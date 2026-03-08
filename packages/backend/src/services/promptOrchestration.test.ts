/**
 * Unit tests for Prompt Orchestration System
 */

import {
  PromptBuilder,
  UserContext,
  buildIdeaGenerationPrompt,
  buildRefinementPrompt,
  buildExpansionPrompt,
  buildRepurposingPrompt,
  buildOptimizationPrompt,
  getToneProfile,
  getAllToneProfiles,
  toneProfiles
} from './promptOrchestration';

describe('PromptBuilder', () => {
  let builder: PromptBuilder;

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  describe('setSystemPrompt', () => {
    it('should set system prompt and return builder for chaining', () => {
      const result = builder.setSystemPrompt('Test system prompt');
      expect(result).toBe(builder);
    });
  });

  describe('setUserContext', () => {
    it('should set user context and return builder for chaining', () => {
      const context: UserContext = {
        userId: 'user-123',
        pastTopics: ['AI', 'Technology'],
        preferredTone: 'professional'
      };
      const result = builder.setUserContext(context);
      expect(result).toBe(builder);
    });
  });

  describe('setTaskPrompt', () => {
    it('should set task prompt and return builder for chaining', () => {
      const result = builder.setTaskPrompt('Test task prompt');
      expect(result).toBe(builder);
    });
  });

  describe('setIncludeExplanation', () => {
    it('should set explanation flag and return builder for chaining', () => {
      const result = builder.setIncludeExplanation(false);
      expect(result).toBe(builder);
    });
  });

  describe('build', () => {
    it('should build prompt with system prompt only', () => {
      const prompt = builder
        .setSystemPrompt('System prompt')
        .setIncludeExplanation(false)
        .build();

      expect(prompt).toContain('System prompt');
    });

    it('should build prompt with user context', () => {
      const context: UserContext = {
        userId: 'user-123',
        pastTopics: ['AI', 'Technology'],
        preferredTone: 'professional',
        targetAudience: 'developers'
      };

      const prompt = builder
        .setUserContext(context)
        .setIncludeExplanation(false)
        .build();

      expect(prompt).toContain('User Context:');
      expect(prompt).toContain('Past successful topics: AI, Technology');
      expect(prompt).toContain('Preferred tone: professional');
      expect(prompt).toContain('Target audience: developers');
    });

    it('should build prompt with task prompt', () => {
      const prompt = builder
        .setTaskPrompt('Generate ideas')
        .setIncludeExplanation(false)
        .build();

      expect(prompt).toContain('Generate ideas');
    });

    it('should include explanation requirement by default', () => {
      const prompt = builder
        .setTaskPrompt('Test task')
        .build();

      expect(prompt).toContain('IMPORTANT: Include clear explanations and rationale');
    });

    it('should not include explanation when disabled', () => {
      const prompt = builder
        .setTaskPrompt('Test task')
        .setIncludeExplanation(false)
        .build();

      expect(prompt).not.toContain('IMPORTANT: Include clear explanations');
    });

    it('should build complete prompt with all components', () => {
      const context: UserContext = {
        userId: 'user-123',
        pastTopics: ['AI'],
        preferredTone: 'conversational'
      };

      const prompt = builder
        .setSystemPrompt('You are an AI assistant')
        .setUserContext(context)
        .setTaskPrompt('Generate content ideas')
        .setIncludeExplanation(true)
        .build();

      expect(prompt).toContain('You are an AI assistant');
      expect(prompt).toContain('User Context:');
      expect(prompt).toContain('Past successful topics: AI');
      expect(prompt).toContain('Generate content ideas');
      expect(prompt).toContain('IMPORTANT: Include clear explanations');
    });

    it('should handle empty user context gracefully', () => {
      const context: UserContext = {
        userId: 'user-123'
      };

      const prompt = builder
        .setUserContext(context)
        .setIncludeExplanation(false)
        .build();

      expect(prompt).toContain('User Context:');
      expect(prompt).not.toContain('Past successful topics:');
    });
  });

  describe('reset', () => {
    it('should reset builder to initial state', () => {
      builder
        .setSystemPrompt('System')
        .setTaskPrompt('Task')
        .setIncludeExplanation(false);

      builder.reset();

      const prompt = builder.build();
      expect(prompt).not.toContain('System');
      expect(prompt).not.toContain('Task');
      expect(prompt).toContain('IMPORTANT: Include clear explanations');
    });
  });
});

