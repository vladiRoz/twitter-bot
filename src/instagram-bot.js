const fs = require('fs');
const path = require('path');
const { getViolenceData } = require('./services/gemini');
const { logger } = require('./utils/logger');
const instagramService = require('./services/instagram');

// Save report to file
function saveJsonReport(data) {
  try {
    const { date } = data;
    const fileName = `reports/${date.replace(/-/g, '')}_report.json`;
    
    // Create reports directory if it doesn't exist
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports');
    }
    
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
    logger.info(`Saved report to ${fileName}`);
  } catch (error) {
    logger.error(`Error saving JSON report: ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    logger.info("Starting violence data collection using Gemini");
    const violenceData = await getViolenceData();

    // Log the complete data object
    logger.info(`Retrieved data for date: ${violenceData.date}`);
    
    if (violenceData.error) {
      logger.error(`Error in retrieved data: ${violenceData.error}`);
    }
    
    // Save the data to a JSON file
    saveJsonReport(violenceData);
    
    // Only post to Instagram if there are incidents reported and no errors
    if (!violenceData.error && violenceData.countries && violenceData.countries.length > 0) {
      await instagramService.postToInstagram(violenceData);
    } else {
      logger.info("Skipping Instagram post due to no data or errors");
    }
    
    logger.info("Bot run completed successfully");
    return true;
  } catch (error) {
    logger.error(`Error in main bot execution: ${error.message}`);
    return false;
  }
}

// Run the main function if this script is run directly
if (require.main === module) {
  main();
}

module.exports = { main }; 