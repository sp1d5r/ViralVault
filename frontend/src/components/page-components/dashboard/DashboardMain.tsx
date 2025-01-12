import React, { useState, useEffect } from 'react';
import { Button } from "../../shadcn/button";
import { Plus, TrendingUp, Users, Clock, Star } from "lucide-react";
import { motion } from 'framer-motion';
import { NewPostModal } from './NewPostModal';
import { PostTimeline } from './PostTimeline';
import { useAuth } from '../../../contexts/AuthenticationProvider';
import { FirebaseDatabaseService, PostData } from 'shared';
import { Unsubscribe } from 'firebase/firestore';
import { PerformanceAnalyzer } from './PerformanceAnalyzer';
import TopPerformingPosts from './TopPerformingPosts';

// Helper function to generate realistic heatmap data
const generateHeatmapData = (posts: PostData[]) => {
    const weeks = 52;
    const daysPerWeek = 7;
    const data = [];
    
    // Start from one year ago
    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 1);
    startDate.setHours(0, 0, 0, 0);
    
    // Align to the start of the week (Sunday)
    const daysSinceStartOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - daysSinceStartOfWeek);

    // Create a map of post counts by date
    const postsByDate = new Map<string, number>();
    posts.forEach(post => {
        const postDate = new Date(post.postDate).toDateString();
        postsByDate.set(postDate, (postsByDate.get(postDate) || 0) + 1);
    });

    // Generate the heatmap data
    for (let week = 0; week < weeks; week++) {
        const weekData = [];
        for (let day = 0; day < daysPerWeek; day++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + (week * 7) + day);
            
            // Get actual post count for this date
            const count = postsByDate.get(date.toDateString()) || 0;
            
            weekData.push({
                date,
                value: count
            });
        }
        data.push(weekData);
    }
    
    return data;
};

