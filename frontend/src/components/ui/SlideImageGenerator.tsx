import React, { useState } from 'react';
import { Card, CardContent } from '../shadcn/card';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { Image, Download, Sparkles, AlertCircle, X } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastProvider';
import { ImageGenerationService } from '../../lib/imageGeneration';

interface SlideImageGeneratorProps {
  imagePrompt: string;
  slideTitle: string;
  slideNumber: number;
}

interface ImageGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageData?: string;
  error?: string;
  progress?: number;
  jobId?: string;
}

export const SlideImageGenerator: React.FC<SlideImageGeneratorProps> = ({
  imagePrompt,
  slideTitle,
  slideNumber,
}) => {
  const { fetchWithAuth } = useApi();
  const [imageStatus, setImageStatus] = useState<ImageGenerationStatus>({ status: 'idle' });
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const imageService = new ImageGenerationService(fetchWithAuth);

  const generateImage = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setImageStatus({ status: 'generating', progress: 0 });

    try {
      // Enhanced prompt for better results
      const enhancedPrompt = `${imagePrompt}, high quality, detailed, professional, suitable for social media, vibrant colors, modern design`;

      // Start async image generation
      const { jobId } = await imageService.generateImagesAsync({
        prompt: enhancedPrompt,
        size: '1024x1536',
        quality: 'high',
        format: 'png',
      });

      setImageStatus(prev => ({ ...prev, jobId }));

      // Poll for completion
      const results = await imageService.pollJobStatus(
        jobId,
        (progress, status) => {
          setImageStatus(prev => ({ ...prev, progress }));
        },
        60, // 5 minutes max
        3000 // Poll every 3 seconds
      );

      if (results && results.length > 0) {
        const imageResult = results[0];
        setImageStatus({
          status: 'completed',
          imageData: imageResult.base64Data,
          progress: 100,
        });

        toast({
          title: "Image Generated!",
          description: `Successfully created image for slide ${slideNumber}`,
        });
      } else {
        throw new Error('No image data received');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setImageStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to generate image',
      });

      toast({
        title: "Generation Failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const cancelGeneration = async () => {
    if (imageStatus.jobId) {
      try {
        await imageService.cancelJob(imageStatus.jobId);
        setImageStatus({ status: 'idle' });
        toast({
          title: "Generation Cancelled",
          description: "Image generation has been cancelled.",
        });
      } catch (error) {
        console.error('Error cancelling job:', error);
      }
    }
  };

  const downloadImage = () => {
    if (imageStatus.imageData) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${imageStatus.imageData}`;
      link.download = `slide-${slideNumber}-${slideTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusIcon = () => {
    switch (imageStatus.status) {
      case 'generating':
        return <Sparkles className="h-3 w-3 animate-pulse" />;
      case 'completed':
        return <Image className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Image className="h-3 w-3" />;
    }
  };

  const getStatusText = () => {
    switch (imageStatus.status) {
      case 'generating':
        return imageStatus.progress ? `Generating (${imageStatus.progress}%)` : 'Generating...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  const getStatusColor = () => {
    switch (imageStatus.status) {
      case 'generating':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'completed':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      default:
        return 'bg-neutral-500/20 border-neutral-500/30 text-neutral-300';
    }
  };

  return (
    <Card className="bg-neutral-800/50 border-neutral-700">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-neutral-400" />
              <span className="text-sm font-medium text-white">Slide Image</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor()}`}
            >
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>

          {/* Image Display */}
          {imageStatus.status === 'completed' && imageStatus.imageData && (
            <div className="relative">
              <img
                src={`data:image/png;base64,${imageStatus.imageData}`}
                alt={`Generated image for ${slideTitle}`}
                className="w-full h-64 object-cover rounded-lg border border-neutral-600"
              />
              <div className="absolute top-2 right-2">
                <Button
                  size="sm"
                  onClick={downloadImage}
                  className="bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Generation Placeholder */}
          {imageStatus.status === 'generating' && (
            <div className="w-full h-64 bg-neutral-700/30 rounded-lg border border-neutral-600 flex items-center justify-center">
              <div className="flex items-center gap-3 text-neutral-400">
                <Sparkles className="h-6 w-6 animate-pulse" />
                <span>Generating your image...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {imageStatus.status === 'error' && (
            <div className="w-full h-64 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center justify-center">
              <div className="text-center text-red-400">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Failed to generate image</p>
                <p className="text-xs text-red-300 mt-1">{imageStatus.error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={generateImage}
              disabled={isGenerating}
              className="flex-1 bg-indigo-500/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>

            {imageStatus.status === 'completed' && (
              <Button
                onClick={downloadImage}
                variant="outline"
                className="bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>

          {/* Prompt Preview */}
          <div className="text-xs text-neutral-400">
            <span className="font-medium">Prompt:</span> {imagePrompt.substring(0, 100)}
            {imagePrompt.length > 100 && '...'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 