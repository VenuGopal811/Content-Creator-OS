import { RetryHandler } from './retryHandler';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelayMs: 100,
      maxDelayMs: 1000,
      backoffMultiplier: 2,
    });
    
    // Suppress console warnings during tests
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful operations', () => {
    it('should execute operation successfully on first try', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await retryHandler.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      await retryHandler.execute(operation);
      
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryable errors', () => {
    it('should retry on ECONNRESET error', async () => {
      const error = new Error('Connection reset');
      (error as any).code = 'ECONNRESET';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');
      
      const result = await retryHandler.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on ETIMEDOUT error', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');
      
      const result = await retryHandler.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on 429 status code', async () => {
      const error = new Error('Rate limited');
      (error as any).status = 429;
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');
      
      const result = await retryHandler.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('non-retryable errors', () => {
    it('should not retry on validation errors', async () => {
      const error = new Error('Validation failed');
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(retryHandler.execute(operation)).rejects.toThrow('Validation failed');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry on 401 errors', async () => {
      const error = new Error('Unauthorized');
      (error as any).status = 401;
      
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(retryHandler.execute(operation)).rejects.toThrow('Unauthorized');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('max retries', () => {
    it('should stop after max retries', async () => {
      const error = new Error('Connection reset');
      (error as any).code = 'ECONNRESET';
      
      const operation = jest.fn().mockRejectedValue(error);
      
      await expect(retryHandler.execute(operation)).rejects.toThrow('Connection reset');
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should succeed if operation succeeds before max retries', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');
      
      const result = await retryHandler.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('exponential backoff', () => {
    it('should wait with exponential backoff between retries', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      await retryHandler.execute(operation);
      const duration = Date.now() - startTime;
      
      // Should have waited at least 100ms + 200ms (with some tolerance)
      expect(duration).toBeGreaterThanOrEqual(250);
    });
  });

  describe('context logging', () => {
    it('should log context in retry warnings', async () => {
      const error = new Error('Timeout');
      (error as any).code = 'ETIMEDOUT';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');
      
      await retryHandler.execute(operation, 'test-operation');
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('test-operation')
      );
    });
  });
});
