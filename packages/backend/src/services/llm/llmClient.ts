/**
 * LLM API Client
 * 
 * Unified client for OpenAI and Anthropic APIs with:
 * - Circuit breaker for fault tolerance
 * - Rate limiting to control API usage
 * - Retry logic with exponential backoff
 * - Graceful degradation when API is unavailable
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import { CircuitBreaker, CircuitBreakerError } from './circuitBreaker';
import { RateLimiter, RateLimitError } from './rateLimiter';
import { RetryHandler } from './retryHandler';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMCompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export class LLMServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string
  ) {
    super(message);
    this.name = 'LLMServiceError';
  }
}

export class LLMClient {
  private readonly provider: 'openai' | 'anthropic';
  private readonly apiKey: string;
  private readonly client: AxiosInstance;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimiter: RateLimiter;
  private readonly retryHandler: RetryHandler;

  constructor() {
    this.provider = config.llm.provider as 'openai' | 'anthropic';
    
    // Validate API key
    if (this.provider === 'openai') {
      if (!config.llm.openaiApiKey) {
        throw new Error('OPENAI_API_KEY is not configured');
      }
      this.apiKey = config.llm.openaiApiKey;
    } else if (this.provider === 'anthropic') {
      if (!config.llm.anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      this.apiKey = config.llm.anthropicApiKey;
    } else {
      throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }

    // Initialize HTTP client
    this.client = this.createHttpClient();

    // Initialize circuit breaker (5 failures trigger open state, 1 minute reset)
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 120000, // 2 minutes
    });

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter({
      maxRequests: config.llm.rateLimit,
      windowMs: config.llm.rateWindow,
    });

    // Initialize retry handler
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
      backoffMultiplier: 2,
    });
  }

  private createHttpClient(): AxiosInstance {
    const baseURL = this.provider === 'openai'
      ? 'https://api.openai.com/v1'
      : 'https://api.anthropic.com/v1';

    return axios.create({
      baseURL,
      timeout: 30000, // 30 second timeout
      headers: this.getHeaders(),
    });
  }

  private getHeaders(): Record<string, string> {
    if (this.provider === 'openai') {
      return {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };
    } else {
      return {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      };
    }
  }

  async complete(options: LLMCompletionOptions): Promise<LLMCompletionResponse> {
    // Check rate limit
    try {
      await this.rateLimiter.acquire();
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw new LLMServiceError(
          `Rate limit exceeded. Please try again in ${Math.ceil(error.retryAfter / 1000)} seconds.`,
          429,
          this.provider
        );
      }
      throw error;
    }

    // Execute with circuit breaker and retry logic
    try {
      return await this.circuitBreaker.execute(async () => {
        return await this.retryHandler.execute(
          () => this.executeCompletion(options),
          'LLM completion'
        );
      });
    } catch (error) {
      if (error instanceof CircuitBreakerError) {
        throw new LLMServiceError(
          'AI service is temporarily unavailable. Please try again later.',
          503,
          this.provider
        );
      }
      throw this.handleError(error);
    }
  }

  private async executeCompletion(
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    if (this.provider === 'openai') {
      return await this.executeOpenAICompletion(options);
    } else {
      return await this.executeAnthropicCompletion(options);
    }
  }

  private async executeOpenAICompletion(
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    const response = await this.client.post('/chat/completions', {
      model: options.model || 'gpt-4',
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    });

    const choice = response.data.choices[0];
    if (!choice || !choice.message) {
      throw new LLMServiceError('Invalid response from OpenAI API', 500, 'openai');
    }

    return {
      content: choice.message.content,
      usage: response.data.usage ? {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      } : undefined,
      model: response.data.model,
    };
  }

  private async executeAnthropicCompletion(
    options: LLMCompletionOptions
  ): Promise<LLMCompletionResponse> {
    // Extract system message if present
    const systemMessage = options.messages.find(m => m.role === 'system');
    const messages = options.messages.filter(m => m.role !== 'system');

    const response = await this.client.post('/messages', {
      model: options.model || 'claude-3-sonnet-20240229',
      messages: messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      system: systemMessage?.content,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
    });

    const content = response.data.content[0];
    if (!content || content.type !== 'text') {
      throw new LLMServiceError('Invalid response from Anthropic API', 500, 'anthropic');
    }

    return {
      content: content.text,
      usage: response.data.usage ? {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
      } : undefined,
      model: response.data.model,
    };
  }

  private handleError(error: any): LLMServiceError {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      if (status === 401) {
        return new LLMServiceError(
          'Invalid API key. Please check your configuration.',
          401,
          this.provider
        );
      }

      if (status === 429) {
        return new LLMServiceError(
          'Rate limit exceeded from API provider. Please try again later.',
          429,
          this.provider
        );
      }

      if (status === 500 || status === 502 || status === 503) {
        return new LLMServiceError(
          'AI service is experiencing issues. Please try again later.',
          status,
          this.provider
        );
      }

      return new LLMServiceError(
        `AI service error: ${message}`,
        status,
        this.provider
      );
    }

    // Handle other errors
    if (error instanceof Error) {
      return new LLMServiceError(
        `Unexpected error: ${error.message}`,
        500,
        this.provider
      );
    }

    return new LLMServiceError(
      'An unknown error occurred',
      500,
      this.provider
    );
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.complete({
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 10,
      });
      return !!response.content;
    } catch (error) {
      return false;
    }
  }

  // Get circuit breaker state for monitoring
  getCircuitState() {
    return {
      state: this.circuitBreaker.getState(),
      failureCount: this.circuitBreaker.getFailureCount(),
    };
  }

  // Get rate limiter state for monitoring
  getRateLimitState() {
    return {
      availableTokens: this.rateLimiter.getAvailableTokens(),
      maxRequests: config.llm.rateLimit,
    };
  }

  // Reset circuit breaker (for testing or manual intervention)
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  // Reset rate limiter (for testing)
  resetRateLimiter(): void {
    this.rateLimiter.reset();
  }
}

// Lazy-loaded singleton instance
let _llmClient: LLMClient | null = null;

export function getLLMClient(): LLMClient {
  if (!_llmClient) {
    _llmClient = new LLMClient();
  }
  return _llmClient;
}

// For backward compatibility and convenience
export const llmClient = {
  get instance(): LLMClient {
    return getLLMClient();
  }
};
