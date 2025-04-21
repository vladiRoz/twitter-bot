# Arab Violence Reporting Bot Scheduler

This scheduler runs the Arab Violence Reporting Bot at regular intervals (every 2 days) to automatically post violence reports to Instagram.

## Features

- Runs every 2 days at 8:00 AM
- Executes the Instagram bot which:
  - Generates violence reports using AI
  - Creates image visualizations
  - Posts to Instagram automatically
- Detailed logging
- Can be run as a system service

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm
- A Linux server for production deployment (optional)

### Installation

1. Install the required dependencies:

   ```bash
   npm install
   ```

2. Make sure your `.env` file has all the required credentials:
   - `GEMINI_API_KEY` - For AI-generated violence reports
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID` and `FACEBOOK_ACCESS_TOKEN` - For Instagram posting
   - `UNSPLASH_ACCESS_KEY` - For background images
   - `IMGUR_CLIENT_ID` - For image hosting

## Running the Scheduler

### Development Mode

To run the scheduler in development mode with immediate execution:

```bash
npm run schedule:dev
```

This will:
- Start the scheduler
- Run the Instagram bot immediately
- Schedule future runs for every 2 days at 8:00 AM

### Production Mode

To run the scheduler in production mode (no immediate execution):

```bash
npm run schedule
```

This will:
- Start the scheduler
- Schedule the Instagram bot to run every 2 days at 8:00 AM

## Production Deployment with systemd

For a production server, you can set up the scheduler as a systemd service to ensure it runs in the background and restarts automatically if it crashes.

1. Edit the `palimirror-scheduler.service` file:

   ```bash
   nano palimirror-scheduler.service
   ```

2. Update the following values:
   - `User`: Your system username
   - `WorkingDirectory`: Full path to the project directory

3. Copy the service file to the systemd directory:

   ```bash
   sudo cp palimirror-scheduler.service /etc/systemd/system/
   ```

4. Reload systemd to recognize the new service:

   ```bash
   sudo systemctl daemon-reload
   ```

5. Enable the service to start on boot:

   ```bash
   sudo systemctl enable palimirror-scheduler.service
   ```

6. Start the service:

   ```bash
   sudo systemctl start palimirror-scheduler.service
   ```

7. Check the status:

   ```bash
   sudo systemctl status palimirror-scheduler.service
   ```

## Logs

The scheduler logs all activities to `scheduler.log` in the project root directory.

When running as a systemd service, you can also view logs using:

```bash
sudo journalctl -u palimirror-scheduler.service -f
```

## Troubleshooting

### Common Issues

1. **The scheduler isn't running properly**
   
   Check the log file for errors:
   ```bash
   cat scheduler.log
   ```

2. **Instagram bot is failing**
   
   Verify that all required API keys and credentials are properly set in your `.env` file.

3. **Facebook access token has expired**
   
   Facebook access tokens expire. Refresh your token with:
   ```bash
   npm run refresh-facebook-token
   ``` 