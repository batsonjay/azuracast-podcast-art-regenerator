/**
 * Configuration management for podcast art regeneration
 */

const config = {
  // API Configuration
  api: {
    baseUrl: 'https://radio.balearic-fm.com/api',
    key: process.env.API_KEY || '452ea24b5bcae87e:3d6677706dd2a0355c6eedd5ed70677b',
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000 // 1 second base delay
  },

  // Station Configuration
  stations: {
    production: {
      id: 1,
      podcastId: '1eee034e-345c-6a8e-aaf3-ad260532e878',
      name: 'Balearic FM Production'
    },
    test: {
      id: 2,
      podcastId: '1f04d545-8949-6f80-9f25-3bdce09225f3',
      name: 'Balearic FM Test/Dev'
    }
  },

  // Processing Configuration
  processing: {
    defaultBatchSize: 50,
    defaultStationId: 2, // Start with test station for safety
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
 * Get station configuration by ID
 * @param {number} stationId - Station ID (1 or 2)
 * @returns {Object} Station configuration
 */
function getStationConfig(stationId) {
  const station = stationId === 1 ? config.stations.production : config.stations.test;
  if (!station) {
    throw new Error(`Invalid station ID: ${stationId}. Must be 1 (production) or 2 (test)`);
  }
  return station;
}

/**
 * Validate configuration
 * @throws {Error} If configuration is invalid
 */
function validateConfig() {
  if (!config.api.key) {
    throw new Error('API key is required. Set API_KEY environment variable or update config.');
  }
  
  if (!config.api.baseUrl) {
    throw new Error('API base URL is required.');
  }
}

module.exports = {
  config,
  getStationConfig,
  validateConfig
};
