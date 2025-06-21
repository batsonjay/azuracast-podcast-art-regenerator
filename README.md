# Podcast Art Regenerator

A Node.js tool for regenerating podcast episode artwork from media files using the AzuraCast API. This tool helps recover missing episode artwork by extracting artwork from the original media files and uploading them to podcast episodes.

## Features

- **Automated Artwork Recovery**: Extract artwork from media files and upload to podcast episodes
- **Batch Processing**: Process episodes in configurable batches with interactive prompts
- **Progress Tracking**: Resume processing from where you left off
- **Episode Database**: Persistent tracking of processed episodes
- **Search Functionality**: Find and process specific episodes by title
- **Dry Run Mode**: Test the process without making actual changes
- **Interactive Setup**: Easy configuration wizard for first-time setup
- **Comprehensive Logging**: Detailed logging with colored output

## Prerequisites

- Node.js 14.0.0 or higher
- AzuraCast instance with API access
- Valid AzuraCast API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/jabventures/podcast-art-regenerator.git
cd podcast-art-regenerator
```

2. Install dependencies:
```bash
npm install
```

3. Run the initialization wizard:
```bash
npm run init
```

The initialization wizard will guide you through:
- Setting up your AzuraCast instance URL
- Configuring your API key
- Selecting your station and podcast
- Setting default processing options

## Configuration

The tool uses environment variables for configuration. After running the initialization wizard, a `.env` file will be created with your settings:

```env
AZURACAST_URL=https://your-azuracast-instance.com
API_KEY=your-api-key-here
STATION_ID=1
PODCAST_ID=your-podcast-id
DEFAULT_BATCH_SIZE=50
```

### Getting Your API Key

1. Log into your AzuraCast instance
2. Go to your user profile
3. Generate an API key
4. Copy the key for use in the configuration

For more information, see the [AzuraCast API Documentation](https://www.azuracast.com/docs/developers/apis/).

## Usage

### Basic Commands

```bash
# Start processing episodes
npm start

# Initialize configuration (first-time setup)
npm run init

# Test run without uploading artwork
npm run test

# Resume from saved progress
npm run resume

# Reset progress and start fresh
npm run reset
```

### Advanced Usage

```bash
# Process with custom batch size
npm start -- --batch-size 25

# Search for specific episode
npm start -- --search-title "episode name"

# Dry run mode (no uploads)
npm start -- --dry-run

# Force processing (ignore existing artwork)
npm start -- --force

# Verbose logging
npm start -- --verbose

# Start from specific page
npm start -- --start-page 5
```

### Command Line Options

- `--batch-size <number>`: Episodes per batch (default: 50)
- `--start-page <number>`: Starting page number (default: 1)
- `--dry-run`: Test run without uploading artwork
- `--resume`: Resume from saved progress
- `--reset`: Reset progress and start fresh
- `--verbose`: Enable verbose logging
- `--force`: Process episodes even if they have custom art
- `--search-title <string>`: Search for specific episode by title
- `--initialize`: Run configuration wizard

## How It Works

1. **Connects to AzuraCast API**: Uses your API key to authenticate
2. **Fetches Episode List**: Retrieves episodes from your specified podcast
3. **Extracts Artwork**: Downloads artwork from the original media files
4. **Uploads to Episodes**: Applies the extracted artwork to podcast episodes
5. **Tracks Progress**: Saves progress to resume later if needed

## Interactive Processing

The tool provides interactive prompts during processing:

- **Batch Confirmation**: Confirm before processing each batch
- **Batch Size Adjustment**: Change batch size between batches
- **Episode Confirmation**: Confirm individual episodes when searching
- **Error Handling**: Choose how to handle errors during processing

## Data Storage

The tool creates a `data/` directory with:

- `progress.json`: Processing progress and resume information
- `episodes.json`: Database of processed episodes with status

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Verify your AzuraCast URL is correct
   - Check that your API key is valid
   - Ensure your AzuraCast instance is accessible

2. **No Episodes Found**
   - Verify the podcast ID is correct
   - Check that the podcast has episodes
   - Ensure your API key has access to the station

3. **Artwork Upload Failed**
   - Check that the media files have embedded artwork
   - Verify API permissions for uploading
   - Try with a smaller batch size

### Getting Help

- Check the [AzuraCast API Documentation](https://www.azuracast.com/docs/developers/apis/)
- Review the verbose logs with `--verbose` flag
- Open an issue on GitHub for bugs or feature requests

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Contributor License Agreement

By contributing to this project, you agree to assign copyright of your contributions to JAB Ventures, Inc. This ensures the project can be maintained and distributed under a consistent license.

## License

This project is licensed under the GNU General Public License v2.0 - see the [LICENSE](LICENSE) file for details.

## Copyright

Copyright (c) JAB Ventures, Inc., 2025

## Acknowledgments

- Built for use with [AzuraCast](https://www.azuracast.com/)
- Inspired by the need to recover missing podcast artwork
- Thanks to the AzuraCast community for API documentation and support

## Support

For support, please:

1. Check the troubleshooting section above
2. Review the [AzuraCast documentation](https://www.azuracast.com/docs/)
3. Open an issue on GitHub with detailed information about your problem

---

**Note**: This tool is designed to work with AzuraCast instances and requires appropriate API access. Always test with the `--dry-run` option first to ensure the tool works correctly with your setup.
