const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const dotenv = require('dotenv');
const { logger } = require('../logger');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Get Imgur credentials from environment
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const IMGUR_ACCESS_TOKEN = process.env.IMGUR_ACCESS_TOKEN;

class ImgurUploader {
  constructor() {
    if (!IMGUR_CLIENT_ID) {
      logger.error('Imgur Client ID is missing from environment variables');
    } else {
      logger.info(`Imgur uploader initialized`);
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
      
    // Default retry settings
    this.maxRetries = 3;
    this.retryDelay = 2000; // Base delay in ms before retrying
    
    // Rate limit tracking
    this.userRateLimit = null;
    this.clientRateLimit = null;
    this.lastRateLimitCheck = 0;
    this.rateLimitCooldown = false;
    this.rateLimitCooldownUntil = 0;
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
   * Check rate limit headers and adapt behavior
   * @param {Object} headers - Response headers from Imgur
   */
  checkRateLimits(headers) {
    const userRemaining = parseInt(headers['x-ratelimit-userremaining'] || '0', 10);
    const clientRemaining = parseInt(headers['x-ratelimit-clientremaining'] || '0', 10);
    const userLimit = parseInt(headers['x-ratelimit-userlimit'] || '0', 10);
    const clientLimit = parseInt(headers['x-ratelimit-clientlimit'] || '0', 10);
    const userReset = parseInt(headers['x-ratelimit-userreset'] || '0', 10);
    const clientReset = parseInt(headers['x-ratelimit-clientreset'] || '0', 10);

    logger.info(`Imgur rate limits - User: ${userRemaining}/${userLimit}, Client: ${clientRemaining}/${clientLimit}`);
    
    this.lastRateLimitCheck = Date.now();
    this.userRateLimit = {
      limit: userLimit,
      remaining: userRemaining,
      reset: userReset * 1000 // Convert to milliseconds
    };
    
    this.clientRateLimit = {
      limit: clientLimit,
      remaining: clientRemaining,
      reset: clientReset * 1000 // Convert to milliseconds
    };
    
    // Log rate limit information
    logger.info(`Imgur rate limits - User: ${userRemaining}/${userLimit}, Client: ${clientRemaining}/${clientLimit}`);
    
    // Check if we're approaching rate limits
    if (userRemaining < 5 || clientRemaining < 5) {
      const resetTime = Math.max(userReset, clientReset) * 1000;
      const cooldownTime = resetTime - Date.now() + 5000; // Add 5 seconds buffer
      
      if (cooldownTime > 0) {
        logger.warn(`Imgur rate limits nearly reached! Setting cooldown for ${cooldownTime/1000} seconds`);
        this.rateLimitCooldown = true;
        this.rateLimitCooldownUntil = Date.now() + cooldownTime;
      }
    }
  }

  /**
   * Upload an image to Imgur using file path with retry logic and rate limit awareness
   * @param {string} imagePath - Local path to the image file
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @param {number} retries - Number of retries (optional)
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromFile(imagePath, title = '', description = '', retries = 0) {
    try {
      if (!IMGUR_CLIENT_ID) {
        throw new Error('Imgur Client ID is required');
      }

      logger.info(`Uploading image to Imgur from file: ${imagePath}`);
      
      // Add a longer delay if this is a retry
      if (retries > 0) {
        const delayTime = this.retryDelay * retries;
        logger.info(`Retry delay: waiting ${delayTime}ms before upload...`);
        await this.delay(delayTime);
      }
      
      // Read the image file as base64
      const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
      
      return this.uploadImageBase64(imageBase64, title, description, retries);
    } catch (error) {
      logger.error(`Error uploading image to Imgur from file: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Upload an image to Imgur using base64 data with retry logic
   * @param {string} imageBase64 - Base64-encoded image data
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @param {number} retries - Current retry count
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageBase64(imageBase64, title = '', description = '', retries = 0) {
    try {
      if (!IMGUR_CLIENT_ID) {
        throw new Error('Imgur Client ID is required');
      }

      logger.info('Uploading base64 image to Imgur');
      
      // Check if we're in a cooldown period
      if (this.rateLimitCooldown && Date.now() < this.rateLimitCooldownUntil) {
        const waitTime = this.rateLimitCooldownUntil - Date.now();
        logger.warn(`Imgur in cooldown period for ${waitTime/1000} more seconds`);
        await this.delay(waitTime);
        this.rateLimitCooldown = false;
      }
      
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
      
      // Check rate limit headers if they exist
      if (response.headers) {
        this.checkRateLimits(response.headers);
      }
      
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
        
        // Check for rate limit headers in error response
        if (error.response.headers) {
          this.checkRateLimits(error.response.headers);
        }
        
        // Set cooldown on rate limit errors
        if (error.response.status === 429) {
          logger.info('Rate limit hit, setting cooldown period');
          this.rateLimitCooldown = true;
          this.rateLimitCooldownUntil = Date.now() + (30 * 60 * 1000); // 30 minute cooldown
        }
      }
      
      // Try to retry the upload if we haven't reached max retries
      if (retries < this.maxRetries) {
        const nextRetry = retries + 1;
        const delayTime = this.retryDelay * Math.pow(2, nextRetry); // Exponential backoff
        
        logger.info(`Retry ${nextRetry}/${this.maxRetries}: Waiting ${delayTime}ms before retrying upload...`);
        await this.delay(delayTime);
        
        logger.info(`Retrying upload (attempt ${nextRetry}/${this.maxRetries})...`);
        return this.uploadImageBase64(imageBase64, title, description, nextRetry);
      }
      
      throw error;
    }
  }
  
  /**
   * Upload an image to Imgur from a URL with retry logic
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @param {number} retries - Current retry count
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromUrl(imageUrl, title = '', description = '', retries = 0) {
    try {
      if (!IMGUR_CLIENT_ID) {
        throw new Error('Imgur Client ID is required');
      }

      logger.info(`Uploading image to Imgur from URL: ${imageUrl}`);
      
      // Check if we're in a cooldown period
      if (this.rateLimitCooldown && Date.now() < this.rateLimitCooldownUntil) {
        const waitTime = this.rateLimitCooldownUntil - Date.now();
        logger.warn(`Imgur in cooldown period for ${waitTime/1000} more seconds`);
        await this.delay(waitTime);
        this.rateLimitCooldown = false;
      }
      
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
      
      // Check rate limit headers if they exist
      if (response.headers) {
        this.checkRateLimits(response.headers);
      }
      
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
        
        // Check for rate limit headers in error response
        if (error.response.headers) {
          this.checkRateLimits(error.response.headers);
        }
        
        // Set cooldown on rate limit errors
        if (error.response.status === 429) {
          logger.info('Rate limit hit, setting cooldown period');
          this.rateLimitCooldown = true;
          this.rateLimitCooldownUntil = Date.now() + (30 * 60 * 1000); // 30 minute cooldown
        }
      }
      
      // Try to retry the upload if we haven't reached max retries
      if (retries < this.maxRetries) {
        const nextRetry = retries + 1;
        const delayTime = this.retryDelay * Math.pow(2, nextRetry); // Exponential backoff
        
        logger.info(`Retry ${nextRetry}/${this.maxRetries}: Waiting ${delayTime}ms before retrying upload...`);
        await this.delay(delayTime);
        
        logger.info(`Retrying upload (attempt ${nextRetry}/${this.maxRetries})...`);
        return this.uploadImageFromUrl(imageUrl, title, description, nextRetry);
      }
      
      throw error;
    }
  }
}

module.exports = new ImgurUploader(); 