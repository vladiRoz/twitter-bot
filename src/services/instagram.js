const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { logger } = require('./openai');
const { formatMessage } = require('../utils/messageFormatter');
const imageUtils = require('../utils/imageUtils');

// Load environment variables
dotenv.config();

// Get API credentials from environment
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

class InstagramService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async createMediaContainer(imageUrl, caption) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: FACEBOOK_ACCESS_TOKEN
        }
      );

      return response.data.id;
    } catch (error) {
      logger.error('Error creating media container:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  async publishMedia(mediaContainerId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`,
        {
          creation_id: mediaContainerId,
          access_token: FACEBOOK_ACCESS_TOKEN
        }
      );

      return response.data.id;
    } catch (error) {
      logger.error('Error publishing media:', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  async postToInstagram(data) {
    try {
      // Skip posting if there are no incidents
      if (!data.countries || data.countries.length === 0) {
        logger.info('No incidents reported, skipping Instagram post');
        return null;
      }

      logger.info('Posting to Instagram');
      
      // Format the message
      const { full, summary } = formatMessage(data);
      const message = summary || full;

      // Get a relevant background image from Unsplash
      const backgroundImageUrl = await imageUtils.getRelevantImage(data);
      logger.info('Got background image from Unsplash:', backgroundImageUrl);

      // Create image with the message and background
      const imagePath = await imageUtils.createReportImage(message, backgroundImageUrl);
      logger.info('Created report image:', imagePath);

      // Create media container with the image URL
      const mediaContainerId = await this.createMediaContainer(imagePath, message);
      logger.info('Created media container:', mediaContainerId);

      // Publish the media
      const mediaId = await this.publishMedia(mediaContainerId);
      logger.info('Successfully published to Instagram:', mediaId);

      // Clean up the temporary image
      fs.unlinkSync(imagePath);

      return mediaId;
    } catch (error) {
      logger.error('Error posting to Instagram:', {
        message: error.message,
        status: error.status,
        errors: error.errors,
        response: error.response?.data
      });
      throw error;
    }
  }
}

module.exports = new InstagramService(); 