const path = require('path');

/**
 * Application configuration
 */
const config = {
  // Root directory where all code repositories are located
  ROOT_CODE_DIR: path.join(process.env.HOME, 'coding'),

  // Server port
  PORT: process.env.PORT || 3000
};

module.exports = config;
