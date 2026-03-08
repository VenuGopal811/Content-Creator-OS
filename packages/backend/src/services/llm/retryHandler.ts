/**
 * Retry Handler with Exponential Backoff
 * 
 * Implements retry logic with exponential backoff for transient failures.
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[]; // Error names that should trigger retry
}

export class RetryHandler {
  private readonly options: Required<RetryOptions>;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      initialDelayMs: options.initialDelayMs ?? 1000,
      maxDelayMs: options.maxDelayMs ?? 10000,
      backoffMultiplier: options.backoffMultiplier ?? 2,
      retryableErrors: options.retryableErrors ?? [
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EAI_AGAIN',
        'RateLimitError',
      ],
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if max retries reached
        if (attempt === this.options.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryable(error as Error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);
        
        console.warn(
          `Retry attempt ${attempt + 1}/${this.options.maxRetries} ` +
          `for ${context || 'operation'} after ${delay}ms. ` +
          `Error: ${(error as Error).message}`
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private isRetryable(error: Error): boolean {
    // Check if error name matches retryable errors
    if (this.options.retryableErrors.includes(error.name)) {
      return true;
    }

    // Check for specific error codes
    const errorCode = (error as any).code;
    if (errorCode && this.options.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check for rate limit errors (429 status)
    const statusCode = (error as any).status || (error as any).statusCode;
    if (statusCode === 429) {
      return true;
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.options.initialDelayMs * 
                  Math.pow(this.options.backoffMultiplier, attempt);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay;
    
    return Math.min(delay + jitter, this.options.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
