/**
 * Prompt Orchestration System
 * 
 * This module provides the PromptBuilder class and prompt templates for
 * constructing AI prompts with context injection for user history and preferences.
 * 
 * Requirements: 3.1, 4.2, 5.2, 10.1
 */

export interface UserContext {
  userId: string;
  pastTopics?: string[];
  preferredTone?: string;
  targetAudience?: string;
  preferences?: Record<string, any>;
}

export interface PromptOptions {
  userContext?: UserContext;
  systemPrompt?: string;
  includeExplanation?: boolean;
}

/**
 * Tone profiles for content generation
 */
export interface ToneProfile {
  name: string;
  systemPrompt: string;
  vocabulary: string[];
  sentenceStructure: string;
  examples: string[];
}

export const toneProfiles: Record<string, ToneProfile> = {
  professional: {
    name: 'Professional',
    systemPrompt: 'Write in a formal, authoritative tone. Use data and evidence. Avoid casual language.',
    vocabulary: ['leverage', 'optimize', 'strategic', 'implement', 'facilitate', 'enhance'],
    sentenceStructure: 'Complex sentences with subordinate clauses',
    examples: [
      'Organizations can leverage data-driven insights to optimize their strategic initiatives.',
      'This approach facilitates enhanced collaboration across departments.'
    ]
  },
  conversational: {
    name: 'Conversational',
    systemPrompt: 'Write in a friendly, approachable tone. Use simple language and relatable examples.',
    vocabulary: ['help', 'easy', 'simple', 'great', 'awesome', 'check out'],
    sentenceStructure: 'Short, simple sentences with occasional questions',
    examples: [
      "Let's make this super simple for you.",
      "Here's a great way to think about it."
    ]
  },
  educational: {
    name: 'Educational',
    systemPrompt: 'Write in a clear, structured, informative tone. Break down complex concepts.',
    vocabulary: ['understand', 'learn', 'concept', 'principle', 'example', 'demonstrate'],
    sentenceStructure: 'Clear topic sentences followed by supporting details',
    examples: [
      'To understand this concept, we first need to examine its core principles.',
      'Let me demonstrate this with a practical example.'
    ]
  },
  inspirational: {
    name: 'Inspirational',
    systemPrompt: 'Write in a motivational, aspirational tone. Use emotional language and vivid imagery.',
    vocabulary: ['transform', 'empower', 'achieve', 'breakthrough', 'vision', 'potential'],
    sentenceStructure: 'Varied sentence length with emphasis on powerful statements',
    examples: [
      'Your potential is limitless when you embrace the power of transformation.',
      'This is your moment to achieve the breakthrough you deserve.'
    ]
  },
  technical: {
    name: 'Technical',
    systemPrompt: 'Write in a precise, detailed, expert-level tone. Use technical terminology accurately.',
    vocabulary: ['implement', 'architecture', 'algorithm', 'protocol', 'specification', 'parameter'],
    sentenceStructure: 'Precise, detailed sentences with technical accuracy',
    examples: [
      'The algorithm implements a binary search tree with O(log n) complexity.',
      'This protocol specification defines the parameter constraints for API requests.'
    ]
  }
};

/**
 * PromptBuilder class for constructing AI prompts with context injection
 */
export class PromptBuilder {
  private systemPrompt: string = '';
  private userContext?: UserContext;
  private taskPrompt: string = '';
  private includeExplanation: boolean = true;

  /**
   * Set the system prompt that defines AI role and behavior
   */
  setSystemPrompt(prompt: string): this {
    this.systemPrompt = prompt;
    return this;
  }

  /**
   * Inject user context (history, preferences) into the prompt
   */
  setUserContext(context: UserContext): this {
    this.userContext = context;
    return this;
  }

  /**
   * Set the main task-specific prompt
   */
  setTaskPrompt(prompt: string): this {
    this.taskPrompt = prompt;
    return this;
  }

  /**
   * Control whether to request explanations in the response
   */
  setIncludeExplanation(include: boolean): this {
    this.includeExplanation = include;
    return this;
  }

