const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const dotenv = require('dotenv');
const { logger } = require('./logger');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Get Imgur credentials from environment
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const IMGUR_ACCESS_TOKEN = process.env.IMGUR_ACCESS_TOKEN;

class ImgurUploader {
  constructor() {
    if (!IMGUR_CLIENT_ID) {
      logger.error('Imgur Client ID is missing from environment variables');
    } else {
      logger.info(`Imgur uploader initialized with Client ID: ${IMGUR_CLIENT_ID.substring(0, 5)}...`);
    }
    
    // Check if we have an access token
    if (IMGUR_ACCESS_TOKEN) {
      logger.info('Imgur access token found, will use authenticated uploads');
    } else {
      logger.info('No Imgur access token found, will use anonymous uploads');
    }
    
    // Set up base headers depending on authentication method
    this.headers = IMGUR_ACCESS_TOKEN 
      ? { Authorization: `Bearer ${IMGUR_ACCESS_TOKEN}` }
      : { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` };
  }

  /**
   * Upload an image to Imgur using file path
   * @param {string} imagePath - Local path to the image file
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromFile(imagePath, title = '', description = '') {
    try {
      if (!IMGUR_CLIENT_ID) {
        throw new Error('Imgur Client ID is required');
      }

      logger.info(`Uploading image to Imgur from file: ${imagePath}`);
      
      // Read the image file as base64
      const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
      
      return this.uploadImageBase64(imageBase64, title, description);
    } catch (error) {
      logger.error(`Error uploading image to Imgur from file: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Upload an image to Imgur using base64 data
   * @param {string} imageBase64 - Base64-encoded image data
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageBase64(imageBase64, title = '', description = '') {
    try {
      if (!IMGUR_CLIENT_ID) {
        throw new Error('Imgur Client ID is required');
      }

      logger.info('Uploading base64 image to Imgur');
      
      const response = await axios.post(
        'https://api.imgur.com/3/image',
        {
          image: imageBase64,
          type: 'base64',
          title,
          description
        },
        { headers: this.headers }
      );
      
      logger.info('Image upload successful. Available URLs:');
      logger.info(`- Image URL: ${response.data.data.link}`);
      logger.info(`- Delete Hash: ${response.data.data.deletehash}`);
      
      // Return the direct image URL
      return response.data.data.link;
    } catch (error) {
      logger.error(`Error uploading image to Imgur: ${error.message}`);
      if (error.response) {
        logger.error(`API response status: ${error.response.status}`);
        logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Upload an image to Imgur from a URL
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromUrl(imageUrl, title = '', description = '') {
    try {
      if (!IMGUR_CLIENT_ID) {
        throw new Error('Imgur Client ID is required');
      }

      logger.info(`Uploading image to Imgur from URL: ${imageUrl}`);
      
      const response = await axios.post(
        'https://api.imgur.com/3/image',
        {
          image: imageUrl,
          type: 'url',
          title,
          description
        },
        { headers: this.headers }
      );
      
      logger.info('Image upload successful. Available URLs:');
      logger.info(`- Image URL: ${response.data.data.link}`);
      logger.info(`- Delete Hash: ${response.data.data.deletehash}`);
      
      // Return the direct image URL
      return response.data.data.link;
    } catch (error) {
      logger.error(`Error uploading image to Imgur from URL: ${error.message}`);
      if (error.response) {
        logger.error(`API response status: ${error.response.status}`);
        logger.error(`API response data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
}

module.exports = new ImgurUploader(); 