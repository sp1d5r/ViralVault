import { ClaudeService , ContextSettings, PostContext, SystemPromptService } from 'shared';
import { z } from 'zod';

// Define the response schema
const analysisResponseSchema = z.string();

export const analyzePostsData = async (
    question: string, 
    context: PostContext[], 
    contextSettings: ContextSettings
): Promise<string> => {
    try {
        const claude = new ClaudeService({
            apiKey: process.env.CLAUDE_API_KEY as string,
        });

        const systemPrompt = SystemPromptService.getFullSystemPrompt();

        const response = await claude.query(
            [{
                role: "user",
                content: [{
                    type: "text",
                    text: `
${systemPrompt}

## Current Analysis Request

**User Question:** ${question}

**Available Data Context:**
${JSON.stringify(context, null, 2)}

**Analysis Settings:**
${JSON.stringify(contextSettings, null, 2)}

Please provide a detailed, actionable analysis based on the available data. Focus on insights that can help the creator improve their content strategy and achieve their business goals.
                    `
                }]
            }],
            analysisResponseSchema,
            "You are a TikTok performance analysis expert working with ViralVault. Analyze the data and provide specific, actionable insights that help creators grow their business."
        );

        return response;
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to analyze data');
    }
}; 