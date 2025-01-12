import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthenticationProvider';
import { FirebaseDatabaseService } from 'shared';
import { Link } from 'react-router-dom';

// Add interface for the Analysis document
interface AnalysisDocument {
    id: string;
    question: string;
    response: string;
    postIds: string[];
    timestamp: number;
}

const DashboardChat = () => {
    const { authState } = useAuth();
    const [chats, setChats] = useState<AnalysisDocument[]>([]);

    useEffect(() => {
        if (!authState.user?.uid) return;
        // Fetch all chat documents
        FirebaseDatabaseService.listenToQuery<AnalysisDocument>(
            'viral-vault-chats',
            "userId",
            authState.user?.uid,
            "timestamp",
            (documents) => {
                if (documents) {
                    // Sort by timestamp descending (newest first)
                    const sortedDocs = documents.sort((a, b) => b.timestamp - a.timestamp);
                    setChats(sortedDocs);
                }
            },
            (error) => console.error('Error fetching chats:', error)
        );
    }, [authState.user?.uid]);
    
    return (
        <div className="space-y-4">
            <h2 className="text-4xl font-semibold text-white mb-6">Chat History</h2>
            <div className="grid gap-4">
                {chats.map((chat) => (
                    <Link 
                        key={chat.timestamp}
                        to={`/support-chat?id=${chat.id}`}
                        className="block p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                    >
                        <div className="text-sm text-neutral-400">
                            {new Date(chat.timestamp).toLocaleString()}
                        </div>
                        <div className="text-white font-medium mt-1">
                            {chat.question}
                        </div>
                        <div className="text-sm text-neutral-400 mt-2 line-clamp-2">
                            {chat.response}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default DashboardChat;