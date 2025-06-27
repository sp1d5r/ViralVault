import { Request, Response } from 'express';
import { generateStorySlides, StoryGenerationRequest } from '../services/storyGenerationService';
import { FirebaseDatabaseService, PostContext } from 'shared';

interface StoryGenerationRequestBody {
  slideType: StoryGenerationRequest['slideType'];
  postIds: string[];
  targetAudience: StoryGenerationRequest['targetAudience'];
  tone: StoryGenerationRequest['tone'];
  focusAreas: string[];
  slideCount: number;
  storyConcept?: string;
  imageStyle: StoryGenerationRequest['imageStyle'];
  aspectRatio: StoryGenerationRequest['aspectRatio'];
  characterStyle?: StoryGenerationRequest['characterStyle'];
  colorScheme?: StoryGenerationRequest['colorScheme'];
}

interface StoryDocument {
  id?: string;
  userId: string;
  slideType: string;
  targetAudience: string;
  tone: string;
  focusAreas: string[];
  slideCount: number;
  postIds: string[];
  generatedStory: any;
  timestamp: number;
}

export const generateStory = async (
  req: Request<{}, {}, StoryGenerationRequestBody>,
  res: Response
): Promise<void> => {
  try {
    const { slideType, postIds, targetAudience, tone, focusAreas, slideCount, storyConcept, imageStyle, aspectRatio, characterStyle, colorScheme } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!slideType || !postIds || !targetAudience || !tone || !focusAreas || !slideCount || !imageStyle || !aspectRatio) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }

    // Fetch the posts data
    const posts: PostContext[] = [];
    for (const postId of postIds) {
      try {
        const post = await new Promise<PostContext>((resolve, reject) => {
          FirebaseDatabaseService.getDocument<PostContext>(
            'tiktok-posts',
            postId,
            (doc) => {
              if (doc) {
                resolve(doc);
              } else {
                reject(new Error(`Post ${postId} not found`));
              }
            },
            (error) => reject(error)
          );
        });
        posts.push(post);
      } catch (error) {
        console.error(`Error fetching post ${postId}:`, error);
        res.status(400).json({ error: `Failed to fetch post ${postId}` });
        return;
      }
    }

    // Generate the story
    const storyRequest: StoryGenerationRequest = {
      slideType,
      posts,
      targetAudience,
      tone,
      focusAreas,
      slideCount,
      userId,
      storyConcept,
      imageStyle,
      aspectRatio,
      characterStyle,
      colorScheme
    };

    const generatedStory = await generateStorySlides(storyRequest);

    // Store the generated story
    const storyDoc: StoryDocument = {
      userId,
      slideType,
      targetAudience,
      tone,
      focusAreas,
      slideCount,
      postIds,
      generatedStory,
      timestamp: Date.now()
    };

    FirebaseDatabaseService.addDocument(
      'viral-vault-stories',
      storyDoc,
      (docId) => {
        res.json({
          storyId: docId,
          story: generatedStory
        });
      },
      (error) => {
        console.error('Failed to store story:', error);
        res.status(500).json({ error: 'Failed to store generated story' });
      }
    );

  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ error: 'Failed to generate story' });
  }
};

export const getStories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    FirebaseDatabaseService.queryDocuments<StoryDocument>(
      'viral-vault-stories',
      'userId',
      'timestamp',
      userId,
      (stories) => {
        if (stories && stories.length > 0) {
          // Sort by timestamp descending (newest first)
          const sortedStories = stories.sort((a, b) => b.timestamp - a.timestamp);
          res.json(sortedStories);
        } else {
          res.json([]);
        }
      },
      (error) => {
        console.error('Error fetching stories:', error);
        res.status(500).json({ error: 'Failed to fetch stories' });
      }
    );

  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Failed to get stories' });
  }
};

export const getStoryById = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    FirebaseDatabaseService.getDocument<StoryDocument>(
      'viral-vault-stories',
      id,
      (story) => {
        if (story && story.userId === userId) {
          res.json(story);
        } else {
          res.status(404).json({ error: 'Story not found' });
        }
      },
      (error) => {
        console.error('Error fetching story:', error);
        res.status(500).json({ error: 'Failed to fetch story' });
      }
    );

  } catch (error) {
    console.error('Get story by ID error:', error);
    res.status(500).json({ error: 'Failed to get story' });
  }
}; 