/**
 * Interface for image uploaders.
 * Any CDN solution must implement this interface.
 */
class ImageUploaderInterface {
  /**
   * Uploads an image from a local file path
   * @param {string} imagePath - Local path to the image file
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromFile(imagePath, title, description) {
    throw new Error('uploadImageFromFile must be implemented by the CDN provider');
  }

  /**
   * Uploads an image from a Base64 encoded string
   * @param {string} imageBase64 - Base64-encoded image data
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageBase64(imageBase64, title, description) {
    throw new Error('uploadImageBase64 must be implemented by the CDN provider');
  }

  /**
   * Uploads an image from a URL
   * @param {string} imageUrl - URL of the image to upload
   * @param {string} title - Optional title for the image
   * @param {string} description - Optional description for the image
   * @returns {Promise<string>} - Public URL of the uploaded image
   */
  async uploadImageFromUrl(imageUrl, title, description) {
    throw new Error('uploadImageFromUrl must be implemented by the CDN provider');
  }
}

module.exports = ImageUploaderInterface; 