const AnalyticCard: React.FC<{
    title: string;
    value: string;
    change: string;
    icon: React.ReactNode;
}> = ({ title, value, change, icon }) => (
    <div className="bg-neutral-900/50 text-white rounded-lg p-4 hover:bg-neutral-900/70 transition-all">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-neutral-400">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
            </div>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
                {icon}
            </div>
        </div>
        <p className={`text-sm mt-2 ${
            parseFloat(change) >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
            {change} from last video.
        </p>
    </div>
);

const calculateAnalytics = (posts: PostData[]) => {
    if (!posts?.length) return {
        totalViews: 0,
        totalFollowers: 0,
        avgWatchTime: "0:00",
        engagementRate: 0,
        changes: {
            views: 0,
            followers: 0,
            watchTime: 0,
            engagement: 0
        }
    };

    // Sort posts by date for getting latest post metrics
    const sortedPosts = [...posts].sort((a, b) => 
        new Date(b.postDate).getTime() - new Date(a.postDate).getTime()
    );

    // Calculate totals
    const totalViews = posts.reduce((sum, post) => sum + (post.analytics?.views || 0), 0);
    const totalFollowers = posts.reduce((sum, post) => sum + (post.analytics?.newFollowers || 0), 0);
    
    // Calculate average watch time
    const totalWatchTime = posts.reduce((sum, post) => sum + (post.analytics?.avgWatchTime || 0), 0);
    const avgWatchTimeSeconds = Math.floor(totalWatchTime / posts.length);
    const avgWatchTime = `${Math.floor(avgWatchTimeSeconds / 60)}:${String(avgWatchTimeSeconds % 60).padStart(2, '0')}`;

    // Calculate overall engagement rate
    const totalEngagements = posts.reduce((sum, post) => {
        const analytics = post.analytics || {};
        return sum + (
            (analytics.likes || 0) + 
            (analytics.comments || 0) + 
            (analytics.shares || 0) + 
            (analytics.favorites || 0)
        );
    }, 0);
    const engagementRate = totalViews ? Number(((totalEngagements / totalViews) * 100).toFixed(1)) : 0;

    // Get latest post for change metrics
    const latestPost = sortedPosts[0];
    const changes = {
        views: latestPost?.analytics?.views || 0,
        followers: latestPost?.analytics?.newFollowers || 0,
        watchTime: latestPost?.analytics?.avgWatchTime || 0,
        engagement: latestPost?.analytics ? 
            Number(((
                (latestPost.analytics.likes || 0) + 
                (latestPost.analytics.comments || 0) + 
                (latestPost.analytics.shares || 0) + 
                (latestPost.analytics.favorites || 0)
            ) / (latestPost.analytics.views || 1) * 100).toFixed(1)) : 0
    };

    return {
        totalViews,
        totalFollowers,
        avgWatchTime,
        engagementRate,
        changes
    };
};

export const DashboardMain: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [posts, setPosts] = useState<PostData[]>([]);
    const [loading, setLoading] = useState(true);
    const {authState} = useAuth();

    useEffect(() => {
        let unsubscribe: Unsubscribe;

        const setupListener = () => {
            if (!authState.user?.uid) {
                setLoading(false);
                setPosts([]);
                return;
            }

            try {
                unsubscribe = FirebaseDatabaseService.listenToQuery<PostData>(
                    'tiktok-posts',
                    'userId',
                    authState.user.uid,
                    'createdAt',
                    (updatedPosts) => {
                        if (updatedPosts) {
                            setPosts(updatedPosts);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error('Query error:', error);
                        setLoading(false);
                    }
                );
            } catch (err) {
                console.error('Setup error:', err);
                setLoading(false);
            }
        };

        setupListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [authState.user?.uid]);

    const analytics = calculateAnalytics(posts);

    // Move heatmap data generation into the component
    const heatmapData = generateHeatmapData(posts);

    return (
        <div className="space-y-6">
            {/* Header - Always at top */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 text-white ">
                <div>
                    <h1 className='text-3xl sm:text-4xl font-bold'>Dashboard</h1>
                    <p className="text-neutral-400 mt-2">Track and manage your content</p>
                </div>
                <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 w-full sm:w-auto"
                >
                    <Plus className="mr-2" /> New Post
                </Button>
            </div>

            {/* Main content area */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Analytics Panel */}
                <div className="order-1 lg:order-2 w-full lg:w-80">
                    <div className="space-y-4 lg:sticky lg:top-4">
                        <div className="bg-neutral-900/50 rounded-lg p-4">
                            <h2 className="text-lg font-semibold mb-4 text-white">Overall Analytics</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                                <AnalyticCard
                                    title="Total Views"
                                    value={analytics.totalViews.toLocaleString()}
                                    change={analytics.changes.views.toString()}
                                    icon={<TrendingUp className="text-indigo-400" />}
                                />
                                <AnalyticCard
                                    title="Total Followers"
                                    value={analytics.totalFollowers.toLocaleString()}
                                    change={analytics.changes.followers.toString()}
                                    icon={<Users className="text-indigo-400" />}
                                />
                                <AnalyticCard
                                    title="Avg Watch Time"
                                    value={analytics.avgWatchTime}
                                    change={analytics.changes.watchTime.toString()}
                                    icon={<Clock className="text-indigo-400" />}
                                />
                                <AnalyticCard
                                    title="Engagement Rate"
                                    value={`${analytics.engagementRate}%`}
                                    change={analytics.changes.engagement.toFixed(1)}
                                    icon={<Star className="text-indigo-400" />}
                                />
                            </div>
                        </div>
                        <TopPerformingPosts posts={posts} />
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="order-2 lg:order-1 flex-1 h-full dark:text-white">
                    <div className="space-y-6">
                        {/* Heatmap and Timeline sections */}
                        <div className="bg-neutral-900/50 rounded-lg p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold mb-4">Content Activity</h2>
                                    <div className="overflow-x-auto pb-2">
                                        <div className="flex gap-[3px] min-w-[750px]">
                                            {heatmapData.map((week, weekIndex) => (
                                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                                    {week.map((day, dayIndex) => (
                                                        <motion.div
                                                            key={`${weekIndex}-${dayIndex}`}
                                                            className={`w-[10px] h-[10px] rounded-sm transition-colors`}
                                                            style={{
                                                                backgroundColor: day.value === 0 
                                                                    ? 'rgba(99, 102, 241, 0.1)' 
                                                                    : `rgba(99, 102, 241, ${0.2 + ((day.value+5) * 0.2)})`
                                                            }}
                                                            whileHover={{ scale: 1.2 }}
                                                            title={`${day.date.toLocaleDateString()}: ${day.value} posts`}
                                                        />
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 text-xs text-neutral-400">
                                        <div className="flex gap-2">
                                            <span>Less</span>
                                            <div className="flex gap-1">
                                                <div className="w-[10px] h-[10px] rounded-sm bg-indigo-500/10" />
                                                <div className="w-[10px] h-[10px] rounded-sm bg-indigo-500/30" />
                                                <div className="w-[10px] h-[10px] rounded-sm bg-indigo-500/50" />
                                                <div className="w-[10px] h-[10px] rounded-sm bg-indigo-500/70" />
                                                <div className="w-[10px] h-[10px] rounded-sm bg-indigo-500/90" />
                                            </div>
                                            <span>More</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:w-96">
                                    <PerformanceAnalyzer posts={posts} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
                            <PostTimeline posts={posts} loading={loading} />
                        </div>
                    </div>
                </div>
            </div>

            <NewPostModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
};
