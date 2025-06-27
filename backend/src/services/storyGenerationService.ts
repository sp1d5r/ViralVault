import { ClaudeService, PostContext, FirebaseDatabaseService } from 'shared';
import { z } from 'zod';

// Define the story slide response schema
const storySlideResponseSchema = z.object({
  title: z.string(),
  slides: z.array(z.object({
    slideNumber: z.number(),
    slideType: z.string(),
    title: z.string(),
    content: z.string(),
    dataPoints: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional()
  })),
  summary: z.string(),
  keyInsights: z.array(z.string()),
  nextSteps: z.array(z.string())
});

export interface StoryGenerationRequest {
  slideType: 'growth' | 'content-evolution' | 'viral-moments' | 'audience-insights' | 'success-patterns' | 'performance-comparison' | 'roi-demonstration' | 'future-strategy';
  posts: PostContext[];
  targetAudience: 'personal' | 'clients' | 'stakeholders' | 'team';
  tone: 'professional' | 'casual' | 'inspirational';
  focusAreas: string[];
  slideCount: number;
  userId: string;
}

interface SystemPromptDocument {
  id?: string;
  userId: string;
  name: string;
  description: string;
  category: 'app-context' | 'story-generation' | 'custom';
  content: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export const generateStorySlides = async (
  request: StoryGenerationRequest
): Promise<z.infer<typeof storySlideResponseSchema>> => {
  try {
    const claude = new ClaudeService({
      apiKey: process.env.CLAUDE_API_KEY as string,
    });

    // Fetch user's custom system prompts
    const userPrompts = await new Promise<SystemPromptDocument[]>((resolve, reject) => {
      FirebaseDatabaseService.queryDocuments<SystemPromptDocument>(
        'system-prompts',
        'userId',
        'createdAt',
        request.userId,
        (prompts) => {
          if (prompts) {
            resolve(prompts);
          } else {
            resolve([]);
          }
        },
        (error) => {
          console.error('Error fetching user prompts:', error);
          reject(error);
        }
      );
    });

    // Get active prompts by category
    const activePrompts = userPrompts.filter(p => p.isActive);
    const appContextPrompt = activePrompts.find(p => p.category === 'app-context');
    const storyGenerationPrompt = activePrompts.find(p => p.category === 'story-generation');

    // Use custom prompts if available, otherwise fall back to defaults
    const systemPrompt = appContextPrompt?.content || `You are an expert content strategist and data storyteller working with ViralVault. Generate compelling, narrative-driven slides that transform social media data into engaging business stories.`;
    const storyPrompt = storyGenerationPrompt?.content || `Generate a compelling story presentation based on the available data. Structure it as a narrative journey that will resonate with the target audience and achieve the creator's business goals.`;

    const response = await claude.query(
      [{
        role: "user",
        content: [{
          type: "text",
          text: `
${systemPrompt}

${storyPrompt}

## Story Generation Request

**Slide Type:** ${request.slideType}
**Target Audience:** ${request.targetAudience}
**Tone:** ${request.tone}
**Focus Areas:** ${request.focusAreas.join(', ')}
**Number of Slides:** ${request.slideCount}

**Available Post Data:**
${JSON.stringify(request.posts, null, 2)}

Please generate a compelling story presentation based on the available data. Structure it as a narrative journey that will resonate with the target audience and achieve the creator's business goals.

The response should be structured as a JSON object with the following format:
{
  "title": "Compelling presentation title",
  "slides": [
    {
      "slideNumber": 1,
      "slideType": "title",
      "title": "Slide title",
      "content": "Slide content with narrative and data insights",
      "dataPoints": ["Key data point 1", "Key data point 2"],
      "recommendations": ["Action item 1", "Action item 2"]
    }
  ],
  "summary": "Brief summary of the story",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "nextSteps": ["Next step 1", "Next step 2"]
}
          `
        }]
      }],
      storySlideResponseSchema,
      "You are an expert content strategist and data storyteller working with ViralVault. Generate compelling, narrative-driven slides that transform social media data into engaging business stories."
    );

    return response;
  } catch (error) {
    console.error('Story generation error:', error);
    throw new Error('Failed to generate story slides');
  }
}; 