import axios from 'axios';

jest.mock('axios');
jest.mock('../../config', () => ({
  config: {
    llm: {
      provider: 'openai',
      openaiApiKey: 'test-openai-key',
      anthropicApiKey: 'test-anthropic-key',
      rateLimit: 100,
      rateWindow: 60000,
    },
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import after mocking
import { LLMClient, LLMServiceError } from './llmClient';

describe('LLMClient', () => {
  let client: LLMClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Mock axios.create to return a mock instance
    mockAxiosInstance = {
      post: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    // Suppress console warnings
    jest.spyOn(console, 'warn').mockImplementation();
    
    client = new LLMClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (client) {
      client.resetCircuitBreaker();
      client.resetRateLimiter();
    }
  });

  describe('initialization', () => {
    it('should initialize with OpenAI provider', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.openai.com/v1',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-openai-key',
          }),
        })
      );
    });
  });

  describe('OpenAI completion', () => {
    it('should complete successfully with OpenAI', async () => {
      const mockResponse = {
        data: {
          choices: [{
            message: {
              content: 'Hello! How can I help you?',
            },
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
          model: 'gpt-4',
        },
      };
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Hello' }],
      });
      
      expect(result).toEqual({
        content: 'Hello! How can I help you?',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        model: 'gpt-4',
      });
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
        })
      );
    });

    it('should use custom parameters', async () => {
      const mockResponse = {
        data: {
          choices: [{ message: { content: 'Response' } }],
          model: 'gpt-3.5-turbo',
        },
      };
      
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      
      await client.complete({
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5,
        maxTokens: 500,
        model: 'gpt-3.5-turbo',
      });
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/chat/completions',
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          max_tokens: 500,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { error: { message: 'Invalid API key' } },
        },
        isAxiosError: true,
      };
      
      mockAxiosInstance.post.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      await expect(client.complete({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(LLMServiceError);
      
      try {
        await client.complete({
          messages: [{ role: 'user', content: 'Test' }],
        });
      } catch (error) {
        expect((error as LLMServiceError).statusCode).toBe(401);
        expect((error as LLMServiceError).message).toContain('Invalid API key');
      }
    });

    it('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          data: { error: { message: 'Rate limit exceeded' } },
        },
        isAxiosError: true,
      };
      
      mockAxiosInstance.post.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      await expect(client.complete({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(LLMServiceError);
    });

    it('should handle 500 server error', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: { message: 'Internal server error' } },
        },
        isAxiosError: true,
      };
      
      mockAxiosInstance.post.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      await expect(client.complete({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow(LLMServiceError);
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit after threshold failures', async () => {
      const error = {
        response: {
          status: 500,
          data: { error: { message: 'Server error' } },
        },
        isAxiosError: true,
      };
      
      mockAxiosInstance.post.mockRejectedValue(error);
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      // Trigger 5 failures to open circuit
      for (let i = 0; i < 5; i++) {
        await expect(client.complete({
          messages: [{ role: 'user', content: 'Test' }],
        })).rejects.toThrow();
      }
      
      // Next request should fail immediately with circuit breaker error
      await expect(client.complete({
        messages: [{ role: 'user', content: 'Test' }],
      })).rejects.toThrow('temporarily unavailable');
      
      expect(client.getCircuitState().state).toBe('open');
    });
  });

  describe('retry logic', () => {
    it('should retry on transient failures', async () => {
      const error = {
        code: 'ETIMEDOUT',
        message: 'Timeout',
        isAxiosError: true,
      };
      
      mockAxiosInstance.post
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          data: {
            choices: [{ message: { content: 'Success after retry' } }],
            model: 'gpt-4',
          },
        });
      
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      const result = await client.complete({
        messages: [{ role: 'user', content: 'Test' }],
      });
      
      expect(result.content).toBe('Success after retry');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('health check', () => {
    it('should return true when service is healthy', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          choices: [{ message: { content: 'OK' } }],
          model: 'gpt-4',
        },
      });
      
      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when service is unhealthy', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Service down'));
      mockedAxios.isAxiosError.mockReturnValue(true);
      
      const isHealthy = await client.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('monitoring', () => {
    it('should expose circuit breaker state', () => {
      const state = client.getCircuitState();
      expect(state).toHaveProperty('state');
      expect(state).toHaveProperty('failureCount');
    });

    it('should expose rate limiter state', () => {
      const state = client.getRateLimitState();
      expect(state).toHaveProperty('availableTokens');
      expect(state).toHaveProperty('maxRequests');
    });
  });
});
