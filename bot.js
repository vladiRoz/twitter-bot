const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const dotenv = require('dotenv');
const { subDays, format } = require('date-fns');

// Load environment variables
dotenv.config();

// Setup logging
const logFile = fs.createWriteStream('bot.log', { flags: 'a' });
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

// Get API keys from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const TWITTER_ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

// OpenAI API request function
async function getViolenceData() {
  try {
    // Calculate yesterday's date
    const yesterday = subDays(new Date(), 1);
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
    
    const prompt = `
    Research incidents of Arab-on-Arab violence, including murders, armed conflict, and reported acts of violence or mass killings that occurred on ${yesterdayFormatted}, broken down by Arab country.
    
    Gather the latest available information from news reports and official sources and provide a country-by-country breakdown.
    
    Create a short and simple summary for every Arab country where incidents occurred.
    
    Format the response as a JSON with the following structure:
    {
        "date": "${yesterdayFormatted}",
        "countries": [
            {
                "country": "Country name",
                "death_toll": number or "unknown",
                "summary": "Brief description of what happened"
            },
            ...
        ]
    }
    
    Only include countries where incidents were reported. If no incidents were reported in any Arab country, return an empty "countries" array.
    `;
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    // Extract the response content
    const content = response.data.choices[0].message.content;
    
    // Parse JSON from the content
    let jsonString = content.trim();
    if (content.includes('```json')) {
      jsonString = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonString = content.split('```')[1].split('```')[0].trim();
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    logger.error(`Error querying OpenAI API: ${error.message}`);
    const yesterday = subDays(new Date(), 1);
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
    return {
      date: yesterdayFormatted,
      countries: [],
      error: error.message
    };
  }
}

// Twitter posting function
async function postToTwitter(data) {
  try {
    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: TWITTER_API_KEY,
      appSecret: TWITTER_API_SECRET,
      accessToken: TWITTER_ACCESS_TOKEN,
      accessSecret: TWITTER_ACCESS_SECRET,
    });
    
    const v1Client = client.v1;
    
    // Create thread for posting
    const { date, countries } = data;
    
    if (countries.length === 0) {
      const message = `Report for ${date}: No incidents of violence were reported in Arab countries yesterday.`;
      await v1Client.tweet(message);
      logger.info(`Posted: ${message}`);
      return;
    }
    
    // First tweet in thread
    const message = `Violence Report in Arab Countries for ${date}:`;
    const firstTweet = await v1Client.tweet(message);
    let lastTweetId = firstTweet.id_str;
    logger.info(`Posted thread starter: ${message}`);
    
    // Post each country as a reply in the thread
    for (const countryData of countries) {
      const { country, death_toll, summary } = countryData;
      
      let message = `${country}: ${death_toll} casualties. ${summary}`;
      
      // Twitter has a 280 character limit
      if (message.length > 280) {
        message = message.substring(0, 277) + '...';
      }
      
      // Post as reply to create thread
      const reply = await v1Client.tweet(message, { in_reply_to_status_id: lastTweetId });
      lastTweetId = reply.id_str;
      logger.info(`Posted reply: ${message}`);
      
      // Sleep to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    logger.error(`Error posting to Twitter: ${error.message}`);
  }
}

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
    
    // Save the data to a JSON file
    saveJsonReport(violenceData);
    
    // Post to Twitter
    logger.info("Posting to Twitter");
    await postToTwitter(violenceData);
    
    logger.info("Bot run completed successfully");
  } catch (error) {
    logger.error(`Error in main bot execution: ${error.message}`);
  }
}

// Run the main function if this script is run directly
if (require.main === module) {
  main();
} 