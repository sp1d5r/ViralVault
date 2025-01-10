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
                        doc.postIds.forEach(postId => {
                            FirebaseDatabaseService.getDocument<PostContext>(
                                'posts',
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
        return <div className="flex items-center justify-center h-screen dark:text-white">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-zinc-900">
            {/* Context Posts Section */}
            <div className="border-b border-zinc-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-3">Context Posts</h2>
                <ScrollArea className="h-[200px] w-full rounded-md">
                    <div className="flex gap-4 pb-4">
                        {posts.map((post) => (
                            <div key={post.id} className="flex-shrink-0 w-[300px] bg-zinc-800 rounded-lg p-4">
                                <h3 className="text-white font-medium">{post.title}</h3>
                                {/* Add more post details as needed */}
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
                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%]">
                            <p>{analysis.question}</p>
                        </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                        <div className="bg-zinc-800 text-white rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%]">
                            <div className="text-xs text-zinc-400 mb-1">AI Assistant</div>
                            <p className="whitespace-pre-wrap">{analysis.response}</p>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};