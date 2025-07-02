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
    caption: z.string(), // TikTok-style overlay caption
    imagePrompt: z.string(),
    dataPoints: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional()
  })),
  summary: z.string(),
  keyInsights: z.array(z.string()),
  nextSteps: z.array(z.string())
});

export interface StoryGenerationRequest {
  slideType: 'relationship-drama' | 'personal-growth' | 'celebrity-story' | 'life-transformation' | 'social-commentary' | 'humorous-tale' | 'inspirational-journey' | 'drama-series';
  posts: PostContext[];
  targetAudience: 'personal' | 'clients' | 'stakeholders' | 'team';
  tone: 'professional' | 'casual' | 'inspirational';
  focusAreas: string[];
  slideCount: number;
  userId: string;
  storyConcept?: string; // Optional custom story concept
  // Image customization options
  imageStyle: 'realistic' | 'cartoon' | 'anime' | 'minimalist' | '3d-render' | 'watercolor' | 'digital-art';
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '3:2';
  characterStyle?: string; // Optional: "looks like [actress/actor name]" or "character design"
  colorScheme?: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'monochrome';
  captionPrompt?: string; // Optional: custom prompt for overlay caption style
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
${request.storyConcept ? `**Custom Story Concept:** ${request.storyConcept}` : ''}

**Image Customization:**
- **Style:** ${request.imageStyle}
- **Aspect Ratio:** ${request.aspectRatio}
- **Color Scheme:** ${request.colorScheme || 'neutral'}
${request.characterStyle ? `- **Character Style:** ${request.characterStyle}` : ''}

**Available Post Data:**
${JSON.stringify(request.posts, null, 2)}

Please generate a compelling social media story presentation that will engage viewers and drive engagement. Create a narrative that's perfect for platforms like TikTok, Instagram, or YouTube Shorts.

${request.storyConcept ? `**IMPORTANT:** Use the provided story concept as the foundation for your narrative: "${request.storyConcept}". Build the entire story around this concept while incorporating the selected slide type and focus areas.` : ''}

For each slide, create:
- A detailed image prompt that can be used in AI image generators like DALL-E, Midjourney, or Stable Diffusion. The image prompt should be:
  - Descriptive and specific for social media storytelling
  - Include the specified visual style: ${request.imageStyle}
  - Use the specified aspect ratio: ${request.aspectRatio}
  - Incorporate the color scheme: ${request.colorScheme || 'neutral'}
  ${request.characterStyle ? `- Include character styling: ${request.characterStyle}` : ''}
  - Include visual style, mood, and composition
  - Relevant to the slide content and narrative
  - Engaging and attention-grabbing for social media
  - Include specific visual elements that represent the story and characters
- A brief, punchy caption for text overlay in TikTok style. This should be 1-2 lines, designed to grab attention and drive the story forward. ${request.captionPrompt ? `Use this custom instruction for the caption style: "${request.captionPrompt}"` : 'Make it suitable for overlaying on the image, and keep it concise and impactful.'}

The response should be structured as a JSON object with the following format:
{
  "title": "Compelling social media story title",
  "slides": [
    {
      "slideNumber": 1,
      "slideType": "opening",
      "title": "Slide title",
      "content": "Slide content with narrative and story elements",
      "caption": "Brief TikTok-style overlay caption for this slide",
      "imagePrompt": "Detailed image prompt incorporating the specified style (${request.imageStyle}), aspect ratio (${request.aspectRatio}), and color scheme (${request.colorScheme || 'neutral'})${request.characterStyle ? `, with character styling: ${request.characterStyle}` : ''}",
      "dataPoints": ["Story beat 1", "Story beat 2"],
      "recommendations": ["Engagement tip 1", "Engagement tip 2"]
    }
  ],
  "summary": "Brief summary of the story",
  "keyInsights": ["Story insight 1", "Story insight 2", "Story insight 3"],
  "nextSteps": ["Next story beat 1", "Next story beat 2"]
}

IMPORTANT: Respond ONLY with valid JSON. Do not include any explanatory text, markdown formatting, or additional commentary. Your entire response must be a single JSON object that can be parsed directly. No code blocks, no extra text, just the JSON object.
          `
        }]
      }],
      storySlideResponseSchema,
      "You are an expert social media storyteller and content creator working with ViralVault. Generate compelling, narrative-driven slides that create engaging social media stories perfect for platforms like TikTok and Instagram. For each slide, create detailed image prompts that incorporate the specified visual style, aspect ratio, and color preferences for use in AI image generators. For each slide, also generate a brief, TikTok-style caption for text overlay, following any custom user instructions if provided."
    );

    return response;
  } catch (error) {
    console.error('Story generation error:', error);
    throw new Error('Failed to generate story slides');
  }
}; 