  /**
   * Build the complete prompt with all components
   */
  build(): string {
    const parts: string[] = [];

    // Add system prompt
    if (this.systemPrompt) {
      parts.push(this.systemPrompt);
      parts.push('');
    }

    // Add user context
    if (this.userContext) {
      parts.push('User Context:');
      if (this.userContext.pastTopics && this.userContext.pastTopics.length > 0) {
        parts.push(`- Past successful topics: ${this.userContext.pastTopics.join(', ')}`);
      }
      if (this.userContext.preferredTone) {
        parts.push(`- Preferred tone: ${this.userContext.preferredTone}`);
      }
      if (this.userContext.targetAudience) {
        parts.push(`- Target audience: ${this.userContext.targetAudience}`);
      }
      parts.push('');
    }

    // Add task prompt
    if (this.taskPrompt) {
      parts.push(this.taskPrompt);
      parts.push('');
    }

    // Add explanation requirement
    if (this.includeExplanation) {
      parts.push('IMPORTANT: Include clear explanations and rationale for all suggestions.');
    }

    return parts.join('\n');
  }

  /**
   * Reset the builder to initial state
   */
  reset(): this {
    this.systemPrompt = '';
    this.userContext = undefined;
    this.taskPrompt = '';
    this.includeExplanation = true;
    return this;
  }
}

/**
 * Prompt template for idea generation
 */
export function buildIdeaGenerationPrompt(
  topic: string,
  context: UserContext,
  count: number = 5
): string {
  const builder = new PromptBuilder();
  
  const systemPrompt = `You are an AI content co-pilot helping creators generate ideas.
Your role is to provide creative, relevant, and actionable content ideas that resonate with the target audience.`;

  const taskPrompt = `Task: Generate ${count} diverse content ideas about "${topic}".

For each idea:
1. Provide a compelling title (max 100 characters)
2. Write a 2-sentence description
3. Explain why this idea would resonate with the audience

Format your response as a JSON array with this structure:
[
  {
    "title": "Idea title",
    "description": "Two-sentence description",
    "rationale": "Explanation of why this resonates"
  }
]`;

  return builder
    .setSystemPrompt(systemPrompt)
    .setUserContext(context)
    .setTaskPrompt(taskPrompt)
    .setIncludeExplanation(true)
    .build();
}

/**
 * Prompt template for content refinement
 */
export function buildRefinementPrompt(
  originalContent: string,
  userRequest: string,
  tone?: string
): string {
  const builder = new PromptBuilder();
  
  let systemPrompt = `You are an AI content co-pilot helping refine content.
Your role is to suggest improvements while preserving the creator's voice and intent.`;

  // Add tone-specific guidance if provided
  if (tone && toneProfiles[tone]) {
    systemPrompt += `\n\n${toneProfiles[tone].systemPrompt}`;
  }

  const taskPrompt = `Original Content:
${originalContent}

User Request: ${userRequest}

Task: Suggest improvements while preserving the creator's voice and intent.

Provide:
1. Specific suggestions with context
2. Explanation for each suggestion
3. Expected impact on engagement

Maintain the creator's core message and style.

Format your response as JSON:
{
  "suggestions": [
    {
      "content": "Improved version",
      "explanation": "Why this is better",
      "impact": "Expected improvement"
    }
  ]
}`;

  return builder
    .setSystemPrompt(systemPrompt)
    .setTaskPrompt(taskPrompt)
    .setIncludeExplanation(true)
    .build();
}

/**
 * Prompt template for content expansion
 */
