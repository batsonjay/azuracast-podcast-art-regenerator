/**
 * API client for AzuraCast with authentication and retry logic
 * Copyright (c) JAB Ventures, Inc., 2025
 * Licensed under GPL v2
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { config } = require('../utils/config');

class ApiClient {
  constructor(logger) {
    this.logger = logger;
    this.baseURL = config.api.baseUrl;
    this.apiKey = config.api.key;
    
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.api.timeout,
      headers: {
        'X-API-Key': this.apiKey,
        'User-Agent': 'BFM-Podcast-Art-Regenerator/1.0.0'
      }
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        if (this.logger && this.logger.verbose) {
          this.logger.verbose(`API ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
        }
        return response;
      },
      (error) => {
        if (this.logger && this.logger.verbose) {
          const url = error.config?.url || 'unknown';
          const method = error.config?.method?.toUpperCase() || 'unknown';
          const status = error.response?.status || 'no response';
          this.logger.verbose(`API ${method} ${url} - Error ${status}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Retry wrapper for API calls
   * @param {Function} apiCall - Function that returns a promise
   * @param {number} attempts - Number of retry attempts
   * @returns {Promise} API response
   */
  async withRetry(apiCall, attempts = config.api.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await apiCall();
      } catch (error) {
        const isLastAttempt = i === attempts - 1;
        
        if (isLastAttempt) {
          throw error;
        }

        // Calculate exponential backoff delay
        const delay = config.api.retryDelay * Math.pow(2, i);
        if (this.logger && this.logger.verbose) {
          this.logger.verbose(`Retry attempt ${i + 1}/${attempts} after ${delay}ms delay`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Get podcast episodes with pagination
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {number} rowCount - Number of episodes per page
   * @param {number} current - Current page number
   * @returns {Promise<Object>} Episodes response
   */
  async getEpisodes(stationId, podcastId, rowCount = 50, current = 1) {
    return this.withRetry(async () => {
      const response = await this.client.get(
        `/station/${stationId}/podcast/${podcastId}/episodes`,
        {
          params: { rowCount, current }
        }
      );
      return response.data;
    });
  }

  /**
   * Get single episode details
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {string} episodeId - Episode ID
   * @returns {Promise<Object>} Episode details
   */
  async getEpisode(stationId, podcastId, episodeId) {
    return this.withRetry(async () => {
      const response = await this.client.get(
        `/station/${stationId}/podcast/${podcastId}/episode/${episodeId}`
      );
      return response.data;
    });
  }

  /**
   * Download media artwork
   * @param {number} stationId - Station ID
   * @param {string} mediaUniqueId - Media unique ID (playlist_media_id)
   * @returns {Promise<Buffer>} Image data as buffer
   */
  async downloadMediaArtwork(stationId, mediaUniqueId) {
    return this.withRetry(async () => {
      const response = await this.client.get(
        `/station/${stationId}/art/${mediaUniqueId}`,
        {
          responseType: 'arraybuffer',
          maxRedirects: 5 // Follow redirects
        }
      );
      return Buffer.from(response.data);
    });
  }

  /**
   * Upload episode artwork
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {string} episodeId - Episode ID
   * @param {Buffer} imageBuffer - Image data as buffer
   * @param {string} [filename='artwork.jpg'] - Filename for the upload
   * @returns {Promise<Object>} Upload response
   */
  async uploadEpisodeArtwork(stationId, podcastId, episodeId, imageBuffer, filename = 'artwork.jpg') {
    return this.withRetry(async () => {
      const FormData = require('form-data');
      const form = new FormData();
      
      form.append('art', imageBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });

      const response = await this.client.post(
        `/station/${stationId}/podcast/${podcastId}/episode/${episodeId}/art`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'Content-Length': form.getLengthSync()
          }
        }
      );
      return response.data;
    });
  }

  /**
   * Get station podcasts list
   * @param {number} stationId - Station ID
   * @returns {Promise<Array>} List of podcasts
   */
  async getPodcasts(stationId) {
    return this.withRetry(async () => {
      const response = await this.client.get(`/station/${stationId}/podcasts`);
      return response.data;
    });
  }

  /**
   * Make a generic API request
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Axios request options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, options = {}) {
    return this.withRetry(async () => {
      const response = await this.client.get(endpoint, options);
      return response;
    });
  }

  /**
   * Test API connectivity and authentication
   * @param {number} stationId - Station ID to test with
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection(stationId = null) {
    try {
      if (stationId) {
        await this.getPodcasts(stationId);
      } else {
        // Test basic connectivity
        await this.makeRequest('/stations');
      }
      return true;
    } catch (error) {
      if (this.logger) {
        this.logger.error('API connection test failed', error);
      }
      return false;
    }
  }
}

module.exports = ApiClient;
