const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Twitter = require('twitter-lite');
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

// Initialize Twitter client with v2
const client = new Twitter({
  subdomain: "api",
  version: "2",
  extension: false,
  consumer_key: TWITTER_API_KEY,
  consumer_secret: TWITTER_API_SECRET,
  access_token_key: TWITTER_ACCESS_TOKEN,
  access_token_secret: TWITTER_ACCESS_SECRET
});

// OpenAI API request function
async function getViolenceData() {
  try {
    // Calculate yesterday's date
    const yesterday = subDays(new Date(), 1);
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
    
    const prompt = `
    target: find sources of death tolls of Arab-on-Arab violence only yesterday.
    look into incidents of Arab-on-Arab violence, including murders, armed conflict, and reported acts of genocide or mass killings that occurred yesterday, broken down by Arab country.
    gather the latest available information from news reports and official sources and get back to you with a country-by-country breakdown.
    create a short and simple summery for every country mentioned.
    don't include gaza unless the violence originated from arabs/Palestinians/Hamas.
    include only yesterday.
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
    
    logger.info("Sending request to OpenAI API...");
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo',
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
    
    logger.info("Received response from OpenAI API");
    
    // Log response status and headers for debugging
    logger.info(`Response status: ${response.status}`);
    
    // Extract the response content
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      logger.error(`Unexpected API response structure: ${JSON.stringify(response.data)}`);
      throw new Error("Invalid API response structure");
    }
    
    const content = response.data.choices[0].message.content;
    logger.info(`Raw content from OpenAI: ${content}`);
    
    // Parse JSON from the content
    let jsonString = content.trim();
    if (content.includes('```json')) {
      jsonString = content.split('```json')[1].split('```')[0].trim();
      logger.info(`Extracted JSON from markdown code block: ${jsonString}`);
    } else if (content.includes('```')) {
      jsonString = content.split('```')[1].split('```')[0].trim();
      logger.info(`Extracted content from markdown code block: ${jsonString}`);
    }
    
    try {
      // Attempt to parse the JSON string
      const parsedData = JSON.parse(jsonString);
      logger.info("Successfully parsed JSON response");
      return parsedData;
    } catch (parseError) {
      logger.error(`JSON parse error: ${parseError.message}`);
      logger.error(`Failed to parse JSON: ${jsonString}`);
      
      // Return a default structure when JSON parsing fails
      return {
        date: yesterdayFormatted,
        countries: [],
        error: `JSON parse error: ${parseError.message}`
      };
    }
  } catch (error) {
    logger.error(`Error querying OpenAI API: ${error.message}`);
    
    // Log more detailed error information if available
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error(`API error status: ${error.response.status}`);
      logger.error(`API error data: ${JSON.stringify(error.response.data)}`);
      logger.error(`API error headers: ${JSON.stringify(error.response.headers)}`);
    } else if (error.request) {
      // The request was made but no response was received
      logger.error(`No response received: ${error.request}`);
    }
    
    const yesterday = subDays(new Date(), 1);
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
    return {
      date: yesterdayFormatted,
      countries: [],
      error: error.message
    };
  }
}

// Twitter posting function using v2 API
async function postToTwitter(data) {
  try {
    logger.info('Posting to Twitter');
    
    // Ensure we have valid data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data provided to postToTwitter');
    }

    // Ensure we have a valid date
    if (!data.date) {
      throw new Error('No date provided in data');
    }

    // Handle case with no incidents
    if (!data.countries || data.countries.length === 0) {
      const message = `📊 Violence Report for ${data.date}\n\nNo incidents of violence reported today.`;
      logger.info('Posting message:', message);
      
      const response = await client.post('tweets', {
        text: message
      });
      
      if (response && response.data) {
        logger.info('Successfully posted tweet:', response.data.id);
      } else {
        logger.warn('Tweet posted but no response data received');
      }
      return;
    }

    // Construct message for cases with incidents
    let message = `📊 Violence Report for ${data.date}\n\n`;
    
    data.countries.forEach(country => {
      const countryName = country.name || country.country; // Handle both name formats
      const deathToll = country.deathToll || country.death_toll; // Handle both formats
      const summary = country.summary;
      const flag = country.flag || '🏳️'; // Default flag if none provided

      message += `${flag} ${countryName}:\n`;
      message += `Casualties: ${deathToll}\n`;
      if (summary) {
        message += `${summary}\n`;
      }
      message += '\n';
    });

    // If message is too long, create a summary version
    if (message.length > 280) {
      const totalCountries = data.countries.length;
      const totalCasualties = data.countries.reduce((sum, country) => {
        const casualties = country.deathToll || country.death_toll || 0;
        return sum + casualties;
      }, 0);
      const avgCasualties = Math.round(totalCasualties / totalCountries);
      
      message = `📊 Violence Report for ${data.date}\n\n`;
      message += `${totalCountries} countries affected\n`;
      message += `Total casualties: ${totalCasualties}\n`;
      message += `Average casualties per country: ${avgCasualties}\n\n`;
      message += `Full report: ${process.env.WEBSITE_URL || 'website.com'}`;
    }

    logger.info('Posting message:', message);
    
    const response = await client.post('tweets', {
      text: message
    });
    
    if (response && response.data) {
      logger.info('Successfully posted tweet:', response.data.id);
    } else {
      logger.warn('Tweet posted but no response data received');
    }
  } catch (error) {
    logger.error('Error posting to Twitter:', {
      message: error.message,
      status: error.status,
      errors: error.errors,
      response: error.response,
      data: error.data,
      headers: error._headers,
      stack: error.stack
    });
    throw error;
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

    // Log the complete data object
    logger.info(`Retrieved data for date: ${violenceData.date}`);
    logger.info(`Number of countries with incidents: ${violenceData.countries?.length || 0}`);
    
    if (violenceData.error) {
      logger.error(`Error in retrieved data: ${violenceData.error}`);
    }
    
    // Save the data to a JSON file
    saveJsonReport(violenceData);
    
    // Only post to Twitter if there are no errors in the data
    if (!violenceData.error) {
      logger.info("Posting to Twitter");
      await postToTwitter(violenceData);
    } else {
      logger.error("Skipping Twitter post due to errors in the data");
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