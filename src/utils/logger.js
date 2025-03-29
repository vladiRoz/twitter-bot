

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


  module.exports = {
    logger
  };