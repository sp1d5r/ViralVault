import React, { useState, useEffect } from 'react';
import { Button } from '../shadcn/button';
import { Card, CardContent } from '../shadcn/card';
import { Badge } from '../shadcn/badge';
import { Image, Download, Sparkles, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { toast } from '../../contexts/ToastProvider';

interface SlideImageGeneratorProps {
  imagePrompt: string;
  slideTitle: string;
  slideNumber: number;
}

interface ImageGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageData?: string;
  error?: string;
}

export const SlideImageGenerator: React.FC<SlideImageGeneratorProps> = ({
  imagePrompt,
  slideTitle,
  slideNumber,
}) => {
  const { fetchWithAuth } = useApi();
  const [imageStatus, setImageStatus] = useState<ImageGenerationStatus>({ status: 'idle' });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setImageStatus({ status: 'generating' });

    try {
      // Enhanced prompt for better results
      const enhancedPrompt = `${imagePrompt}, high quality, detailed, professional, suitable for social media, vibrant colors, modern design`;

      const response = await fetchWithAuth('api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          size: '1024x1024',
          quality: 'high',
          format: 'png',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const imageResult = result.data[0];
        setImageStatus({
          status: 'completed',
          imageData: imageResult.base64Data,
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

  const downloadImage = () => {
    if (!imageStatus.imageData) return;

    try {
      // Convert base64 to blob
      const byteCharacters = atob(imageStatus.imageData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `slide-${slideNumber}-${slideTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Image Downloaded!",
        description: "Image saved to your downloads folder",
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = () => {
    switch (imageStatus.status) {
      case 'generating':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (imageStatus.status) {
      case 'generating':
        return 'Generating...';
      case 'completed':
        return 'Ready';
      case 'error':
        return 'Failed';
      default:
        return 'Generate Image';
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
                className="w-full h-48 object-cover rounded-lg border border-neutral-600"
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
            <div className="w-full h-48 bg-neutral-700/30 rounded-lg border border-neutral-600 flex items-center justify-center">
              <div className="flex items-center gap-3 text-neutral-400">
                <Sparkles className="h-6 w-6 animate-pulse" />
                <span>Generating your image...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {imageStatus.status === 'error' && (
            <div className="w-full h-48 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center justify-center">
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
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
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