describe('buildIdeaGenerationPrompt', () => {
  it('should build prompt for idea generation', () => {
    const context: UserContext = {
      userId: 'user-123',
      pastTopics: ['AI', 'Machine Learning'],
      preferredTone: 'professional',
      targetAudience: 'tech professionals'
    };

    const prompt = buildIdeaGenerationPrompt('AI in Healthcare', context, 5);

    expect(prompt).toContain('AI content co-pilot');
    expect(prompt).toContain('User Context:');
    expect(prompt).toContain('Past successful topics: AI, Machine Learning');
    expect(prompt).toContain('Preferred tone: professional');
    expect(prompt).toContain('Target audience: tech professionals');
    expect(prompt).toContain('Generate 5 diverse content ideas about "AI in Healthcare"');
    expect(prompt).toContain('JSON array');
    expect(prompt).toContain('title');
    expect(prompt).toContain('description');
    expect(prompt).toContain('rationale');
  });

  it('should use default count of 5 ideas', () => {
    const context: UserContext = { userId: 'user-123' };
    const prompt = buildIdeaGenerationPrompt('Technology', context);

    expect(prompt).toContain('Generate 5 diverse content ideas');
  });
});

describe('buildRefinementPrompt', () => {
  it('should build prompt for content refinement', () => {
    const originalContent = 'This is my original content about AI.';
    const userRequest = 'Make it more engaging';

    const prompt = buildRefinementPrompt(originalContent, userRequest);

    expect(prompt).toContain('AI content co-pilot helping refine content');
    expect(prompt).toContain('Original Content:');
    expect(prompt).toContain(originalContent);
    expect(prompt).toContain('User Request: Make it more engaging');
    expect(prompt).toContain('preserving the creator\'s voice and intent');
    expect(prompt).toContain('JSON');
    expect(prompt).toContain('suggestions');
  });

  it('should include tone-specific guidance when tone is provided', () => {
    const prompt = buildRefinementPrompt(
      'Content here',
      'Refine this',
      'professional'
    );

    expect(prompt).toContain('formal, authoritative tone');
    expect(prompt).toContain('Use data and evidence');
  });

  it('should work without tone specification', () => {
    const prompt = buildRefinementPrompt('Content', 'Refine');

    expect(prompt).toContain('AI content co-pilot');
    expect(prompt).not.toContain('formal, authoritative');
  });
});

describe('buildExpansionPrompt', () => {
  it('should build prompt for content expansion', () => {
    const currentContent = 'AI is transforming healthcare.';
    const expansionPoint = 'Explain specific use cases';

    const prompt = buildExpansionPrompt(currentContent, expansionPoint);

    expect(prompt).toContain('AI content co-pilot helping expand content');
    expect(prompt).toContain('Current Content:');
    expect(prompt).toContain(currentContent);
    expect(prompt).toContain('Expansion Point: Explain specific use cases');
    expect(prompt).toContain('maintains tone and style consistency');
    expect(prompt).toContain('expandedContent');
  });

  it('should include tone guidance when provided', () => {
    const prompt = buildExpansionPrompt(
      'Content',
      'Expand here',
      'educational'
    );

    expect(prompt).toContain('clear, structured, informative tone');
  });
});

