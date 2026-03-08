# Redis Caching for AI Operations

This document describes the caching implementation for ContentOS AI operations, designed to reduce LLM API calls and improve performance.

## Overview

The caching service provides three types of caches:

1. **System Prompt Cache** - Caches AI role and behavior definitions (1 hour TTL)
2. **User Context Cache** - Caches user preferences, history, and performance data (1 hour TTL)
3. **AI Response Cache** - Caches similar AI responses (30 minutes TTL)

## Architecture

```
┌─────────────────┐
│   AI Request    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Check Cache    │◄──── System Prompt Cache (1h)
│                 │◄──── User Context Cache (1h)
│                 │◄──── AI Response Cache (30m)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Hit       Miss
    │         │
    │         ▼
    │   ┌─────────────┐
    │   │  LLM API    │
    │   │    Call     │
    │   └──────┬──────┘
    │          │
    │          ▼
    │   ┌─────────────┐
    │   │ Cache Result│
    │   └──────┬──────┘
    │          │
    └──────────┘
         │
         ▼
   ┌─────────────┐
   │   Return    │
   │  Response   │
   └─────────────┘
```

## Cache Types

### 1. System Prompt Cache

**Purpose:** Cache system prompts that define AI role and behavior.

**TTL:** 1 hour (3600 seconds)

**Key Format:** `prompt:system:{operation}`

**Usage:**
```typescript
import { cacheService } from './services/cacheService';

// Get cached prompt
const prompt = await cacheService.systemPrompt.get('idea_generation');

// Set prompt
await cacheService.systemPrompt.set('idea_generation', promptText);

// Invalidate
await cacheService.systemPrompt.invalidate('idea_generation');
```

**When to use:**
- System prompts rarely change
- Same prompt used across multiple requests
- Reduces prompt construction overhead

### 2. User Context Cache

**Purpose:** Cache user-specific context like preferences, history, and performance data.

**TTL:** 1 hour (3600 seconds)

**Key Format:** `prompt:context:{userId}:{contextType}`

**Usage:**
```typescript
// Get cached context
const preferences = await cacheService.userContext.get(userId, 'preferences');

// Set context
await cacheService.userContext.set(userId, 'preferences', preferencesData);

// Invalidate specific type
await cacheService.userContext.invalidate(userId, 'preferences');

// Invalidate all context types
await cacheService.userContext.invalidate(userId);
```

**Context Types:**
- `preferences` - User tone, format, and style preferences
- `history` - Past content topics and successful patterns
- `performance` - Performance metrics and feedback data

**When to use:**
- User preferences don't change frequently
- Avoid repeated database queries for same user
- Personalization data needed for AI operations

### 3. AI Response Cache

**Purpose:** Cache AI responses for similar requests to reduce API calls.

**TTL:** 30 minutes (1800 seconds)

**Key Format:** `response:{hash}` (hash generated from request parameters)

**Usage:**
```typescript
const requestParams = {
  operation: 'idea_generation',
  userId: 'user-123',
  topic: 'AI trends',
  tone: 'professional',
};

// Get cached response
const response = await cacheService.aiResponse.get(requestParams);

// Set response
await cacheService.aiResponse.set(requestParams, responseData);

// Check if cached
const exists = await cacheService.aiResponse.exists(requestParams);

// Invalidate
await cacheService.aiResponse.invalidate(requestParams);
```

**When to use:**
- Similar requests likely to produce similar responses
- Reduce LLM API costs
- Improve response time for common queries

## Cache Key Generation

The service uses SHA-256 hashing to generate cache keys from request parameters:

```typescript
import { generateCacheKey } from './services/cacheService';

const params = {
  operation: 'idea_generation',
  userId: 'user-123',
  topic: 'AI trends',
};

const hash = generateCacheKey(params);
// Returns: "a1b2c3d4..." (64-character hex string)
```

**Key features:**
- Consistent hashing for same parameters
- Order-independent (keys sorted before hashing)
- Handles nested objects
- Deterministic output

## TTL Strategy

| Cache Type | TTL | Rationale |
|------------|-----|-----------|
| System Prompts | 1 hour | Prompts rarely change; safe to cache longer |
| User Context | 1 hour | Preferences change infrequently; balance freshness and performance |
| AI Responses | 30 minutes | Responses may become stale; shorter TTL ensures relevance |

## Best Practices

### 1. Always Include Relevant Parameters

Include all parameters that affect the AI response in the cache key:

