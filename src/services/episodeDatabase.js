/**
 * Episode database service using lowdb for persistent episode tracking
 */

const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

class EpisodeDatabase {
  constructor(logger, dbPath = './data/episodes.json') {
    this.logger = logger;
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize the database
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create adapter and database
      const adapter = new JSONFile(this.dbPath);
      this.db = new Low(adapter, { episodes: [] });

      // Read data from JSON file, this will set db.data content
      await this.db.read();

      // If file doesn't exist, db.data will be null
      // Set default data
      this.db.data = this.db.data || { episodes: [] };

      // Write default data to file
      await this.db.write();

      this.logger.verbose(`Episode database initialized at ${this.dbPath}`);
      this.logger.verbose(`Loaded ${this.db.data.episodes.length} existing episode records`);
    } catch (error) {
      this.logger.error('Failed to initialize episode database', error);
      throw error;
    }
  }

  /**
   * Add a processed episode to the database
   * @param {string} episodeId - Episode ID
   * @param {string} mediaUniqueId - Media unique ID
   * @param {string} status - Processing status (success, failed, skipped)
   * @param {string} [error] - Error message if failed
   * @param {string} [title] - Episode title (optional)
   * @returns {Promise<void>}
   */
  async addEpisode(episodeId, mediaUniqueId, status, error = null, title = null) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Check if episode already exists
    const existingIndex = this.db.data.episodes.findIndex(ep => ep.episodeId === episodeId);
    
    const episodeRecord = {
      episodeId,
      mediaUniqueId,
      status,
      error,
      title,
      processedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing episode
      this.db.data.episodes[existingIndex] = {
        ...this.db.data.episodes[existingIndex],
        ...episodeRecord
      };
      this.logger.verbose(`Updated episode record: ${episodeId}`);
    } else {
      // Add new episode
      this.db.data.episodes.push(episodeRecord);
      this.logger.verbose(`Added new episode record: ${episodeId}`);
    }

    // Save to file
    await this.db.write();
  }

  /**
   * Check if an episode has been processed
   * @param {string} episodeId - Episode ID
   * @returns {boolean} True if episode has been processed
   */
  isEpisodeProcessed(episodeId) {
    if (!this.db) {
      return false;
    }

    return this.db.data.episodes.some(ep => ep.episodeId === episodeId);
  }

  /**
   * Get episode processing status
   * @param {string} episodeId - Episode ID
   * @returns {Object|null} Episode record or null if not found
   */
  getEpisode(episodeId) {
    if (!this.db) {
      return null;
    }

    return this.db.data.episodes.find(ep => ep.episodeId === episodeId) || null;
  }

  /**
   * Get all processed episodes
   * @returns {Array} Array of episode records
   */
  getAllEpisodes() {
    if (!this.db) {
      return [];
    }

    return this.db.data.episodes;
  }

  /**
   * Get episodes by status
   * @param {string} status - Status to filter by (success, failed, skipped)
   * @returns {Array} Array of episode records
   */
  getEpisodesByStatus(status) {
    if (!this.db) {
      return [];
    }

    return this.db.data.episodes.filter(ep => ep.status === status);
  }

  /**
   * Search episodes by title (case-insensitive substring match)
   * @param {string} searchTerm - Search term
   * @returns {Array} Array of matching episode records
   */
  searchEpisodesByTitle(searchTerm) {
    if (!this.db) {
      return [];
    }

    const searchLower = searchTerm.toLowerCase();
    return this.db.data.episodes.filter(ep => 
      ep.title && ep.title.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get processing statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    if (!this.db) {
      return {
        total: 0,
        success: 0,
        failed: 0,
        skipped: 0
      };
    }

    const episodes = this.db.data.episodes;
    return {
      total: episodes.length,
      success: episodes.filter(ep => ep.status === 'success').length,
      failed: episodes.filter(ep => ep.status === 'failed').length,
      skipped: episodes.filter(ep => ep.status === 'skipped').length
    };
  }

  /**
   * Get failed episodes for retry
   * @returns {Array} Array of failed episode records
   */
  getFailedEpisodes() {
    return this.getEpisodesByStatus('failed');
  }

  /**
   * Remove an episode record (for testing/cleanup)
   * @param {string} episodeId - Episode ID to remove
   * @returns {Promise<boolean>} True if episode was removed
   */
  async removeEpisode(episodeId) {
    if (!this.db) {
      return false;
    }

    const initialLength = this.db.data.episodes.length;
    this.db.data.episodes = this.db.data.episodes.filter(ep => ep.episodeId !== episodeId);
    
    if (this.db.data.episodes.length < initialLength) {
      await this.db.write();
      this.logger.verbose(`Removed episode record: ${episodeId}`);
      return true;
    }

    return false;
  }

  /**
   * Clear all episode records (for reset)
   * @returns {Promise<void>}
   */
  async clearAll() {
    if (!this.db) {
      return;
    }

    this.db.data.episodes = [];
    await this.db.write();
    this.logger.info('Cleared all episode records');
  }
}

module.exports = EpisodeDatabase;
