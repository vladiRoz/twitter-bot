const fs = require('fs');
const path = require('path');
const { subDays, format } = require('date-fns');
const Twitter = require('twitter-lite');
const dotenv = require('dotenv');
const { getViolenceData, logger } = require('./services/gemini');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get Twitter API credentials
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;

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

// Format the collected data into a tweet
function formatTweet(data) {
  const { date, countries } = data;
  
  // If no countries with incidents, return a simple message
  if (!countries || countries.length === 0) {
    return {
      full: `No Arab-on-Arab violence incidents reported for ${date}.`,
      summary: `No Arab-on-Arab violence incidents reported for ${date}.`
    };
  }
  
  // Format the full message with all details
  let message = `Arab World Violence Report for ${date}:\n\n`;
  
  // Format each country's data
  countries.forEach(country => {
    const { country: countryName, death_toll, summary } = country;
    const flag = getCountryFlag(countryName);
    message += `${flag} ${countryName}: ${death_toll} casualties\n${summary}\n\n`;
  });
  
  // If message is too long, create a summary
  const isTooLong = message.length > 280;
  let summaryMessage = '';
  
  if (isTooLong) {
    const totalCountries = countries.length;
    const totalDeaths = countries.reduce((sum, country) => {
      const deaths = typeof country.death_toll === 'number' ? country.death_toll : 0;
      return sum + deaths;
    }, 0);
    
    const avgDeaths = Math.round(totalDeaths / totalCountries);
    
    summaryMessage = `Arab World Violence Report for ${date}:\n\n`;
    summaryMessage += `${totalCountries} countries affected with a total of ${totalDeaths} casualties (avg: ${avgDeaths} per country).\n\n`;
    summaryMessage += '#ArabViolence';
  }
  
  return {
    full: message,
    summary: isTooLong ? summaryMessage : message
  };
}

// Helper function to get flag emoji for a country
function getCountryFlag(countryName) {
  const flagMap = {
    "Syria": "🇸🇾",
    "Iraq": "🇮🇶",
    "Yemen": "🇾🇪",
    "Libya": "🇱🇾",
    "Lebanon": "🇱🇧",
    "Sudan": "🇸🇩",
    "Somalia": "🇸🇴",
    "Algeria": "🇩🇿",
    "Egypt": "🇪🇬",
    "Tunisia": "🇹🇳",
    "Morocco": "🇲🇦",
    "Saudi Arabia": "🇸🇦",
    "UAE": "🇦🇪",
    "United Arab Emirates": "🇦🇪",
    "Qatar": "🇶🇦",
    "Bahrain": "🇧🇭",
    "Oman": "🇴🇲",
    "Kuwait": "🇰🇼",
    "Jordan": "🇯🇴",
    "Mauritania": "🇲🇷",
    "Djibouti": "🇩🇯",
    "Senegal": "🇸🇳",
    "Mali": "🇲🇱",
    "Niger": "🇳🇪",
    "Chad": "🇹🇩",
    "Gambia": "🇬🇲",
    "Sierra Leone": "🇸🇱",
    "Nigeria": "🇳🇬",
    "Eritrea": "🇪🇷"
  };
  
  return flagMap[countryName] || "🌍";
}

// Post to Twitter
async function postToTwitter(message) {
  try {
    // Log the message that will be posted
    logger.info(`Posting to Twitter: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    
    // Check if Twitter credentials are available
    if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET) {
      logger.info('Twitter credentials not found, skipping actual post.');
      return 'test_tweet_id';
    }
    
    // Initialize Twitter client
    const client = new Twitter({
      consumer_key: TWITTER_API_KEY,
      consumer_secret: TWITTER_API_SECRET,
      access_token_key: TWITTER_ACCESS_TOKEN,
      access_token_secret: TWITTER_ACCESS_TOKEN_SECRET
    });
    
    // Post the tweet
    const response = await client.post('statuses/update', {
      status: message
    });
    
    logger.info(`Successfully posted to Twitter, tweet ID: ${response.id_str}`);
    
    return response.id_str;
  } catch (error) {
    logger.error(`Error posting to Twitter: ${error.message}`);
    if (error.errors) {
      error.errors.forEach(e => {
        logger.error(`Twitter API error: ${e.message} (code: ${e.code})`);
      });
    }
    throw error;
  }
}

// Main function
async function main() {
  try {
    logger.info("Starting violence data collection for Twitter");
    const violenceData = await getViolenceData();

    // Log the complete data object
    logger.info(`Retrieved data for date: ${violenceData.date}`);
    
    if (violenceData.error) {
      logger.error(`Error in retrieved data: ${violenceData.error}`);
    }
    
    // Save the data to a JSON file
    saveJsonReport(violenceData);
    
    // Format the tweet
    const { full, summary } = formatTweet(violenceData);
    const tweetText = summary || full;
    
    // Post to Twitter
    await postToTwitter(tweetText);
    
    logger.info("Twitter bot run completed successfully");
    return true;
  } catch (error) {
    logger.error(`Error in Twitter bot execution: ${error.message}`);
    return false;
  }
}

// Run the main function if this script is run directly
if (require.main === module) {
  main();
}

module.exports = { main }; 