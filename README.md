# Podcast Art Regeneration Tool

A Node.js command-line application for recovering missing podcast episode artwork by extracting artwork from media files and uploading to AzuraCast episodes.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Command Line Options](#command-line-options)
- [Examples](#examples)
- [Progress Tracking](#progress-tracking)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)
- [API Integration](#api-integration)

## Overview

This tool addresses the specific issue where AzuraCast episode database records indicate `has_custom_art: true` but the actual artwork files are missing from the server. The application:

1. **Ignores database flags** that incorrectly indicate episodes have artwork
2. **Extracts artwork** from the original media files using AzuraCast's media API
3. **Uploads fresh artwork** to each episode
4. **Tracks progress** to allow resumption of large batch operations
5. **Provides detailed logging** with colored output for easy monitoring

## Installation

### Prerequisites

- Node.js 14+ 
- npm or yarn
- Access to AzuraCast API with valid API key
- Station ID and Podcast ID

### Setup

```bash
# Clone the repository
git clone https://github.com/batsonjay/bfm-podcast-art-regeneration.git
cd bfm-podcast-art-regeneration

# Install dependencies
npm install

# Make the script executable (optional)
chmod +x src/index.js
```

## Configuration

### API Configuration

Edit `src/utils/config.js` to configure your AzuraCast instance:

```javascript
const config = {
  api: {
    baseUrl: 'https://your-azuracast-instance.com',
    apiKey: 'your-api-key-here'
  },
  stations: {
    1: {
      name: 'Production Station',
      podcastId: 'your-podcast-id-here'
    }
  }
};
```

### Required Information

- **API Key**: Your AzuraCast API key (format: `key:secret`)
- **Station ID**: Numeric ID of your station (typically 1 for production)
- **Podcast ID**: UUID of the podcast to process

## Usage

### Basic Syntax

```bash
node src/index.js [OPTIONS]
```

### Quick Start

```bash
# Process episodes with default settings (50 per batch)
node src/index.js --station-id 1

# Process with smaller batches for testing
node src/index.js --station-id 1 --batch-size 5

# Dry run to test without uploading
node src/index.js --station-id 1 --batch-size 5 --dry-run
```

## Command Line Options

### Required Options

| Option | Description | Example |
|--------|-------------|---------|
| `-s, --station-id <number>` | Station ID (1=production, 2=test) | `--station-id 1` |

### Optional Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `-b, --batch-size <number>` | Episodes per batch | 50 | `--batch-size 10` |
| `-p, --start-page <number>` | Starting page number | 1 | `--start-page 5` |
| `-d, --dry-run` | Test run without uploading | false | `--dry-run` |
| `-r, --resume` | Resume from saved progress | false | `--resume` |
| `--reset` | Reset progress and start fresh | false | `--reset` |
| `-v, --verbose` | Enable verbose logging | false | `--verbose` |
| `--force` | Process episodes even if they have custom art | false | `--force` |

### Help

```bash
node src/index.js --help
```

## Examples

### Basic Operations

```bash
# Start processing from the beginning
node src/index.js --station-id 1

# Resume previous processing session
node src/index.js --station-id 1 --resume

# Process with verbose logging
node src/index.js --station-id 1 --verbose

# Test with dry run (no actual uploads)
node src/index.js --station-id 1 --batch-size 5 --dry-run
```

### Advanced Usage

```bash
# Reset progress and start fresh
node src/index.js --station-id 1 --reset

# Start from a specific page
node src/index.js --station-id 1 --start-page 10

# Force processing even if episodes claim to have artwork
node src/index.js --station-id 1 --force

# Combine options for testing
node src/index.js --station-id 1 --batch-size 3 --dry-run --verbose
```

## Interactive Prompts

The application provides interactive prompts during execution:

### First Batch Prompt
```
📋 Ready to start processing from page 1/145
📄 First batch will process 50 episodes

How many episodes for first batch? (default: 50): 
```

### Continuation Prompt
```
✅ Batch 1 completed
📊 Progress: 1/145 pages
📈 Total: 5 success, 0 failed, 0 skipped

Continue? (y)es, (n)o, (p)ause: 
```

### Batch Size Prompt
```
How many episodes for next batch? (default: 50): 
```

## Progress Tracking

### Automatic Progress Saving

- Progress is automatically saved after each episode
- Application can be safely interrupted (Ctrl+C)
- Resume from where you left off using `--resume` or automatic detection

### Progress File Location

```
data/progress.json
```

### Progress Information

The progress file tracks:
- Episodes processed and their status
- Current page and batch size
- Success/failure/skip counts
- Processing timestamps

### Resume Behavior

```bash
# Automatic resume (recommended)
node src/index.js --station-id 1

# Explicit resume
node src/index.js --station-id 1 --resume

# Reset and start over
node src/index.js --station-id 1 --reset
```

## Output Format

### Episode Processing

```
📄 Processing page 1/145 (50 episodes)
🔄 Processing: Episode Title (processing; extracting artwork from media file)
🔄 Processing: Another Episode (skipped; already processed)
ℹ️  Batch 1 complete: 1 success, 0 failed, 1 skipped
```

### Color Coding

- **Magenta**: Page processing headers
- **Cyan**: Individual episode processing
- **Green**: Success messages
- **Red**: Error messages
- **Yellow**: Warning messages
- **Blue**: Information messages

### Status Messages

| Status | Meaning |
|--------|---------|
| `(processing; extracting artwork from media file)` | Episode is being processed |
| `(skipped; already processed)` | Episode was processed in previous run |
| `(failed; No artwork data received)` | Could not extract artwork from media file |
| `(failed; Upload failed)` | Artwork extraction succeeded but upload failed |

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to connect to API` | Invalid API key or URL | Check configuration |
| `No playlist_media_id found` | Episode has no associated media file | Skip episode |
| `No artwork data received` | Media file has no embedded artwork | Skip episode |
| `Upload failed` | Network or server error | Retry or check logs |

### Verbose Logging

Enable verbose logging to see detailed information:

```bash
node src/index.js --station-id 1 --verbose
```

### Log Files

Application logs are written to console. To save logs:

```bash
node src/index.js --station-id 1 2>&1 | tee processing.log
```

## Troubleshooting

### Application Won't Start

1. **Check Node.js version**: `node --version` (requires 14+)
2. **Install dependencies**: `npm install`
3. **Check configuration**: Verify API key and station ID

### API Connection Issues

1. **Test API manually**: Visit `https://your-station.com/docs/api/`
2. **Verify API key**: Check format is `key:secret`
3. **Check network**: Ensure server is accessible

### Processing Issues

1. **Use dry run**: Test with `--dry-run` flag
2. **Start small**: Use `--batch-size 1` for testing
3. **Check verbose logs**: Use `--verbose` flag
4. **Reset progress**: Use `--reset` if progress is corrupted

### Performance Issues

1. **Reduce batch size**: Use smaller `--batch-size`
2. **Monitor memory**: Large batches may use more memory
3. **Check network**: Slow uploads may timeout

## API Integration

### AzuraCast API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/station/{id}/podcast/{podcast_id}/episodes` | Fetch episode list |
| `GET /api/station/{id}/art/{media_id}.jpg` | Download media artwork |
| `POST /api/station/{id}/podcast/{podcast_id}/episode/{episode_id}/art` | Upload episode artwork |

### Authentication

Uses API key authentication in header:
```
X-API-Key: your-api-key-here
```

### Rate Limiting

The application processes episodes sequentially to avoid overwhelming the API. No built-in rate limiting is implemented.

## Development

### Project Structure

```
src/
├── api/
│   └── client.js          # AzuraCast API client
├── services/
│   ├── podcast.js         # Episode processing logic
│   └── progress.js        # Progress tracking
├── utils/
│   ├── config.js          # Configuration management
│   └── logger.js          # Colored logging utilities
└── index.js               # Main application entry point
```

### Adding New Features

1. **API methods**: Add to `src/api/client.js`
2. **Processing logic**: Modify `src/services/podcast.js`
3. **Configuration**: Update `src/utils/config.js`
4. **Logging**: Use methods from `src/utils/logger.js`

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. **Check this README** for common solutions
2. **Review logs** with `--verbose` flag
3. **Test with dry run** using `--dry-run`
4. **Create GitHub issue** with detailed error information

## Version History

- **v1.0.0**: Initial release with full artwork recovery functionality
  - Batch processing with user prompts
  - Progress tracking and resumption
  - Comprehensive error handling
  - AzuraCast API integration
  - Production-ready for 700+ episodes
