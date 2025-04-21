const fs = require('fs');
const { exec } = require('child_process');
const schedule = require('node-schedule');
const path = require('path');

// Get the absolute path to the project root
const rootDir = path.resolve(__dirname);

// Setup logging
const logFile = fs.createWriteStream(path.join(rootDir, 'facebook-token-scheduler.log'), { flags: 'a' });
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

// Function to refresh the Facebook token
function refreshFacebookToken() {
  const timestamp = new Date().toISOString();
  logger.info(`Refreshing Facebook token at ${timestamp}`);
  
  // Execute the Facebook token refresh script
  exec('npm run refresh-facebook-token', { cwd: rootDir }, (error, stdout, stderr) => {
    if (error) {
      logger.error(`Error refreshing Facebook token: ${error.message}`);
      return;
    }
    
    if (stderr) {
      logger.error(`Facebook token refresh stderr: ${stderr}`);
    }
    
    if (stdout) {
      logger.info(`Facebook token refresh stdout: ${stdout}`);
    }
    
    logger.info('Facebook token refresh completed');
    
    // Calculate and log the next scheduled refresh
    const nextRefresh = new Date();
    nextRefresh.setMonth(nextRefresh.getMonth() + 2);
    logger.info(`Next token refresh scheduled for: ${nextRefresh.toISOString()}`);
  });
}

// Check if Facebook token is about to expire
function checkTokenExpiration() {
  try {
    const tokenFilePath = path.join(rootDir, 'facebook_token.json');
    
    if (fs.existsSync(tokenFilePath)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      
      if (tokenData.expiration_date) {
        const expirationDate = new Date(tokenData.expiration_date);
        const now = new Date();
        
        // Calculate days until expiration
        const daysUntilExpiration = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));
        
        logger.info(`Facebook token expires in ${daysUntilExpiration} days`);
        
        // If token expires in less than 10 days, refresh it
        if (daysUntilExpiration <= 10) {
          logger.info('Token expiration is approaching, refreshing now');
          refreshFacebookToken();
        }
      }
    }
  } catch (error) {
    logger.error(`Error checking token expiration: ${error.message}`);
  }
}

// Schedule rule: Run every 2 months on the 1st at 7:00 AM
function createRefreshSchedule() {
  // Create a recurring rule that runs on the 1st of every odd-numbered month
  const rule = new schedule.RecurrenceRule();
  rule.month = [0, 2, 4, 6, 8, 10];  // Jan, Mar, May, Jul, Sep, Nov (0-indexed months)
  rule.date = 1;                    // 1st of the month
  rule.hour = 7;
  rule.minute = 0;
  rule.second = 0;
  
  logger.info('Created schedule to run on the 1st of every other month at 7:00 AM');
  return rule;
}

// Main function
function main() {
  logger.info('Starting Facebook token refresh scheduler');
  
  // First check if token is about to expire
  checkTokenExpiration();
  
  // Schedule the token refresh every 2 months
  const rule = createRefreshSchedule();
  const job = schedule.scheduleJob(rule, refreshFacebookToken);
  
  // For more reliability, also schedule a daily check that will only refresh if needed
  const dailyCheckJob = schedule.scheduleJob('0 9 * * *', checkTokenExpiration);
  
  // Get the next run date
  const nextRun = job.nextInvocation();
  logger.info(`Facebook token refresh scheduled every 2 months. Next run: ${nextRun}`);
  
  // Run once immediately if RUN_ON_START is set
  if (process.env.RUN_ON_START === 'true') {
    logger.info('RUN_ON_START is set to true, refreshing Facebook token now');
    refreshFacebookToken();
  }
  
  // Handle process termination
  process.on('SIGINT', () => {
    logger.info('Scheduler stopping due to SIGINT');
    job.cancel();
    dailyCheckJob.cancel();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logger.info('Scheduler stopping due to SIGTERM');
    job.cancel();
    dailyCheckJob.cancel();
    process.exit(0);
  });
}

// Run the main function if this script is run directly
if (require.main === module) {
  main();
}

module.exports = { main, refreshFacebookToken, checkTokenExpiration }; 