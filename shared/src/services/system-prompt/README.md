# SystemPromptService

The `SystemPromptService` is a centralized service that stores all the foundational information about the ViralVault app to avoid repeating it in every AI prompt. This ensures consistency and efficiency across all AI interactions.

## What It Does

Instead of writing massive text prompts every time you need to interact with an AI, this service provides:

- **App Context**: What ViralVault is, who it's for, how it works
- **Story Slide Context**: Specific guidance for generating story presentations
- **Consistent Tone**: Professional yet approachable voice across all AI interactions
- **Business Focus**: Always oriented toward helping creators grow their business

## Usage

### Basic Usage

```typescript
import { SystemPromptService } from 'shared';

// Get the full system prompt for any AI interaction
const systemPrompt = SystemPromptService.getFullSystemPrompt();

// Get specific context for story generation
const storyPrompt = SystemPromptService.getStoryGenerationPrompt();

// Get just the app context
const appContext = SystemPromptService.getAppContext();

// Get just the story slide context
const storyContext = SystemPromptService.getStorySlideContext();
```

### In AI Services

```typescript
// Example: Using in analyzeService.ts
const systemPrompt = SystemPromptService.getFullSystemPrompt();

const response = await claude.query(
  [{
    role: "user",
    content: [{
      type: "text",
      text: `
${systemPrompt}

## Current Request
User Question: ${question}
Available Data: ${JSON.stringify(context, null, 2)}

Please provide analysis based on the above context.
      `
    }]
  }],
  responseSchema,
  "You are a TikTok performance analysis expert working with ViralVault..."
);
```

### Updating Context

```typescript
// Update app context
SystemPromptService.updateAppContext({
  description: "Updated description...",
  features: ["New feature 1", "New feature 2"]
});

// Update story slide context
SystemPromptService.updateStorySlideContext({
  slideTypes: ["New slide type 1", "New slide type 2"]
});
```

## What's Included

### App Context
- App name and description
- Target audience
- Core value proposition
- Key features and benefits
- Use cases
- Technical stack
- Business model

### Story Slide Context
- Purpose and target audience
- Available slide types
- Data sources
- Customization options

### AI Guidelines
- Tone and style guidance
- Business focus areas
- User role considerations
- Actionable insights emphasis

## Benefits

1. **Consistency**: All AI interactions have the same foundational context
2. **Efficiency**: No need to repeat app information in every prompt
3. **Maintainability**: Update app information in one place
4. **Quality**: Ensures AI always understands the full context
5. **Scalability**: Easy to add new contexts for different AI use cases

## Future Enhancements

- Add more specific contexts for different AI use cases
- Include user-specific context (premium vs free users)
- Add industry-specific guidance
- Include seasonal or trending context updates 