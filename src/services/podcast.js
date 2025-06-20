/**
 * Podcast episode processing service
 */

const { getStationConfig } = require('../utils/config');

class PodcastService {
  constructor(apiClient, progressTracker, logger) {
    this.api = apiClient;
    this.progress = progressTracker;
    this.logger = logger;
  }

  /**
   * Process a single episode - download and upload artwork
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {Object} episode - Episode object
   * @param {boolean} dryRun - If true, don't actually upload artwork
   * @param {boolean} force - If true, process even if episode has custom art
   * @returns {Promise<string>} Processing status ('success', 'failed', 'skipped')
   */
  async processEpisode(stationId, podcastId, episode, dryRun = false, force = false) {
    const episodeId = episode.id;
    const mediaUniqueId = episode.playlist_media_id;

    try {
      // Skip if no media unique ID
      if (!mediaUniqueId) {
        const error = 'No playlist_media_id found';
        console.log(` (failed; ${error})`);
        this.progress.recordEpisode(episodeId, mediaUniqueId, 'failed', error);
        return 'failed';
      }

      // Always process episodes - ignore has_custom_art flag since artwork files are missing
      console.log(' (processing; extracting artwork from media file)');

      // Download artwork from media file
      this.logger.verbose(`Downloading artwork for media ID: ${mediaUniqueId}`);
      const artworkBuffer = await this.api.downloadMediaArtwork(stationId, mediaUniqueId);

      if (!artworkBuffer || artworkBuffer.length === 0) {
        const error = 'No artwork data received';
        this.logger.episodeResult(episode, 'failed', error);
        this.progress.recordEpisode(episodeId, mediaUniqueId, 'failed', error);
        return 'failed';
      }

      this.logger.verbose(`Downloaded ${artworkBuffer.length} bytes of artwork`);

      // Upload artwork to episode (unless dry run)
      if (!dryRun) {
        this.logger.verbose(`Uploading artwork to episode: ${episodeId}`);
        const uploadResult = await this.api.uploadEpisodeArtwork(
          stationId, 
          podcastId, 
          episodeId, 
          artworkBuffer,
          `${mediaUniqueId}.jpg`
        );

        if (!uploadResult.success) {
          const error = uploadResult.message || 'Upload failed';
          this.logger.episodeResult(episode, 'failed', error);
          this.progress.recordEpisode(episodeId, mediaUniqueId, 'failed', error);
          return 'failed';
        }
      } else {
        this.logger.verbose(`DRY RUN: Would upload ${artworkBuffer.length} bytes to episode`);
      }

      this.logger.episodeResult(episode, 'success');
      this.progress.recordEpisode(episodeId, mediaUniqueId, 'success');
      return 'success';

    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      this.logger.episodeResult(episode, 'failed', errorMessage);
      this.progress.recordEpisode(episodeId, mediaUniqueId, 'failed', errorMessage);
      return 'failed';
    }
  }

  /**
   * Process a batch of episodes
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {Array} episodes - Array of episode objects
   * @param {boolean} dryRun - If true, don't actually upload artwork
   * @param {boolean} force - If true, process even if episode has custom art
   * @returns {Promise<Object>} Batch processing results
   */
  async processBatch(stationId, podcastId, episodes, dryRun = false, force = false) {
    const results = {
      total: episodes.length,
      success: 0,
      failed: 0,
      skipped: 0,
      processed: []
    };

    for (const episode of episodes) {
      const title = episode.title || episode.id;
      
      // Always show the episode title first (without newline)
      const chalk = require('chalk');
      process.stdout.write(chalk.cyan('🔄 Processing: ' + title));

      // Skip if already processed
      if (this.progress.isEpisodeProcessed(episode.id)) {
        const status = this.progress.getEpisodeStatus(episode.id);
        console.log(` (skipped; already processed)`);
        results[status]++;
        results.processed.push({ episode: episode.id, status });
        continue;
      }

      const status = await this.processEpisode(stationId, podcastId, episode, dryRun, force);
      results[status]++;
      results.processed.push({ episode: episode.id, status });

      // Save progress after each episode
      await this.progress.save();
    }

    return results;
  }

  /**
   * Get episodes for a specific page
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {number} page - Page number
   * @param {number} batchSize - Number of episodes per page
   * @returns {Promise<Object>} Episodes response with pagination info
   */
  async getEpisodesPage(stationId, podcastId, page, batchSize) {
    this.logger.verbose(`Fetching page ${page} with ${batchSize} episodes`);
    const response = await this.api.getEpisodes(stationId, podcastId, batchSize, page);
    
    this.logger.verbose(`Retrieved ${response.rows?.length || 0} episodes from page ${page}`);
    return response;
  }

