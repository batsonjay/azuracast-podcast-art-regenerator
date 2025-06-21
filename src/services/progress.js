/**
 * Progress tracking service for podcast art regeneration
 */

const fs = require('fs').promises;
const path = require('path');
const { config } = require('../utils/config');

class ProgressTracker {
  constructor(logger) {
    this.logger = logger;
    this.progressFile = config.processing.progressFile;
    this.progress = null;
  }

  /**
   * Initialize progress tracking
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {number} batchSize - Batch size
   * @returns {Promise<void>}
   */
  async initialize(stationId, podcastId, batchSize = 50) {
    // Try to load existing progress first
    const existingLoaded = await this.load();
    
    if (existingLoaded && this.progress) {
      // Merge with existing progress - only update what's necessary
      const existingEpisodes = this.progress.episodes || {};
      const existingMetadata = this.progress.metadata || {};
      
      this.progress = {
        metadata: {
          stationId,
          podcastId,
          batchSize,
          totalEpisodes: existingMetadata.totalEpisodes || 0,
          processedEpisodes: existingMetadata.processedEpisodes || 0,
          successCount: existingMetadata.successCount || 0,
          failureCount: existingMetadata.failureCount || 0,
          skippedCount: existingMetadata.skippedCount || 0,
          currentPage: existingMetadata.currentPage || 1,
          startedAt: existingMetadata.startedAt || new Date().toISOString(),
          lastProcessedAt: existingMetadata.lastProcessedAt || null,
          isComplete: existingMetadata.isComplete || false
        },
        episodes: existingEpisodes
      };
      
      this.logger.verbose(`Progress tracking initialized with existing data: ${this.progress.metadata.processedEpisodes} episodes already processed`);
    } else {
      // Create new progress if no existing data
      this.progress = {
        metadata: {
          stationId,
          podcastId,
          batchSize,
          totalEpisodes: 0,
          processedEpisodes: 0,
          successCount: 0,
          failureCount: 0,
          skippedCount: 0,
          currentPage: 1,
          startedAt: new Date().toISOString(),
          lastProcessedAt: null,
          isComplete: false
        },
        episodes: {}
      };
      
      this.logger.verbose('Progress tracking initialized with new data');
    }

    await this.save();
  }

  /**
   * Load existing progress from file
   * @returns {Promise<boolean>} True if progress was loaded, false if no existing progress
   */
  async load() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.progressFile);
      await fs.mkdir(dataDir, { recursive: true });

      const data = await fs.readFile(this.progressFile, 'utf8');
      this.progress = JSON.parse(data);
      this.logger.info(`Loaded existing progress: ${this.progress.metadata.processedEpisodes} episodes processed`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.verbose('No existing progress file found');
        return false;
      }
      throw error;
    }
  }

  /**
   * Save progress to file
   * @returns {Promise<void>}
   */
  async save() {
    if (!this.progress) {
      throw new Error('No progress data to save');
    }

    // Ensure data directory exists
    const dataDir = path.dirname(this.progressFile);
    await fs.mkdir(dataDir, { recursive: true });

    // Update last processed timestamp
    this.progress.metadata.lastProcessedAt = new Date().toISOString();

    await fs.writeFile(this.progressFile, JSON.stringify(this.progress, null, 2));
    this.logger.verbose('Progress saved');
  }

  /**
   * Reset progress (delete progress file)
   * @returns {Promise<void>}
   */
  async reset() {
    try {
      await fs.unlink(this.progressFile);
      this.progress = null;
      this.logger.info('Progress reset - starting fresh');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      this.logger.verbose('No progress file to reset');
    }
  }

  /**
   * Update total episodes count
   * @param {number} total - Total number of episodes
   */
  updateTotal(total) {
    if (this.progress) {
      this.progress.metadata.totalEpisodes = total;
    }
  }

  /**
   * Update current page
   * @param {number} page - Current page number
   */
  updateCurrentPage(page) {
    if (this.progress) {
      this.progress.metadata.currentPage = page;
    }
  }

  /**
   * Record episode processing result
   * @param {string} episodeId - Episode ID
   * @param {string} mediaUniqueId - Media unique ID
   * @param {string} status - Processing status ('success', 'failed', 'skipped')
   * @param {string} [error] - Error message if failed
   */
  recordEpisode(episodeId, mediaUniqueId, status, error = null) {
    if (!this.progress) {
      throw new Error('Progress not initialized');
    }

    this.progress.episodes[episodeId] = {
      mediaUniqueId,
      status,
      error,
      processedAt: new Date().toISOString()
    };

    // Update counters
    this.progress.metadata.processedEpisodes++;
    
    switch (status) {
      case 'success':
        this.progress.metadata.successCount++;
        break;
      case 'failed':
        this.progress.metadata.failureCount++;
        break;
      case 'skipped':
        this.progress.metadata.skippedCount++;
        break;
    }
  }

  /**
   * Check if episode has been processed
   * @param {string} episodeId - Episode ID
   * @returns {boolean} True if episode has been processed
   */
  isEpisodeProcessed(episodeId) {
    return this.progress && this.progress.episodes[episodeId] !== undefined;
  }

  /**
   * Get episode processing status
   * @param {string} episodeId - Episode ID
   * @returns {string|null} Processing status or null if not processed
   */
  getEpisodeStatus(episodeId) {
    if (!this.progress || !this.progress.episodes[episodeId]) {
      return null;
    }
    return this.progress.episodes[episodeId].status;
  }

  /**
   * Mark processing as complete
   */
  markComplete() {
    if (this.progress) {
      this.progress.metadata.isComplete = true;
      this.progress.metadata.completedAt = new Date().toISOString();
    }
  }

  /**
   * Get current statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    if (!this.progress) {
      return {
        total: 0,
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        currentPage: 1
      };
    }

    return {
      total: this.progress.metadata.totalEpisodes,
      processed: this.progress.metadata.processedEpisodes,
      success: this.progress.metadata.successCount,
      failed: this.progress.metadata.failureCount,
      skipped: this.progress.metadata.skippedCount,
      currentPage: this.progress.metadata.currentPage
    };
  }

  /**
   * Get failed episodes for retry
   * @returns {Array} Array of failed episode IDs
   */
  getFailedEpisodes() {
    if (!this.progress) {
      return [];
    }

    return Object.keys(this.progress.episodes).filter(
      episodeId => this.progress.episodes[episodeId].status === 'failed'
    );
  }

  /**
   * Check if we can resume processing
   * @returns {boolean} True if resume is possible
   */
  canResume() {
    return this.progress && !this.progress.metadata.isComplete;
  }

  /**
   * Get resume information
   * @returns {Object|null} Resume information or null if can't resume
   */
  getResumeInfo() {
    if (!this.canResume()) {
      return null;
    }

    return {
      stationId: this.progress.metadata.stationId,
      podcastId: this.progress.metadata.podcastId,
      currentPage: this.progress.metadata.currentPage,
      batchSize: this.progress.metadata.batchSize,
      processedEpisodes: this.progress.metadata.processedEpisodes,
      totalEpisodes: this.progress.metadata.totalEpisodes
    };
  }
}

module.exports = ProgressTracker;
