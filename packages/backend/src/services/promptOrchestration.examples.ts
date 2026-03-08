/**
 * Prompt Orchestration System - Usage Examples
 * 
 * This file demonstrates how to use the prompt orchestration system
 * for various AI operations in ContentOS.
 */

import {
  PromptBuilder,
  UserContext,
  buildIdeaGenerationPrompt,
  buildRefinementPrompt,
  buildExpansionPrompt,
  buildRepurposingPrompt,
  buildOptimizationPrompt,
  getToneProfile,
  getAllToneProfiles
} from './promptOrchestration';

/**
 * Example 1: Building a custom prompt with PromptBuilder
 */
export function example1_CustomPromptBuilder() {
  const builder = new PromptBuilder();
  
  const userContext: UserContext = {
    userId: 'user-123',
    pastTopics: ['AI', 'Machine Learning', 'Data Science'],
    preferredTone: 'professional',
    targetAudience: 'tech professionals'
  };

  const prompt = builder
    .setSystemPrompt('You are an AI content assistant specializing in technical writing.')
    .setUserContext(userContext)
    .setTaskPrompt('Generate a blog post outline about neural networks.')
    .setIncludeExplanation(true)
    .build();

  console.log('Custom Prompt:', prompt);
  return prompt;
}

/**
 * Example 2: Generating content ideas with context
 */
export function example2_IdeaGeneration() {
  const userContext: UserContext = {
    userId: 'user-456',
    pastTopics: ['Productivity', 'Remote Work', 'Team Collaboration'],
    preferredTone: 'conversational',
    targetAudience: 'startup founders and remote teams'
  };

  const prompt = buildIdeaGenerationPrompt(
    'Building High-Performance Remote Teams',
    userContext,
    7 // Generate 7 ideas instead of default 5
  );

  console.log('Idea Generation Prompt:', prompt);
  return prompt;
}

/**
 * Example 3: Refining content with tone specification
 */
export function example3_ContentRefinement() {
  const originalContent = `
    Remote work is becoming more popular. Many companies are adopting it.
    It has benefits like flexibility and cost savings. But there are also
    challenges like communication and collaboration.
  `;

  const userRequest = 'Make this more engaging and add specific examples';
  const tone = 'professional';

  const prompt = buildRefinementPrompt(originalContent, userRequest, tone);

  console.log('Refinement Prompt:', prompt);
  return prompt;
}

/**
 * Example 4: Expanding content on a specific point
 */
export function example4_ContentExpansion() {
  const currentContent = `
    Artificial Intelligence is transforming healthcare in unprecedented ways.
    From diagnostic tools to personalized treatment plans, AI is making
    healthcare more efficient and effective.
  `;

  const expansionPoint = 'Provide specific examples of AI diagnostic tools and their impact';
  const tone = 'educational';

  const prompt = buildExpansionPrompt(currentContent, expansionPoint, tone);

  console.log('Expansion Prompt:', prompt);
  return prompt;
}

/**
 * Example 5: Repurposing blog post to Twitter thread
 */
export function example5_RepurposeToTwitter() {
  const blogPost = `
    The Future of AI in Healthcare
    
    Artificial intelligence is revolutionizing healthcare delivery. Machine learning
    algorithms can now detect diseases earlier and more accurately than traditional
    methods. AI-powered diagnostic tools analyze medical images with superhuman
    precision, identifying patterns that human doctors might miss.
    
    Personalized medicine is another frontier where AI excels. By analyzing genetic
    data, lifestyle factors, and medical history, AI systems can recommend tailored
    treatment plans for individual patients. This approach leads to better outcomes
    and fewer side effects.
    
    The integration of AI in healthcare isn't without challenges. Data privacy,
    algorithmic bias, and the need for human oversight remain critical concerns.
    However, the potential benefits far outweigh the risks when implemented responsibly.
  `;

  const prompt = buildRepurposingPrompt(
    blogPost,
    'Twitter Thread',
    {
      maxLength: 280,
      structure: 'Thread of 5-7 tweets',
      conventions: [
        'Start with a hook',
        'Use thread numbering (1/7, 2/7, etc.)',
        'Include relevant hashtags',
        'End with a call-to-action'
      ]
    }
  );

  console.log('Repurposing to Twitter Prompt:', prompt);
  return prompt;
}

/**
 * Example 6: Repurposing blog post to LinkedIn article
 */
export function example6_RepurposeToLinkedIn() {
  const blogPost = `
    5 Productivity Hacks for Remote Workers
    
    Working from home requires discipline and the right strategies...
  `;

  const prompt = buildRepurposingPrompt(
    blogPost,
    'LinkedIn Article',
    {
      maxLength: 1000,
      structure: 'Professional article with clear sections',
      conventions: [
        'Professional tone',
        'Include personal insights',
        'Use bullet points for readability',
        'Add relevant industry hashtags'
      ]
    }
  );

  console.log('Repurposing to LinkedIn Prompt:', prompt);
  return prompt;
}

/**
 * Example 7: Optimizing content with score breakdown
 */
export function example7_ContentOptimization() {
  const content = `
    AI is good. It helps with many things. Companies use it. It makes work easier.
    People like it because it saves time. AI is the future. Everyone should learn about it.
  `;

  const scoreBreakdown = {
    clarity: 45,        // Low - vague statements
    structure: 30,      // Low - no clear structure
    toneConsistency: 55, // Medium - inconsistent
    platformFit: 50,    // Medium - generic
    readability: 40     // Low - too simplistic
  };

  const prompt = buildOptimizationPrompt(content, scoreBreakdown);

  console.log('Optimization Prompt:', prompt);
  return prompt;
}

