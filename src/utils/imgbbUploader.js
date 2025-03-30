const imgbbUploader = require('imgbb-uploader');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { logger } = require('./logger');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Get ImgBB API key from environment
const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

class ImgBBUploader {
  constructor() {
    if (!IMGBB_API_KEY) {
      logger.error('ImgBB API key is missing from environment variables');
    } else {
      logger.info(`ImgBB uploader initialized with API key: ${IMGBB_API_KEY.substring(0, 5)}...`);
    }
  }

  /**
   * Upload an image to ImgBB and get a public URL
   * @param {string} imagePath - Local path to the image file
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImage(imagePath) {
    try {
      if (!IMGBB_API_KEY) {
        throw new Error('ImgBB API key is required');
      }

      logger.info(`Uploading image to ImgBB: ${imagePath}`);

      const result = await imgbbUploader({
        apiKey: IMGBB_API_KEY,
        imagePath: imagePath,
        name: path.basename(imagePath),
      });

      logger.info(`Image successfully uploaded to ImgBB: ${result.url}`);
      
      // Return the direct image URL for use with Instagram API
      return result.display_url;
    } catch (error) {
      logger.error(`Error uploading image to ImgBB: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ImgBBUploader(); 