# LLM Service

A robust LLM API client with built-in fault tolerance, rate limiting, and retry logic for OpenAI and Anthropic APIs.

## Features

- **Circuit Breaker**: Prevents cascade failures by opening the circuit after 5 consecutive failures
- **Rate Limiting**: Token bucket algorithm to control API usage (configurable via environment variables)
- **Retry Logic**: Exponential backoff with up to 3 retries for transient failures
- **Multi-Provider Support**: Works with both OpenAI and Anthropic APIs
- **Graceful Degradation**: Clear error messages when service is unavailable
- **Monitoring**: Exposes circuit breaker and rate limiter state for observability

## Configuration

Set the following environment variables in your `.env` file:

```bash
# LLM Provider (openai or anthropic)
LLM_PROVIDER=openai

# API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Rate Limiting
LLM_RATE_LIMIT=100        # Max requests per window
LLM_RATE_WINDOW=60000     # Window in milliseconds (60 seconds)
```

## Usage

### Basic Usage

```typescript
import { getLLMClient } from './services/llm';

const client = getLLMClient();

// Simple completion
const response = await client.complete({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello, how are you?' }
  ]
});

console.log(response.content);
```

### With Custom Parameters

```typescript
const response = await client.complete({
  messages: [
    { role: 'user', content: 'Explain quantum computing' }
  ],
  temperature: 0.7,
  maxTokens: 500,
  model: 'gpt-4'
});
```

### Error Handling

```typescript
import { LLMServiceError } from './services/llm';

try {
  const response = await client.complete({
    messages: [{ role: 'user', content: 'Hello' }]
  });
} catch (error) {
  if (error instanceof LLMServiceError) {
    console.error(`LLM Error (${error.statusCode}): ${error.message}`);
    console.error(`Provider: ${error.provider}`);
  }
}
```

### Health Check

```typescript
const isHealthy = await client.healthCheck();
if (!isHealthy) {
  console.warn('LLM service is not responding');
}
```

### Monitoring

```typescript
// Check circuit breaker state
const circuitState = client.getCircuitState();
console.log(`Circuit: ${circuitState.state}, Failures: ${circuitState.failureCount}`);

// Check rate limiter state
const rateLimitState = client.getRateLimitState();
console.log(`Available tokens: ${rateLimitState.availableTokens}/${rateLimitState.maxRequests}`);
```

## Architecture

### Circuit Breaker

The circuit breaker has three states:

1. **CLOSED**: Normal operation, requests pass through
2. **OPEN**: Circuit is open after 5 failures, requests fail immediately
3. **HALF-OPEN**: Testing if service has recovered after 1 minute

```
CLOSED --[5 failures]--> OPEN --[1 minute]--> HALF-OPEN
   ^                                               |
   |                                               |
   +--[success]----------------------------------+
   |
   +--[failure]---> OPEN
```

### Rate Limiting

Uses token bucket algorithm:
- Tokens are consumed on each request
- Tokens refill after the time window expires
- Requests fail immediately when no tokens available

### Retry Logic

Retries with exponential backoff:
- Initial delay: 1 second
- Backoff multiplier: 2x
- Max delay: 10 seconds
- Max retries: 3

Retryable errors:
- Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
- Rate limit errors (429)
- Server errors (500, 502, 503)

Non-retryable errors:
- Authentication errors (401)
- Validation errors (400)
- Not found errors (404)

## Testing

Run the test suite:

```bash
npm test -- src/services/llm
```

Individual test files:
```bash
npm test -- src/services/llm/circuitBreaker.test.ts
npm test -- src/services/llm/rateLimiter.test.ts
npm test -- src/services/llm/retryHandler.test.ts
npm test -- src/services/llm/llmClient.test.ts
```

## API Reference

### LLMClient

#### `complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse>`

Execute a completion request.

**Parameters:**
- `messages`: Array of message objects with `role` and `content`
- `temperature` (optional): Sampling temperature (0-1)
- `maxTokens` (optional): Maximum tokens to generate
- `model` (optional): Model to use (defaults to gpt-4 or claude-3-sonnet)

**Returns:**
- `content`: Generated text
- `usage`: Token usage statistics
- `model`: Model used

**Throws:**
- `LLMServiceError`: On API errors
- `RateLimitError`: When rate limit exceeded
- `CircuitBreakerError`: When circuit is open

#### `healthCheck(): Promise<boolean>`

Check if the LLM service is healthy.

#### `getCircuitState(): { state: CircuitState, failureCount: number }`

Get current circuit breaker state.

#### `getRateLimitState(): { availableTokens: number, maxRequests: number }`

Get current rate limiter state.

#### `resetCircuitBreaker(): void`

Manually reset the circuit breaker (for testing or manual intervention).

#### `resetRateLimiter(): void`

Manually reset the rate limiter (for testing).

## Error Types

### LLMServiceError

Base error for all LLM service errors.

Properties:
- `message`: Error description
- `statusCode`: HTTP status code (if applicable)
- `provider`: LLM provider (openai or anthropic)

### RateLimitError

Thrown when rate limit is exceeded.

Properties:
- `message`: Error description
- `retryAfter`: Milliseconds until next request allowed

### CircuitBreakerError

Thrown when circuit breaker is open.

Properties:
- `message`: Error description

## Best Practices

1. **Always handle errors**: Wrap LLM calls in try-catch blocks
2. **Monitor circuit state**: Check circuit breaker state in production
3. **Set appropriate rate limits**: Configure based on your API tier
4. **Use health checks**: Implement health check endpoints for monitoring
5. **Cache responses**: Cache LLM responses when possible to reduce API calls
6. **Implement fallbacks**: Have fallback behavior when LLM is unavailable

## Example: API Endpoint with LLM

```typescript
import { Router } from 'express';
import { getLLMClient, LLMServiceError } from '../services/llm';

const router = Router();

router.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const client = getLLMClient();
    const response = await client.complete({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 500,
    });
    
    res.json({
      content: response.content,
      usage: response.usage,
    });
  } catch (error) {
    if (error instanceof LLMServiceError) {
      res.status(error.statusCode || 500).json({
        error: error.message,
        provider: error.provider,
      });
    } else {
      res.status(500).json({
        error: 'An unexpected error occurred',
      });
    }
  }
});

export default router;
```

## Troubleshooting

### Circuit breaker keeps opening

- Check if API key is valid
- Verify network connectivity
- Check API provider status
- Review error logs for patterns

### Rate limit errors

- Increase `LLM_RATE_LIMIT` in environment variables
- Implement caching to reduce API calls
- Use longer `LLM_RATE_WINDOW` for burst traffic

### Timeout errors

- Check network latency
- Increase axios timeout in `llmClient.ts`
- Use smaller `maxTokens` for faster responses

### Authentication errors

- Verify API key is correct
- Check API key has necessary permissions
- Ensure API key is not expired
