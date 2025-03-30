const fs = require('fs');
const path = require('path');
const { logger } = require('./utils/logger');
const imgbbUploader = require('./utils/imgbbUploader');

// Function to test ImgBB upload
async function testImgBBUpload() {
  try {
    logger.info('Starting ImgBB upload test');

    // Check if we have a test image in the output directory
    const outputDir = path.join(__dirname, '../output');
    const files = fs.readdirSync(outputDir);
    
    if (files.length === 0) {
      logger.error('No test images found in output directory. Please run "npm run generate-image" first.');
      return;
    }

    // Use the most recent image
    const testImageFile = files[files.length - 1];
    const testImagePath = path.join(outputDir, testImageFile);
    
    logger.info(`Using test image: ${testImagePath}`);
    
    // Upload the file to ImgBB
    const publicImageUrl = await imgbbUploader.uploadImage(testImagePath);

    logger.info('Test completed successfully!');
    logger.info(`Uploaded file URL: ${publicImageUrl}`);
    logger.info('You can use this URL with the Instagram API');

  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
    
    if (error.message.includes('API key')) {
      logger.error('Please add your ImgBB API key to the .env file as IMGBB_API_KEY=your_api_key');
      logger.error('You can get a free API key from https://api.imgbb.com/');
    }
  }
}

// Run the test if this script is run directly
if (require.main === module) {
  testImgBBUpload();
} 