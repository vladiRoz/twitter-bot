const axios = require('axios');
const { subDays, format } = require('date-fns');
const dotenv = require('dotenv');
const path = require('path');
const { createPrompt } = require('../utils/promptBuilder');
const { logger } = require('../utils/logger');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
    
    const prompt = createPrompt(yesterdayFormatted);
    
    logger.info("Sending request to OpenAI API...");
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { 
            role: "system", 
            content: "You are a data collection service that reports on Arab-on-Arab violence."
          },
          { 
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
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
    
    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      logger.error("Unexpected API response format");
      return {
        date: yesterdayFormatted,
        countries: [],
        error: "Unexpected API response format"
      };
    }
    
    const responseText = response.data.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let jsonString = responseText.trim();
    if (responseText.includes('```json')) {
      jsonString = responseText.split('```json')[1].split('```')[0].trim();
      logger.info(`Extracted JSON from markdown code block: ${jsonString}`);
    } else if (responseText.includes('```')) {
      jsonString = responseText.split('```')[1].split('```')[0].trim();
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