describe('buildRepurposingPrompt', () => {
  it('should build prompt for content repurposing', () => {
    const sourceContent = 'Long blog post about AI in healthcare...';
    const targetPlatform = 'Twitter';
    const constraints = {
      maxLength: 280,
      structure: 'Thread format',
      conventions: ['Use hashtags', 'Keep tweets concise', 'Engage with questions']
    };

    const prompt = buildRepurposingPrompt(sourceContent, targetPlatform, constraints);

    expect(prompt).toContain('AI content co-pilot transforming content');
    expect(prompt).toContain('Source Content:');
    expect(prompt).toContain(sourceContent);
    expect(prompt).toContain('Target Platform: Twitter');
    expect(prompt).toContain('Max length: 280 characters');
    expect(prompt).toContain('Structure: Thread format');
    expect(prompt).toContain('Use hashtags, Keep tweets concise, Engage with questions');
    expect(prompt).toContain('preserving the core message');
    expect(prompt).toContain('repurposedContent');
    expect(prompt).toContain('changes');
  });

  it('should format length as words for long content', () => {
    const constraints = {
      maxLength: 1000,
      structure: 'Article',
      conventions: []
    };

    const prompt = buildRepurposingPrompt('Content', 'Blog', constraints);

    expect(prompt).toContain('Max length: 1000 words');
  });

  it('should format length as characters for short content', () => {
    const constraints = {
      maxLength: 280,
      structure: 'Tweet',
      conventions: []
    };

    const prompt = buildRepurposingPrompt('Content', 'Twitter', constraints);

    expect(prompt).toContain('Max length: 280 characters');
  });
});

describe('buildOptimizationPrompt', () => {
  it('should build prompt for content optimization', () => {
    const content = 'This is content that needs optimization.';
    const scoreBreakdown = {
      clarity: 75,
      structure: 55,
      toneConsistency: 80,
      platformFit: 45,
      readability: 70
    };

    const prompt = buildOptimizationPrompt(content, scoreBreakdown);

    expect(prompt).toContain('AI content co-pilot providing optimization suggestions');
    expect(prompt).toContain('Content to Optimize:');
    expect(prompt).toContain(content);
    expect(prompt).toContain('Current Score Breakdown:');
    expect(prompt).toContain('clarity: 75/100');
    expect(prompt).toContain('structure: 55/100');
    expect(prompt).toContain('toneConsistency: 80/100');
    expect(prompt).toContain('platformFit: 45/100');
    expect(prompt).toContain('readability: 70/100');
    expect(prompt).toContain('Weak Areas Requiring Attention:');
    expect(prompt).toContain('structure: 55/100');
    expect(prompt).toContain('platformFit: 45/100');
  });

  it('should handle all high scores gracefully', () => {
    const scoreBreakdown = {
      clarity: 85,
      structure: 90,
      toneConsistency: 88,
      platformFit: 92,
      readability: 87
    };

    const prompt = buildOptimizationPrompt('Great content', scoreBreakdown);

    expect(prompt).toContain('All areas are performing well');
    expect(prompt).not.toContain('Weak Areas Requiring Attention:');
  });

  it('should identify multiple weak areas', () => {
    const scoreBreakdown = {
      clarity: 45,
      structure: 50,
      toneConsistency: 40,
      platformFit: 55,
      readability: 35
    };

    const prompt = buildOptimizationPrompt('Content', scoreBreakdown);

    expect(prompt).toContain('Weak Areas Requiring Attention:');
    expect(prompt).toContain('clarity: 45/100');
    expect(prompt).toContain('structure: 50/100');
    expect(prompt).toContain('toneConsistency: 40/100');
    expect(prompt).toContain('platformFit: 55/100');
    expect(prompt).toContain('readability: 35/100');
  });
});