export function buildExpansionPrompt(
  currentContent: string,
  expansionPoint: string,
  tone?: string
): string {
  const builder = new PromptBuilder();
  
  let systemPrompt = `You are an AI content co-pilot helping expand content.
Your role is to generate additional content that maintains tone and style consistency.`;

  if (tone && toneProfiles[tone]) {
    systemPrompt += `\n\n${toneProfiles[tone].systemPrompt}`;
  }

  const taskPrompt = `Current Content:
${currentContent}

Expansion Point: ${expansionPoint}

Task: Generate additional content that expands on the specified point while maintaining tone and style consistency.

Provide:
1. The expanded content
2. Explanation of how it enhances the original
3. How it maintains consistency

Format your response as JSON:
{
  "expandedContent": "The new content to add",
  "explanation": "How this enhances the original",
  "consistency": "How tone and style are maintained"
}`;

  return builder
    .setSystemPrompt(systemPrompt)
    .setTaskPrompt(taskPrompt)
    .setIncludeExplanation(true)
    .build();
}

/**
 * Prompt template for content repurposing
 */
export function buildRepurposingPrompt(
  sourceContent: string,
  targetPlatform: string,
  platformConstraints: {
    maxLength: number;
    structure: string;
    conventions: string[];
  }
): string {
  const builder = new PromptBuilder();
  
  const systemPrompt = `You are an AI content co-pilot transforming content for different platforms.
Your role is to adapt content while preserving the core message and intent.`;

  const taskPrompt = `Source Content:
${sourceContent}

Target Platform: ${targetPlatform}

Platform Constraints:
- Max length: ${platformConstraints.maxLength} ${platformConstraints.maxLength > 500 ? 'words' : 'characters'}
- Structure: ${platformConstraints.structure}
- Conventions: ${platformConstraints.conventions.join(', ')}

Task: Transform the content while preserving the core message.

Provide:
1. Repurposed content that fits platform constraints
2. List of changes made
3. Explanation for each transformation

Format your response as JSON:
{
  "repurposedContent": "The transformed content",
  "changes": [
    {
      "type": "length|structure|style|formatting",
      "description": "What changed",
      "rationale": "Why this change was necessary"
    }
  ],
  "explanation": "Overall transformation strategy"
}`;

  return builder
    .setSystemPrompt(systemPrompt)
    .setTaskPrompt(taskPrompt)
    .setIncludeExplanation(true)
    .build();
}

/**
 * Prompt template for content optimization suggestions
 */
export function buildOptimizationPrompt(
  content: string,
  scoreBreakdown: {
    clarity: number;
    structure: number;
    toneConsistency: number;
    platformFit: number;
    readability: number;
  }
): string {
  const builder = new PromptBuilder();
  
  const systemPrompt = `You are an AI content co-pilot providing optimization suggestions.
Your role is to analyze content and provide specific, actionable recommendations for improvement.`;

  // Identify weak areas (score < 60)
  const weakAreas = Object.entries(scoreBreakdown)
    .filter(([_, score]) => score < 60)
    .map(([area, score]) => `${area}: ${score}/100`);

  const taskPrompt = `Content to Optimize:
${content}

Current Score Breakdown:
${Object.entries(scoreBreakdown).map(([area, score]) => `- ${area}: ${score}/100`).join('\n')}

${weakAreas.length > 0 ? `Weak Areas Requiring Attention:\n${weakAreas.join('\n')}` : 'All areas are performing well, but there is room for improvement.'}

Task: Provide specific, actionable optimization suggestions.

For each suggestion:
1. Identify the specific issue
2. Provide a concrete recommendation
3. Explain why this will improve the content
4. Estimate the impact (high/medium/low)

Format your response as JSON:
{
  "suggestions": [
    {
      "category": "clarity|structure|toneConsistency|platformFit|readability",
      "description": "Specific issue identified",
      "recommendation": "Concrete action to take",
      "explanation": "Why this improves the content",
      "impact": "high|medium|low"
    }
  ]
}`;

  return builder
    .setSystemPrompt(systemPrompt)
    .setTaskPrompt(taskPrompt)
    .setIncludeExplanation(true)
    .build();
}

/**
 * Get tone profile by name
 */
export function getToneProfile(toneName: string): ToneProfile | undefined {
  return toneProfiles[toneName];
}

/**
 * Get all available tone profiles
 */
export function getAllToneProfiles(): ToneProfile[] {
  return Object.values(toneProfiles);
}
