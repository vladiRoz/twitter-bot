/**
 * Imgur utilities module
 */

const imgurUploader = require('./imgurUploader');
const imgurAuth = require('./imgur-auth');

module.exports = {
  uploader: imgurUploader,
  auth: imgurAuth
}; 