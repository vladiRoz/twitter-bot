const axios = require('axios');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

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
      // Search for relevant photos
      const response = await this.unsplashApi.get('/photos/random', {
        params: {
          query: 'breaking news journalism',
          orientation: 'squarish'
        }
      });

      return response.data.urls.regular;
    } catch (error) {
      console.error('Error fetching image from Unsplash:', error);
      // Return a fallback image URL if the request fails
      return 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167';
    }
  }

  async createReportImage(message, backgroundImageUrl) {
    try {
      // Create a new image with dimensions suitable for Instagram
      const width = 1080;  // Instagram recommended width
      const height = 1080; // Square format

      // Download and load the background image
      const backgroundImage = await Jimp.read(backgroundImageUrl);
      
      // Resize and crop the background image to fit Instagram dimensions
      backgroundImage.cover(width, height);

      // Add a semi-transparent overlay to improve text readability
      backgroundImage.brightness(-0.3); // Darken the image
      backgroundImage.contrast(0.1);    // Increase contrast

      // Load font
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE); // Use white text

      // Split message into lines
      const maxLineWidth = width - 100; // Leave some margin
      const lines = [];
      let currentLine = '';
      const words = message.split(' ');

      for (const word of words) {
        const testLine = currentLine + word + ' ';
        const testWidth = Jimp.measureText(font, testLine);
        
        if (testWidth > maxLineWidth) {
          lines.push(currentLine);
          currentLine = word + ' ';
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      // Calculate starting Y position to center the text vertically
      const lineHeight = 50;
      const totalTextHeight = lines.length * lineHeight;
      let y = (height - totalTextHeight) / 2;

      // Print each line
      for (const line of lines) {
        const x = (width - Jimp.measureText(font, line)) / 2;
        backgroundImage.print(font, x, y, line);
        y += lineHeight;
      }

      // Save the image
      const imagePath = path.join(__dirname, '../../temp');
      if (!fs.existsSync(imagePath)) {
        fs.mkdirSync(imagePath, { recursive: true });
      }
      const outputPath = path.join(imagePath, 'report.jpg');
      await backgroundImage.writeAsync(outputPath);
      
      return outputPath;
    } catch (error) {
      console.error('Error creating report image:', error);
      throw error;
    }
  }
}

module.exports = new ImageUtils(); 