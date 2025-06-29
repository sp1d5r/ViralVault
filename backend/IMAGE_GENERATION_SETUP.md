# AI Image Generation Service

This service provides AI-powered image generation using OpenAI's DALL-E models. It includes various generation modes, content validation, and specialized templates for different use cases.

## Environment Variables

Add this environment variable to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

## Getting OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Create a new API key
5. Copy the key and add it to your environment variables

## API Endpoints

### Generate Images
```
POST /api/images/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "A beautiful sunset over mountains",
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid",
  "model": "dall-e-3",
  "n": 1
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "url": "https://...",
      "revisedPrompt": "A beautiful sunset over mountains, vibrant colors...",
      "size": "1024x1024",
      "model": "dall-e-3",
      "created": 1703123456789
    }
  ]
}
```

### Generate Enhanced Images
```
POST /api/images/enhanced
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "A tech startup office",
  "style": "vivid, colorful"
}
```

### Generate Social Media Images
```
POST /api/images/social-media
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Tech startup office",
  "platform": "linkedin"
}
```

### Generate Blog Images
```
POST /api/images/blog
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "10 Tips for Startup Success",
  "category": "business"
}
```

### Generate Image Variations
```
POST /api/images/variations
Authorization: Bearer <token>
Content-Type: application/json

{
  "imageUrl": "https://...",
  "size": "1024x1024",
  "n": 3
}
```

### Edit Image
```
POST /api/images/edit
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "Add a cat to the image",
  "imageUrl": "https://...",
  "maskUrl": "https://...", // Optional
  "size": "1024x1024"
}
```

### Validate Prompt
```
POST /api/images/validate-prompt
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "A beautiful landscape"
}
```

### Get Available Models
```
GET /api/images/models
Authorization: Bearer <token>
```

## Frontend Usage

### Basic Image Generation

```typescript
import { ImageGenerationService } from './lib/imageGeneration';
import { useApi } from './contexts/ApiContext';

function MyComponent() {
  const { fetchWithAuth } = useApi();
  const imageService = new ImageGenerationService(fetchWithAuth);

  const handleGenerate = async () => {
    const images = await imageService.generateImages({
      prompt: 'A beautiful sunset over mountains',
      size: '1024x1024',
      model: 'dall-e-3'
    });
    
    console.log('Generated images:', images);
  };
}
```

### Social Media Images

```typescript
// Generate LinkedIn optimized image
const linkedinImage = await imageService.generateSocialMediaImages(
  'Tech startup office with modern design',
  'linkedin'
);

// Generate Instagram optimized image
const instagramImage = await imageService.generateSocialMediaImages(
  'Colorful abstract art',
  'instagram'
);
```

### Blog Header Images

```typescript
// Generate blog header
const blogImage = await imageService.generateBlogImages(
  'The Future of AI in Business',
  'technology'
);
```

### React Component

```tsx
import { ImageGenerator } from './components/ui/ImageGenerator';

function App() {
  return <ImageGenerator />;
}
```

## Available Models

### DALL-E 3
- **Best quality** images
- **Better prompt understanding**
- **HD quality option**
- **Multiple aspect ratios**
- **Limited to 1 image per request**

### DALL-E 2
- **Multiple images** per request (up to 10)
- **Image variations** support
- **Image editing** capabilities
- **Smaller size options**

## Image Sizes

- `1024x1024` - Square (default)
- `1792x1024` - Wide landscape
- `1024x1792` - Tall portrait
- `512x512` - Small square (DALL-E 2 only)
- `256x256` - Very small (DALL-E 2 only)

## Quality Options

- `standard` - Standard quality (faster, cheaper)
- `hd` - High definition (better quality, more expensive)

## Style Options

- `vivid` - More colorful and dramatic
- `natural` - More realistic and subdued

## Content Policy

The service includes automatic content validation that checks for:
- Inappropriate content
- Violence or harmful content
- Copyright violations
- NSFW content

## Specialized Templates

### Social Media Optimization
- **Instagram**: Aesthetic, trendy, visually appealing
- **Twitter**: Clean design, professional
- **LinkedIn**: Business appropriate, professional
- **Facebook**: Engaging, colorful

### Blog Headers
- **Wide format** (1792x1024)
- **Professional design**
- **Category-specific styling**
- **Clean layout**

### Enhanced Generation
- **Automatic prompt enhancement**
- **Quality improvements**
- **Style optimization**
- **Professional results**

## Error Handling

The service includes comprehensive error handling:
- **Authentication failures**
- **Invalid prompts**
- **Content policy violations**
- **API rate limits**
- **Network errors**

## Cost Considerations

- **DALL-E 3**: More expensive but higher quality
- **DALL-E 2**: More affordable for multiple images
- **HD quality**: Additional cost for better resolution
- **Multiple images**: Cost scales with quantity

## Best Practices

1. **Be specific** in your prompts for better results
2. **Use DALL-E 3** for single high-quality images
3. **Use DALL-E 2** for variations and multiple images
4. **Validate prompts** before generation
5. **Use specialized templates** for specific use cases
6. **Monitor costs** and usage

## Rate Limits

- OpenAI has rate limits on API calls
- Consider implementing client-side rate limiting
- Monitor usage in OpenAI dashboard
- Implement retry logic for failed requests 