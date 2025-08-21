# Automatic Image Generation

This document explains how the new automatic image generation feature works, designed to overcome API Gateway's 29-second timeout limitation while allowing Lambda functions to run for up to 5 minutes.

## How It Works

### 1. Immediate Response
When you call the automatic generation endpoint, the backend:
- Validates the request
- Creates a master job record in Firebase
- **Immediately returns a response to the client** with a `masterJobId`
- Continues processing in the background

### 2. Background Processing
The Lambda function continues running after the response is sent:
- Generates images sequentially for each slide
- Uses the first image as a reference for character consistency on subsequent slides
- Updates progress in Firebase as each image completes
- Can run for up to 5 minutes (Lambda timeout increased from 30s to 300s)

### 3. Progress Tracking
- Each slide gets its own job record linked to the master job
- Real-time progress updates via the master job status endpoint
- Frontend polls for updates every 5 seconds
- Automatic polling stops when generation completes

## API Endpoints

### Start Automatic Generation
```http
POST /api/images/generate-all-automatically
Content-Type: application/json

{
  "storyId": "your-story-id",
  "useCharacterConsistency": true
}
```

**Response (immediate):**
```json
{
  "success": true,
  "data": {
    "masterJobId": "auto-gen-story123-1234567890",
    "message": "Automatic image generation started. Images will be generated sequentially.",
    "totalSlides": 5,
    "estimatedTime": "10 minutes"
  }
}
```

### Get Master Job Status
```http
GET /api/images/master-job/{masterJobId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "masterJob": {
      "jobId": "auto-gen-story123-1234567890",
      "type": "auto-generation-sequence",
      "status": "generating",
      "progress": 60,
      "currentSlide": 3,
      "totalSlides": 5
    },
    "slideJobs": [
      {
        "jobId": "auto-gen-story123-1234567890-slide-1",
        "slideNumber": 1,
        "status": "completed",
        "progress": 100,
        "result": {
          "imageUrl": "https://...",
          "size": "1024x1024",
          "model": "gpt-4o-mini",
          "format": "png"
        }
      }
    ],
    "summary": {
      "totalSlides": 5,
      "completed": 3,
      "errors": 0,
      "inProgress": 2,
      "overallProgress": 60
    }
  }
}
```

## Frontend Integration

### React Hook
```typescript
import { useGenerateAllImagesAutomatically, useMasterJobStatus } from '../lib/imageGeneration';

const { mutateAsync: generateAll } = useGenerateAllImagesAutomatically();
const { data: masterJobStatus } = useMasterJobStatus(masterJobId);

// Start generation
const handleStart = async () => {
  const result = await generateAll({
    storyId: 'your-story-id',
    useCharacterConsistency: true
  });
  setMasterJobId(result.masterJobId);
};
```

### Progress Display
The frontend automatically:
- Shows overall progress bar
- Displays completed/error counts
- Updates slide states in real-time
- Stops polling when complete

## Benefits

1. **No Timeout Issues**: API Gateway gets response within 29 seconds
2. **Full Processing**: Lambda can run for 5 minutes to complete all images
3. **Character Consistency**: Subsequent images use first image as reference
4. **Real-time Updates**: Progress tracking via Firebase
5. **Error Handling**: Individual slide failures don't stop the sequence
6. **Scalable**: Can handle stories with many slides

## Configuration Changes

### Lambda Timeout
Updated from 30 seconds to 300 seconds (5 minutes) in `infra/core/lambda_service.py`:

```python
timeout: int = 300  # 5 minutes instead of 30 seconds
```

### Rate Limiting
Added 2-second delays between image generations to avoid OpenAI rate limits.

## Error Handling

- Individual slide failures are logged and tracked
- Master job continues processing other slides
- Error jobs are created in Firebase for debugging
- Frontend shows error counts and allows retry

## Monitoring

- All operations are logged to CloudWatch
- Firebase tracks job status and progress
- Frontend provides real-time progress updates
- Error tracking for failed generations

## Future Enhancements

- Retry mechanism for failed slides
- Configurable delays between generations
- Batch processing for very long stories
- Webhook notifications when complete
- Cost optimization with parallel processing