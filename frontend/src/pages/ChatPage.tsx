import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FirebaseDatabaseService } from "shared";

export interface ChatPageProps {
}

export const ChatPage: React.FC<ChatPageProps> = () => {
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');

    useEffect(() => {
        if (id) {
            FirebaseDatabaseService.listenToDocument('viral-vault-chats', id, (doc) => {   
                console.log(doc);
            });
        }
    }, [id]);

    return <div>ChatPage</div>;
}