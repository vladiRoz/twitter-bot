#!/bin/bash

# This script helps deploy the bot to a DigitalOcean Droplet

# Install Node.js dependencies
echo "Installing dependencies..."
npm install

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create a .env file with your API keys."
    exit 1
fi

# Start or restart the bot with PM2
if pm2 list | grep -q "arab-violence-bot"; then
    echo "Restarting bot with PM2..."
    pm2 restart arab-violence-bot
else
    echo "Starting bot with PM2..."
    pm2 start schedule_bot.js --name "arab-violence-bot"
fi

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot if not already configured
echo "Setting up PM2 to start on system boot..."
pm2 startup

echo "Deployment completed successfully!"
echo "Your bot is now running and will automatically restart if the server reboots."
echo "You can check its status with: pm2 status"
echo "And view logs with: pm2 logs arab-violence-bot" 