```typescript
// Good - includes all relevant parameters
const params = {
  operation: 'idea_generation',
  userId: userId,
  topic: topic,
  tone: tone,
  targetAudience: audience,
};

// Bad - missing parameters that affect response
const params = {
  operation: 'idea_generation',
  topic: topic,
};
```

### 2. Invalidate on Data Changes

Invalidate caches when underlying data changes:

```typescript
// When user updates preferences
await updateUserPreferences(userId, newPreferences);
await cacheService.userContext.invalidate(userId, 'preferences');

// When system prompts are updated
await updateSystemPrompt('idea_generation', newPrompt);
await cacheService.systemPrompt.invalidate('idea_generation');
```

### 3. Handle Cache Misses Gracefully

Always have a fallback when cache misses:

```typescript
let response = await cacheService.aiResponse.get(params);

if (!response) {
  // Fallback to API call
  response = await callLLMAPI(params);
  await cacheService.aiResponse.set(params, response);
}

return response;
```

### 4. Use Appropriate Cache Types

Choose the right cache type for your use case:

- **System Prompt Cache**: For operation-specific prompts
- **User Context Cache**: For user-specific data
- **AI Response Cache**: For complete AI responses

### 5. Monitor Cache Hit Rates

Track cache effectiveness:

```typescript
const isCached = await cacheService.aiResponse.exists(params);
if (isCached) {
  console.log('Cache hit - saved API call');
} else {
  console.log('Cache miss - making API call');
}
```

## Performance Impact

### Expected Benefits

1. **Reduced API Calls**: 40-60% reduction in LLM API calls for typical usage
2. **Faster Response Times**: Cached responses return in <10ms vs 1-3s for API calls
3. **Cost Savings**: Significant reduction in LLM API costs
4. **Improved UX**: Instant responses for cached requests

### Cache Hit Rate Targets

- System Prompts: 95%+ (rarely change)
- User Context: 80%+ (changes infrequently)
- AI Responses: 40-60% (depends on request diversity)

## Testing

The cache service includes comprehensive unit tests:

```bash
npm test -- cacheService.test.ts
```

**Test Coverage:**
- Cache key generation (consistency, uniqueness, order-independence)
- System prompt caching (get, set, invalidate)
- User context caching (get, set, invalidate)
- AI response caching (get, set, exists, invalidate)
- TTL values verification

## Integration Example

Complete example of using caching in an AI operation:

```typescript
import { cacheService } from './services/cacheService';

async function generateIdeas(userId: string, topic: string) {
  // 1. Get system prompt (cached)
  let systemPrompt = await cacheService.systemPrompt.get('idea_generation');
  if (!systemPrompt) {
    systemPrompt = buildSystemPrompt();
    await cacheService.systemPrompt.set('idea_generation', systemPrompt);
  }

  // 2. Get user context (cached)
  let userContext = await cacheService.userContext.get(userId, 'preferences');
  if (!userContext) {
    userContext = await fetchUserPreferences(userId);
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
    // Build prompt and call LLM API
    const fullPrompt = buildFullPrompt(systemPrompt, userContext, topic);
    ideas = await callLLMAPI(fullPrompt);
    
    // Cache the response
    await cacheService.aiResponse.set(requestParams, ideas);
  }

  return ideas;
}
```

## Troubleshooting

### Cache Not Working

1. **Check Redis Connection**: Ensure Redis is running and connected
2. **Verify TTL**: Check if cache has expired
3. **Check Key Format**: Ensure cache keys are generated correctly
4. **Review Parameters**: Verify all relevant parameters are included

### High Cache Miss Rate

1. **Parameter Variability**: Too many unique parameter combinations
2. **Short TTL**: Consider increasing TTL if appropriate
3. **Cache Invalidation**: Check if caches are being invalidated too frequently

### Stale Data

1. **Increase Invalidation**: Invalidate caches when data changes
2. **Reduce TTL**: Shorter TTL for more frequently changing data
3. **Manual Refresh**: Provide manual cache refresh option

## Future Enhancements

1. **Cache Warming**: Pre-populate caches with common requests
2. **Cache Analytics**: Track hit rates, miss rates, and performance
3. **Distributed Caching**: Support for Redis Cluster
4. **Cache Compression**: Compress large responses to save memory
5. **Smart Invalidation**: Automatically invalidate related caches

## References

- [Redis Documentation](https://redis.io/docs/)
- [ContentOS Design Document](../../../../design.md)
- [Task 6.3 Specification](.kiro/specs/content-os/tasks.md)
