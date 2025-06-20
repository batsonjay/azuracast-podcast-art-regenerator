# Podcast Art Regeneration Plan

## Overview
This document outlines the plan for creating a command-line application to regenerate podcast episode artwork in AzuraCast by fetching artwork from the associated media files.

## ✅ COMPLETED APPLICATION

The application has been successfully built and tested! Here are the available commands:

### Quick Start Commands
```bash
# Install dependencies
npm install

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

### Test Results
✅ **API Connection**: Working perfectly  
✅ **Episode Retrieval**: Successfully retrieved 1 episode from test station  
✅ **Progress Tracking**: Progress saved and statistics displayed  
✅ **User Interface**: Interactive prompts and colored output working  
✅ **Dry Run Mode**: Correctly skipped episode that already has custom art  

**Status**: Ready for production use on Station 1 (722 episodes)

---

## Project Requirements
- Replace deleted album art for ~800 podcast episodes
- Use AzuraCast API with provided API key
- Implement pagination to process episodes in batches
- Track progress to allow for restarts
- Create a command-line interface
- Use Node.js or shell scripts

## API Information
- **Base URL**: https://radio.balearic-fm.com/api
- **API Key**: 452ea24b5bcae87e:3d6677706dd2a0355c6eedd5ed70677b
- **Production Station ID**: 1
  - **Production Podcast ID**: 1eee034e-345c-6a8e-aaf3-ad260532e878
  - **Total Episodes**: ~722 episodes
- **Test/Dev Station ID**: 2 (recommended for initial testing)
  - **Test Podcast ID**: 1f04d545-8949-6f80-9f25-3bdce09225f3
  - **Total Episodes**: 1 episode
- **Station Art URL Pattern**: `/api/station/{station_id}/art/{media_unique_id}` (redirects to actual image)
- **API Documentation**: OpenAPI spec available at `/api/openapi.yml`

## Technical Approach

### 1. Technology Stack
- **Language**: Node.js (preferred for better error handling and async operations)
- **Dependencies**:
  - `axios` or `node-fetch` for API calls
  - `commander` for CLI interface
  - `chalk` for colored console output
  - `fs/promises` for file operations
  - `dotenv` for environment variables (optional)

### 2. Application Architecture

```
podcast-art-regenerator/
├── package.json
├── .env (optional)
├── .gitignore
├── README.md
├── src/
│   ├── index.js          # Main entry point
│   ├── api/
│   │   ├── client.js     # API client wrapper
│   │   └── endpoints.js  # API endpoint definitions
│   ├── services/
│   │   ├── podcast.js    # Podcast episode operations
│   │   └── progress.js   # Progress tracking
│   └── utils/
│       ├── logger.js     # Logging utilities
│       └── config.js     # Configuration management
└── data/
    └── progress.json     # Progress tracking file
```

### 3. Core Functionality

#### A. Progress Tracking
- Store processed episodes in a JSON file with:
  - Episode ID
  - Media unique ID
  - Processing status (success/failed/skipped)
  - Timestamp
  - Current page number
- Allow resume from last processed batch

#### B. API Operations Flow
1. **Get Podcast Episodes** (paginated)
   - Endpoint: `GET /api/station/{station_id}/podcast/{podcast_id}/episodes?rowCount={limit}&current={page}`
   - Extract from response:
     - `id` (episode ID)
     - `playlist_media_id` (media unique ID - confirmed field name)
     - `has_custom_art` (boolean to check if art already exists)
     - `art` (current art URL if exists)

2. **Fetch Media Artwork**
   - Use the station art URL pattern: `/api/station/{station_id}/art/{media_unique_id}` ✅ **CONFIRMED**
   - API returns 302 redirect to actual image location
   - Use curl `-L` flag to follow redirects
   - Download as binary data (JPEG format confirmed)

3. **Update Episode Artwork**
   - Endpoint: `POST /api/station/{station_id}/podcast/{podcast_id}/episode/{episode_id}/art` ✅ **CONFIRMED**
   - Method: POST with multipart/form-data using `-F "art=@filename.jpg"`
   - Upload the artwork binary data
   - Returns: `{"success":true,"message":"Record updated successfully."}`
   - Updates `art_updated_at` timestamp and `has_custom_art` to true

#### C. Batch Processing
- Default batch size: 50 episodes
- User prompts after each batch:
  - Continue to next batch
  - Pause (save progress)
  - Abort (save progress)
- Progress indicator showing:
  - Current batch number
  - Total episodes processed
  - Success/failure count

### 4. Error Handling
- Retry failed requests (3 attempts with exponential backoff)
- Log all errors with episode details
- Continue processing on individual episode failures
- Save progress before any exit

### 5. CLI Interface

```bash
# Basic usage (defaults to test station 2)
node src/index.js

# Test on station 2 with small batch
node src/index.js --station-id 2 --batch-size 5 --dry-run

# Run on production station 1
node src/index.js --station-id 1 --batch-size 50

