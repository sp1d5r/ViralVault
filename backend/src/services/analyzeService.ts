import { ClaudeService } from 'shared';
import { z } from 'zod';

// Define the response schema
const analysisResponseSchema = z.string();

export const analyzePostsData = async (
    question: string, 
    context: any[], 
    contextSettings: {
        includeScripts: boolean;
        includeAnalytics: boolean;
        postHistory: number;
        analyticsTypes: {
            retention: boolean;
            views: boolean;
            engagement: boolean;
            watchTime: boolean;
        };
    }
) => {
    try {
        const claude = new ClaudeService({
            apiKey: process.env.CLAUDE_API_KEY as string,
        });

        const response = await claude.query(
            [{
                role: "user",
                content: [{
                    type: "text",
                    text: `
                        Analyzing TikTok post data with the following context:
                        ${JSON.stringify(context, null, 2)}

                        Settings used for this analysis:
                        ${JSON.stringify(contextSettings, null, 2)}

                        Question: ${question}

                        Please provide a detailed analysis based on the available data.
                    `
                }]
            }],
            analysisResponseSchema,
            "You are a TikTok performance analysis expert. Analyze the data and provide specific, actionable insights."
        );

        return response;
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to analyze data');
    }
}; 