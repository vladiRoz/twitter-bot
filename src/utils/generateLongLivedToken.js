const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Required environment variables
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

async function generateLongLivedToken() {
  // Check if required environment variables are set
  if (!FACEBOOK_APP_ID) {
    logger.error('Missing FACEBOOK_APP_ID in .env file');
    console.error('Error: FACEBOOK_APP_ID is required. Add it to your .env file.');
    process.exit(1);
  }

  if (!FACEBOOK_APP_SECRET) {
    logger.error('Missing FACEBOOK_APP_SECRET in .env file');
    console.error('Error: FACEBOOK_APP_SECRET is required. Add it to your .env file.');
    process.exit(1);
  }

  if (!FACEBOOK_ACCESS_TOKEN) {
    logger.error('Missing FACEBOOK_ACCESS_TOKEN in .env file');
    console.error('Error: FACEBOOK_ACCESS_TOKEN is required. Add it to your .env file.');
    process.exit(1);
  }

  try {
    logger.info('Generating long-lived Facebook access token...');
    
    const response = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: FACEBOOK_APP_ID,
        client_secret: FACEBOOK_APP_SECRET,
        fb_exchange_token: FACEBOOK_ACCESS_TOKEN
      }
    });

    const longLivedToken = response.data.access_token;
    const expiresIn = response.data.expires_in;
    const expirationDate = new Date(Date.now() + expiresIn * 1000);

    logger.info(`Long-lived token generated successfully!`);
    logger.info(`Token will expire in ${expiresIn} seconds (approximately ${Math.floor(expiresIn / 86400)} days)`);
    logger.info(`Expiration date: ${expirationDate.toLocaleDateString()} ${expirationDate.toLocaleTimeString()}`);
    
    // Store token information in a file, but not the actual token for security
    const tokenInfo = {
      expires_in: expiresIn,
      expiration_date: expirationDate.toISOString(),
      generated_at: new Date().toISOString()
    };

    fs.writeFileSync(
      path.resolve(__dirname, '../../facebook_token.json'), 
      JSON.stringify(tokenInfo, null, 2)
    );
    
    logger.info(`Token metadata saved to facebook_token.json`);
    console.log('\nTo use this token, update your .env file with:');
    console.log(`FACEBOOK_ACCESS_TOKEN=${longLivedToken}`);
    
    // Instructions for updating the token in the .env file
    const envPath = path.resolve(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // If the token already exists in the .env file, suggest how to update it
      if (envContent.includes('FACEBOOK_ACCESS_TOKEN=')) {
        console.log('\nYou can update your .env file automatically by running:');
        console.log('node src/utils/updateEnvToken.js');
      }
    }

    // Auto-update the token in memory for the current session
    process.env.FACEBOOK_ACCESS_TOKEN = longLivedToken;

    return longLivedToken;
  } catch (error) {
    logger.error('Error generating long-lived token:', error.message);
    
    if (error.response) {
      logger.error(`Status: ${error.response.status}`);
      logger.error(`Error data: ${JSON.stringify(error.response.data)}`);
      console.error('\nAPI Error:', error.response.data);
    }
    
    console.error('\nMake sure your FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_ACCESS_TOKEN are correct.');
    process.exit(1);
  }
}

// If this script is run directly, execute the function
if (require.main === module) {
  generateLongLivedToken();
}

module.exports = { generateLongLivedToken }; 