#!/usr/bin/env node

/**
 * Main entry point for podcast art regeneration tool
 */

const { Command } = require('commander');
const Logger = require('./utils/logger');
const { config, getStationConfig, validateConfig } = require('./utils/config');
const ApiClient = require('./api/client');
const ProgressTracker = require('./services/progress');
const EpisodeDatabase = require('./services/episodeDatabase');
const PodcastService = require('./services/podcast');

// Initialize CLI
const program = new Command();

program
  .name('podcast-art-regenerator')
  .description('Regenerate podcast episode artwork from media files')
  .version('1.0.0');

program
  .option('-s, --station-id <number>', 'Station ID (1=production, 2=test)', config.processing.defaultStationId)
  .option('-b, --batch-size <number>', 'Episodes per batch', config.processing.defaultBatchSize)
  .option('-p, --start-page <number>', 'Starting page number', 1)
  .option('-d, --dry-run', 'Test run without uploading artwork', false)
  .option('-r, --resume', 'Resume from saved progress', false)
  .option('--reset', 'Reset progress and start fresh', false)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .option('--force', 'Process episodes even if they already have custom art', false)
  .option('--search-title <string>', 'Search for and process a single episode by title substring');

/**
 * Prompt user for confirmation to process a found episode
 * @param {Object} episode - Episode object
 * @returns {Promise<boolean>} True if user confirms processing
 */
async function promptEpisodeConfirmation(episode) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log(`\n🎯 Found episode: "${episode.title}"`);
    console.log(`📅 Published: ${episode.publish_at || 'Unknown'}`);
    console.log(`🆔 Episode ID: ${episode.id}`);
    
    rl.question('\nProcess this episode? (y/n): ', (answer) => {
      rl.close();
      const choice = answer.toLowerCase().trim();
      resolve(choice === 'y' || choice === 'yes');
    });
  });
}

/**
 * Prompt user for batch continuation and batch size
 * @param {Object} batchInfo - Batch completion information
 * @param {number} currentBatchSize - Current batch size to use as default
 * @returns {Promise<Object>} Object with continue flag and optional new batch size
 */
async function promptBatchContinuation(batchInfo, currentBatchSize = 50) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    if (batchInfo.preProcess && batchInfo.isFirstBatch) {
      // This is the first batch pre-processing prompt
      console.log(`\n📋 Ready to start processing from page ${batchInfo.page}/${batchInfo.totalPages}`);
      console.log(`📄 First batch will process ${batchInfo.episodesToProcess} episodes`);
      
      // Ask for batch size for the first batch
      rl.question(`\nHow many episodes for first batch? (default: ${currentBatchSize}): `, (batchSizeAnswer) => {
        rl.close();
        
        let newBatchSize = currentBatchSize; // use command-line batch size as default
        const inputBatchSize = parseInt(batchSizeAnswer.trim());
        
        if (!isNaN(inputBatchSize) && inputBatchSize > 0) {
          newBatchSize = inputBatchSize;
        }
        
        resolve({ 
          continue: true, 
          newBatchSize: newBatchSize 
        });
      });
      return;
    }

    if (batchInfo.error) {
      console.log(`\n❌ Error on page ${batchInfo.page}: ${batchInfo.error}`);
    } else {
      console.log(`\n✅ Batch ${batchInfo.page} completed`);
      if (batchInfo.totalPages) {
        console.log(`📊 Progress: ${batchInfo.page}/${batchInfo.totalPages} pages`);
      }
    }

    if (batchInfo.totalResults) {
      console.log(`📈 Total: ${batchInfo.totalResults.success} success, ${batchInfo.totalResults.failed} failed, ${batchInfo.totalResults.skipped} skipped`);
    }

    // First ask if they want to continue
    rl.question('\nContinue? (y)es, (n)o, (p)ause: ', (answer) => {
      const choice = answer.toLowerCase().trim();
      
      if (choice === 'n' || choice === 'no') {
        rl.close();
        resolve({ continue: false });
      } else if (choice === 'p' || choice === 'pause') {
        console.log('⏸️  Processing paused. Use --resume to continue later.');
        rl.close();
        resolve({ continue: false });
      } else {
        // Ask for batch size for next batch
        rl.question(`\nHow many episodes for next batch? (default: ${currentBatchSize}): `, (batchSizeAnswer) => {
          rl.close();
          
          let newBatchSize = currentBatchSize; // use current batch size as default
          const inputBatchSize = parseInt(batchSizeAnswer.trim());
          
          if (!isNaN(inputBatchSize) && inputBatchSize > 0) {
            newBatchSize = inputBatchSize;
          }
          
          resolve({ 
            continue: true, 
            newBatchSize: newBatchSize 
          });
        });
      }
    });
  });
}

/**
 * Main processing function
 */