describe('Tone Profiles', () => {
  describe('toneProfiles', () => {
    it('should have all required tone profiles', () => {
      expect(toneProfiles).toHaveProperty('professional');
      expect(toneProfiles).toHaveProperty('conversational');
      expect(toneProfiles).toHaveProperty('educational');
      expect(toneProfiles).toHaveProperty('inspirational');
      expect(toneProfiles).toHaveProperty('technical');
    });

    it('should have complete profile structure for each tone', () => {
      Object.values(toneProfiles).forEach(profile => {
        expect(profile).toHaveProperty('name');
        expect(profile).toHaveProperty('systemPrompt');
        expect(profile).toHaveProperty('vocabulary');
        expect(profile).toHaveProperty('sentenceStructure');
        expect(profile).toHaveProperty('examples');
        expect(Array.isArray(profile.vocabulary)).toBe(true);
        expect(Array.isArray(profile.examples)).toBe(true);
      });
    });
  });

  describe('getToneProfile', () => {
    it('should return tone profile for valid tone name', () => {
      const profile = getToneProfile('professional');
      expect(profile).toBeDefined();
      expect(profile?.name).toBe('Professional');
    });

    it('should return undefined for invalid tone name', () => {
      const profile = getToneProfile('nonexistent');
      expect(profile).toBeUndefined();
    });
  });

  describe('getAllToneProfiles', () => {
    it('should return all tone profiles', () => {
      const profiles = getAllToneProfiles();
      expect(profiles).toHaveLength(5);
      expect(profiles.map(p => p.name)).toContain('Professional');
      expect(profiles.map(p => p.name)).toContain('Conversational');
      expect(profiles.map(p => p.name)).toContain('Educational');
      expect(profiles.map(p => p.name)).toContain('Inspirational');
      expect(profiles.map(p => p.name)).toContain('Technical');
    });
  });
});

describe('Context Injection', () => {
  it('should inject all available user context fields', () => {
    const context: UserContext = {
      userId: 'user-123',
      pastTopics: ['AI', 'ML', 'Data Science'],
      preferredTone: 'technical',
      targetAudience: 'data scientists',
      preferences: {
        verbosity: 'detailed',
        includeExamples: true
      }
    };

    const prompt = buildIdeaGenerationPrompt('Neural Networks', context);

    expect(prompt).toContain('Past successful topics: AI, ML, Data Science');
    expect(prompt).toContain('Preferred tone: technical');
    expect(prompt).toContain('Target audience: data scientists');
  });

  it('should handle minimal user context', () => {
    const context: UserContext = {
      userId: 'user-123'
    };

    const prompt = buildIdeaGenerationPrompt('Topic', context);

    expect(prompt).toContain('User Context:');
    // Should not crash or produce invalid prompts
    expect(prompt.length).toBeGreaterThan(0);
  });
});

describe('Explanation Requirements', () => {
  it('should always include explanation requirement in idea generation', () => {
    const context: UserContext = { userId: 'user-123' };
    const prompt = buildIdeaGenerationPrompt('Topic', context);

    expect(prompt).toContain('IMPORTANT: Include clear explanations and rationale');
  });

  it('should always include explanation requirement in refinement', () => {
    const prompt = buildRefinementPrompt('Content', 'Request');

    expect(prompt).toContain('IMPORTANT: Include clear explanations and rationale');
  });

  it('should always include explanation requirement in expansion', () => {
    const prompt = buildExpansionPrompt('Content', 'Point');

    expect(prompt).toContain('IMPORTANT: Include clear explanations and rationale');
  });

  it('should always include explanation requirement in repurposing', () => {
    const prompt = buildRepurposingPrompt('Content', 'Platform', {
      maxLength: 100,
      structure: 'Short',
      conventions: []
    });

    expect(prompt).toContain('IMPORTANT: Include clear explanations and rationale');
  });

  it('should always include explanation requirement in optimization', () => {
    const prompt = buildOptimizationPrompt('Content', {
      clarity: 50,
      structure: 50,
      toneConsistency: 50,
      platformFit: 50,
      readability: 50
    });

    expect(prompt).toContain('IMPORTANT: Include clear explanations and rationale');
  });
});
