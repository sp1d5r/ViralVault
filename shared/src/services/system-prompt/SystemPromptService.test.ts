import { SystemPromptService } from './SystemPromptService';

// Simple test to verify the service works
console.log('Testing SystemPromptService...');

const appContext = SystemPromptService.getAppContext();
console.log('App Name:', appContext.name);
console.log('App Description:', appContext.description);

const storyContext = SystemPromptService.getStorySlideContext();
console.log('Story Purpose:', storyContext.purpose);
console.log('Available Slide Types:', storyContext.slideTypes.length);

const fullPrompt = SystemPromptService.getFullSystemPrompt();
console.log('Full prompt length:', fullPrompt.length);

const storyPrompt = SystemPromptService.getStoryGenerationPrompt();
console.log('Story prompt length:', storyPrompt.length);

console.log('✅ SystemPromptService test completed successfully!'); 