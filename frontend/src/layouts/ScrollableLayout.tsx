import React from 'react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';

export interface ScrollableLayoutProps {
    children: React.ReactNode;
}

const ScrollableLayout: React.FC<ScrollableLayoutProps> = ({ children }) => {
    return <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow overflow-auto">
        <div className="container mx-auto px-4">
            {children}
        </div>
        </main>
        <Footer />
  </div>
}

export default ScrollableLayout;