/**
 * Example 8: Working with tone profiles
 */
export function example8_ToneProfiles() {
  // Get a specific tone profile
  const professionalTone = getToneProfile('professional');
  console.log('Professional Tone:', professionalTone);

  // Get all available tones
  const allTones = getAllToneProfiles();
  console.log('Available Tones:', allTones.map(t => t.name));

  // Use tone profile in content generation
  if (professionalTone) {
    const builder = new PromptBuilder();
    const prompt = builder
      .setSystemPrompt(professionalTone.systemPrompt)
      .setTaskPrompt('Write about quarterly business results')
      .build();
    
    console.log('Prompt with Professional Tone:', prompt);
  }
}

/**
 * Example 9: Chaining multiple operations
 */
export function example9_ChainingOperations() {
  const userContext: UserContext = {
    userId: 'user-789',
    pastTopics: ['Technology', 'Innovation'],
    preferredTone: 'inspirational',
    targetAudience: 'entrepreneurs'
  };

  // Step 1: Generate ideas
  const ideaPrompt = buildIdeaGenerationPrompt('Future of Work', userContext);
  
  // Step 2: After selecting an idea, expand on it
  const selectedIdea = 'How AI is reshaping the workplace';
  const expansionPrompt = buildExpansionPrompt(
    selectedIdea,
    'Discuss specific examples and their impact on employees',
    'inspirational'
  );

  // Step 3: Refine the expanded content
  const draftContent = 'AI is changing how we work...';
  const refinementPrompt = buildRefinementPrompt(
    draftContent,
    'Add more emotional appeal and concrete examples',
    'inspirational'
  );

  console.log('Chained Operations:');
  console.log('1. Idea Generation:', ideaPrompt.substring(0, 100) + '...');
  console.log('2. Expansion:', expansionPrompt.substring(0, 100) + '...');
  console.log('3. Refinement:', refinementPrompt.substring(0, 100) + '...');
}

/**
 * Example 10: Reusing builder for multiple prompts
 */
export function example10_ReusingBuilder() {
  const builder = new PromptBuilder();
  
  const userContext: UserContext = {
    userId: 'user-999',
    preferredTone: 'technical'
  };

  // First prompt
  const prompt1 = builder
    .setSystemPrompt('You are a technical writer')
    .setUserContext(userContext)
    .setTaskPrompt('Explain REST APIs')
    .build();

  // Reset and create second prompt
  const prompt2 = builder
    .reset()
    .setSystemPrompt('You are a technical writer')
    .setUserContext(userContext)
    .setTaskPrompt('Explain GraphQL')
    .build();

  console.log('Prompt 1:', prompt1.substring(0, 100) + '...');
  console.log('Prompt 2:', prompt2.substring(0, 100) + '...');
}

/**
 * Example 11: Minimal context usage
 */
export function example11_MinimalContext() {
  // Sometimes you may not have full user context
  const minimalContext: UserContext = {
    userId: 'new-user-001'
  };

  const prompt = buildIdeaGenerationPrompt('Getting Started with AI', minimalContext);
  
  console.log('Prompt with Minimal Context:', prompt);
  return prompt;
}

/**
 * Example 12: Integration with AI service
 * (Pseudo-code showing how this would be used with an actual LLM)
 */
export async function example12_IntegrationWithAI() {
  // This is pseudo-code to demonstrate integration
  
  const userContext: UserContext = {
    userId: 'user-123',
    pastTopics: ['AI', 'Technology'],
    preferredTone: 'conversational'
  };

  // Build the prompt
  const prompt = buildIdeaGenerationPrompt('AI Ethics', userContext, 5);

  // Send to LLM (pseudo-code)
  // const response = await llmService.complete(prompt);
  // const ideas = JSON.parse(response);
  
  console.log('Prompt ready for LLM:', prompt);
  
  // Expected response format:
  const expectedResponse = [
    {
      title: 'The Bias Problem in AI Systems',
      description: 'Exploring how unconscious bias gets encoded into AI algorithms and what we can do about it.',
      rationale: 'This topic resonates because it addresses a critical concern in AI development that affects real people.'
    },
    // ... 4 more ideas
  ];

  return expectedResponse;
}

// Export all examples for easy testing
export const examples = {
  example1_CustomPromptBuilder,
  example2_IdeaGeneration,
  example3_ContentRefinement,
  example4_ContentExpansion,
  example5_RepurposeToTwitter,
  example6_RepurposeToLinkedIn,
  example7_ContentOptimization,
  example8_ToneProfiles,
  example9_ChainingOperations,
  example10_ReusingBuilder,
  example11_MinimalContext,
  example12_IntegrationWithAI
};

/**
 * Run all examples (for demonstration purposes)
 */
export function runAllExamples() {
  console.log('=== Prompt Orchestration Examples ===\n');
  
  Object.entries(examples).forEach(([name, exampleFn]) => {
    console.log(`\n--- ${name} ---`);
    try {
      exampleFn();
    } catch (error) {
      console.error(`Error in ${name}:`, error);
    }
  });
}

// Uncomment to run examples:
// runAllExamples();
