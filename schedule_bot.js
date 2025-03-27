const fs = require('fs');
const { exec } = require('child_process');
const schedule = require('node-schedule');

// Setup logging
const logFile = fs.createWriteStream('scheduler.log', { flags: 'a' });
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - INFO - ${message}\n`;
    console.log(logMessage);
    logFile.write(logMessage);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ERROR - ${message}\n`;
    console.error(logMessage);
    logFile.write(logMessage);
  }
};

// Function to run the bot
function runBot() {
  const timestamp = new Date().toISOString();
  logger.info(`Running bot at ${timestamp}`);
  
  // Execute the bot script
  exec('node bot.js', (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error running bot: ${error.message}`);
      return;
    }
    
    if (stderr) {
      logger.error(`Bot execution stderr: ${stderr}`);
    }
    
    if (stdout) {
      logger.info(`Bot execution stdout: ${stdout}`);
    }
    
    logger.info('Bot execution completed');
  });
}

// Main function
function main() {
  logger.info('Starting scheduler');
  
  // Schedule the bot to run every day at 8:00 AM
  const job = schedule.scheduleJob('0 8 * * *', runBot);
  logger.info(`Bot scheduled to run at 8:00 AM daily. Next run: ${job.nextInvocation()}`);
  
  // Run once immediately when starting
  runBot();
  
  // Handle process termination
  process.on('SIGINT', () => {
    logger.info('Scheduler stopping due to SIGINT');
    job.cancel();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.info('Scheduler stopping due to SIGTERM');
    job.cancel();
    process.exit(0);
  });
}

// Run the main function if this script is run directly
if (require.main === module) {
  main();
} 