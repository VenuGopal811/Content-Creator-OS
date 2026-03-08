import { CircuitBreaker, CircuitBreakerError } from './circuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000,
    });
  });

  describe('closed state', () => {
    it('should execute operation successfully when closed', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should remain closed after single failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));
      
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
      expect(circuitBreaker.getState()).toBe('closed');
      expect(circuitBreaker.getFailureCount()).toBe(1);
    });
  });

  describe('open state', () => {
    it('should open circuit after threshold failures', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Trigger failures to reach threshold
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
      }
      
      expect(circuitBreaker.getState()).toBe('open');
      expect(circuitBreaker.getFailureCount()).toBe(3);
    });

    it('should reject requests immediately when open', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      // Next request should fail immediately without calling operation
      operation.mockClear();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow(CircuitBreakerError);
      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('half-open state', () => {
    it('should transition to half-open after reset timeout', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
      }
      
      expect(circuitBreaker.getState()).toBe('open');
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Next request should attempt operation (half-open)
      const result = await circuitBreaker.execute(operation);
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('closed');
    });

    it('should reopen if operation fails in half-open state', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Fail again in half-open state
      await expect(circuitBreaker.execute(operation)).rejects.toThrow('failure');
      expect(circuitBreaker.getState()).toBe('open');
    });
  });

  describe('reset', () => {
    it('should reset circuit to closed state', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      }
      
      expect(circuitBreaker.getState()).toBe('open');
      
      // Reset
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe('closed');
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('success after failures', () => {
    it('should reset failure count on success', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success');
      
      // Two failures
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      await expect(circuitBreaker.execute(operation)).rejects.toThrow();
      expect(circuitBreaker.getFailureCount()).toBe(2);
      
      // Success should reset count
      await circuitBreaker.execute(operation);
      expect(circuitBreaker.getFailureCount()).toBe(0);
      expect(circuitBreaker.getState()).toBe('closed');
    });
  });
});
