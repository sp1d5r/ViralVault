import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../shadcn/card';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Image, Download, Sparkles, AlertCircle, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastProvider';
import { useJobStatus, useGenerateImage, useCancelJob, useJobsByStoryAndSlide } from '../../lib/imageGeneration';

interface SlideImageGeneratorProps {
  imagePrompt: string;
  slideTitle: string;
  slideNumber: number;
  storyId?: string;
}

interface ImageGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error';
  imageData?: string;
  imageUrl?: string;
  error?: string;
  progress?: number;
  jobId?: string;
}

interface JobOption {
  jobId: string;
  status: string;
  progress?: number;
  createdAt: number;
  prompt: string;
  result?: {
    imageUrl?: string;
    base64Data?: string;
  };
  error?: string;
  completedAt?: number;
}

export const SlideImageGenerator: React.FC<SlideImageGeneratorProps> = ({
  imagePrompt,
  slideTitle,
  slideNumber,
  storyId,
}) => {
  const { fetchWithAuth } = useApi();
  const [imageStatus, setImageStatus] = useState<ImageGenerationStatus>({ status: 'idle' });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { toast } = useToast();

  // TanStack Query hooks
  const generateImageMutation = useGenerateImage();
  const cancelJobMutation = useCancelJob();
  
  // Get jobs for this story and slide
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError,
    refetch: refetchJobs 
  } = useJobsByStoryAndSlide(storyId || null, slideNumber);

  // Get status of selected job
  const { 
    data: jobStatusData, 
    isLoading: jobStatusLoading,
    error: jobStatusError 
  } = useJobStatus(selectedJobId, !!selectedJobId);

  // Convert jobs data to JobOption format
  const availableJobs: JobOption[] = React.useMemo(() => {
    if (!jobsData) return [];
    
    return jobsData.map((job: any) => ({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      prompt: job.prompt,
      result: job.result,
      error: job.error,
      completedAt: job.completedAt,
    }));
  }, [jobsData]);

  // Update image status based on job status
  useEffect(() => {
    if (jobStatusData?.job) {
      const job = jobStatusData.job;
      
      console.log('Processing job status:', {
        status: job.status,
        hasResult: !!job.result,
        resultType: typeof job.result,
        isArray: Array.isArray(job.result),
        resultKeys: job.result ? Object.keys(job.result) : null,
        error: job.error
      });
      
      if (job.status === 'completed' && job.result && !job.error) {
        // Handle both array and single result formats
        const result = Array.isArray(job.result) ? job.result[0] : job.result;
        console.log('Setting completed status with result:', result);
        setImageStatus({
          status: 'completed',
          imageData: result.base64Data,
          imageUrl: result.imageUrl,
          progress: 100,
          jobId: job.jobId,
        });
      } else if (job.status === 'completed' && job.error) {
        console.log('Setting error status:', job.error);
        setImageStatus({
          status: 'error',
          error: job.error,
          jobId: job.jobId,
        });
      } else if (['in_progress', 'queued', 'processing'].includes(job.status)) {
        console.log('Setting generating status, progress:', job.progress);
        setImageStatus({
          status: 'generating',
          progress: job.progress || 0,
          jobId: job.jobId,
        });
      } else if (job.status === 'failed') {
        console.log('Setting failed status:', job.error);
        setImageStatus({
          status: 'error',
          error: job.error || 'Job failed',
          jobId: job.jobId,
        });
      }
    }
  }, [jobStatusData]);

  // Debug image status changes
  useEffect(() => {
    if (imageStatus.status === 'completed') {
      console.log('Image status completed:', { 
        imageUrl: imageStatus.imageUrl, 
        hasImageData: !!imageStatus.imageData,
        jobId: imageStatus.jobId 
      });
    }
  }, [imageStatus]);

  // Reset state when slide number changes
  useEffect(() => {
    setImageStatus({ status: 'idle' });
    setSelectedJobId(null);
  }, [slideNumber]);

  // Set initial selected job when jobs load
  useEffect(() => {
    if (availableJobs.length > 0 && !selectedJobId) {
      const latestJob = availableJobs[0];
      setSelectedJobId(latestJob.jobId);
    }
  }, [availableJobs, selectedJobId]);

  const generateImage = async () => {
    try {
      const options = {
        prompt: imagePrompt,
        size: '1024x1536' as const,
        quality: 'high' as const,
        format: 'png' as const,
        storyId,
        slideNumber,
      };

      const result = await generateImageMutation.mutateAsync(options);
      
      if (result.jobId) {
        setSelectedJobId(result.jobId);
        setImageStatus({
          status: 'generating',
          progress: 0,
          jobId: result.jobId,
        });
        
        toast({
          title: 'Image Generation Started',
          description: 'Your image is being generated. This may take a few minutes.',
        });
        
        // Refetch jobs to update the list
        refetchJobs();
      }
    } catch (error) {
      console.error('Error generating image:', error);
              toast({
          title: 'Generation Failed',
          description: error instanceof Error ? error.message : 'Failed to start image generation',
          variant: 'destructive',
        });
    }
  };

  const cancelGeneration = async () => {
    if (!selectedJobId) return;
    
    try {
      await cancelJobMutation.mutateAsync(selectedJobId);
              toast({
          title: 'Generation Cancelled',
          description: 'Image generation has been cancelled.',
        });
    } catch (error) {
      console.error('Error cancelling job:', error);
              toast({
          title: 'Cancellation Failed',
          description: 'Failed to cancel image generation',
          variant: 'destructive',
        });
    }
  };

  const downloadImage = () => {
    const imageUrl = imageStatus.imageUrl;
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${slideTitle}-slide-${slideNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleJobSelection = (jobId: string) => {
    setSelectedJobId(jobId);
    
    // Find the selected job to update status immediately
    const selectedJob = availableJobs.find(job => job.jobId === jobId);
    if (selectedJob) {
      if (selectedJob.status === 'completed' && selectedJob.result && !selectedJob.error) {
        setImageStatus({
          status: 'completed',
          imageData: selectedJob.result.base64Data,
          imageUrl: selectedJob.result.imageUrl,
          progress: 100,
          jobId: selectedJob.jobId,
        });
      } else if (selectedJob.status === 'completed' && selectedJob.error) {
        setImageStatus({
          status: 'error',
          error: selectedJob.error,
          jobId: selectedJob.jobId,
        });
      } else if (['in_progress', 'queued', 'processing'].includes(selectedJob.status)) {
        setImageStatus({
          status: 'generating',
          progress: selectedJob.progress || 0,
          jobId: selectedJob.jobId,
        });
      } else if (selectedJob.status === 'failed') {
        setImageStatus({
          status: 'error',
          error: selectedJob.error || 'Job failed',
          jobId: selectedJob.jobId,
        });
      }
    }
  };

  const getStatusIcon = () => {
    switch (imageStatus.status) {
      case 'generating':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    switch (imageStatus.status) {
      case 'generating':
        return 'Generating...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Ready to generate';
    }
  };

  const getStatusColor = () => {
    switch (imageStatus.status) {
      case 'generating':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">Slide {slideNumber} Image</h3>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>

        {/* Job Selection Dropdown */}
        {availableJobs.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Previous Generations
            </label>
            <Select value={selectedJobId || ''} onValueChange={handleJobSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {availableJobs.map((job) => (
                  <SelectItem key={job.jobId} value={job.jobId}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{job.prompt.substring(0, 50)}...</span>
                      <Badge variant="outline" className="ml-2">
                        {job.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Progress Bar */}
        {imageStatus.status === 'generating' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{imageStatus.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${imageStatus.progress || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {imageStatus.status === 'error' && imageStatus.error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{imageStatus.error}</span>
            </div>
          </div>
        )}

        {/* Image Display */}
        {imageStatus.status === 'completed' && (imageStatus.imageUrl || imageStatus.imageData) && (
          <div className="mb-4">
            <div className="relative group">
              <img
                src={imageStatus.imageUrl || `data:image/png;base64,${imageStatus.imageData}`}
                alt={`Generated image for slide ${slideNumber}`}
                className="w-full h-64 object-cover rounded-lg border"
                onLoad={() => console.log('Image loaded successfully')}
                onError={(e) => {
                  console.error('Image failed to load:', e);
                  console.error('Image src was:', imageStatus.imageUrl || `data:image/png;base64,${imageStatus.imageData}`);
                  toast({
                    title: 'Image Load Error',
                    description: 'Failed to load the generated image',
                    variant: 'destructive',
                  });
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <Button
                  onClick={downloadImage}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {imageStatus.status === 'idle' && (
            <Button
              onClick={generateImage}
              disabled={generateImageMutation.isPending}
              className="flex-1"
            >
              {generateImageMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          )}

          {imageStatus.status === 'generating' && (
            <Button
              onClick={cancelGeneration}
              disabled={cancelJobMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {cancelJobMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel Generation
                </>
              )}
            </Button>
          )}

          {imageStatus.status === 'completed' && (
            <Button onClick={generateImage} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate New Image
            </Button>
          )}

          {imageStatus.status === 'error' && (
            <Button onClick={generateImage} className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Retry Generation
            </Button>
          )}
        </div>

        {/* Loading States */}
        {(jobsLoading || jobStatusLoading) && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Loading job information...
          </div>
        )}

        {/* Error States */}
        {(jobsError || jobStatusError) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">
                {jobsError?.message || jobStatusError?.message || 'Failed to load job information'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 