# Prompt Orchestration System

## Overview

The Prompt Orchestration System is a core component of ContentOS that provides structured prompt construction for AI operations. It implements the design requirements for prompt templates, context injection, and tone control.

**Requirements Addressed:** 3.1, 4.2, 5.2, 10.1

## Features

- **PromptBuilder Class**: Fluent API for constructing prompts with system prompts, user context, and task-specific instructions
- **Prompt Templates**: Pre-built templates for common operations (idea generation, refinement, expansion, repurposing, optimization)
- **Context Injection**: Automatic injection of user history, preferences, and past topics
- **Tone Profiles**: Five predefined tone profiles (professional, conversational, educational, inspirational, technical)
- **Explanation Requirements**: Built-in support for requesting AI explanations and rationale

## Architecture

```
PromptBuilder
├── System Prompt (AI role and behavior)
├── User Context (history, preferences, audience)
├── Task Prompt (specific operation instructions)
└── Explanation Requirement (request for rationale)
```

## Core Components

### PromptBuilder

The `PromptBuilder` class provides a fluent interface for constructing prompts:

```typescript
const builder = new PromptBuilder();

const prompt = builder
  .setSystemPrompt('You are an AI content assistant')
  .setUserContext(userContext)
  .setTaskPrompt('Generate content ideas')
  .setIncludeExplanation(true)
  .build();
```

**Methods:**
- `setSystemPrompt(prompt: string)`: Define AI role and behavior
- `setUserContext(context: UserContext)`: Inject user history and preferences
- `setTaskPrompt(prompt: string)`: Set the specific task instructions
- `setIncludeExplanation(include: boolean)`: Control explanation requirement
- `build()`: Construct the final prompt
- `reset()`: Reset builder to initial state

### Prompt Templates

Pre-built templates for common operations:

#### 1. Idea Generation
```typescript
buildIdeaGenerationPrompt(topic: string, context: UserContext, count?: number)
```
Generates content ideas based on topic and user context.

#### 2. Content Refinement
```typescript
buildRefinementPrompt(originalContent: string, userRequest: string, tone?: string)
```
Suggests improvements while preserving creator's voice.

#### 3. Content Expansion
```typescript
buildExpansionPrompt(currentContent: string, expansionPoint: string, tone?: string)
```
Expands content at specific points while maintaining consistency.

#### 4. Content Repurposing
```typescript
buildRepurposingPrompt(
  sourceContent: string,
  targetPlatform: string,
  platformConstraints: { maxLength, structure, conventions }
)
```
Transforms content for different platforms while preserving core message.

#### 5. Content Optimization
```typescript
buildOptimizationPrompt(content: string, scoreBreakdown: ScoreBreakdown)
```
Provides actionable optimization suggestions based on score analysis.

### Tone Profiles

Five predefined tone profiles for content generation:

| Tone | Description | Use Cases |
|------|-------------|-----------|
| **Professional** | Formal, authoritative, data-driven | Business reports, white papers, corporate communications |
| **Conversational** | Friendly, approachable, relatable | Blog posts, social media, newsletters |
| **Educational** | Clear, structured, informative | Tutorials, how-to guides, documentation |
| **Inspirational** | Motivational, aspirational, emotional | Keynotes, vision statements, motivational content |
| **Technical** | Precise, detailed, expert-level | Technical documentation, API guides, specifications |

**Access Tone Profiles:**
```typescript
// Get specific tone
const profile = getToneProfile('professional');

// Get all tones
const allProfiles = getAllToneProfiles();
```

### User Context

The `UserContext` interface captures user-specific information for personalization:

```typescript
interface UserContext {
  userId: string;
  pastTopics?: string[];        // Topics user has written about
  preferredTone?: string;        // Default tone preference
  targetAudience?: string;       // Intended audience
  preferences?: Record<string, any>; // Additional preferences
}
```

## Usage Examples

### Example 1: Generate Content Ideas

```typescript
import { buildIdeaGenerationPrompt, UserContext } from './promptOrchestration';

const userContext: UserContext = {
  userId: 'user-123',
  pastTopics: ['AI', 'Machine Learning'],
  preferredTone: 'professional',
  targetAudience: 'tech professionals'
};

const prompt = buildIdeaGenerationPrompt('AI in Healthcare', userContext, 5);

// Send prompt to LLM
const response = await llmService.complete(prompt);
const ideas = JSON.parse(response);
```

### Example 2: Refine Content with Tone

```typescript
import { buildRefinementPrompt } from './promptOrchestration';

const originalContent = 'AI is transforming healthcare...';
const userRequest = 'Make it more engaging and add examples';
const tone = 'conversational';

const prompt = buildRefinementPrompt(originalContent, userRequest, tone);

const response = await llmService.complete(prompt);
const suggestions = JSON.parse(response);
```

