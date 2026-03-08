import { 
  generateCacheKey, 
  systemPromptCache, 
  userContextCache, 
  aiResponseCache,
  CACHE_TTL 
} from './cacheService';
import { cache } from '../cache/redis';

// Mock the cache module
jest.mock('../cache/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
  },
}));

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent hash for same data', () => {
      const data = { operation: 'test', userId: '123', content: 'hello' };
      const hash1 = generateCacheKey(data);
      const hash2 = generateCacheKey(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different hashes for different data', () => {
      const data1 = { operation: 'test', userId: '123' };
      const data2 = { operation: 'test', userId: '456' };
      
      const hash1 = generateCacheKey(data1);
      const hash2 = generateCacheKey(data2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate same hash regardless of key order', () => {
      const data1 = { a: '1', b: '2', c: '3' };
      const data2 = { c: '3', a: '1', b: '2' };
      
      const hash1 = generateCacheKey(data1);
      const hash2 = generateCacheKey(data2);
      
      expect(hash1).toBe(hash2);
    });

    it('should handle nested objects', () => {
      const data = {
        operation: 'test',
        params: { nested: { value: 'deep' } },
      };
      
      const hash = generateCacheKey(data);
      expect(hash).toHaveLength(64);
    });
  });

  describe('systemPromptCache', () => {
    describe('get', () => {
      it('should retrieve cached system prompt', async () => {
        const mockPrompt = 'You are an AI assistant...';
        (cache.get as jest.Mock).mockResolvedValue(mockPrompt);

        const result = await systemPromptCache.get('idea_generation');

        expect(cache.get).toHaveBeenCalledWith('prompt:system:idea_generation');
        expect(result).toBe(mockPrompt);
      });

      it('should return null if prompt not cached', async () => {
        (cache.get as jest.Mock).mockResolvedValue(null);

        const result = await systemPromptCache.get('idea_generation');

        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should cache system prompt with correct TTL', async () => {
        const prompt = 'You are an AI assistant...';
        
        await systemPromptCache.set('idea_generation', prompt);

        expect(cache.set).toHaveBeenCalledWith(
          'prompt:system:idea_generation',
          prompt,
          CACHE_TTL.SYSTEM_PROMPT
        );
      });

      it('should cache different prompts for different operations', async () => {
        const prompt1 = 'Generate ideas...';
        const prompt2 = 'Refine content...';
        
        await systemPromptCache.set('idea_generation', prompt1);
        await systemPromptCache.set('refinement', prompt2);

        expect(cache.set).toHaveBeenCalledWith(
          'prompt:system:idea_generation',
          prompt1,
          CACHE_TTL.SYSTEM_PROMPT
        );
        expect(cache.set).toHaveBeenCalledWith(
          'prompt:system:refinement',
          prompt2,
          CACHE_TTL.SYSTEM_PROMPT
        );
      });
    });

    describe('invalidate', () => {
      it('should delete cached system prompt', async () => {
        await systemPromptCache.invalidate('idea_generation');

        expect(cache.del).toHaveBeenCalledWith('prompt:system:idea_generation');
      });
    });
  });

  describe('userContextCache', () => {
    const userId = 'user-123';

    describe('get', () => {
      it('should retrieve cached user context', async () => {
        const mockContext = { preferences: { tone: 'professional' } };
        (cache.get as jest.Mock).mockResolvedValue(mockContext);

        const result = await userContextCache.get(userId, 'preferences');

        expect(cache.get).toHaveBeenCalledWith('prompt:context:user-123:preferences');
        expect(result).toEqual(mockContext);
      });

      it('should return null if context not cached', async () => {
        (cache.get as jest.Mock).mockResolvedValue(null);

        const result = await userContextCache.get(userId, 'history');

        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('should cache user context with correct TTL', async () => {
        const context = { preferences: { tone: 'professional' } };
        
        await userContextCache.set(userId, 'preferences', context);

        expect(cache.set).toHaveBeenCalledWith(
          'prompt:context:user-123:preferences',
          context,
          CACHE_TTL.SYSTEM_PROMPT
        );
      });

      it('should cache different context types separately', async () => {
        const preferences = { tone: 'professional' };
        const history = { pastTopics: ['AI', 'Tech'] };
        
        await userContextCache.set(userId, 'preferences', preferences);
        await userContextCache.set(userId, 'history', history);

        expect(cache.set).toHaveBeenCalledWith(
          'prompt:context:user-123:preferences',
          preferences,
          CACHE_TTL.SYSTEM_PROMPT
        );
        expect(cache.set).toHaveBeenCalledWith(
          'prompt:context:user-123:history',
          history,
          CACHE_TTL.SYSTEM_PROMPT
        );
      });
    });

    describe('invalidate', () => {
      it('should delete specific context type', async () => {
        await userContextCache.invalidate(userId, 'preferences');

        expect(cache.del).toHaveBeenCalledWith('prompt:context:user-123:preferences');
      });

      it('should delete all common context types when no type specified', async () => {
        await userContextCache.invalidate(userId);

        expect(cache.del).toHaveBeenCalledTimes(3);
        expect(cache.del).toHaveBeenCalledWith('prompt:context:user-123:history');
        expect(cache.del).toHaveBeenCalledWith('prompt:context:user-123:preferences');
        expect(cache.del).toHaveBeenCalledWith('prompt:context:user-123:performance');
      });
    });
  });

  describe('aiResponseCache', () => {
    const requestParams = {
      operation: 'idea_generation',
      userId: 'user-123',
      topic: 'AI trends',
    };

    describe('get', () => {
      it('should retrieve cached AI response', async () => {
        const mockResponse = { ideas: ['Idea 1', 'Idea 2'] };
        (cache.get as jest.Mock).mockResolvedValue(mockResponse);

        const result = await aiResponseCache.get(requestParams);

        expect(cache.get).toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
      });

      it('should return null if response not cached', async () => {
        (cache.get as jest.Mock).mockResolvedValue(null);

        const result = await aiResponseCache.get(requestParams);

        expect(result).toBeNull();
      });

      it('should use same cache key for identical requests', async () => {
        const params1 = { operation: 'test', userId: '123' };
        const params2 = { operation: 'test', userId: '123' };

        await aiResponseCache.get(params1);
        await aiResponseCache.get(params2);

        const calls = (cache.get as jest.Mock).mock.calls;
        expect(calls[0][0]).toBe(calls[1][0]);
      });
    });

    describe('set', () => {
      it('should cache AI response with correct TTL', async () => {
        const response = { ideas: ['Idea 1', 'Idea 2'] };
        
        await aiResponseCache.set(requestParams, response);

        expect(cache.set).toHaveBeenCalledWith(
          expect.stringContaining('response:'),
          response,
          CACHE_TTL.AI_RESPONSE
        );
      });

      it('should use different cache keys for different requests', async () => {
        const params1 = { operation: 'test', userId: '123' };
        const params2 = { operation: 'test', userId: '456' };
        const response = { result: 'test' };

        await aiResponseCache.set(params1, response);
        await aiResponseCache.set(params2, response);

        const calls = (cache.set as jest.Mock).mock.calls;
        expect(calls[0][0]).not.toBe(calls[1][0]);
      });
    });

    describe('exists', () => {
      it('should check if response is cached', async () => {
        (cache.exists as jest.Mock).mockResolvedValue(true);

        const result = await aiResponseCache.exists(requestParams);

        expect(cache.exists).toHaveBeenCalled();
        expect(result).toBe(true);
      });

      it('should return false if response not cached', async () => {
        (cache.exists as jest.Mock).mockResolvedValue(false);

        const result = await aiResponseCache.exists(requestParams);

        expect(result).toBe(false);
      });
    });

    describe('invalidate', () => {
      it('should delete cached AI response', async () => {
        await aiResponseCache.invalidate(requestParams);

        expect(cache.del).toHaveBeenCalled();
      });
    });
  });

  describe('Cache TTL values', () => {
    it('should have correct TTL for system prompts (1 hour)', () => {
      expect(CACHE_TTL.SYSTEM_PROMPT).toBe(3600);
    });

    it('should have correct TTL for AI responses (30 minutes)', () => {
      expect(CACHE_TTL.AI_RESPONSE).toBe(1800);
    });
  });
});
