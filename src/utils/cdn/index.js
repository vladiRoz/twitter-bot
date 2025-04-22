/**
 * CDN Uploader Factory
 * This module provides a centralized way to get the preferred image uploader
 */

const cloudinaryUploader = require('./cloudinaryUploader');
// Keep the reference to imgurUploader but use Cloudinary as default
// const imgurUploader = require('../imgur/imgurUploader');

/**
 * Returns the preferred image uploader
 * @returns The image uploader instance
 */
function getImageUploader() {
  // Return the preferred uploader
  // Can be easily modified to switch between uploaders
  return cloudinaryUploader;
}

module.exports = {
  getImageUploader
}; 