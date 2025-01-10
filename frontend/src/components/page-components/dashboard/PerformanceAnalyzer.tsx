import React, { useState } from 'react';
import { Button } from "../../shadcn/button";
import { Textarea } from "../../shadcn/textarea";
import { Checkbox } from "../../shadcn/checkbox";
import { PostData } from 'shared';
import { Loader2 } from 'lucide-react';
import { useApi } from '../../../contexts/ApiContext';

interface PerformanceAnalyzerProps {
    posts: PostData[];
}

export const PerformanceAnalyzer: React.FC<PerformanceAnalyzerProps> = ({ posts }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { fetchWithAuth } = useApi();
    const [contextSettings, setContextSettings] = useState({
        includeScripts: false,
        includeAnalytics: false,
        postHistory: 5,
        analyticsTypes: {
            retention: false,
            views: false,
            engagement: false,
            watchTime: false
        }
    });

    const handleAnalysis = async () => {
        setIsLoading(true);
        
        try {
            // Prepare context based on settings
            const contextPosts = posts
                .filter((post: PostData) => post.status === 'posted')
                .slice(-contextSettings.postHistory)
                .map((post: PostData) => {
                    const context: any = {
                        id: post.id,
                        title: post.title,
                        hook: post.hook,
                        postDate: post.postDate,
                    };

                    if (contextSettings.includeScripts) {
                        context.script = post.script;
                    }

                    if (contextSettings.includeAnalytics && post.analytics) {
                        context.analytics = {
                            ...(contextSettings.analyticsTypes.views && { 
                                views: post.analytics.views,
                                viewDistribution: post.analytics.graphs?.viewDistribution 
                            }),
                            ...(contextSettings.analyticsTypes.retention && { 
                                retention: post.analytics.graphs?.retention,
                                fullVideoPercentage: post.analytics.fullVideoPercentage 
                            }),
                            ...(contextSettings.analyticsTypes.engagement && { 
                                likes: post.analytics.likes,
                                comments: post.analytics.comments,
                                shares: post.analytics.shares,
                                engagementOverTime: post.analytics.graphs?.engagementOverTime 
                            }),
                            ...(contextSettings.analyticsTypes.watchTime && { 
                                avgWatchTime: post.analytics.avgWatchTime,
                                totalPlayTime: post.analytics.totalPlayTime 
                            })
                        };
                    }

                    return context;
                });

            const response = await fetchWithAuth('api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: query,
                    context: contextPosts,
                    contextSettings // Include settings so the LLM knows what context it has
                })
            });

            const data = await response.json();

            if (data && data.response) {
                window.location.href = `/support-chat?question=${data.response}`;
            } else {
                setResponse("Sorry, I couldn't analyze that right now. Please try again.");
            }
        } catch (error) {
            console.log(error);
            setResponse("Sorry, I couldn't analyze that right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold mb-4">AI Assistant</h3>
            
            {/* Context Settings - Now more compact */}
            <div className="mb-4 space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            checked={contextSettings.includeScripts}
                            onCheckedChange={(checked) => 
                                setContextSettings(prev => ({...prev, includeScripts: !!checked}))}
                        />
                        <label>Scripts</label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            checked={contextSettings.includeAnalytics}
                            onCheckedChange={(checked) => 
                                setContextSettings(prev => ({...prev, includeAnalytics: !!checked}))}
                        />
                        <label>Analytics</label>
                    </div>

                    <select 
                        className="bg-neutral-800/50 rounded px-2 py-1"
                        value={contextSettings.postHistory}
                        onChange={(e) => setContextSettings(prev => ({
                            ...prev, 
                            postHistory: Number(e.target.value)
                        }))}
                    >
                        <option value={3}>3 posts</option>
                        <option value={5}>5 posts</option>
                        <option value={10}>10 posts</option>
                        <option value={20}>20 posts</option>
                    </select>
                </div>

                {contextSettings.includeAnalytics && (
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                checked={contextSettings.analyticsTypes.retention}
                                onCheckedChange={(checked) => 
                                    setContextSettings(prev => ({
                                        ...prev, 
                                        analyticsTypes: {
                                            ...prev.analyticsTypes,
                                            retention: !!checked
                                        }
                                    }))}
                            />
                            <label>Retention</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                checked={contextSettings.analyticsTypes.views}
                                onCheckedChange={(checked) => 
                                    setContextSettings(prev => ({
                                        ...prev, 
                                        analyticsTypes: {
                                            ...prev.analyticsTypes,
                                            views: !!checked
                                        }
                                    }))}
                            />
                            <label>Views</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                checked={contextSettings.analyticsTypes.engagement}
                                onCheckedChange={(checked) => 
                                    setContextSettings(prev => ({
                                        ...prev, 
                                        analyticsTypes: {
                                            ...prev.analyticsTypes,
                                            engagement: !!checked
                                        }
                                    }))}
                            />
                            <label>Engagement</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox 
                                checked={contextSettings.analyticsTypes.watchTime}
                                onCheckedChange={(checked) => 
                                    setContextSettings(prev => ({
                                        ...prev, 
                                        analyticsTypes: {
                                            ...prev.analyticsTypes,
                                            watchTime: !!checked
                                        }
                                    }))}
                            />
                            <label>Watch time</label>
                        </div>
                    </div>
                )}
            </div>

            {/* Query Input */}
            <div className="space-y-2">
                <Textarea
                    placeholder="Ask about performance, script ideas, etc..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-neutral-800/50"
                    rows={1}
                />
                <Button 
                    className="w-full bg-indigo-500 hover:bg-indigo-600"
                    onClick={handleAnalysis}
                    disabled={isLoading || !query.trim()}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : 'Analyze'}
                </Button>
            </div>

            {/* Response Area */}
            {response && (
                <div className="mt-4 p-4 bg-neutral-800/50 rounded-lg">
                    <p className="text-sm text-neutral-200 whitespace-pre-wrap">{response}</p>
                </div>
            )}
        </div>
    );
}; 