  /**
   * Process all episodes with pagination
   * @param {number} stationId - Station ID
   * @param {string} podcastId - Podcast ID
   * @param {number} batchSize - Episodes per batch
   * @param {number} startPage - Starting page number
   * @param {boolean} dryRun - If true, don't actually upload artwork
   * @param {boolean} force - If true, process even if episode has custom art
   * @param {Function} onBatchComplete - Callback after each batch
   * @returns {Promise<Object>} Final processing results
   */
  async processAllEpisodes(stationId, podcastId, batchSize, startPage = 1, dryRun = false, force = false, onBatchComplete = null) {
    const stationConfig = getStationConfig(stationId);
    this.logger.info(`Starting processing for ${stationConfig.name}`);
    
    if (dryRun) {
      this.logger.warning('DRY RUN MODE - No artwork will be uploaded');
    }

    let currentPage = startPage;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let isFirstBatch = true;

    while (true) {
      try {
        // Get episodes for current page
        const episodesResponse = await this.getEpisodesPage(stationId, podcastId, currentPage, batchSize);
        
        if (!episodesResponse.rows || episodesResponse.rows.length === 0) {
          this.logger.info('No more episodes to process');
          break;
        }

        // Update total episodes count on first page
        if (currentPage === startPage) {
          this.progress.updateTotal(episodesResponse.total);
          this.logger.info(`Total episodes in podcast: ${episodesResponse.total}`);
        }

        // Update current page in progress
        this.progress.updateCurrentPage(currentPage);

        // Ask for permission before processing (including the first batch)
        if (onBatchComplete && isFirstBatch) {
          const shouldContinue = await onBatchComplete({
            page: currentPage,
            totalPages: episodesResponse.total_pages,
            episodesToProcess: episodesResponse.rows.length,
            totalResults: {
              processed: totalProcessed,
              success: totalSuccess,
              failed: totalFailed,
              skipped: totalSkipped
            },
            preProcess: true,
            isFirstBatch: true
          });

          isFirstBatch = false; // Mark as no longer first batch BEFORE processing response

          if (typeof shouldContinue === 'boolean') {
            if (!shouldContinue) {
              this.logger.info('Processing stopped by user');
              break;
            }
          } else if (typeof shouldContinue === 'object') {
            if (!shouldContinue.continue) {
              this.logger.info('Processing stopped by user');
              break;
            }
            // Update batch size if provided
            if (shouldContinue.newBatchSize && shouldContinue.newBatchSize !== batchSize) {
              batchSize = shouldContinue.newBatchSize;
              this.logger.info(`Batch size changed to ${batchSize} episodes`);
              // Need to re-fetch with new batch size
              continue;
            }
          }
        }

        // Use magenta color for page processing to distinguish from individual episodes
        const chalk = require('chalk');
        console.log(chalk.magenta('📄 Processing page ' + currentPage + '/' + episodesResponse.total_pages + ' (' + episodesResponse.rows.length + ' episodes)'));

        // Process batch
        const batchResults = await this.processBatch(stationId, podcastId, episodesResponse.rows, dryRun, force);

        // Update totals
        totalProcessed += batchResults.total;
        totalSuccess += batchResults.success;
        totalFailed += batchResults.failed;
        totalSkipped += batchResults.skipped;

        // Show batch results
        this.logger.info(`Batch ${currentPage} complete: ${batchResults.success} success, ${batchResults.failed} failed, ${batchResults.skipped} skipped`);

        // Call batch complete callback if provided
        if (onBatchComplete) {
          const batchResponse = await onBatchComplete({
            page: currentPage,
            totalPages: episodesResponse.total_pages,
            batchResults,
            totalResults: {
              processed: totalProcessed,
              success: totalSuccess,
              failed: totalFailed,
              skipped: totalSkipped
            }
          });

          // Handle response - could be boolean (old format) or object (new format)
          if (typeof batchResponse === 'boolean') {
            if (!batchResponse) {
              this.logger.info('Processing stopped by user');
              break;
            }
          } else if (typeof batchResponse === 'object') {
            if (!batchResponse.continue) {
              this.logger.info('Processing stopped by user');
              break;
            }
            // Update batch size if provided
            if (batchResponse.newBatchSize && batchResponse.newBatchSize !== batchSize) {
              batchSize = batchResponse.newBatchSize;
              this.logger.info(`Batch size changed to ${batchSize} episodes`);
            }
          }
        }

        // Check if we've processed all pages
        if (currentPage >= episodesResponse.total_pages) {
          this.logger.info('All pages processed');
          break;
        }

        currentPage++;

      } catch (error) {
        this.logger.error(`Error processing page ${currentPage}`, error);
        
        // Ask user if they want to continue or abort
        if (onBatchComplete) {
          const shouldContinue = await onBatchComplete({
            page: currentPage,
            error: error.message,
            totalResults: {
              processed: totalProcessed,
              success: totalSuccess,
              failed: totalFailed,
              skipped: totalSkipped
            }
          });

          if (!shouldContinue) {
            this.logger.info('Processing aborted due to error');
            break;
          }
        } else {
          // If no callback, continue to next page
          this.logger.warning('Continuing to next page after error');
        }

        currentPage++;
      }
    }

    // Mark as complete if we processed all episodes
    const stats = this.progress.getStats();
    if (stats.processed >= stats.total) {
      this.progress.markComplete();
      await this.progress.save();
    }

    return {
      processed: totalProcessed,
      success: totalSuccess,
      failed: totalFailed,
      skipped: totalSkipped,
      finalPage: currentPage - 1
    };
  }
}

module.exports = PodcastService;