async function main() {
  const options = program.parse().opts();
  
  // Initialize logger
  const logger = new Logger(options.verbose);
  
  try {
    // Validate configuration
    validateConfig();
    
    // Parse options
    const stationId = parseInt(options.stationId);
    const batchSize = parseInt(options.batchSize);
    const startPage = parseInt(options.startPage);
    
    // Get station configuration
    const stationConfig = getStationConfig(stationId);
    
    logger.info(`Podcast Art Regeneration Tool`);
    logger.info(`Station: ${stationConfig.name} (ID: ${stationId})`);
    logger.info(`Batch Size: ${batchSize}`);
    
    if (options.dryRun) {
      logger.warning('DRY RUN MODE - No artwork will be uploaded');
    }
    
    // Initialize services
    const apiClient = new ApiClient(logger);
    const progressTracker = new ProgressTracker(logger);
    const episodeDatabase = new EpisodeDatabase(logger);
    const podcastService = new PodcastService(apiClient, progressTracker, episodeDatabase, logger);
    
    // Test API connection
    logger.progress('Testing API connection...');
    const connectionOk = await apiClient.testConnection(stationId);
    if (!connectionOk) {
      logger.error('Failed to connect to API. Please check your configuration.');
      process.exit(1);
    }
    logger.success('API connection successful');
    
    // Initialize episode database
    await episodeDatabase.initialize();
    
    // Handle reset option
    if (options.reset) {
      await progressTracker.reset();
      await episodeDatabase.clearAll();
    }
    
    // Always try to load existing progress first
    let resumeInfo = null;
    const loaded = await progressTracker.load();
    
    if (loaded) {
      resumeInfo = progressTracker.getResumeInfo();
      if (resumeInfo) {
        // Validate resume parameters match
        if (resumeInfo.stationId !== stationId) {
          logger.warning(`Station ID mismatch: saved=${resumeInfo.stationId}, current=${stationId}`);
          logger.warning('Starting fresh with current station ID');
          resumeInfo = null;
        } else {
          logger.info(`Resuming from page ${resumeInfo.currentPage}`);
          logger.info(`Previous progress: ${resumeInfo.processedEpisodes}/${resumeInfo.totalEpisodes} episodes`);
        }
      } else {
        logger.info('Previous processing was already complete');
      }
    }
    
    // Initialize new progress only if no valid existing progress
    if (!resumeInfo) {
      await progressTracker.initialize(stationId, stationConfig.podcastId, batchSize);
      logger.info('Initialized new progress tracking');
    }
    
    // Determine starting parameters
    const actualStartPage = resumeInfo ? resumeInfo.currentPage : startPage;
    const podcastId = resumeInfo ? resumeInfo.podcastId : stationConfig.podcastId;
    
    logger.separator();
    
    // Check if this is a search operation
    if (options.searchTitle) {
      logger.info(`Searching for episode with title containing: "${options.searchTitle}"`);
      
      // Search for episodes
      const matchingEpisodes = await podcastService.searchEpisodesByTitle(
        stationId,
        podcastId,
        options.searchTitle
      );
      
      if (matchingEpisodes.length === 0) {
        logger.warning(`No episodes found containing: "${options.searchTitle}"`);
        process.exit(0);
      }
      
      logger.success(`Found ${matchingEpisodes.length} matching episode(s)`);
      
      // Process each matching episode
      let processedCount = 0;
      let successCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      
      for (const episode of matchingEpisodes) {
        // Ask for confirmation
        const shouldProcess = await promptEpisodeConfirmation(episode);
        
        if (!shouldProcess) {
          logger.info('Skipping episode');
          skippedCount++;
          continue;
        }
        
        // Initialize minimal progress tracking for individual episode
        if (!resumeInfo) {
          await progressTracker.initialize(stationId, podcastId, 1);
        }
        
        // Process the episode
        logger.info(`Processing episode: "${episode.title}"`);
        const status = await podcastService.processEpisode(
          stationId,
          podcastId,
          episode,
          options.dryRun,
          options.force
        );
        
        processedCount++;
        if (status === 'success') {
          successCount++;
          logger.success(`Episode processed successfully`);
        } else if (status === 'failed') {
          failedCount++;
          logger.error(`Episode processing failed`);
        } else {
          skippedCount++;
          logger.info(`Episode was skipped`);
        }
        
        // Save progress after processing
        await progressTracker.save();
      }
      
      // Show final results for search
      logger.separator();
      logger.success('Search and processing completed!');
      logger.stats({
        total: processedCount,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount
      });
      
    } else {
      // Regular batch processing mode
      logger.info(`Starting processing from page ${actualStartPage}`);
      
      // Process all episodes
      const results = await podcastService.processAllEpisodes(
        stationId,
        podcastId,
        batchSize,
        actualStartPage,
        options.dryRun,
        options.force,
        (batchInfo) => promptBatchContinuation(batchInfo, batchSize)
      );
      
      // Show final results
      logger.separator();
      logger.success('Processing completed!');
      logger.stats({
        total: results.processed,
        success: results.success,
        failed: results.failed,
        skipped: results.skipped
      });
      
      // Show failed episodes if any
      const failedEpisodes = progressTracker.getFailedEpisodes();
      if (failedEpisodes.length > 0) {
        logger.warning(`${failedEpisodes.length} episodes failed to process`);
        logger.info('Use --verbose flag to see detailed error information');
      }
    }
    
  } catch (error) {
    logger.error('Fatal error occurred', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Received SIGINT. Gracefully shutting down...');
  console.log('Progress has been saved. Use --resume to continue later.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Received SIGTERM. Gracefully shutting down...');
  console.log('Progress has been saved. Use --resume to continue later.');
  process.exit(0);
});

// Run the program
if (require.main === module) {
  main();
}

module.exports = { main };
