const { generateLongLivedToken } = require('./generateLongLivedToken');
const { updateEnvToken } = require('./updateEnvToken');
const { logger } = require('../logger');

async function refreshFacebookToken() {
  try {
    logger.info('Starting Facebook token refresh process');
    console.log('============================================');
    console.log('FACEBOOK LONG-LIVED TOKEN REFRESH UTILITY');
    console.log('============================================\n');

    // Step 1: Generate the long-lived token
    console.log('Step 1: Generating long-lived token...\n');
    await generateLongLivedToken();
    
    // Step 2: Update the .env file
    console.log('\nStep 2: Updating .env file with new token...\n');
    updateEnvToken();
    
    console.log('\n============================================');
    console.log('TOKEN REFRESH COMPLETED SUCCESSFULLY');
    console.log('============================================');
    console.log('Your Facebook access token has been updated with a long-lived token (60 days validity).');
    console.log('The token is stored only in your .env file');
    console.log('You should run this script again before the token expires.\n');
    
    logger.info('Facebook token refresh process completed successfully');
  } catch (error) {
    logger.error('Error in token refresh process:', error.message);
    console.error('\nAn error occurred during the token refresh process:');
    console.error(error.message);
    process.exit(1);
  }
}

// If this script is run directly, execute the function
if (require.main === module) {
  refreshFacebookToken();
}

module.exports = { refreshFacebookToken }; 