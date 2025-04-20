const fs = require('fs');
const path = require('path');
const { getViolenceData, logger } = require('./services/gemini');
const imageUtils = require('./utils/imageUtils');

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

// Generate caption text
function generateCaption(data) {
  let caption = `🔴 Arab World Violence Report for ${data.date}\n\n`;
  
  if (data.countries && data.countries.length > 0) {
    data.countries.forEach(country => {
      const flag = imageUtils.getCountryFlagEmoji(country.country);
      caption += `${flag} ${country.country}: ${country.death_toll} casualties\n`;
      caption += `${country.summary}\n\n`;
    });
  } else {
    caption += 'No incidents reported today.';
  }
  
  caption += '\n#ArabViolence #NewsReport #Peace';
  return caption;
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
    
    // Generate caption for reference
    const caption = generateCaption(violenceData);
    logger.info(`Generated caption: ${caption}`);
    
    // Get a relevant background image
    const backgroundImageUrl = await imageUtils.getRelevantImage(violenceData);
    logger.info(`Got background image URL`);

    // Create image with the data and background
    const imagePath = await imageUtils.createReportImage(violenceData, backgroundImageUrl);
    logger.info(`Created and saved report image to: ${imagePath}`);
    
    // Copy image to output directory with date in filename
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const date = violenceData.date.replace(/-/g, '');
    const outputPath = path.join(outputDir, `violence_report_${date}.jpg`);
    fs.copyFileSync(imagePath, outputPath);
    logger.info(`Copied report image to: ${outputPath}`);
    
    logger.info("Image generation completed successfully");
  } catch (error) {
    logger.error(`Error in main execution: ${error.message}`);
  }
}

// Run the main function if this script is run directly
if (require.main === module) {
  main();
} 