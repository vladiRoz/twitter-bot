const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { logger } = require('../utils/logger');
const imageUtils = require('../utils/imageUtils');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Get API credentials from environment
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

class InstagramService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v18.0';
    logger.info(`Instagram service initialized with account ID: ${INSTAGRAM_BUSINESS_ACCOUNT_ID ? (INSTAGRAM_BUSINESS_ACCOUNT_ID.substring(0, 5) + '...') : 'undefined'}`);
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
      logger.error('Error creating media container:', error.message);
      if (error.response) {
        logger.error(`API response status: ${error.response.status}`);
        logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
      }
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
      logger.error('Error publishing media:', error.message);
      if (error.response) {
        logger.error(`API response status: ${error.response.status}`);
        logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  generateCaption(data) {
    let caption = `🔴 Violence Report for ${data.date}\n\n`;
    
    if (data.countries && data.countries.length > 0) {
      data.countries.forEach(country => {
        const flag = imageUtils.getCountryFlagEmoji(country.country);
        caption += `${flag} ${country.country}: ${country.death_toll} casualties\n`;
        caption += `${country.summary}\n\n`;
      });
    } else {
      caption += 'No incidents reported today.';
    }
    
    caption += '\n#ArabViolence #NewsReport #Peace';
    return caption;
  }

  async postToInstagram(data) {
    try {
      // Skip posting if there are no incidents
      if (!data.countries || data.countries.length === 0) {
        logger.info('No incidents reported, skipping Instagram post');
        return null;
      }

      logger.info('Posting to Instagram');
      
      // Generate caption
      const caption = this.generateCaption(data);
      logger.info(`Generated caption: ${caption.substring(0, 100)}...`);

      // Get a relevant background image from Unsplash
      const backgroundImageUrl = await imageUtils.getRelevantImage(data);
      logger.info(`Got background image from Unsplash`);

      // Create image with the data and background
      const imagePath = await imageUtils.createReportImage(data, backgroundImageUrl);
      logger.info(`Created report image`);

      // Upload image to ImgBB or a similar service to get a public URL
      // For now, we're skipping this step and assuming image hosting is set up

      // Create media container with the image path
      const mediaContainerId = await this.createMediaContainer(imagePath, caption);
      logger.info(`Created media container: ${mediaContainerId}`);

      // Publish the media
      const mediaId = await this.publishMedia(mediaContainerId);
      logger.info(`Successfully published to Instagram: ${mediaId}`);

      // Clean up the temporary image
      fs.unlinkSync(imagePath);

      return mediaId;
    } catch (error) {
      logger.error(`Error posting to Instagram: ${error.message}`);
      if (error.response) {
        logger.error(`API response status: ${error.response.status}`);
        logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
}

module.exports = new InstagramService(); 