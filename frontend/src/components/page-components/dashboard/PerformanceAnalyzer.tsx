import React, { useState } from 'react';
import { Button } from "../../shadcn/button";
import { Textarea } from "../../shadcn/textarea";
import { Checkbox } from "../../shadcn/checkbox";
import { PostData } from 'shared';
import { Loader2 } from 'lucide-react';

interface PerformanceAnalyzerProps {
    posts: PostData[];
}

export const PerformanceAnalyzer: React.FC<PerformanceAnalyzerProps> = ({ posts }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [contextSettings, setContextSettings] = useState({
        includeScripts: false,
        includeAnalytics: true,
        postHistory: 5,
        analyticsTypes: {
            retention: true,
            views: true,
            engagement: true,
            watchTime: false
        }
    });

    const handleAnalysis = async () => {
        setIsLoading(true);
        
        try {
            // Prepare context based on settings
            const contextPosts = posts
                .filter(post => post.status === 'posted')
                .slice(-contextSettings.postHistory)
                .map(post => {
                    const context: any = {
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

            const response = await fetch('/api/analyze', {
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
            setResponse(data.response);
        } catch (error) {
            setResponse("Sorry, I couldn't analyze that right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-neutral-900/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">AI Performance Analysis</h3>
            
            {/* Context Settings */}
            <div className="mb-4 space-y-3">
                <div className="flex items-center gap-2">
                    <Checkbox 
                        checked={contextSettings.includeScripts}
                        onCheckedChange={(checked) => 
                            setContextSettings(prev => ({...prev, includeScripts: !!checked}))}
                    />
                    <label className="text-sm">Include video scripts</label>
                </div>
                
                <div className="flex items-center gap-2">
                    <Checkbox 
                        checked={contextSettings.includeAnalytics}
                        onCheckedChange={(checked) => 
                            setContextSettings(prev => ({...prev, includeAnalytics: !!checked}))}
                    />
                    <label className="text-sm">Include analytics</label>
                </div>

                {contextSettings.includeAnalytics && (
                    <div className="ml-6 space-y-2">
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
                            <label className="text-sm">Retention data</label>
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
                            <label className="text-sm">View metrics</label>
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
                            <label className="text-sm">Engagement metrics</label>
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
                            <label className="text-sm">Watch time data</label>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <select 
                        className="bg-neutral-800/50 rounded px-2 py-1 text-sm"
                        value={contextSettings.postHistory}
                        onChange={(e) => setContextSettings(prev => ({
                            ...prev, 
                            postHistory: Number(e.target.value)
                        }))}
                    >
                        <option value={3}>Last 3 posts</option>
                        <option value={5}>Last 5 posts</option>
                        <option value={10}>Last 10 posts</option>
                        <option value={20}>Last 20 posts</option>
                    </select>
                    <label className="text-sm">Context history</label>
                </div>
            </div>

            {/* Query Input */}
            <div className="space-y-2">
                <Textarea
                    placeholder="Ask about your content performance..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[80px] bg-neutral-800/50"
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