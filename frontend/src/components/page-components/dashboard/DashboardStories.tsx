import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthenticationProvider';
import { FirebaseDatabaseService } from 'shared';
import { Link } from 'react-router-dom';
import { Button } from '../../shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../shadcn/card';
import { Badge } from '../../shadcn/badge';
import { FileText, Calendar, Users, TrendingUp, Sparkles, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoryGeneratorModal } from './StoryGeneratorModal';
import { PostData } from 'shared';

interface StoryDocument {
    id: string;
    userId: string;
    slideType: string;
    targetAudience: string;
    tone: string;
    focusAreas: string[];
    slideCount: number;
    postIds: string[];
    generatedStory: {
        title: string;
        slides: any[];
        summary: string;
        keyInsights: string[];
        nextSteps: string[];
    };
    timestamp: number;
}

const DashboardStories = () => {
    const { authState } = useAuth();
    const [stories, setStories] = useState<StoryDocument[]>([]);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authState.user?.uid) return;
        
        // Fetch all story documents
        FirebaseDatabaseService.queryDocuments<StoryDocument>(
            'viral-vault-stories',
            "userId",
            "timestamp",
            authState.user?.uid,
            (documents) => {
                if (documents) {
                    // Sort by timestamp descending (newest first)
                    const sortedDocs = documents.sort((a, b) => b.timestamp - a.timestamp);
                    setStories(sortedDocs);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Error fetching stories:', error);
                setLoading(false);
            }
        );

        // Fetch posts for the story generator
        FirebaseDatabaseService.queryDocuments<PostData>(
            'tiktok-posts',
            "userId",
            "createdAt",
            authState.user?.uid,
            (documents) => {
                if (documents) {
                    setPosts(documents);
                }
            },
            (error) => {
                console.error('Error fetching posts:', error);
            }
        );
    }, [authState.user?.uid]);

    const getSlideTypeIcon = (slideType: string) => {
        switch (slideType) {
            case 'growth':
                return <TrendingUp className="h-4 w-4" />;
            case 'audience-insights':
                return <Users className="h-4 w-4" />;
            case 'viral-moments':
            case 'future-strategy':
                return <Sparkles className="h-4 w-4" />;
            default:
                return <FileText className="h-4 w-4" />;
        }
    };

    const formatSlideType = (slideType: string) => {
        return slideType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                    <span className="text-white">Loading your stories...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-semibold text-white mb-2">Your Stories</h2>
                    <p className="text-neutral-400">Generated story slides from your content data</p>
                </div>
                <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-500 hover:bg-indigo-600"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate New Story
                </Button>
            </div>

            {stories.length === 0 ? (
                <Card className="bg-neutral-900/50 border-neutral-700">
                    <CardContent className="p-8 text-center">
                        <Sparkles className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Stories Yet</h3>
                        <p className="text-neutral-400 mb-6">
                            Generate your first story slides to transform your content data into compelling presentations.
                        </p>
                        <Button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-500 hover:bg-indigo-600"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create Your First Story
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {stories.map((story) => (
                        <Link 
                            key={story.id}
                            to={`/story/${story.id}`}
                            className="block"
                        >
                            <Card className="bg-neutral-900/50 border-neutral-700 hover:bg-neutral-800/50 transition-colors cursor-pointer">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                    {getSlideTypeIcon(story.slideType)}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-white text-lg">
                                                        {story.generatedStory.title}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300">
                                                            {formatSlideType(story.slideType)}
                                                        </Badge>
                                                        <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                                                            {story.targetAudience}
                                                        </Badge>
                                                        <Badge variant="outline" className="border-neutral-600 text-neutral-300">
                                                            {story.tone}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-neutral-400 text-sm">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(story.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-sm text-neutral-400 mt-1">
                                                {story.slideCount} slides
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-neutral-300 text-sm line-clamp-2">
                                        {story.generatedStory.summary}
                                    </p>
                                    <div className="flex items-center gap-4 mt-4 text-xs text-neutral-400">
                                        <span>{story.postIds.length} posts included</span>
                                        <span>•</span>
                                        <span>{story.focusAreas.length} focus areas</span>
                                        <span>•</span>
                                        <span>{story.generatedStory.keyInsights.length} key insights</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            <StoryGeneratorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                posts={posts}
            />
        </div>
    );
};

export default DashboardStories; 