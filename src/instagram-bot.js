const fs = require('fs');
const path = require('path');
const { getViolenceData, logger } = require('./services/openai');
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
    logger.info("Starting violence data collection");
    const violenceData = await getViolenceData();

    // Log the complete data object
    logger.info(`Retrieved data for date: ${violenceData.date}`);
    logger.info(`Number of countries with incidents: ${violenceData.countries?.length || 0}`);
    
    if (violenceData.error) {
      logger.error(`Error in retrieved data: ${violenceData.error}`);
    }
    
    // Save the data to a JSON file
    saveJsonReport(violenceData);
    
    // Only post to Instagram if there are no errors in the data
    if (!violenceData.error) {
      logger.info("Posting to Instagram");
      await instagramService.postToInstagram(violenceData);
    } else {
      logger.error("Skipping Instagram post due to errors in the data");
    }
    
    logger.info("Bot run completed successfully");
  } catch (error) {
    logger.error(`Error in main bot execution: ${error.message}`);
  }
}

// Run the main function if this script is run directly
if (require.main === module) {
  main();
} 