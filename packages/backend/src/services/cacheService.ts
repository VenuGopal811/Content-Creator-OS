import crypto from 'crypto';
import { cache } from '../cache/redis';

/**
 * Cache Service for AI prompts and responses
 * Implements caching strategy to reduce LLM API calls
 */

// TTL constants (in seconds)
export const CACHE_TTL = {
  SYSTEM_PROMPT: 3600, // 1 hour for system prompts and user context
  AI_RESPONSE: 1800,   // 30 minutes for AI responses
} as const;

// Cache key prefixes
const CACHE_PREFIX = {
  SYSTEM_PROMPT: 'prompt:system:',
  USER_CONTEXT: 'prompt:context:',
  AI_RESPONSE: 'response:',
} as const;

/**
 * Generate a hash for cache key from request parameters
 * @param data - The data to hash
 * @returns SHA-256 hash of the data
 */
export function generateCacheKey(data: Record<string, any>): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Cache system prompts
 * System prompts define AI role and behavior and rarely change
 */
export const systemPromptCache = {
  /**
   * Get cached system prompt
   * @param operation - The operation type (e.g., 'idea_generation', 'refinement')
   * @returns Cached prompt or null
   */
  async get(operation: string): Promise<string | null> {
    const key = `${CACHE_PREFIX.SYSTEM_PROMPT}${operation}`;
    return cache.get<string>(key);
  },

  /**
   * Set system prompt in cache
   * @param operation - The operation type
   * @param prompt - The system prompt text
   */
  async set(operation: string, prompt: string): Promise<void> {
    const key = `${CACHE_PREFIX.SYSTEM_PROMPT}${operation}`;
    await cache.set(key, prompt, CACHE_TTL.SYSTEM_PROMPT);
  },

  /**
   * Invalidate system prompt cache
   * @param operation - The operation type to invalidate
   */
  async invalidate(operation: string): Promise<void> {
    const key = `${CACHE_PREFIX.SYSTEM_PROMPT}${operation}`;
    await cache.del(key);
  },
};

/**
 * Cache user context
 * User context includes history, preferences, and past performance data
 */
export const userContextCache = {
  /**
   * Get cached user context
   * @param userId - The user ID
   * @param contextType - Type of context (e.g., 'history', 'preferences')
   * @returns Cached context or null
   */
  async get(userId: string, contextType: string): Promise<any | null> {
    const key = `${CACHE_PREFIX.USER_CONTEXT}${userId}:${contextType}`;
    return cache.get(key);
  },

  /**
   * Set user context in cache
   * @param userId - The user ID
   * @param contextType - Type of context
   * @param context - The context data
   */
  async set(userId: string, contextType: string, context: any): Promise<void> {
    const key = `${CACHE_PREFIX.USER_CONTEXT}${userId}:${contextType}`;
    await cache.set(key, context, CACHE_TTL.SYSTEM_PROMPT);
  },

  /**
   * Invalidate user context cache
   * @param userId - The user ID
   * @param contextType - Optional specific context type to invalidate
   */
  async invalidate(userId: string, contextType?: string): Promise<void> {
    if (contextType) {
      const key = `${CACHE_PREFIX.USER_CONTEXT}${userId}:${contextType}`;
      await cache.del(key);
    } else {
      // Note: In production, you might want to use SCAN to find all keys
      // For now, we'll invalidate common context types
      const types = ['history', 'preferences', 'performance'];
      await Promise.all(
        types.map(type => {
          const key = `${CACHE_PREFIX.USER_CONTEXT}${userId}:${type}`;
          return cache.del(key);
        })
      );
    }
  },
};

/**
 * Cache AI responses
 * Similar requests should return cached responses to reduce API calls
 */
export const aiResponseCache = {
  /**
   * Get cached AI response
   * @param requestParams - The request parameters to hash
   * @returns Cached response or null
   */
  async get(requestParams: Record<string, any>): Promise<any | null> {
    const hash = generateCacheKey(requestParams);
    const key = `${CACHE_PREFIX.AI_RESPONSE}${hash}`;
    return cache.get(key);
  },

  /**
   * Set AI response in cache
   * @param requestParams - The request parameters to hash
   * @param response - The AI response to cache
   */
  async set(requestParams: Record<string, any>, response: any): Promise<void> {
    const hash = generateCacheKey(requestParams);
    const key = `${CACHE_PREFIX.AI_RESPONSE}${hash}`;
    await cache.set(key, response, CACHE_TTL.AI_RESPONSE);
  },

  /**
   * Check if a response is cached
   * @param requestParams - The request parameters to hash
   * @returns True if cached, false otherwise
   */
  async exists(requestParams: Record<string, any>): Promise<boolean> {
    const hash = generateCacheKey(requestParams);
    const key = `${CACHE_PREFIX.AI_RESPONSE}${hash}`;
    return cache.exists(key);
  },

  /**
   * Invalidate AI response cache
   * @param requestParams - The request parameters to hash
   */
  async invalidate(requestParams: Record<string, any>): Promise<void> {
    const hash = generateCacheKey(requestParams);
    const key = `${CACHE_PREFIX.AI_RESPONSE}${hash}`;
    await cache.del(key);
  },
};

/**
 * Combined cache service for AI operations
 * Provides a unified interface for all caching needs
 */
export const cacheService = {
  systemPrompt: systemPromptCache,
  userContext: userContextCache,
  aiResponse: aiResponseCache,
  
  /**
   * Clear all AI-related caches
   * Use with caution - this will invalidate all cached data
   */
  async clearAll(): Promise<void> {
    // Note: In production, implement proper cache clearing using SCAN
    console.warn('clearAll() called - implement proper cache clearing in production');
  },
};
