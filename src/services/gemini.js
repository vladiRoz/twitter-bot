const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
  const fs = require("node:fs");
  const mime = require("mime-types");
  const { subDays, format } = require('date-fns');
  const { createPrompt } = require('../utils/promptBuilder');
  const { logger } = require('../utils/logger');
  const dotenv = require('dotenv');
  // Load environment variables
dotenv.config();

  const apiKey = process.env.GEMINI_API_KEY;

  const genAI = new GoogleGenerativeAI(apiKey);
  
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
  });
  
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseModalities: [
    ],
    responseMimeType: "text/plain",
  };
  
  async function getViolenceData() {
    try {
      const yesterday = subDays(new Date(), 1);
      const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
      
      const prompt = createPrompt(yesterdayFormatted);
      logger.info("Sending request to Gemini API with prompt from promptBuilder");
      
      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [
              {text: "You are a data collection service that reports on Arab-on-Arab violence. For this task, assume you have access to news sources and can provide data about incidents that occurred yesterday.\n\nPlease provide a JSON response in exactly this format:\n{\n    \"date\": \"${yesterdayFormatted}\",\n    \"countries\": [\n        {\n            \"country\": \"Country name\",\n            \"death_toll\": number or \"unknown\",\n            \"summary\": \"Brief description of what happened\"\n        }\n    ]\n}\n\nRules:\n1. Only include Arab countries where incidents occurred\n2. If no incidents occurred, return an empty countries array\n3. Don't include Gaza unless violence originated from Arabs/Palestinians/Hamas\n4. Don't include Israel\n5. Respond ONLY with the JSON, no other text\n6. For this simulation, include at least one incident\n7. if the number is unknown, don't include it.\n\nExample response for no incidents:\n{\n    \"date\": \"${yesterdayFormatted}\",\n    \"countries\": []\n}`;"},
            ],
          },
          {
            role: "model",
            parts: [
              {text: "```json\n{\n    \"date\": \"2024-02-29\",\n    \"countries\": [\n        {\n            \"country\": \"Lebanon\",\n            \"death_toll\": 2,\n            \"summary\": \"Clashes erupted between rival factions in a Palestinian refugee camp near Tyre, resulting in casualties. The fighting involved the use of small arms and explosives.\"\n        }\n    ]\n}\n```"},
            ],
          },
          {
            role: "user",
            parts: [
              {text: "same question but for the 28.03.2025\n"},
            ],
          },
          {
            role: "model",
            parts: [
              {text: "```json\n{\n    \"date\": \"2025-03-28\",\n    \"countries\": [\n        {\n            \"country\": \"Yemen\",\n            \"death_toll\": 5,\n            \"summary\": \"Fighting between opposing factions intensified in Marib, resulting in civilian casualties and displacement.\"\n        }\n    ]\n}\n```"},
            ],
          },
        ],
      });
    
      const result = await chatSession.sendMessage(prompt);
      logger.info("Received response from Gemini API");
      
      const responseText = result.response.text();
      logger.info(`Raw response: ${responseText}`);
      
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
      logger.error(`Error querying Gemini API: ${error.message}`);
      
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