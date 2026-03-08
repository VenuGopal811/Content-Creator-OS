/**
 * Rate Limiter Implementation
 * 
 * Implements token bucket algorithm to limit API calls per time window.
 */

export interface RateLimiterOptions {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
}

export class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly options: RateLimiterOptions;

  constructor(options: RateLimiterOptions) {
    this.options = options;
    this.tokens = options.maxRequests;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens < 1) {
      const retryAfter = this.getRetryAfter();
      throw new RateLimitError(
        `Rate limit exceeded. Retry after ${retryAfter}ms`,
        retryAfter
      );
    }

    this.tokens--;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    if (timePassed >= this.options.windowMs) {
      // Refill tokens
      const windowsPassed = Math.floor(timePassed / this.options.windowMs);
      this.tokens = Math.min(
        this.options.maxRequests,
        this.tokens + windowsPassed * this.options.maxRequests
      );
      this.lastRefill = now;
    }
  }

  private getRetryAfter(): number {
    const now = Date.now();
    const timeSinceRefill = now - this.lastRefill;
    return this.options.windowMs - timeSinceRefill;
  }

  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  reset(): void {
    this.tokens = this.options.maxRequests;
    this.lastRefill = Date.now();
  }
}