# Resume from saved progress
node src/index.js --resume

# Reset progress and start fresh
node src/index.js --reset
```

#### Command Options:
- `--station-id, -s <number>`: Station ID (default: 2 for testing, use 1 for production)
- `--batch-size, -b <number>`: Episodes per batch (default: 50)
- `--start-page, -p <number>`: Starting page number (default: 1)
- `--dry-run, -d`: Test run without making updates
- `--resume, -r`: Resume from saved progress
- `--reset`: Clear progress and start fresh
- `--verbose, -v`: Enable verbose logging

### 6. API Authentication

**✅ CONFIRMED**: Use X-API-Key header method:
- **Header**: `X-API-Key: {api_key}` ✅ **WORKING**
- ~~**Header**: `Authorization: Bearer {api_key}`~~ (not tested)
- ~~**Query Parameter**: `?api_key={api_key}`~~ (not tested)

### 7. Implementation Steps

1. **Phase 1: Setup and Discovery**
   - Initialize Node.js project
   - Test API endpoints with curl/Postman
   - Verify response structures
   - Confirm authentication method (test which header/parameter works)

2. **Phase 2: Production Station Single Episode Test**
   - Download full podcast episode feed for Station 1
   - Find episode with title "Ian Douglass 040"
   - Test artwork fetch and replacement workflow on production station
   - Verify the complete process works on Station 1

3. **Phase 3: Core Development**
   - Implement API client with authentication
   - Create progress tracking system
   - Build episode fetching with pagination
   - Implement artwork retrieval

4. **Phase 4: Update Mechanism**
   - Determine correct API endpoint for updating artwork
   - Implement artwork update functionality
   - Add retry logic

5. **Phase 5: CLI and User Experience**
   - Build command-line interface
   - Add progress indicators
   - Implement pause/resume functionality
   - Add dry-run mode

6. **Phase 6: Testing and Refinement**
   - Test with small batches
   - Handle edge cases
   - Optimize performance
   - Add comprehensive logging

### 8. Sample Progress File Structure

```json
{
  "metadata": {
    "stationId": 2,
    "podcastId": "1f04d545-8949-6f80-9f25-3bdce09225f3",
    "totalEpisodes": 800,
    "processedEpisodes": 150,
    "successCount": 148,
    "failureCount": 2,
    "lastProcessedAt": "2025-06-20T15:30:00Z",
    "currentPage": 3,
    "batchSize": 50
  },
  "episodes": {
    "episode-id-1": {
      "mediaUniqueId": "f6c0474e91364c7cf920140d",
      "status": "success",
      "processedAt": "2025-06-20T15:25:00Z"
    },
    "episode-id-2": {
      "mediaUniqueId": "a1b2c3d4e5f6g7h8i9j0k1l2",
      "status": "failed",
      "error": "Artwork not found",
      "processedAt": "2025-06-20T15:25:30Z"
    }
  }
}
```

### 9. Security Considerations
- Store API key in environment variable or .env file
- Never commit API keys to version control
- Implement rate limiting to avoid overwhelming the API
- Add request timeouts

### 10. Future Enhancements
- Parallel processing of episodes (with rate limiting)
- Generate report of failed episodes
- Add option to retry only failed episodes
- Support for multiple podcasts
- Web dashboard for monitoring progress

## Next Steps
1. Verify API endpoints and response structures
2. Create Node.js project structure
3. Implement and test API client
4. Build core functionality incrementally
5. Add CLI interface and user interactions

## API Test Commands

Here are some curl commands to test the API before implementation:

```bash
# Test authentication and get podcast episodes (try different auth methods)
# Method 1: X-API-Key header
curl -H "X-API-Key: 452ea24b5bcae87e:3d6677706dd2a0355c6eedd5ed70677b" \
  "https://radio.balearic-fm.com/api/station/2/podcast/1f04d545-8949-6f80-9f25-3bdce09225f3/episodes?rowCount=5&current=1"

# Method 2: Authorization Bearer header
curl -H "Authorization: Bearer 452ea24b5bcae87e:3d6677706dd2a0355c6eedd5ed70677b" \
  "https://radio.balearic-fm.com/api/station/2/podcast/1f04d545-8949-6f80-9f25-3bdce09225f3/episodes?rowCount=5&current=1"

# Method 3: Query parameter
curl "https://radio.balearic-fm.com/api/station/2/podcast/1f04d545-8949-6f80-9f25-3bdce09225f3/episodes?rowCount=5&current=1&api_key=452ea24b5bcae87e:3d6677706dd2a0355c6eedd5ed70677b"

# Once you identify a media unique ID from the episodes response, test artwork retrieval:
# Replace {media_unique_id} with actual ID from episode response
curl -H "X-API-Key: 452ea24b5bcae87e:3d6677706dd2a0355c6eedd5ed70677b" \
  -o test-artwork.jpg \
  "https://radio.balearic-fm.com/api/station/2/art/{media_unique_id}.jpg"
```
