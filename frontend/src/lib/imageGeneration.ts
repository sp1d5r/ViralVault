interface ImageGenerationOptions {
  prompt: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
  compression?: number;
  background?: 'auto' | 'transparent' | 'opaque';
}

interface ImageGenerationResult {
  base64Data: string;
  revisedPrompt?: string;
  size: string;
  model: string;
  created: number;
  format: string;
}

interface ImageVariationOptions {
  base64Image: string;
  variationPrompt: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
}

interface ImageEditOptions {
  prompt: string;
  base64Image: string;
  base64Mask?: string;
  size?: 'auto' | '1024x1024' | '1024x1536' | '1536x1024';
  quality?: 'auto' | 'low' | 'medium' | 'high';
  format?: 'png' | 'jpeg' | 'webp';
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  details?: string;
}

export class ImageGenerationService {
  private fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;

  constructor(fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>) {
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
   * Generate images asynchronously using background jobs
   */
  async generateImagesAsync(options: ImageGenerationOptions): Promise<{ jobId: string; status: string }> {
    const response = await this.fetchWithAuth('api/images/generate', {
      method: 'POST',
      body: JSON.stringify({ ...options, async: true }),
    });

    const result: ApiResponse<{ jobId: string; status: string }> = await response.json();
    return result.data;
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<{
    job: {
      jobId: string;
      status: string;
      progress?: number;
      result?: ImageGenerationResult[];
      error?: string;
      createdAt: number;
      completedAt?: number;
    };
    warning?: string;
  }> {
    const response = await this.fetchWithAuth(`api/images/jobs/${jobId}`, {
      method: 'GET',
    });

    const result: ApiResponse<{
      job: any;
      warning?: string;
    }> = await response.json();
    return result.data;
  }

  /**
   * Poll job status until completion
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (progress: number, status: string) => void,
    maxAttempts: number = 60, // 5 minutes with 5-second intervals
    intervalMs: number = 5000
  ): Promise<ImageGenerationResult[]> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const { job } = await this.getJobStatus(jobId);
        
        if (onProgress && job.progress !== undefined) {
          onProgress(job.progress, job.status);
        }

        if (job.status === 'completed' && job.result) {
          return job.result;
        }

        if (job.status === 'failed') {
          throw new Error(job.error || 'Job failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
      } catch (error) {
        console.error(`Error polling job status (attempt ${attempts + 1}):`, error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error('Job polling timed out');
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error('Job polling timed out');
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    const response = await this.fetchWithAuth(`api/images/jobs/${jobId}/cancel`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to cancel job');
    }
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