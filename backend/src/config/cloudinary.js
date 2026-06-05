const logger = require('../utils/logger');

let cloudinary = null;
let isConfigured = false;

try {
  const cloudinaryModule = require('cloudinary');
  cloudinary = cloudinaryModule.v2;

  isConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    logger.info('Cloudinary configured successfully.');
  } else {
    logger.warn('Cloudinary environment variables missing. Falling back to local file upload.');
  }
} catch (err) {
  logger.warn('Cloudinary package not installed. Avatar uploads will save as base64 in database.');
}

module.exports = {
  cloudinary,
  isConfigured
};
