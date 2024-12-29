import React from "react";
import ScrollableLayout from "../layouts/ScrollableLayout";
import { Button } from "../components/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/shadcn/card";
import { Badge } from "../components/shadcn/badge";
import { DataWaveBackground } from "../components/ui/hero/DataWaveBackground";

export const Landing: React.FC = () => {
  return (
    <ScrollableLayout>
      <div className="flex flex-col gap-2">   
      <div className="relative flex flex-col justify-start items-center min-h-[80vh] ">
      <DataWaveBackground
        className="absolute w-[100vw] min-h-[80vh]"
      >
        <div className="relative z-10 text-center px-4 py-16 max-w-4xl mx-auto">
          <h2 className="text-3xl max-w-4xl relative z-20 md:text-4xl lg:text-7xl font-bold text-center text-white font-sans tracking-tight">
            Turn Your Content Into{" "}
            <div className="relative mx-auto inline-block w-max [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
              <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-2 md:py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                <span className="">Viral Success</span>
              </div>
              <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500 py-2 md:py-4">
                <span className="">Viral Success</span>
              </div>
            </div>
          </h2>
          <p className="text-lg md:text-xl mb-8 dark:text-white">
            Track, analyze, and optimize your video content performance across all platforms.
            Make data-driven decisions that drive engagement.
          </p>
          <Button className="dark:text-white bg-indigo-500 hover:bg-indigo-600">
            Start free today
          </Button>
        </div>
        </DataWaveBackground>
      </div>

      <h1 className="text-2xl md:text-4xl font-bold mb-8 text-center dark:text-white my-4">
        Your all-in-one video analytics dashboard
      </h1>
      
      <div className="grid grid-cols-5 gap-4 mb-4 max-w-6xl mx-auto">
        <Card className="col-span-3 hover:border-indigo-500 ease-in-out bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle>Performance Tracking</CardTitle>
            <CardDescription>
              Track views, engagement, and growth metrics across all your video content in one place.
              <br />
              <Button variant="link" className="p-0">View metrics →</Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 border rounded p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">Video Analytics</span>
                <Badge variant="secondary">Live</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Engagement Rate</span>
                  <span>4.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg. Watch Time</span>
                  <span>2:45</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 hover:border-indigo-500 ease-in-out bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle>Content Insights</CardTitle>
            <CardDescription>
              Get detailed insights on what makes your videos perform better than others.
              <br />
              <Button variant="link" className="p-0 text-indigo-500 hover:text-indigo-600">View insights →</Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-2">
              <Badge variant="outline">Trending Topics</Badge>
              <Badge variant="outline">Best Posting Times</Badge>
              <Badge variant="outline">Audience Retention</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-4 max-w-6xl mx-auto">
        <div className="col-span-2 space-y-4">
          <Card className="hover:border-indigo-500 ease-in-out bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle>Growth Tracking</CardTitle>
              <CardDescription>
                Monitor your channel's growth with comprehensive metrics and trends analysis.
                <br/>
                <Button variant="link" className="p-0">View growth →</Button>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:border-indigo-500 ease-in-out bg-neutral-900/50 border-neutral-800">
            <CardHeader>
              <CardTitle>Smart Notifications</CardTitle>
              <CardDescription>
                Get instant alerts when your videos hit key performance milestones or need attention.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="col-span-3 hover:border-indigo-500 ease-in-out bg-neutral-900/50 border-neutral-800">
          <CardHeader>
            <CardTitle>Performance History</CardTitle>
            <CardDescription>
              Track your content's performance over time and identify what drives success.
              <br/>
              <Button variant="link" className="p-0">View history →</Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 border rounded p-4">
              <div className="text-center text-gray-500">Historical Performance Graph</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row max-w-6xl mx-auto my-16 px-4">
        <div className="w-full md:w-1/2 mb-8 md:mb-0">
            <img 
                src="https://placehold.co/400" 
                alt="Video Analytics Dashboard" 
                className="w-full aspect-square h-auto object-cover rounded-lg shadow-lg"
            />
        </div>
        <div className="w-full md:w-1/2 md:pl-8 flex flex-col justify-center dark:text-white">
            <p className="font-bold text-indigo-500">COMPREHENSIVE ANALYTICS</p>
            <h2 className="text-3xl font-bold mb-4">Make Data-Driven Content Decisions</h2>
            <p className="text-lg mb-6">
              Track every metric that matters. From views and engagement to audience retention 
              and growth patterns. Understand what works and why.
              <br/>
              <Button>Start Tracking</Button>
            </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row max-w-6xl mx-auto my-16 px-4 dark:text-white">
        <div className="w-full md:w-1/2 md:pl-8 flex flex-col justify-center">
            <p className="font-bold text-indigo-500">CONTENT OPTIMIZATION</p>
            <h2 className="text-3xl font-bold mb-4">Optimize Your Video Strategy</h2>
            <p className="text-lg mb-6">
              Get actionable insights on the best times to post, optimal video length, 
              and content themes that resonate with your audience.
              <br/>
              <Button>Learn More</Button>
            </p>
        </div>
        <div className="w-full md:w-1/2 mb-8 md:mb-0">
            <img 
                src="https://placehold.co/400" 
                alt="Content Strategy Dashboard" 
                className="w-full aspect-square h-auto object-cover rounded-lg shadow-lg"
            />
        </div>
      </div>

      <div className="relative flex items-center justify-center my-50 min-h-[20vh]">
        <div className="absolute w-[100vw] min-h-[20vh] bg-neutral-900 flex flex-col justify-center items-center">
            <h1 className="relative text-4xl font-bold m-0">
                <div className="absolute left-0 top-[1px] bg-clip-text bg-no-repeat text-transparent bg-gradient-to-r py-2 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
                    <span className="">Start tracking today</span>
                </div>
                <div className="relative bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 py-2">
                    <span className="">Start tracking today</span>
                </div>
            </h1>
            <p className="text-white mb-1">Turn your content into data-driven success</p>
            <Button variant="secondary">Get started for free</Button>
        </div>
      </div>
      </div>
    </ScrollableLayout>
  );
};