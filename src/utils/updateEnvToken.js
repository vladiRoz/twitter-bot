const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

function updateEnvToken() {
  const tokenFilePath = path.resolve(__dirname, '../../facebook_token.json');
  const envFilePath = path.resolve(__dirname, '../../.env');

  try {
    // Check if env file exists
    if (!fs.existsSync(envFilePath)) {
      console.error('Error: .env file not found.');
      process.exit(1);
    }

    // Check if we have a token in memory (from generateLongLivedToken)
    const longLivedToken = process.env.FACEBOOK_ACCESS_TOKEN;
    
    if (!longLivedToken) {
      console.error('Error: No access token found in memory. Run the generateLongLivedToken.js script first.');
      process.exit(1);
    }

    // Read .env file
    let envContent = fs.readFileSync(envFilePath, 'utf8');

    // Check if FACEBOOK_ACCESS_TOKEN already exists in .env
    if (envContent.includes('FACEBOOK_ACCESS_TOKEN=')) {
      // Replace the existing token
      envContent = envContent.replace(
        /FACEBOOK_ACCESS_TOKEN=.*(\r?\n|$)/,
        `FACEBOOK_ACCESS_TOKEN=${longLivedToken}$1`
      );
    } else {
      // Add the token if it doesn't exist
      envContent += `\nFACEBOOK_ACCESS_TOKEN=${longLivedToken}\n`;
    }

    // Write updated content back to .env
    fs.writeFileSync(envFilePath, envContent);

    logger.info('Updated FACEBOOK_ACCESS_TOKEN in .env file successfully');
    console.log('FACEBOOK_ACCESS_TOKEN has been updated in your .env file.');
    
    // Display token expiration info if available
    if (fs.existsSync(tokenFilePath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      if (tokenData.expiration_date) {
        const expirationDate = new Date(tokenData.expiration_date);
        console.log(`Token will expire on: ${expirationDate.toLocaleDateString()} ${expirationDate.toLocaleTimeString()}`);
      }
    }
    
  } catch (error) {
    logger.error('Error updating .env file:', error.message);
    console.error('Failed to update .env file:', error.message);
    process.exit(1);
  }
}

// If this script is run directly, execute the function
if (require.main === module) {
  updateEnvToken();
}

module.exports = { updateEnvToken }; 