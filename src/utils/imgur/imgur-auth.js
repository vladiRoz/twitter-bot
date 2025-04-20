const axios = require('axios');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { logger } = require('../logger');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const clientId = process.env.IMGUR_CLIENT_ID;
const clientSecret = process.env.IMGUR_CLIENT_SECRET;

// Verify credentials
if (!clientId || !clientSecret) {
  console.error('Error: IMGUR_CLIENT_ID and IMGUR_CLIENT_SECRET must be set in your .env file');
  process.exit(1);
}

const app = express();
const PORT = 3000;
const CALLBACK_URL = `http://localhost:${PORT}/callback`;

// Route to start OAuth flow
app.get('/', (req, res) => {
  const authUrl = `https://api.imgur.com/oauth2/authorize?client_id=${clientId}&response_type=code&callback_url=${CALLBACK_URL}`;
  logger.info(`Imgur authorization URL: ${authUrl}`);
  console.log(`\nAuthorize your Imgur application by opening this URL in your browser:`);
  console.log(`\n${authUrl}\n`);
  res.send(`
    <h1>Imgur Authorization</h1>
    <p>Please click the button below to authorize this application to access your Imgur account:</p>
    <a href="${authUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1bb76e; color: white; text-decoration: none; border-radius: 4px;">Authorize Imgur Access</a>
  `);
});

// Callback route to handle the authorization code
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    logger.error('No authorization code received from Imgur');
    return res.send('Error: No authorization code received from Imgur');
  }
  
  try {
    logger.info(`Received authorization code: ${code}`);
    console.log(`Received authorization code: ${code}`);
    console.log('Exchanging code for access token...');
    
    // Exchange the code for access and refresh tokens
    const response = await axios.post('https://api.imgur.com/oauth2/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: CALLBACK_URL
    });
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    logger.info('Successfully obtained Imgur access and refresh tokens');
    console.log('\n===== IMGUR AUTH SUCCESS =====');
    console.log(`Access Token: ${access_token}`);
    console.log(`Refresh Token: ${refresh_token}`);
    console.log(`Expires In: ${expires_in} seconds`);
    console.log('===============================\n');
    
    // Update .env file with the new tokens
    const envPath = path.resolve(__dirname, '../../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if tokens already exist in .env and update them
    if (envContent.includes('IMGUR_ACCESS_TOKEN=')) {
      envContent = envContent.replace(/IMGUR_ACCESS_TOKEN=.*\n/, `IMGUR_ACCESS_TOKEN=${access_token}\n`);
    } else {
      envContent += `\nIMGUR_ACCESS_TOKEN=${access_token}`;
    }
    
    if (envContent.includes('IMGUR_REFRESH_TOKEN=')) {
      envContent = envContent.replace(/IMGUR_REFRESH_TOKEN=.*\n/, `IMGUR_REFRESH_TOKEN=${refresh_token}\n`);
    } else {
      envContent += `\nIMGUR_REFRESH_TOKEN=${refresh_token}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    logger.info('Tokens saved to .env file');
    console.log('Tokens saved to .env file');
    
    res.send(`
      <h1>Imgur Authorization Successful!</h1>
      <p>Your access token and refresh token have been saved to your .env file.</p>
      <p>You can now close this window and continue using your application.</p>
    `);
    
    // Keep the server running for a bit to ensure the response is sent
    setTimeout(() => {
      console.log('Server shutting down...');
      process.exit(0);
    }, 5000);
  } catch (error) {
    logger.error(`Error exchanging code for tokens: ${error.message}`);
    console.error('Error exchanging code for tokens:', error.message);
    if (error.response) {
      logger.error(`API response: ${JSON.stringify(error.response.data)}`);
      console.error('API response:', error.response.data);
    }
    res.send('Error obtaining tokens. Check console for details.');
  }
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Imgur OAuth server started on http://localhost:${PORT}`);
  console.log(`\nImgur OAuth server started on http://localhost:${PORT}`);
  console.log(`Please open http://localhost:${PORT} in your browser to begin authorization`);
});

module.exports = app; 