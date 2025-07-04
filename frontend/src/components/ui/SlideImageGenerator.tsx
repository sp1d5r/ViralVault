import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../shadcn/card';
import { Button } from '../shadcn/button';
import { Badge } from '../shadcn/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../shadcn/select';
import { Dialog, DialogContent } from '../shadcn/dialog';
import { Image, Download, Sparkles, AlertCircle, X, Clock, CheckCircle, XCircle, RefreshCw, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useApi } from '../../contexts/ApiContext';
import { useToast } from '../../contexts/ToastProvider';
import { useJobStatus, useGenerateImage, useCancelJob, useJobsByStoryAndSlide, useRefreshImageUrl } from '../../lib/imageGeneration';

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
  const [imageLoadRetries, setImageLoadRetries] = useState(0);
  const [isRefreshingUrl, setIsRefreshingUrl] = useState(false);
  const [hasUserSelectedJob, setHasUserSelectedJob] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const { toast } = useToast();

  // TanStack Query hooks
  const generateImageMutation = useGenerateImage();
  const cancelJobMutation = useCancelJob();
  const refreshImageUrlMutation = useRefreshImageUrl();
  
  // Get jobs for this story and slide
  const { 
    data: jobsData, 
    isLoading: jobsLoading, 
    error: jobsError,
    refetch: refetchJobs 
  } = useJobsByStoryAndSlide(storyId || null, slideNumber);

  // Convert jobs data to JobOption format
  const availableJobs: JobOption[] = React.useMemo(() => {
    console.log('Converting jobs data:', {
      jobsData,
      jobsLoading,
      jobsError,
      storyId,
      slideNumber
    });
    
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
  }, [jobsData, jobsLoading, jobsError, storyId, slideNumber]);

  // Get status of selected job
  const { 
    data: jobStatusData, 
    isLoading: jobStatusLoading,
    error: jobStatusError 
  } = useJobStatus(selectedJobId, !!selectedJobId);

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
        
        // Refetch jobs to update the list with the completed job
        refetchJobs();
      } else if (job.status === 'completed' && job.error) {
        console.log('Setting error status:', job.error);
        setImageStatus({
          status: 'error',
          error: job.error,
          jobId: job.jobId,
        });
        
        // Refetch jobs to update the list
        refetchJobs();
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
        
        // Refetch jobs to update the list
        refetchJobs();
      }
    }
  }, [jobStatusData, refetchJobs]);

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
    setImageLoadRetries(0);
    setIsRefreshingUrl(false);
    setHasUserSelectedJob(false);
  }, [slideNumber]);

  // Set initial selected job when jobs load (only if user hasn't manually selected)
  useEffect(() => {
    console.log('Jobs loaded:', {
      availableJobs: availableJobs.length,
      jobsLoading,
      selectedJobId,
      hasUserSelectedJob,
      currentStatus: imageStatus.status
    });
    
    // Don't auto-select if user has manually selected a job
    if (hasUserSelectedJob) {
      console.log('User has manually selected a job, skipping auto-selection');
      return;
    }
    
    if (availableJobs.length > 0) {
      // Find the most recent completed job, or fall back to the latest job
      const completedJob = availableJobs.find(job => 
        job.status === 'completed' && job.result && job.result.imageUrl
      );
      
      const latestJob = availableJobs[0]; // Jobs are sorted by createdAt desc
      
      console.log('Job analysis:', {
        completedJob: completedJob ? { jobId: completedJob.jobId, hasImageUrl: !!completedJob.result?.imageUrl } : null,
        latestJob: { jobId: latestJob.jobId, status: latestJob.status }
      });
      
      const jobToSelect = completedJob || latestJob;
      
      // Only update selectedJobId if it's different or not set
      if (selectedJobId !== jobToSelect.jobId) {
        console.log('Setting selected job:', jobToSelect.jobId);
        setSelectedJobId(jobToSelect.jobId);
      }
      
      // If we found a completed job, immediately set the image status
      if (completedJob) {
        console.log('Restoring completed image:', {
          jobId: completedJob.jobId,
          imageUrl: completedJob.result?.imageUrl,
          hasImageData: !!completedJob.result?.base64Data
        });
        setImageStatus({
          status: 'completed',
          imageData: completedJob.result?.base64Data,
          imageUrl: completedJob.result?.imageUrl,
          progress: 100,
          jobId: completedJob.jobId,
        });
      } else if (latestJob.status === 'completed' && latestJob.error) {
        setImageStatus({
          status: 'error',
          error: latestJob.error,
          jobId: latestJob.jobId,
        });
      } else if (['in_progress', 'queued', 'processing'].includes(latestJob.status)) {
        setImageStatus({
          status: 'generating',
          progress: latestJob.progress || 0,
          jobId: latestJob.jobId,
        });
      } else if (latestJob.status === 'failed') {
        setImageStatus({
          status: 'error',
          error: latestJob.error || 'Job failed',
          jobId: latestJob.jobId,
        });
      }
    } else if (jobsLoading) {
      // Show loading state while jobs are being fetched
      setImageStatus({ status: 'idle' });
    }
  }, [availableJobs, selectedJobId, jobsLoading, hasUserSelectedJob]);

  const handleImageLoadError = async (imageUrl: string) => {
    console.error('Image failed to load, attempting URL refresh...');
    
    if (imageLoadRetries < 2 && selectedJobId) {
      setImageLoadRetries(prev => prev + 1);
      setIsRefreshingUrl(true);
      
      try {
        const result = await refreshImageUrlMutation.mutateAsync(selectedJobId);
        
        // Update the image status with the new URL
        setImageStatus(prev => ({
          ...prev,
          imageUrl: result.imageUrl,
        }));
        
        toast({
          title: 'Image URL Refreshed',
          description: 'Successfully refreshed the image URL',
        });
        
        // Reset retry count on success
        setImageLoadRetries(0);
      } catch (error) {
        console.error('Failed to refresh image URL:', error);
        toast({
          title: 'URL Refresh Failed',
          description: 'Failed to refresh the image URL. The image may have expired.',
          variant: 'destructive',
        });
      } finally {
        setIsRefreshingUrl(false);
      }
    } else {
      toast({
        title: 'Image Load Error',
        description: 'Failed to load the image after multiple attempts. The image may have expired.',
        variant: 'destructive',
      });
    }
  };

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

  const openPreview = () => {
    setPreviewScale(1);
    setPreviewRotation(0);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  const zoomIn = () => {
    setPreviewScale(prev => Math.min(prev * 1.5, 5));
  };

  const zoomOut = () => {
    setPreviewScale(prev => Math.max(prev / 1.5, 0.1));
  };

  const rotateImage = () => {
    setPreviewRotation(prev => (prev + 90) % 360);
  };

  const resetPreview = () => {
    setPreviewScale(1);
    setPreviewRotation(0);
  };

  const handleJobSelection = (jobId: string) => {
    console.log('User manually selected job:', jobId);
    setSelectedJobId(jobId);
    setHasUserSelectedJob(true); // Mark that user has manually selected
    
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
                {availableJobs.map((job, index) => {
                  const isMostRecentCompleted = index === 0 && job.status === 'completed' && job.result?.imageUrl;
                  return (
                    <SelectItem key={job.jobId} value={job.jobId}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{job.prompt.substring(0, 50)}...</span>
                          {isMostRecentCompleted && (
                            <Badge variant="secondary" className="text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {job.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
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
              {isRefreshingUrl && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-white">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Refreshing image URL...</span>
                  </div>
                </div>
              )}
              <img
                src={imageStatus.imageUrl || `data:image/png;base64,${imageStatus.imageData}`}
                alt={`Generated image for slide ${slideNumber}`}
                className="w-full h-64 object-cover rounded-lg border"
                onLoad={() => {
                  console.log('Image loaded successfully');
                  setImageLoadRetries(0); // Reset retry count on successful load
                }}
                onError={(e) => {
                  console.error('Image failed to load:', e);
                  console.error('Image src was:', imageStatus.imageUrl || `data:image/png;base64,${imageStatus.imageData}`);
                  
                  if (imageStatus.imageUrl) {
                    handleImageLoadError(imageStatus.imageUrl);
                  } else {
                    toast({
                      title: 'Image Load Error',
                      description: 'Failed to load the generated image',
                      variant: 'destructive',
                    });
                  }
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    onClick={openPreview}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    size="sm"
                    variant="secondary"
                  >
                    <ZoomIn className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    onClick={downloadImage}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {imageStatus.imageUrl && (
                    <Button
                      onClick={() => handleImageLoadError(imageStatus.imageUrl!)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      size="sm"
                      variant="outline"
                      disabled={isRefreshingUrl}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh URL
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Retry indicator */}
            {imageLoadRetries > 0 && (
              <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>Retry attempt {imageLoadRetries}/2</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {imageStatus.status === 'idle' && !jobsLoading && (
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

          {/* Manual refresh button for completed images */}
          {imageStatus.status === 'completed' && imageStatus.imageUrl && (
            <Button 
              onClick={() => handleImageLoadError(imageStatus.imageUrl!)}
              disabled={isRefreshingUrl}
              variant="outline"
              size="sm"
            >
              {isRefreshingUrl ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh URL
                </>
              )}
            </Button>
          )}
        </div>

        {/* Loading States */}
        {(jobsLoading || jobStatusLoading) && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Loading job information...
            </div>
          </div>
        )}

        {/* Show loading state when no jobs but still loading */}
        {jobsLoading && availableJobs.length === 0 && imageStatus.status === 'idle' && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 animate-spin" />
              Loading previous generations...
            </div>
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
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/95">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center gap-4">
              <h3 className="text-white font-semibold">Slide {slideNumber} Preview</h3>
              <Badge variant="secondary" className="text-xs">
                {Math.round(previewScale * 100)}% • {previewRotation}°
              </Badge>
            </div>
            <Button
              onClick={closePreview}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
            <div className="relative">
              <img
                src={imageStatus.imageUrl || `data:image/png;base64,${imageStatus.imageData}`}
                alt={`Generated image for slide ${slideNumber}`}
                className="max-w-none max-h-[80vh] transition-all duration-300 ease-out"
                style={{
                  transform: `scale(${previewScale}) rotate(${previewRotation}deg)`,
                  transformOrigin: 'center',
                }}
                draggable={false}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 p-4 bg-black/50 backdrop-blur-sm border-t border-white/10">
            <Button
              onClick={zoomOut}
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
              disabled={previewScale <= 0.1}
            >
              <ZoomOut className="h-4 w-4 mr-1" />
              Zoom Out
            </Button>
            
            <Button
              onClick={resetPreview}
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            
            <Button
              onClick={rotateImage}
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <RotateCw className="h-4 w-4 mr-1" />
              Rotate
            </Button>
            
            <Button
              onClick={zoomIn}
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
              disabled={previewScale >= 5}
            >
              <ZoomIn className="h-4 w-4 mr-1" />
              Zoom In
            </Button>
            
            <Button
              onClick={downloadImage}
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </Card>
  );
};