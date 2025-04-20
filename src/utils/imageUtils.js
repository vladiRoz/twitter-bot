const axios = require('axios');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { logger } = require('./logger');

// Load environment variables from the root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  logger.error('Unsplash access key is missing from environment variables');
}

class ImageUtils {
  constructor() {
    this.unsplashApi = axios.create({
      baseURL: 'https://api.unsplash.com',
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    }); 
  }

  async getRelevantImage(data) {
    try {
      if (!UNSPLASH_ACCESS_KEY) {
        logger.error('Unsplash access key is missing - using fallback image');
        return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167';
      }
      
      // Use country name for a more relevant search if available
      const searchTerm = data && data.countries && data.countries.length > 0 
        ? `${data.countries[0].country} news` 
        : 'typewriter news journalism';
      
      logger.info(`Searching Unsplash for: ${searchTerm}`);
      
      // Search for relevant photos
      const response = await this.unsplashApi.get('/photos/random', {
        params: {
          query: searchTerm,
          orientation: 'squarish'
        }
      });
      
      logger.info(`Got background image from Unsplash: ${response.data.urls.regular.substring(0, 50)}...`);
      return response.data.urls.regular;
    } catch (error) {
      logger.error('Error fetching image from Unsplash:', error);
      // Return a fallback image URL if the request fails
      return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167';
    }
  }

  async createReportImage(data, backgroundImageUrl) {
    try {
      // Create a new image with dimensions suitable for Instagram
      const width = 1080;  // Instagram recommended width
      const height = 1080; // Square format

      logger.info(`Creating image with dimensions ${width}x${height}`);
      
      // Download and load the background image
      const backgroundImage = await Jimp.read(backgroundImageUrl);
      
      // Resize and crop the background image to fit Instagram dimensions
      backgroundImage.cover(width, height);

      // Add a semi-transparent overlay to improve text readability
      backgroundImage.brightness(-0.5); // Darken the image significantly
      backgroundImage.contrast(0.3);    // Increase contrast more

      // Add a more opaque black overlay to improve text readability
      const overlay = await new Jimp(width, height, 0x000000A0); // 60% transparent black
      backgroundImage.composite(overlay, 0, 0);
      
      // Load fonts with larger sizes for better readability
      const titleFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
      const dateFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      const countryFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE); // Larger for country names
      const statsFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
      const summaryFont = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE); // Larger for summary
      
      // Title
      const title = "Arab World Violence Report";
      const titleWidth = Jimp.measureText(titleFont, title);
      backgroundImage.print(titleFont, (width - titleWidth) / 2, 100, title);
      
      // Date
      const date = `for ${data.date}`;
      const dateWidth = Jimp.measureText(dateFont, date);
      backgroundImage.print(dateFont, (width - dateWidth) / 2, 180, date);
      
      // Starting Y position for countries
      let y = 280;
      
      // Draw each country's information
      if (data.countries && data.countries.length > 0) {
        for (const country of data.countries) {
          // Country name (no emoji - Jimp doesn't render them properly)
          backgroundImage.print(countryFont, 100, y, country.country + ":");
          y += 90; // Increased spacing after country title
          
          // Death toll
          const deathToll = `Casualties: ${country.death_toll}`;
          backgroundImage.print(statsFont, 120, y, deathToll);
          y += 50;
          
          // Summary with word wrapping
          const maxLineWidth = width - 240; // Leave some margin
          const summaryLines = this.wordWrap(country.summary, summaryFont, maxLineWidth);
          
          // Indent and print each line of the summary
          for (const line of summaryLines) {
            backgroundImage.print(summaryFont, 120, y, line);
            y += 40; // Increased spacing
          }
          
          y += 50; // Add more space between countries
        }
      } else {
        const noData = "No incidents reported today";
        const noDataWidth = Jimp.measureText(dateFont, noData);
        backgroundImage.print(dateFont, (width - noDataWidth) / 2, 350, noData);
      }

      // Save the image
      const imagePath = path.join(__dirname, '../../temp');
      if (!fs.existsSync(imagePath)) {
        fs.mkdirSync(imagePath, { recursive: true });
      }
      const outputPath = path.join(imagePath, 'report.jpg');
      await backgroundImage.writeAsync(outputPath);
      
      logger.info(`Created report image: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logger.error('Error creating report image:', error);
      throw error;
    }
  }
  
  // Helper to get appropriate flag emoji for country
  getCountryFlagEmoji(countryName) {
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
  
  // Helper to wrap text
  wordWrap(text, font, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const testWidth = Jimp.measureText(font, testLine);
      
      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}

module.exports = new ImageUtils(); 