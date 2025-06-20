# Podcast Art Regeneration Tool

A Node.js command-line application to regenerate podcast episode artwork in AzuraCast by fetching artwork from the associated media files.

## Overview

This tool addresses the issue of inadvertently deleted album art for podcast episodes on AzuraCast radio stations. It uses the AzuraCast API to:

1. Fetch podcast episodes with pagination
2. Download artwork from the media files using their unique IDs
3. Upload the artwork back to the podcast episodes
4. Track progress to allow for restarts and resumption

## Features

- ✅ **Batch Processing**: Process episodes in configurable batches with user prompts
- ✅ **Progress Tracking**: Save progress to allow resuming after interruptions
- ✅ **Dry Run Mode**: Test the process without making actual changes
- ✅ **Error Handling**: Retry failed requests with exponential backoff
- ✅ **Colored Logging**: Clear, colored console output with verbose mode
- ✅ **Graceful Shutdown**: Handle interruptions and save progress
- ✅ **Station Support**: Works with both production and test stations

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The tool is pre-configured for Balearic FM with the following settings:

- **Production Station**: Station 1 (722 episodes)
- **Test Station**: Station 2 (1 episode for testing)
- **API Key**: Pre-configured (can be overridden with `API_KEY` environment variable)

## Usage

### Basic Commands

```bash
# Test run on test station (recommended first)
npm run test

# Start processing production station
npm run production

# Resume from saved progress
npm run resume

# Reset progress and start fresh
npm run reset
```

### Advanced Usage

```bash
# Custom batch size and verbose logging
node src/index.js --station-id 2 --batch-size 10 --verbose

# Dry run on production station
node src/index.js --station-id 1 --dry-run

# Start from specific page
node src/index.js --start-page 5

# Force process episodes that already have custom art
node src/index.js --force
```

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --station-id <number>` | Station ID (1=production, 2=test) | 2 |
| `-b, --batch-size <number>` | Episodes per batch | 50 |
| `-p, --start-page <number>` | Starting page number | 1 |
| `-d, --dry-run` | Test run without uploading artwork | false |
| `-r, --resume` | Resume from saved progress | false |
| `--reset` | Reset progress and start fresh | false |
| `-v, --verbose` | Enable verbose logging | false |
| `--force` | Process episodes even if they have custom art | false |

## Workflow

1. **API Connection Test**: Verifies authentication and connectivity
2. **Progress Loading**: Loads existing progress or initializes new tracking
3. **Batch Processing**: Processes episodes in configurable batches
4. **User Prompts**: After each batch, prompts to:
   - Continue, pause, or abort processing
   - Set the number of episodes for the next batch (default: 50)
5. **Progress Saving**: Automatically saves progress after each episode
6. **Final Report**: Shows comprehensive statistics upon completion

## Progress Tracking

Progress is saved to `./data/progress.json` and includes:

- Episode processing status (success/failed/skipped)
- Current page and batch information
- Success/failure counters
- Timestamps and error messages

## Error Handling

- **Retry Logic**: Failed API calls are retried up to 3 times with exponential backoff
- **Graceful Degradation**: Individual episode failures don't stop batch processing
- **Progress Preservation**: Progress is saved even if the process is interrupted
- **Detailed Logging**: Verbose mode provides detailed error information

## Safety Features

- **Test Station Default**: Defaults to test station (Station 2) for safety
- **Dry Run Mode**: Test the complete workflow without making changes
- **User Confirmation**: Prompts after each batch for user control
- **Progress Tracking**: Never lose progress due to interruptions

## Example Output

```
ℹ️  Podcast Art Regeneration Tool
ℹ️  Station: Balearic FM Test/Dev (ID: 2)
ℹ️  Batch Size: 5
🔄 Testing API connection...
✅ API connection successful
🔄 Processing page 1/1 (1 episodes)
ℹ️  Batch 1 complete: 1 success, 0 failed, 0 skipped

✅ Batch 1 completed
📊 Progress: 1/1 pages
📈 Total: 1 success, 0 failed, 0 skipped

Continue? (y)es, (n)o, (p)ause: y

────────────────────────────────────────────────────────────
✅ Processing completed!
ℹ️  Processing Statistics:
  Total Episodes: 1
  Successful: 1
  Failed: 0
  Skipped: 0
  Elapsed Time: 0m 3s
────────────────────────────────────────────────────────────
```

## File Structure

```
bfm-podcast-art-regeneration/
├── package.json              # Project configuration and scripts
├── README.md                 # This documentation
├── src/
│   ├── index.js              # Main entry point
│   ├── api/
│   │   └── client.js         # API client with retry logic
│   ├── services/
│   │   ├── podcast.js        # Episode processing service
│   │   └── progress.js       # Progress tracking service
│   └── utils/
│       ├── config.js         # Configuration management
│       └── logger.js         # Colored logging utilities
└── data/
    └── progress.json         # Progress tracking file (auto-created)
```

## API Endpoints Used

- `GET /api/station/{id}/podcast/{id}/episodes` - Fetch episodes with pagination
- `GET /api/station/{id}/art/{media_id}` - Download media artwork
- `POST /api/station/{id}/podcast/{id}/episode/{id}/art` - Upload episode artwork

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check internet connection
   - Verify API key is correct
   - Ensure station ID exists

2. **No Episodes Found**
   - Verify podcast ID is correct for the station
   - Check if station has any episodes

3. **Artwork Download Failed**
   - Some episodes may not have associated media files
   - Check if media unique ID exists

4. **Upload Failed**
   - Verify episode ID is valid
   - Check if artwork data is valid image format

### Verbose Logging

Use the `--verbose` flag to see detailed information about:
- API requests and responses
- Episode processing steps
- Error details and stack traces
- Progress saving operations

## Development

### Testing

Always test on Station 2 first:
```bash
npm run test
```

**Testing Continuous Batch Prompting:**
Since the test station only has 1 episode, use the `--force` flag to simulate processing episodes that need artwork:
```bash
# Test continuous prompting with force flag
node src/index.js --station-id 2 --batch-size 1 --dry-run --force --verbose

# Test on production station with small batches
node src/index.js --station-id 1 --batch-size 2 --dry-run --verbose
```

### Production

Only run on Station 1 after successful testing:
```bash
npm run production
```

## License

ISC License
