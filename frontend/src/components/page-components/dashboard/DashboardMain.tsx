import React, { useState } from 'react';
import { Button } from "../../shadcn/button";
import { Plus, Edit, Music, Share2 } from "lucide-react";
import { motion } from 'framer-motion';
import { NewPostModal } from './NewPostModal';

export interface DashboardMainProps {

}

export const DashboardMain : React.FC<DashboardMainProps> = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return <div className="w-full h-full dark:text-white flex flex-col gap-2">
        <h1 className='text-4xl font-bold '>Dashboard</h1>
        <p>Add some additional information about your features in here please.</p>

        <div className="flex justify-start items-center gap-2 flex-wrap lg:flex-no-wrap overflow-x-scroll">
            <DashboardButton icon={<Plus />} text="New Post" subtext="Create a new content entry" onClick={() => setIsModalOpen(true)} />
            <DashboardButton icon={<Edit />} text="Feature 2" subtext="Describe your second feature!" beta />
            <DashboardButton icon={<Music />} text="Feature 3" subtext="Describe your third feature!" />
            <DashboardButton icon={<Share2 />} text="Share" subtext="Post and Schedule your clips" />
        </div>

        <NewPostModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
        />
    </div>
}

interface DashboardButtonProps {
    icon: React.ReactNode;
    text: string;
    subtext: string;
    beta?: boolean;
    onClick?: () => void;
}

const DashboardButton: React.FC<DashboardButtonProps> = ({ icon, text, subtext, beta = false, onClick }) => {
    const fadeIn = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.7 }
      };

    return (
        <Button variant="outline" className="h-auto w-full justify-start text-left max-w-[300px] " onClick={onClick}>
            <motion.div {...fadeIn} className="flex items-center">
                <div className="mr-3 text-2xl">{icon}</div>
                <div>
                    <div className="font-bold flex items-center">
                        {text}
                        {beta && <span className="ml-2 px-1 py-0.5 text-xs bg-purple-600 rounded">Beta</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">{subtext}</div>
                </div>
            </motion.div>
        </Button>
    );
}