### Example 3: Repurpose Blog to Twitter

```typescript
import { buildRepurposingPrompt } from './promptOrchestration';

const blogPost = 'Long blog post content...';

const prompt = buildRepurposingPrompt(
  blogPost,
  'Twitter Thread',
  {
    maxLength: 280,
    structure: 'Thread of 5-7 tweets',
    conventions: ['Use hashtags', 'Start with hook', 'End with CTA']
  }
);

const response = await llmService.complete(prompt);
const twitterThread = JSON.parse(response);
```

### Example 4: Custom Prompt with Builder

```typescript
import { PromptBuilder, UserContext } from './promptOrchestration';

const builder = new PromptBuilder();
const userContext: UserContext = {
  userId: 'user-456',
  preferredTone: 'educational'
};

const prompt = builder
  .setSystemPrompt('You are an expert educator')
  .setUserContext(userContext)
  .setTaskPrompt('Explain quantum computing to beginners')
  .setIncludeExplanation(true)
  .build();

const response = await llmService.complete(prompt);
```

## Response Formats

All prompt templates request structured JSON responses for easy parsing:

### Idea Generation Response
```json
[
  {
    "title": "Idea title",
    "description": "Two-sentence description",
    "rationale": "Why this resonates with audience"
  }
]
```

### Refinement Response
```json
{
  "suggestions": [
    {
      "content": "Improved version",
      "explanation": "Why this is better",
      "impact": "Expected improvement"
    }
  ]
}
```

### Repurposing Response
```json
{
  "repurposedContent": "Transformed content",
  "changes": [
    {
      "type": "length|structure|style|formatting",
      "description": "What changed",
      "rationale": "Why this change was necessary"
    }
  ],
  "explanation": "Overall transformation strategy"
}
```

### Optimization Response
```json
{
  "suggestions": [
    {
      "category": "clarity|structure|toneConsistency|platformFit|readability",
      "description": "Specific issue",
      "recommendation": "Concrete action",
      "explanation": "Why this improves content",
      "impact": "high|medium|low"
    }
  ]
}
```

## Integration with AI Service

The prompt orchestration system is designed to work with any LLM service:

```typescript
// Example integration
import { buildIdeaGenerationPrompt } from './promptOrchestration';
import { llmService } from './llmService';

async function generateIdeas(topic: string, userId: string) {
  // Get user context from database
  const userContext = await getUserContext(userId);
  
  // Build prompt
  const prompt = buildIdeaGenerationPrompt(topic, userContext);
  
  // Send to LLM
  const response = await llmService.complete(prompt);
  
  // Parse response
  const ideas = JSON.parse(response);
  
  return ideas;
}
```

## Caching Strategy

Prompts can be cached to reduce redundant API calls:

```typescript
import { buildIdeaGenerationPrompt } from './promptOrchestration';
import { redis } from './cache';

async function getCachedPrompt(key: string, builder: () => string) {
  // Check cache
  const cached = await redis.get(key);
  if (cached) return cached;
  
  // Build and cache
  const prompt = builder();
  await redis.setex(key, 3600, prompt); // 1 hour TTL
  
  return prompt;
}

// Usage
const prompt = await getCachedPrompt(
  `prompt:idea:${userId}:${topic}`,
  () => buildIdeaGenerationPrompt(topic, userContext)
);
```

## Testing

The system includes comprehensive unit tests covering:

- PromptBuilder functionality
- All prompt templates
- Tone profile management
- Context injection
- Explanation requirements
- Edge cases and error handling

Run tests:
```bash
npm test promptOrchestration
```

## Best Practices

1. **Always Include Context**: Provide user context when available for better personalization
2. **Use Appropriate Tones**: Match tone to content type and audience
3. **Request Explanations**: Always include explanations for transparency (Requirement 10.1)
4. **Cache Prompts**: Cache system prompts and user context to reduce API calls
5. **Validate Responses**: Always validate and parse LLM responses before using
6. **Handle Errors**: Implement proper error handling for malformed responses
7. **Reset Builder**: Reset PromptBuilder when reusing for multiple prompts

## Future Enhancements

Potential improvements for future iterations:

- Custom tone profile creation
- Multi-language support
- Prompt versioning and A/B testing
- Advanced context retrieval from vector database
- Prompt optimization based on feedback
- Template customization per user

## Related Documentation

- [AI Copilot Service](./aiCopilotService.md)
- [LLM Client Configuration](../config/README.md)
- [Content Service](./contentService.ts)
- [Design Document](../../../../design.md)

## Support

For questions or issues with the prompt orchestration system:
1. Check the examples file: `promptOrchestration.examples.ts`
2. Review the test file: `promptOrchestration.test.ts`
3. Consult the design document for requirements context
