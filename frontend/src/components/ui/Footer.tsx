import React from 'react';
import { Button } from "../shadcn/button";
import { Input } from "../shadcn/input";
import { Facebook, Twitter, Instagram, Github, Youtube,  } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-950 z-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500">
              ViralVault
            </h3>
            <p className="text-sm text-gray-400">
              Track, analyze, and optimize your video content performance across all platforms.
            </p>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-200">Product</h4>
            <ul className="space-y-2">
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">Features</Button></li>
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">Analytics</Button></li>
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">Pricing</Button></li>
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">API</Button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-200">Resources</h4>
            <ul className="space-y-2">
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">Documentation</Button></li>
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">Help Center</Button></li>
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">Privacy Policy</Button></li>
              <li><Button variant="link" className="text-gray-400 hover:text-gray-200">Terms of Service</Button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-200">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-2">
              Get the latest updates on features and platform news.
            </p>
            <div className="flex space-x-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-neutral-900 border-neutral-800 text-gray-200 placeholder:text-gray-500 focus:border-violet-500" 
              />
              <Button className="bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-white hover:opacity-90">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ViralVault. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-gray-200 hover:bg-neutral-900"
            >
              <Youtube className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-gray-200 hover:bg-neutral-900"
            >
              <Twitter className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400 hover:text-gray-200 hover:bg-neutral-900"
            >
              <Instagram className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}