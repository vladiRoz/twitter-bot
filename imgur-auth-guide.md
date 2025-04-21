# Imgur Authentication Guide for DigitalOcean

This guide will help you set up proper authentication with Imgur to resolve upload issues on your DigitalOcean server.

## The Problem

You're getting `429 Too Many Requests` errors when uploading to Imgur from your DigitalOcean server, but not from your local machine. This could be because:

1. DigitalOcean IP addresses are more heavily rate-limited by Imgur
2. The server might be missing proper authentication tokens
3. Cloud IPs may be subject to stricter policies by Imgur

## Solution: Authenticate with Imgur

### Step 1: Obtain Imgur API Credentials

1. Make sure you have an Imgur account. If not, create one at [imgur.com](https://imgur.com)
2. Go to [https://api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient)
3. Register your application:
   - Application name: `Arab Violence Report Bot`
   - Authorization type: Select `OAuth 2 authorization with a callback URL`
   - Authorization callback URL: `http://localhost:3000/callback`
   - Email: Your email
   - Description: `Bot for posting violence reports to social media`
4. After registration, you'll get:
   - Client ID
   - Client Secret

### Step 2: Set Up Environment Variables

Make sure these are properly set in your `.env` file on the DigitalOcean server:

```
IMGUR_CLIENT_ID=your_client_id_here
IMGUR_CLIENT_SECRET=your_client_secret_here
```

### Step 3: Run the Authentication Script Locally

The authentication needs to be done from a machine with a browser, not directly on your server:

1. Clone your repo to your local machine if you don't have it already
2. Make sure your `.env` file has the right credentials
3. Run the authentication script:

```bash
npm run auth:imgur
```

4. This will open a server on port 3000 and provide a URL
5. Open that URL in your browser
6. Authorize your application with Imgur
7. The script will save your access token and refresh token to your `.env` file

### Step 4: Copy Tokens to DigitalOcean

After authentication, your local `.env` file will have these new entries:

```
IMGUR_ACCESS_TOKEN=your_access_token_here
IMGUR_REFRESH_TOKEN=your_refresh_token_here
```

Copy these lines and add them to your `.env` file on your DigitalOcean server.

### Step 5: Verify Authentication is Being Used

The `imgurUploader.js` file should already check for an access token and use it if available:

```javascript
// Set up base headers depending on authentication method
this.headers = IMGUR_ACCESS_TOKEN 
  ? { Authorization: `Bearer ${IMGUR_ACCESS_TOKEN}` }
  : { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` };
```

This code will use the access token if available, which provides higher rate limits and fewer restrictions.

### Step 6: Restart Your Bot

After updating the `.env` file on your server, restart your bot:

```bash
pm2 restart your_bot_process_name  # If using PM2
# OR
systemctl restart your_service_name  # If using systemd
```

## Troubleshooting

If you're still experiencing issues:

### Option 1: Use Direct Server Authentication

If you can't run a browser on your server for authentication, you can:

1. Create a script to manually set tokens in your `.env` file
2. Get tokens from your local machine and manually update them on the server

### Option 2: Add Retry Logic

Modify your code to retry uploads with increasing delays:

```javascript
async function uploadWithRetry(imagePath, title, description, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await uploadImageFromFile(imagePath, title, description);
    } catch (error) {
      retries++;
      if (retries >= maxRetries) throw error;
      
      logger.info(`Upload failed, retrying in ${retries * 2} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retries * 2000));
    }
  }
}
```

### Option 3: Use an Alternative Image Host

If Imgur consistently refuses uploads from your server, consider switching to ImgBB or another image hosting service. 