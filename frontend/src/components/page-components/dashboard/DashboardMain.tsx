import React, { useState } from 'react';
import { Button } from "../../shadcn/button";
import { Plus, Edit, Music, Share2, TrendingUp, Users, Clock, Star } from "lucide-react";
import { motion } from 'framer-motion';
import { NewPostModal } from './NewPostModal';
import { PostTimeline } from './PostTimeline';

// Helper function to generate random data for the heatmap
const generateHeatmapData = () => {
    const weeks = 52;
    const daysPerWeek = 7;
    const data = [];
    
    // Start from the beginning of the current week
    const now = new Date();
    const currentDay = now.getDay();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - currentDay - (weeks * 7));

    for (let week = 0; week < weeks; week++) {
        const weekData = [];
        for (let day = 0; day < daysPerWeek; day++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + (week * 7) + day);
            weekData.push({
                date,
                value: Math.floor(Math.random() * 5) // 0-4 posts per day
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
            {change}% from last month
        </p>
    </div>
);

export const DashboardMain: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const heatmapData = generateHeatmapData();

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
                <div className="order-1 lg:order-2 w-full lg:w-80 space-y-4">
                    <div className="bg-neutral-900/50 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-4 text-white">Overall Analytics</h2>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                            <AnalyticCard
                                title="Total Views"
                                value="124.8k"
                                change="+12.3"
                                icon={<TrendingUp className="text-indigo-400" />}
                            />
                            <AnalyticCard
                                title="Total Followers"
                                value="1,234"
                                change="+5.2"
                                icon={<Users className="text-indigo-400" />}
                            />
                            <AnalyticCard
                                title="Avg Watch Time"
                                value="2:31"
                                change="-1.5"
                                icon={<Clock className="text-indigo-400" />}
                            />
                            <AnalyticCard
                                title="Engagement Rate"
                                value="4.6%"
                                change="+0.8"
                                icon={<Star className="text-indigo-400" />}
                            />
                        </div>
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="order-2 lg:order-1 flex-1 h-full dark:text-white">
                    <div className="space-y-6">
                        {/* Heatmap and Timeline sections */}
                        <div className="bg-neutral-900/50 rounded-lg p-0 md:p-4 sm:p-6">
                            <h2 className="text-lg font-semibold mb-4">Content Activity</h2>
                            <div className="overflow-x-auto pb-2">
                                <div className="flex gap-1 min-w-[750px]">
                                    {heatmapData.map((week, weekIndex) => (
                                        <div key={weekIndex} className="flex flex-col gap-1">
                                            {week.map((day, dayIndex) => (
                                                <div
                                                    key={`${weekIndex}-${dayIndex}`}
                                                    className={`w-3 h-3 rounded-sm transition-colors`}
                                                    style={{
                                                        backgroundColor: `rgba(99, 102, 241, ${day.value * 0.25})`
                                                    }}
                                                    title={`${day.date.toDateString()}: ${day.value} posts`}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-1 mt-2 text-xs text-neutral-400">
                                <div className="w-8">Mon</div>
                                <div className="w-8">Wed</div>
                                <div className="w-8">Fri</div>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
                            <PostTimeline />
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
