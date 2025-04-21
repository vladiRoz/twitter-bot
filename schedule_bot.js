const fs = require('fs');
const { exec } = require('child_process');
const schedule = require('node-schedule');
const path = require('path');

// Get the absolute path to the project root
const rootDir = path.resolve(__dirname);

// Setup logging
const logFile = fs.createWriteStream(path.join(rootDir, 'scheduler.log'), { flags: 'a' });
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

// Function to run the Instagram bot
function runInstagramBot() {
  const timestamp = new Date().toISOString();
  logger.info(`Running Instagram bot at ${timestamp}`);
  
  // Execute the Instagram bot script
  exec('node src/instagram-bot.js', { cwd: rootDir }, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error running Instagram bot: ${error.message}`);
      return;
    }
    
    if (stderr) {
      logger.error(`Instagram bot stderr: ${stderr}`);
    }
    
    if (stdout) {
      logger.info(`Instagram bot stdout: ${stdout}`);
    }
    
    logger.info('Instagram bot execution completed successfully');
  });
}

// Main function
function main() {
  logger.info('Starting scheduler');
  
  // Schedule the bot to run every 2 days at 8:00 AM
  // Rule: minute hour day month dayOfWeek
  const job = schedule.scheduleJob('0 8 */2 * *', runInstagramBot);
  logger.info(`Instagram bot scheduled to run at 8:00 AM every 2 days. Next run: ${job.nextInvocation()}`);
  
  // Run once immediately if RUN_ON_START is set
  if (process.env.RUN_ON_START === 'true') {
    logger.info('RUN_ON_START is set to true, running Instagram bot now');
    runInstagramBot();
  }
  
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

module.exports = { main, runInstagramBot }; 