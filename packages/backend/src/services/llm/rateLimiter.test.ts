import { RateLimiter, RateLimitError } from './rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 1000,
    });
  });

  describe('token acquisition', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        await expect(rateLimiter.acquire()).resolves.toBeUndefined();
      }
    });

    it('should reject requests exceeding limit', async () => {
      // Use all tokens
      for (let i = 0; i < 5; i++) {
        await rateLimiter.acquire();
      }
      
      // Next request should fail
      await expect(rateLimiter.acquire()).rejects.toThrow(RateLimitError);
    });

    it('should include retry-after time in error', async () => {
      // Use all tokens
      for (let i = 0; i < 5; i++) {
        await rateLimiter.acquire();
      }
      
      try {
        await rateLimiter.acquire();
        fail('Should have thrown RateLimitError');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBeGreaterThan(0);
        expect((error as RateLimitError).retryAfter).toBeLessThanOrEqual(1000);
      }
    });
  });

  describe('token refill', () => {
    it('should refill tokens after window expires', async () => {
      // Use all tokens
      for (let i = 0; i < 5; i++) {
        await rateLimiter.acquire();
      }
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be able to acquire again
      await expect(rateLimiter.acquire()).resolves.toBeUndefined();
    });

    it('should track available tokens correctly', () => {
      expect(rateLimiter.getAvailableTokens()).toBe(5);
      
      rateLimiter.acquire();
      expect(rateLimiter.getAvailableTokens()).toBe(4);
      
      rateLimiter.acquire();
      expect(rateLimiter.getAvailableTokens()).toBe(3);
    });
  });

  describe('reset', () => {
    it('should reset tokens to maximum', async () => {
      // Use some tokens
      await rateLimiter.acquire();
      await rateLimiter.acquire();
      expect(rateLimiter.getAvailableTokens()).toBe(3);
      
      // Reset
      rateLimiter.reset();
      expect(rateLimiter.getAvailableTokens()).toBe(5);
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent token acquisition', async () => {
      const promises = Array(5).fill(null).map(() => rateLimiter.acquire());
      await expect(Promise.all(promises)).resolves.toBeDefined();
      
      // Next request should fail
      await expect(rateLimiter.acquire()).rejects.toThrow(RateLimitError);
    });
  });
});
