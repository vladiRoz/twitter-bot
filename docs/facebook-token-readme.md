# Facebook Long-Lived Access Token Generator

This utility allows you to generate long-lived access tokens for Facebook Graph API that expire after 60 days instead of the default short-lived tokens that expire quickly.

## Prerequisites

1. A Facebook Developer account
2. A Facebook App with the Instagram Graph API added
3. Business Instagram account connected to a Facebook Page
4. Basic access token (short-lived)

## Setup Instructions

### 1. Create a Facebook App (if you don't have one already)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" and then "Create App"
3. Choose "Business" as the app type
4. Fill in the required details and create the app
5. Once created, navigate to your app dashboard

### 2. Add Instagram Graph API to Your App

1. In your app dashboard, click "Add Products"
2. Look for "Instagram Graph API" and click "Set Up"
3. Follow the instructions to complete the setup

### 3. Get App ID and App Secret

1. From your app dashboard, go to "Settings" > "Basic"
2. Copy your "App ID" and "App Secret"
3. Add these values to your `.env` file:
   ```
   FACEBOOK_APP_ID=your_app_id
   FACEBOOK_APP_SECRET=your_app_secret
   ```

### 4. Get a Short-Lived Access Token

1. Go to [Facebook Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click "Generate Access Token"
4. Make sure to select the necessary permissions (e.g., `instagram_basic`, `instagram_content_publish`)
5. Copy the generated token
6. Add it to your `.env` file:
   ```
   FACEBOOK_ACCESS_TOKEN=your_short_lived_token
   ```

## How to Generate a Long-Lived Token

Once you have set up the prerequisites and updated your `.env` file with your Facebook App ID, App Secret, and a short-lived access token, you can generate a long-lived token using our utility:

```bash
node src/utils/refreshFacebookToken.js
```

This script will:
1. Generate a long-lived token (valid for 60 days)
2. Save the token metadata to `facebook_token.json` (the actual token is not stored in the file for security)
3. Automatically update your `.env` file with the new token

The script will also show you when the token will expire so you can schedule token refreshes accordingly.

## Individual Scripts

If you need to run the steps individually:

- To only generate the token:
  ```bash
  node src/utils/generateLongLivedToken.js
  ```

- To update your `.env` file with an already-generated token:
  ```bash
  node src/utils/updateEnvToken.js
  ```

## Token Expiration

Long-lived tokens are valid for approximately 60 days. Make sure to refresh your token before it expires to prevent service disruptions.

Set up a calendar reminder to run the refresh script again before the expiration date shown when you generate the token.

## Automated Token Refresh

To avoid manual token refreshing, a scheduler has been created that will automatically refresh your Facebook token every 2 months (before the 60-day expiration).

### Running the Token Refresh Scheduler

#### Development Mode

To run the token refresh scheduler in development mode with immediate execution:

```bash
npm run schedule:token:dev
```

This will:
- Start the scheduler
- Refresh your Facebook token immediately
- Schedule future token refreshes on the 1st day of every other month at 7:00 AM
- Also check the token's expiration daily at 9:00 AM and refresh if it's about to expire

#### Production Mode

To run the token refresh scheduler in production mode (no immediate execution):

```bash
npm run schedule:token
```

This will:
- Start the scheduler
- Schedule token refreshes on the 1st day of every other month at 7:00 AM
- Check the token's expiration daily at 9:00 AM

### Production Deployment with systemd

For a production server, you can set up the token refresh scheduler as a systemd service:

1. Edit the `facebook-token-scheduler.service` file:

   ```bash
   nano facebook-token-scheduler.service
   ```

2. Update the following values:
   - `User`: Your system username
   - `WorkingDirectory`: Full path to the project directory

3. Copy the service file to the systemd directory:

   ```bash
   sudo cp facebook-token-scheduler.service /etc/systemd/system/
   ```

4. Reload systemd to recognize the new service:

   ```bash
   sudo systemctl daemon-reload
   ```

5. Enable the service to start on boot:

   ```bash
   sudo systemctl enable facebook-token-scheduler.service
   ```

6. Start the service:

   ```bash
   sudo systemctl start facebook-token-scheduler.service
   ```

7. Check the status:

   ```bash
   sudo systemctl status facebook-token-scheduler.service
   ```

### Logs

The token refresh scheduler logs all activities to `facebook-token-scheduler.log` in the project root directory.

When running as a systemd service, you can also view logs using:

```bash
sudo journalctl -u facebook-token-scheduler.service -f
```

## Troubleshooting

If you encounter errors:

1. **Invalid App ID or App Secret**: Double-check that you've entered the correct values in the `.env` file
2. **Invalid access token**: Make sure your short-lived token is still valid and has the necessary permissions
3. **API errors**: Read the error message returned by the Facebook API for specific issues
4. **Rate limiting**: If you hit rate limits, wait a while before trying again

## Security Features

- **Token Storage**: For security reasons, the actual access token is never stored in `facebook_token.json`, only metadata about the token
- The token is only stored in your `.env` file, which should never be committed to version control
- The token is temporarily kept in memory during the script execution

## Security Notes

- Never commit your `.env` file or `facebook_token.json` to version control
- Keep your App Secret and access tokens secure
- Use environment variables in production environments
- Consider using a secure vault for sensitive credentials in production 