interface ImageGenerationOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  model?: 'dall-e-2' | 'dall-e-3';
  n?: number;
}

interface ImageGenerationResult {
  url: string;
  revisedPrompt?: string;
  size: string;
  model: string;
  created: number;
}

interface ImageVariationOptions {
  imageUrl: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
}

interface ImageEditOptions {
  prompt: string;
  imageUrl: string;
  maskUrl?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  n?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
}

export class ImageGenerationService {
  private fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response>;

  constructor(fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response>) {
    this.fetchWithAuth = fetchWithAuth;
  }

  /**
   * Generate images using DALL-E
   */
  async generateImages(options: ImageGenerationOptions): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/generate', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate image variations
   */
  async generateVariations(options: ImageVariationOptions): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/variations', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Edit an existing image
   */
  async editImage(options: ImageEditOptions): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/edit', {
      method: 'POST',
      body: JSON.stringify(options),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate images with enhanced prompt engineering
   */
  async generateEnhancedImages(
    basePrompt: string,
    style?: string,
    options?: Partial<ImageGenerationOptions>
  ): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/enhanced', {
      method: 'POST',
      body: JSON.stringify({ prompt: basePrompt, style, ...options }),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate images for social media posts
   */
  async generateSocialMediaImages(
    prompt: string,
    platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook'
  ): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/social-media', {
      method: 'POST',
      body: JSON.stringify({ prompt, platform }),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Generate images for blog posts
   */
  async generateBlogImages(
    title: string,
    category?: string
  ): Promise<ImageGenerationResult[]> {
    const response = await this.fetchWithAuth('api/images/blog', {
      method: 'POST',
      body: JSON.stringify({ title, category }),
    });

    const result: ApiResponse<ImageGenerationResult[]> = await response.json();
    return result.data;
  }

  /**
   * Validate prompt for content policy
   */
  async validatePrompt(prompt: string): Promise<{ isValid: boolean; reason?: string }> {
    const response = await this.fetchWithAuth('api/images/validate-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });

    const result: ApiResponse<{ isValid: boolean; reason?: string }> = await response.json();
    return result.data;
  }

  /**
   * Get available models and capabilities
   */
  async getAvailableModels(): Promise<any> {
    const response = await this.fetchWithAuth('api/images/models', {
      method: 'GET',
    });

    const result: ApiResponse<any> = await response.json();
    return result.data;
  }

  /**
   * Download image from URL
   */
  async downloadImage(imageUrl: string, filename?: string): Promise<void> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'generated-image.png';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Get image dimensions from URL
   */
  async getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = imageUrl;
    });
  }
}

// Example usage with useApi hook:
// import { useApi } from '../contexts/ApiContext';
//
// function MyComponent() {
//   const { fetchWithAuth } = useApi();
//   const imageService = new ImageGenerationService(fetchWithAuth);
//
//   const handleGenerate = async () => {
//     const images = await imageService.generateImages({
//       prompt: 'A beautiful sunset over mountains',
//       size: '1024x1024',
//       model: 'dall-e-3'
//     });
//   };
// } 