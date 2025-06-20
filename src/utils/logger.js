/**
 * Logging utilities with colored output
 */

const chalk = require('chalk');
const { config } = require('./config');

class Logger {
  constructor(verbose = false) {
    this.isVerbose = verbose;
    this.startTime = Date.now();
  }

  /**
   * Log success message
   * @param {string} message - Message to log
   */
  success(message) {
    console.log(chalk.green('✅ ' + message));
  }

  /**
   * Log error message
   * @param {string} message - Message to log
   * @param {Error} [error] - Optional error object
   */
  error(message, error = null) {
    console.error(chalk.red('❌ ' + message));
    if (error && this.isVerbose) {
      console.error(chalk.gray(error.stack || error.message));
    }
  }

  /**
   * Log warning message
   * @param {string} message - Message to log
   */
  warning(message) {
    console.log(chalk.yellow('⚠️  ' + message));
  }

  /**
   * Log info message
   * @param {string} message - Message to log
   */
  info(message) {
    console.log(chalk.blue('ℹ️  ' + message));
  }

  /**
   * Log progress message
   * @param {string} message - Message to log
   */
  progress(message) {
    console.log(chalk.cyan('🔄 ' + message));
  }

  /**
   * Log verbose message (only if verbose mode is enabled)
   * @param {string} message - Message to log
   */
  verbose(message) {
    if (this.isVerbose) {
      console.log(chalk.gray('🔍 ' + message));
    }
  }

  /**
   * Log a separator line
   */
  separator() {
    console.log(chalk.gray('─'.repeat(60)));
  }

  /**
   * Log processing statistics
   * @param {Object} stats - Statistics object
   */
  stats(stats) {
    this.separator();
    this.info(`Processing Statistics:`);
    console.log(chalk.white(`  Total Episodes: ${stats.total || 0}`));
    console.log(chalk.green(`  Successful: ${stats.success || 0}`));
    console.log(chalk.red(`  Failed: ${stats.failed || 0}`));
    console.log(chalk.yellow(`  Skipped: ${stats.skipped || 0}`));
    
    if (stats.currentPage) {
      console.log(chalk.cyan(`  Current Page: ${stats.currentPage}`));
    }
    
    const elapsed = Date.now() - this.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    console.log(chalk.gray(`  Elapsed Time: ${minutes}m ${seconds}s`));
    this.separator();
  }

  /**
   * Log episode processing result
   * @param {Object} episode - Episode object
   * @param {string} status - Processing status
   * @param {string} [error] - Error message if failed
   */
  episodeResult(episode, status, error = null) {
    const title = episode.title || episode.id;
    const truncatedTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
    
    switch (status) {
      case 'success':
        this.verbose(`✅ ${truncatedTitle}`);
        break;
      case 'failed':
        this.error(`❌ ${truncatedTitle}${error ? ': ' + error : ''}`);
        break;
      case 'skipped':
        this.verbose(`⏭️  ${truncatedTitle} (already has custom art)`);
        break;
      default:
        this.verbose(`🔄 ${truncatedTitle}`);
    }
  }

  /**
   * Create a progress bar
   * @param {number} current - Current progress
   * @param {number} total - Total items
   * @param {number} [width=40] - Width of progress bar
   * @returns {string} Progress bar string
   */
  progressBar(current, total, width = 40) {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return chalk.cyan(`[${bar}] ${percentage}% (${current}/${total})`);
  }
}

module.exports = Logger;
