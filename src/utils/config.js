/**
 * Configuration management for podcast art regeneration
 * Copyright (c) JAB Ventures, Inc., 2025
 * Licensed under GPL v2
 */

// Load environment variables
require('dotenv').config();

const config = {
  // API Configuration
  api: {
    baseUrl: process.env.AZURACAST_URL ? `${process.env.AZURACAST_URL}/api` : null,
    key: process.env.API_KEY,
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second base delay
  },

  // Station Configuration
  station: {
    id: process.env.STATION_ID ? parseInt(process.env.STATION_ID) : null,
    podcastId: process.env.PODCAST_ID || null,
    name: null // Will be discovered during initialization
  },

  // Processing Configuration
  processing: {
    defaultBatchSize: process.env.DEFAULT_BATCH_SIZE ? parseInt(process.env.DEFAULT_BATCH_SIZE) : 50,
    progressFile: './data/progress.json',
    tempDir: './temp',
    maxConcurrent: 3 // Max concurrent downloads
  },

  // CLI Configuration
  cli: {
    colors: {
      success: 'green',
      error: 'red',
      warning: 'yellow',
      info: 'blue',
      progress: 'cyan'
    }
  }
};

/**
 * Get station configuration
 * @returns {Object} Station configuration
 */
function getStationConfig() {
  if (!config.station.id) {
    throw new Error('Station ID not configured. Run with --initialize to set up configuration.');
  }
  return config.station;
}

/**
 * Validate configuration
 * @throws {Error} If configuration is invalid
 */
function validateConfig() {
  if (!config.api.key) {
    throw new Error('API key is required. Run with --initialize to set up configuration.');
  }
  
  if (!config.api.baseUrl) {
    throw new Error('AzuraCast URL is required. Run with --initialize to set up configuration.');
  }
  
  if (!config.station.id) {
    throw new Error('Station ID is required. Run with --initialize to set up configuration.');
  }
  
  if (!config.station.podcastId) {
    throw new Error('Podcast ID is required. Run with --initialize to set up configuration.');
  }
}

/**
 * Check if configuration is initialized
 * @returns {boolean} True if basic configuration exists
 */
function isConfigured() {
  return !!(config.api.key && config.api.baseUrl && config.station.id && config.station.podcastId);
}

module.exports = {
  config,
  getStationConfig,
  validateConfig,
  isConfigured
};
