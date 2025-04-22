const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('../logger');
const ImageUploaderInterface = require('./imageUploaderInterface');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: 'duxvvmvaa',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryUploader extends ImageUploaderInterface {
  constructor() {
    super();
    if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      logger.error('Cloudinary API credentials are missing from environment variables');
    } else {
      logger.info('Cloudinary uploader initialized');
    }

    // Configure upload options
    this.defaultOptions = {
      folder: 'palimirror',
      resource_type: 'image'
    };

    // Retry settings
    this.maxRetries = 3;
    this.retryDelay = 2000; // Base delay in ms
  }

  /**
   * Helper method to delay execution
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload an image to Cloudinary using file path
   * @param {string} imagePath - Local path to the image file
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @param {number} retries - Number of retries (internal use)
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromFile(imagePath, title = '', description = '', retries = 0) {
    try {
      if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary API credentials are required');
      }

      logger.info(`Uploading image to Cloudinary from file: ${imagePath}`);

      // Add a longer delay if this is a retry
      if (retries > 0) {
        const delayTime = this.retryDelay * Math.pow(2, retries - 1);
        logger.info(`Retry delay: waiting ${delayTime}ms before upload...`);
        await this.delay(delayTime);
      }

      // Prepare upload options
      const options = {
        ...this.defaultOptions,
        public_id: title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : undefined,
        context: description ? `caption=${description}` : undefined
      };

      // Upload the file
      const result = await cloudinary.uploader.upload(imagePath, options);
      
      logger.info('Image upload successful');
      logger.info(`- Image URL: ${result.secure_url}`);
      
      return result.secure_url;
    } catch (error) {
      logger.error(`Error uploading image to Cloudinary from file: ${error.message}`);
      
      // Try to retry the upload if we haven't reached max retries
      if (retries < this.maxRetries) {
        const nextRetry = retries + 1;
        const delayTime = this.retryDelay * Math.pow(2, nextRetry - 1); // Exponential backoff
        
        logger.info(`Retry ${nextRetry}/${this.maxRetries}: Waiting ${delayTime}ms before retrying upload...`);
        await this.delay(delayTime);
        
        return this.uploadImageFromFile(imagePath, title, description, nextRetry);
      }
      
      throw error;
    }
  }

  /**
   * Upload an image to Cloudinary using base64 data
   * @param {string} imageBase64 - Base64-encoded image data
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @param {number} retries - Current retry count (internal use)
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageBase64(imageBase64, title = '', description = '', retries = 0) {
    try {
      if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary API credentials are required');
      }

      logger.info('Uploading base64 image to Cloudinary');
      
      // Add a longer delay if this is a retry
      if (retries > 0) {
        const delayTime = this.retryDelay * Math.pow(2, retries - 1);
        logger.info(`Retry delay: waiting ${delayTime}ms before upload...`);
        await this.delay(delayTime);
      }

      // Prepare upload options
      const options = {
        ...this.defaultOptions,
        public_id: title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : undefined,
        context: description ? `caption=${description}` : undefined
      };

      // Format the base64 string for Cloudinary
      const base64Data = `data:image/jpeg;base64,${imageBase64}`;
      
      // Upload the image
      const result = await cloudinary.uploader.upload(base64Data, options);
      
      logger.info('Image upload successful');
      logger.info(`- Image URL: ${result.secure_url}`);
      
      return result.secure_url;
    } catch (error) {
      logger.error(`Error uploading image to Cloudinary: ${error.message}`);
      
      // Try to retry the upload if we haven't reached max retries
      if (retries < this.maxRetries) {
        const nextRetry = retries + 1;
        const delayTime = this.retryDelay * Math.pow(2, nextRetry - 1); // Exponential backoff
        
        logger.info(`Retry ${nextRetry}/${this.maxRetries}: Waiting ${delayTime}ms before retrying upload...`);
        await this.delay(delayTime);
        
        return this.uploadImageBase64(imageBase64, title, description, nextRetry);
      }
      
      throw error;
    }
  }

  /**
   * Upload an image to Cloudinary from a URL
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @param {number} retries - Current retry count (internal use)
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromUrl(imageUrl, title = '', description = '', retries = 0) {
    try {
      if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary API credentials are required');
      }

      logger.info(`Uploading image to Cloudinary from URL: ${imageUrl}`);
      
      // Add a longer delay if this is a retry
      if (retries > 0) {
        const delayTime = this.retryDelay * Math.pow(2, retries - 1);
        logger.info(`Retry delay: waiting ${delayTime}ms before upload...`);
        await this.delay(delayTime);
      }

      // Prepare upload options
      const options = {
        ...this.defaultOptions,
        public_id: title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : undefined,
        context: description ? `caption=${description}` : undefined
      };

      // Upload the image
      const result = await cloudinary.uploader.upload(imageUrl, options);
      
      logger.info('Image upload successful');
      logger.info(`- Image URL: ${result.secure_url}`);
      
      return result.secure_url;
    } catch (error) {
      logger.error(`Error uploading image to Cloudinary from URL: ${error.message}`);
      
      // Try to retry the upload if we haven't reached max retries
      if (retries < this.maxRetries) {
        const nextRetry = retries + 1;
        const delayTime = this.retryDelay * Math.pow(2, nextRetry - 1); // Exponential backoff
        
        logger.info(`Retry ${nextRetry}/${this.maxRetries}: Waiting ${delayTime}ms before retrying upload...`);
        await this.delay(delayTime);
        
        return this.uploadImageFromUrl(imageUrl, title, description, nextRetry);
      }
      
      throw error;
    }
  }
}

module.exports = new CloudinaryUploader(); 