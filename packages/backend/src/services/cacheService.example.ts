/**
 * Cache Service Usage Examples
 * 
 * This file demonstrates how to use the cacheService for AI operations
 * to reduce LLM API calls and improve performance.
 */

import { cacheService } from './cacheService';

/**
 * Example 1: Caching System Prompts
 * System prompts define AI role and behavior and rarely change.
 * Cache them for 1 hour to avoid rebuilding on every request.
 */
async function exampleSystemPromptCaching() {
  const operation = 'idea_generation';
  
  // Try to get cached prompt
  let systemPrompt = await cacheService.systemPrompt.get(operation);
  
  if (!systemPrompt) {
    // Build the prompt if not cached
    systemPrompt = `
      You are an AI content co-pilot helping creators generate ideas.
      Your role is to provide creative, relevant, and actionable content ideas.
      Always explain your reasoning and tailor suggestions to the user's context.
    `;
    
    // Cache for future requests (1 hour TTL)
    await cacheService.systemPrompt.set(operation, systemPrompt);
  }
  
  return systemPrompt;
}

/**
 * Example 2: Caching User Context
 * User context includes preferences, history, and performance data.
 * Cache for 1 hour to avoid repeated database queries.
 */
async function exampleUserContextCaching(userId: string) {
  // Try to get cached user preferences
  let preferences = await cacheService.userContext.get(userId, 'preferences');
  
  if (!preferences) {
    // Fetch from database if not cached
    preferences = {
      defaultTone: 'professional',
      preferredFormats: ['blog', 'linkedin'],
      targetAudience: 'tech professionals',
    };
    
    // Cache for future requests (1 hour TTL)
    await cacheService.userContext.set(userId, 'preferences', preferences);
  }
  
  return preferences;
}

/**
 * Example 3: Caching AI Responses
 * Similar requests should return cached responses to reduce API calls.
 * Cache for 30 minutes as responses may become stale.
 */
async function exampleAIResponseCaching(userId: string, topic: string) {
  const requestParams = {
    operation: 'idea_generation',
    userId,
    topic,
    // Include all parameters that affect the response
  };
  
  // Check if we have a cached response
  let response = await cacheService.aiResponse.get(requestParams);
  
  if (!response) {
    // Make LLM API call if not cached
    response = await callLLMAPI(requestParams);
    
    // Cache the response (30 min TTL)
    await cacheService.aiResponse.set(requestParams, response);
  }
  
  return response;
}

/**
 * Example 4: Complete AI Operation with Caching
 * Demonstrates a full workflow using all cache types
 */
async function generateIdeasWithCaching(userId: string, topic: string) {
  // 1. Get cached system prompt
  const systemPrompt = await cacheService.systemPrompt.get('idea_generation') 
    || buildSystemPrompt();
  
  if (!await cacheService.systemPrompt.get('idea_generation')) {
    await cacheService.systemPrompt.set('idea_generation', systemPrompt);
  }
  
  // 2. Get cached user context
  const userContext = await cacheService.userContext.get(userId, 'preferences')
    || await fetchUserPreferences(userId);
  
  if (!await cacheService.userContext.get(userId, 'preferences')) {
    await cacheService.userContext.set(userId, 'preferences', userContext);
  }
  
  // 3. Check for cached response
  const requestParams = {
    operation: 'idea_generation',
    userId,
    topic,
    tone: userContext.defaultTone,
  };
  
  let ideas = await cacheService.aiResponse.get(requestParams);
  
  if (!ideas) {
    // Build full prompt with system prompt and user context
    const fullPrompt = `${systemPrompt}

User Context:
- Preferred tone: ${userContext.defaultTone}
- Target audience: ${userContext.targetAudience}

Task: Generate 5 content ideas about "${topic}"`;
    
    // Make LLM API call
    ideas = await callLLMAPI({ prompt: fullPrompt });
    
    // Cache the response
    await cacheService.aiResponse.set(requestParams, ideas);
  }
  
  return ideas;
}

/**
 * Example 5: Cache Invalidation
 * Invalidate caches when data changes
 */
async function exampleCacheInvalidation(userId: string) {
  // When user updates preferences, invalidate the cache
  await updateUserPreferences(userId, { defaultTone: 'conversational' });
  await cacheService.userContext.invalidate(userId, 'preferences');
  
  // When system prompts are updated, invalidate specific operation
  await cacheService.systemPrompt.invalidate('idea_generation');
  
  // When you want to force fresh AI responses for a specific request
  const requestParams = { operation: 'test', userId };
  await cacheService.aiResponse.invalidate(requestParams);
}

/**
 * Example 6: Checking Cache Existence
 * Check if a response is cached before making decisions
 */
async function exampleCacheExistence(userId: string, topic: string) {
  const requestParams = {
    operation: 'idea_generation',
    userId,
    topic,
  };
  
  const isCached = await cacheService.aiResponse.exists(requestParams);
  
  if (isCached) {
    console.log('Using cached response - no API call needed');
    return await cacheService.aiResponse.get(requestParams);
  } else {
    console.log('Cache miss - making API call');
    const response = await callLLMAPI(requestParams);
    await cacheService.aiResponse.set(requestParams, response);
    return response;
  }
}

// Mock helper functions for examples
function buildSystemPrompt(): string {
  return 'System prompt...';
}

async function fetchUserPreferences(userId: string): Promise<any> {
  return { defaultTone: 'professional' };
}

async function updateUserPreferences(userId: string, preferences: any): Promise<void> {
  // Update in database
}

async function callLLMAPI(params: any): Promise<any> {
  // Make actual LLM API call
  return { ideas: [] };
}

export {
  exampleSystemPromptCaching,
  exampleUserContextCaching,
  exampleAIResponseCaching,
  generateIdeasWithCaching,
  exampleCacheInvalidation,
  exampleCacheExistence,
};
