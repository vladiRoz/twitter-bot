const axios = require('axios');
const { subDays, format } = require('date-fns');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Setup logging
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - INFO - ${message}`);
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    console.error(`${timestamp} - ERROR - ${message}`);
  }
};

// Get API key from environment with validation
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  logger.error('OpenAI API key is missing from environment variables');
  throw new Error('OpenAI API key is required');
}

async function getViolenceData() {
  try {
    // Calculate yesterday's date
    const yesterday = subDays(new Date(), 1);
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
    
    const prompt = `You are a data collection service that reports on Arab-on-Arab violence. For this task, assume you have access to news sources and can provide data about incidents that occurred yesterday.

Please provide a JSON response in exactly this format:
{
    "date": "${yesterdayFormatted}",
    "countries": [
        {
            "country": "Country name",
            "death_toll": number or "unknown",
            "summary": "Brief description of what happened"
        }
    ]
}

Rules:
1. Only include Arab countries where incidents occurred
2. If no incidents occurred, return an empty countries array
3. Don't include Gaza unless violence originated from Arabs/Palestinians/Hamas
4. Don't include Israel
5. Respond ONLY with the JSON, no other text
6. For this simulation, include at least one incident
7. if the number is unknown, don't include it.

Example response for no incidents:
{
    "date": "${yesterdayFormatted}",
    "countries": []
}`;
    
    logger.info("Sending request to OpenAI API...");
    
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
    
    logger.info("Received response from OpenAI API");
    logger.info(`Response status: ${response.status}`);
    
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      logger.error(`Unexpected API response structure: ${JSON.stringify(response.data)}`);
      throw new Error("Invalid API response structure");
    }
    
    const content = response.data.choices[0].message.content;
    logger.info(`Raw content from OpenAI: ${content}`);
    
    let jsonString = content.trim();
    if (content.includes('```json')) {
      jsonString = content.split('```json')[1].split('```')[0].trim();
      logger.info(`Extracted JSON from markdown code block: ${jsonString}`);
    } else if (content.includes('```')) {
      jsonString = content.split('```')[1].split('```')[0].trim();
      logger.info(`Extracted content from markdown code block: ${jsonString}`);
    }
    
    try {
      const parsedData = JSON.parse(jsonString);
      logger.info("Successfully parsed JSON response");
      return parsedData;
    } catch (parseError) {
      logger.error(`JSON parse error: ${parseError.message}`);
      logger.error(`Failed to parse JSON: ${jsonString}`);
      
      return {
        date: yesterdayFormatted,
        countries: [],
        error: `JSON parse error: ${parseError.message}`
      };
    }
  } catch (error) {
    logger.error(`Error querying OpenAI API: ${error.message}`);
    
    if (error.response) {
      logger.error(`API error status: ${error.response.status}`);
      logger.error(`API error data: ${JSON.stringify(error.response.data)}`);
      logger.error(`API error headers: ${JSON.stringify(error.response.headers)}`);
    } else if (error.request) {
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

module.exports = {
  getViolenceData,
  logger
}; 