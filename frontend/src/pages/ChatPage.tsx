import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FirebaseDatabaseService, PostContext, ContextSettings } from "shared";
import { ScrollArea } from "../components/shadcn/scroll-area";

interface AnalysisDocument {
    question: string;
    response: string;
    postIds: string[];
    timestamp: number;
    contextSettings: ContextSettings;
}

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 50%)`;
};

export const ChatPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const [analysis, setAnalysis] = useState<AnalysisDocument | null>(null);
    const [posts, setPosts] = useState<PostContext[]>([]);

    useEffect(() => {
        if (id) {
            FirebaseDatabaseService.getDocument<AnalysisDocument>(
                'viral-vault-chats',
                id,
                (doc) => {
                    if (doc) {
                        setAnalysis(doc);
                        setPosts([]);
                        doc.postIds.forEach(postId => {
                            FirebaseDatabaseService.getDocument<PostContext>(
                                'tiktok-posts',
                                postId,
                                (post) => {
                                    if (post) {
                                        setPosts(prev => [...prev, post]);
                                    }
                                },
                                (error) => console.error('Error fetching post:', error)
                            );
                        });
                    }
                },
                (error) => console.error('Error fetching analysis:', error)
            );
        }
    }, [id]);

    if (!analysis) {
        return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-screen container">
            {/* Context Posts Section */}
            <div className="bg-neutral-900/50 border-b border-neutral-800 p-4">
                <h2 className="text-4xl font-semibold text-white mb-3">Context Posts</h2>
                <ScrollArea className="w-full rounded-md">
                    <div className="flex gap-4 pb-4">
                        {posts.map((post) => (
                            <div key={post.id} className="flex items-center gap-3 flex-shrink-0 w-[300px] bg-neutral-900/50 rounded-lg p-4 border border-neutral-800">
                                <div 
                                    className="w-12 h-12 rounded overflow-hidden flex-shrink-0"
                                    style={{
                                        background: `linear-gradient(135deg, ${stringToColor(post.title)}, ${stringToColor(post.title + 'alt')})`
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-medium text-white truncate">{post.title}</h3>
                                    <p className="text-xs text-neutral-400">
                                        {new Date(post.postDate).toLocaleDateString()} • {post.analytics?.views?.toLocaleString() || 0} views
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            
            {/* Chat Log */}
            <ScrollArea className="flex-grow p-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* User Question */}
                    <div className="flex justify-end">
                        <div className="bg-indigo-600/80 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%]">
                            <p className="text-sm">{analysis.question}</p>
                        </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                        <div className="bg-neutral-900/50 text-white rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] border border-neutral-800">
                            <div className="text-xs text-neutral-400 mb-1">AI Assistant</div>
                            <p className="text-sm whitespace-pre-wrap">{analysis.response}</p>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};