# Cloudflare R2 Storage Service

This service provides direct upload capabilities to Cloudflare R2 storage using pre-signed URLs. Files are uploaded directly from the frontend to R2, bypassing the backend for better performance and scalability.

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_bucket_name
R2_REGION=auto  # Optional, defaults to 'auto'
```

## Getting R2 Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to R2 Object Storage
3. Create a new bucket or use existing one
4. Go to "Manage R2 API tokens"
5. Create a new API token with appropriate permissions
6. Copy the Account ID, Access Key ID, and Secret Access Key

## API Endpoints

### Generate Upload URL
```
POST /api/r2/upload-url
Authorization: Bearer <token>
Content-Type: application/json

{
  "fileName": "example.jpg",
  "contentType": "image/jpeg"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "url": "https://...",
    "expiresIn": 3600,
    "key": "users/123/1234567890-example.jpg"
  }
}
```

### Generate Download URL
```
GET /api/r2/download-url/:key
Authorization: Bearer <token>
```

### Delete File
```
DELETE /api/r2/files/:key
Authorization: Bearer <token>
```

### List User Files
```
GET /api/r2/files?prefix=optional_prefix
Authorization: Bearer <token>
```

### Get File Metadata
```
GET /api/r2/files/:key/metadata
Authorization: Bearer <token>
```

### Check File Exists
```
GET /api/r2/files/:key/exists
Authorization: Bearer <token>
```

## Frontend Usage

### Basic Upload Example

```typescript
import { R2UploadService } from './lib/r2Upload';
import { useApi } from './contexts/ApiContext';

function MyComponent() {
  const { fetchWithAuth } = useApi();
  const r2Service = new R2UploadService(fetchWithAuth);

  const handleUpload = async (file: File) => {
    try {
      const { key, url } = await r2Service.uploadFile(file);
      console.log('File uploaded successfully:', key);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };
}
```

### React Component Example

```tsx
import { R2FileUpload } from './components/ui/R2FileUpload';

function App() {
  return <R2FileUpload />;
}
```

## How It Works

1. **Frontend requests upload URL**: Frontend sends file metadata to backend
2. **Backend generates pre-signed URL**: Backend creates a pre-signed PUT URL for R2
3. **Frontend uploads directly to R2**: Frontend uses the pre-signed URL to upload file directly to R2
4. **No backend file handling**: Backend never touches the actual file data

## Security Features

- **User isolation**: Files are stored under `users/{userId}/` prefix
- **Authentication required**: All endpoints require valid Firebase auth token
- **Access control**: Users can only access their own files
- **Pre-signed URLs**: Temporary, expiring URLs for secure access
- **File metadata**: Tracks upload time, user, and original filename

## File Organization

Files are organized in R2 as:
```
users/
  {userId}/
    {timestamp}-{filename}
```

Example:
```
users/abc123/
  1703123456789-image.jpg
  1703123456790-document.pdf
```

## Error Handling

The service includes comprehensive error handling:
- Authentication failures
- Invalid file keys
- R2 API errors
- Network timeouts
- File not found errors

## Performance Benefits

- **Direct uploads**: No backend bandwidth usage
- **Scalable**: R2 handles the heavy lifting
- **Fast**: No file processing on backend
- **Cost-effective**: Reduced backend compute usage 