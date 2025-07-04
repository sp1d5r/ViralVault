import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/shadcn/card';
import { Badge } from '../components/shadcn/badge';
import { ChevronLeft, ChevronRight, Download, Share2, ArrowLeft, Sparkles, Copy, Plus, FileText, ExternalLink } from 'lucide-react';
import { useApi } from '../contexts/ApiContext';
import { toast } from '../contexts/ToastProvider';
import { FirebaseDatabaseService, PostData } from 'shared';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '../components/shadcn/breadcrumbs';
import { SlideImageGenerator } from '../components/ui/SlideImageGenerator';

interface StorySlide {
    slideNumber: number;
    slideType: string;
    title: string;
    content: string;
    imagePrompt: string;
    dataPoints?: string[];
    recommendations?: string[];
    caption?: string;
}

interface GeneratedStory {
    title: string;
    slides: StorySlide[];
    summary: string;
    keyInsights: string[];
    nextSteps: string[];
}

interface StoryDocument {
    id: string;
    userId: string;
    slideType: string;
    targetAudience: string;
    tone: string;
    focusAreas: string[];
    slideCount: number;
    postIds: string[];
    generatedStory: GeneratedStory;
    timestamp: number;
}

export const StoryPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fetchWithAuth } = useApi();
    const [story, setStory] = useState<StoryDocument | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [linkedPosts, setLinkedPosts] = useState<PostData[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(false);

    useEffect(() => {
        const fetchStory = async () => {
            if (!id) return;

            try {
                const response = await fetchWithAuth(`api/stories/${id}`);
                const data = await response.json();
                setStory(data);
                
                // Fetch linked posts after story is loaded
                if (data) {
                    fetchLinkedPosts();
                }
            } catch (err) {
                console.error('Error fetching story:', err);
                setError('Failed to load story');
            } finally {
                setLoading(false);
            }
        };

        fetchStory();
    }, [id, fetchWithAuth]);

    const fetchLinkedPosts = async () => {
        if (!id) return;
        
        setLoadingPosts(true);
        try {
            // Query posts that have this story ID
            FirebaseDatabaseService.queryDocuments<PostData>(
                'tiktok-posts',
                'storyId',
                'createdAt',
                id,
                (posts) => {
                    if (posts) {
                        setLinkedPosts(posts);
                    }
                    setLoadingPosts(false);
                },
                (error) => {
                    console.error('Error fetching linked posts:', error);
                    setLoadingPosts(false);
                }
            );
        } catch (error) {
            console.error('Error fetching linked posts:', error);
            setLoadingPosts(false);
        }
    };

    const nextSlide = () => {
        if (story && currentSlide < story.generatedStory.slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const goToSlide = (slideIndex: number) => {
        setCurrentSlide(slideIndex);
    };

    const handleConvertToPosts = async () => {
        if (!story) return;

        try {
            // Convert the entire story into ONE single post
            const allSlidesContent = story.generatedStory.slides.map((slide, index) => 
                `SLIDE ${index + 1}: ${slide.title}\n${slide.content}\n\nIMAGE PROMPT: ${slide.imagePrompt}\n\nSTORY BEATS: ${slide.dataPoints?.join(', ') || 'N/A'}\n\nRECOMMENDATIONS: ${slide.recommendations?.join(', ') || 'N/A'}\n\n---\n`
            ).join('\n');

            const singlePost = {
                title: story.generatedStory.title,
                postDate: new Date(Date.now()).toISOString().slice(0, 16),
                status: 'draft' as const,
                hook: story.generatedStory.slides[0]?.title || story.generatedStory.title, // Use first slide title as hook
                script: `STORY: ${story.generatedStory.title}\n\nSUMMARY: ${story.generatedStory.summary}\n\nTOTAL SLIDES: ${story.generatedStory.slides.length}\n\n${allSlidesContent}\n\nKEY INSIGHTS: ${story.generatedStory.keyInsights.join(', ')}\n\nNEXT STEPS: ${story.generatedStory.nextSteps.join(', ')}`,
                song: '', // Leave empty for user to fill
                notes: `Generated from story: ${story.generatedStory.title}\nTotal slides: ${story.generatedStory.slides.length}\nStory type: ${story.slideType}\nTarget audience: ${story.targetAudience}\nTone: ${story.tone}`,
                postReleaseNotes: `Complete story: ${story.generatedStory.title}\nSlides: ${story.generatedStory.slides.length}\nType: ${story.slideType}\nAudience: ${story.targetAudience}\nTone: ${story.tone}`,
                tags: [
                    'story-generated',
                    'complete-story',
                    story.slideType,
                    story.targetAudience,
                    story.tone,
                    ...story.focusAreas
                ],
                storyId: id, // Add the story ID to link back to the original story
                createdAt: Date.now(),
                userId: story.userId,
            };

            // Create the single post
            await new Promise<void>((resolve, reject) => {
                FirebaseDatabaseService.addDocument(
                    'tiktok-posts',
                    singlePost,
                    (docId: string) => {
                        resolve();
                    },
                    (error: Error) => {
                        reject(error);
                    }
                );
            });

            // Show success message
            toast({
                title: "Post Created!",
                description: `Successfully converted story into a single post with ${story.generatedStory.slides.length} slides. Check your posts dashboard.`,
            });

            // Refresh linked posts
            fetchLinkedPosts();

        } catch (error) {
            console.error('Error converting story to post:', error);
            toast({
                title: "Error",
                description: "Failed to convert story to post. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                    <span>Loading your story...</span>
                </div>
            </div>
        );
    }

    if (error || !story) {
        return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error || 'Story not found'}</p>
                    <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/dashboard')}
                        className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const currentSlideData = story.generatedStory.slides[currentSlide];

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
            {/* Header */}
            <div className="border-b border-neutral-700 bg-neutral-900/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <Breadcrumb className="text-white mb-4 hidden md:block">
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/dashboard?content=stories">Stories</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/story/${id}`}>{story.generatedStory.title}</BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white">{story.generatedStory.title}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 text-xs">
                                    {story.slideType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                <Badge variant="outline" className="border-neutral-600 text-neutral-300 text-xs">
                                    {story.targetAudience}
                                </Badge>
                                <Badge variant="outline" className="border-neutral-600 text-neutral-300 text-xs">
                                    {story.tone}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleConvertToPosts}
                                className="bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20 text-xs"
                            >
                                <Plus className="mr-2 h-3 w-3" />
                                Convert to Posts
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20 text-xs"
                            >
                                <Download className="mr-2 h-3 w-3" />
                                Export
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20 text-xs"
                            >
                                <Share2 className="mr-2 h-3 w-3" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-4 sm:py-8">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                    {/* Slide Navigation */}
                    <div className="w-full lg:w-64 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Slides</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 lg:space-y-2">
                            {story.generatedStory.slides.map((slide, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-full text-left p-3 rounded-lg transition-all ${
                                        currentSlide === index
                                            ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                                            : 'bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300'
                                    }`}
                                >
                                    <div className="text-sm font-medium">{slide.title}</div>
                                    <div className="text-xs text-neutral-400 mt-1">
                                        Slide {slide.slideNumber} • {slide.slideType}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Story Summary */}
                        <Card className="bg-neutral-800/50 border-neutral-700">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-white">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-xs text-neutral-300">{story.generatedStory.summary}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Slide Display */}
                    <div className="flex-1">
                        <div className="bg-neutral-800/50 rounded-xl p-4 sm:p-8 border border-neutral-700 min-h-[400px] sm:min-h-[600px]">
                            {/* Slide Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                <div>
                                    <Badge variant="outline" className="border-neutral-600 text-neutral-300 mb-2 text-xs">
                                        Slide {currentSlide + 1} of {story.generatedStory.slides.length}
                                    </Badge>
                                    <h2 className="text-lg sm:text-2xl font-bold text-white">{currentSlideData.title}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={prevSlide}
                                        disabled={currentSlide === 0}
                                        className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={nextSlide}
                                        disabled={currentSlide === story.generatedStory.slides.length - 1}
                                        className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Slide Content */}
                            <div className="space-y-4 sm:space-y-6">
                                {/* TikTok-style Caption Overlay */}
                                {currentSlideData.caption && (
                                    <div className="w-full flex justify-center">
                                        <div className="text-2xl sm:text-3xl font-extrabold text-white text-center drop-shadow-lg bg-black/40 px-4 py-2 rounded-lg mb-4 max-w-2xl">
                                            {currentSlideData.caption}
                                        </div>
                                    </div>
                                )}
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-base sm:text-lg text-neutral-200 leading-relaxed">
                                        {currentSlideData.content}
                                    </p>
                                </div>

                                {/* Image Generator */}
                                <div className="border-t border-neutral-700 pt-4 sm:pt-6">
                                    <SlideImageGenerator
                                        key={`${id}-${currentSlide}`}
                                        imagePrompt={currentSlideData.imagePrompt}
                                        slideTitle={currentSlideData.title}
                                        slideNumber={currentSlide + 1}
                                        storyId={id}
                                    />
                                </div>

                                {/* Image Prompt */}
                                <div className="border-t border-neutral-700 pt-4 sm:pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                                        <h4 className="text-sm font-semibold text-neutral-300">AI Image Prompt</h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                navigator.clipboard.writeText(currentSlideData.imagePrompt);
                                                toast({
                                                    title: "Image prompt copied!",
                                                    description: "Ready to paste in your image generator",
                                                });
                                            }}
                                            className="bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 w-full sm:w-auto"
                                        >
                                            Copy Prompt
                                        </Button>
                                    </div>
                                    <div className="p-3 sm:p-4 bg-neutral-700/30 rounded-lg border border-neutral-600">
                                        <p className="text-xs sm:text-sm text-neutral-200 font-mono leading-relaxed">
                                            {currentSlideData.imagePrompt}
                                        </p>
                                    </div>
                                    <p className="text-xs text-neutral-400 mt-2">
                                        Use this prompt in DALL-E, Midjourney, or other AI image generators
                                    </p>
                                </div>

                                {/* Data Points */}
                                {currentSlideData.dataPoints && currentSlideData.dataPoints.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-300 mb-3">Key Data Points</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {currentSlideData.dataPoints.map((point, index) => (
                                                <div key={index} className="p-3 bg-neutral-700/30 rounded-lg">
                                                    <p className="text-sm text-neutral-200">{point}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {currentSlideData.recommendations && currentSlideData.recommendations.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-neutral-300 mb-3">Recommendations</h4>
                                        <div className="space-y-2">
                                            {currentSlideData.recommendations.map((rec, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 flex-shrink-0"></div>
                                                    <p className="text-sm text-neutral-200">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Key Insights & Next Steps */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-8">
                            <Card className="bg-neutral-800/50 border-neutral-700">
                                <CardHeader>
                                    <CardTitle className="text-white text-sm sm:text-base">Key Insights</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {story.generatedStory.keyInsights.map((insight, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs sm:text-sm text-neutral-300">{insight}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-neutral-800/50 border-neutral-700">
                                <CardHeader>
                                    <CardTitle className="text-white text-sm sm:text-base">Next Steps</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {story.generatedStory.nextSteps.map((step, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                                <p className="text-xs sm:text-sm text-neutral-300">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Linked Posts Section */}
                <div className="mt-8 sm:mt-12">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Posts Created from This Story</h3>
                        <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/dashboard')}
                            className="bg-neutral-500/10 border-neutral-500/20 text-neutral-300 hover:bg-neutral-500/20"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            View All Posts
                        </Button>
                    </div>

                    {loadingPosts ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-3 text-neutral-400">
                                <Sparkles className="h-5 w-5 animate-pulse" />
                                <span>Loading posts...</span>
                            </div>
                        </div>
                    ) : linkedPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {linkedPosts.map((post) => (
                                <Card key={post.id} className="bg-neutral-800/50 border-neutral-700 hover:bg-neutral-700/50 transition-all">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-sm text-white line-clamp-2">{post.title}</CardTitle>
                                            <Badge 
                                                variant="outline" 
                                                className="border-green-500/30 text-green-400 text-xs ml-2 flex-shrink-0"
                                            >
                                                {post.status}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-neutral-400 mb-3 line-clamp-2">{post.hook}</p>
                                        <div className="flex items-center justify-between text-xs text-neutral-500">
                                            <span>{new Date(post.postDate).toLocaleDateString()}</span>
                                            <div className="flex items-center gap-2">
                                                {post.analytics?.views && (
                                                    <span>{post.analytics.views.toLocaleString()} views</span>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => navigate('/dashboard')}
                                                    className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 p-1"
                                                    title="View in Dashboard"
                                                >
                                                    <ExternalLink size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-neutral-800/50 border-neutral-700">
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <FileText className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-medium text-white mb-2">No Posts Created Yet</h4>
                                    <p className="text-neutral-400 mb-4">
                                        Convert this story into posts to see them here
                                    </p>
                                    <Button 
                                        onClick={handleConvertToPosts}
                                        className="bg-green-500/10 border-green-500/20 text-green-300 hover:bg-green-500/20"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Convert to Posts
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}; 