import { Router, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AppError } from '../middleware/errorHandler';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ContentService } from '../services/contentService';
import { config } from '../config';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: config.llm.groqApiKey || process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b';

export function createAiRouter(pool: Pool): Router {
  const router = Router();
  const contentService = new ContentService(pool);
  
  router.use(authMiddleware);

  // POST /api/ai/ideas/generate
  router.post('/ideas/generate', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, topic } = req.body;
      
      if (!projectId) throw new AppError(400, 'VALIDATION_ERROR', 'Project ID is required');

      const systemPrompt = `You are an expert AI content strategist. Generate exactly 5 content ideas for the topic: "${topic}". 
CRITICAL: Respond ONLY with a raw JSON array. DO NOT include markdown formatting like \`\`\`json. DO NOT include any conversational text.
Format:
[
  { "title": "...", "description": "...", "rationale": "..." }
]`;
      
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: systemPrompt }],
        model: MODEL,
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      let templateIdeas = [];
      try {
        templateIdeas = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
        if (!Array.isArray(templateIdeas)) templateIdeas = [];
      } catch (e) {
        console.error("Failed to parse JSON from LLM: ", responseText);
        templateIdeas = [];
      }
      
      // Save ideas to Postgres ideas table
      const generated = [];
      for (const idea of templateIdeas) {
        if (!idea.title) continue;
        const result = await pool.query(
          `INSERT INTO ideas (project_id, title, description, rationale, created_at)
           VALUES ($1, $2, $3, $4, NOW()) RETURNING *;`,
          [projectId, idea.title, idea.description || '', idea.rationale || '']
        );
        generated.push(result.rows[0]);
      }
      
      res.status(200).json({ ideas: generated });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/ai/ideas/project/:projectId
  router.get('/ideas/project/:projectId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const result = await pool.query(`SELECT * FROM ideas WHERE project_id = $1 ORDER BY created_at DESC;`, [projectId]);
      res.status(200).json({ ideas: result.rows });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/ai/ideas/select
  router.post('/ideas/select', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { ideaId, projectId } = req.body;

      if (!ideaId || !projectId) throw new AppError(400, 'VALIDATION_ERROR', 'Idea ID and Project ID are required');

      const ideaResult = await pool.query(`SELECT * FROM ideas WHERE id = $1;`, [ideaId]);
      if (ideaResult.rows.length === 0) throw new AppError(404, 'IDEA_NOT_FOUND', 'Idea not found');
      
      const idea = ideaResult.rows[0];

      await pool.query(`UPDATE ideas SET selected = TRUE WHERE id = $1;`, [ideaId]);

      // Create content
      const content = await contentService.createContent({
        projectId,
        userId: authReq.userId!,
        title: idea.title,
        body: idea.description + '\\n\\n' + idea.rationale,
        stage: 'draft'
      });

      res.status(200).json({ content });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/ai/suggest
  router.post('/suggest', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, content: textContent } = req.body;
      if (!action || !textContent) throw new AppError(400, 'VALIDATION_ERROR', 'Action and content are required');

      let instruction = '';
      if (action === 'expand') instruction = 'Expand on the following text, adding more detail and depth while maintaining the original meaning.';
      else if (action === 'refine') instruction = 'Refine the following text to make it more concise, professional, and clear.';
      else if (action === 'rephrase') instruction = 'Rephrase the following text to sound more engaging and dynamic.';
      else throw new AppError(400, 'INVALID_ACTION', 'Action not supported');

      const prompt = `System: You are an expert copywriter. ${instruction}
User Content:
${textContent}

CRITICAL: Respond ONLY with a JSON object. No conversational text or markdown blocks.
Format:
{
  "content": "The newly rewritten/expanded/refined text.",
  "explanation": "A short, 1-sentence explanation of what you changed and why."
}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: MODEL,
        temperature: 0.5,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      let suggestion = { content: "Error executing suggestion.", explanation: "Failed to parse AI response." };
      try {
        suggestion = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        console.error("Failed to parse AI suggestion:", responseText);
      }
      
      res.status(200).json({ suggestion });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/ai/repurpose
  router.post('/repurpose', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content: textContent, platform } = req.body;
      if (!platform || !textContent) throw new AppError(400, 'VALIDATION_ERROR', 'Platform and content are required');

      const prompt = `System: You are an expert social media manager. Repurpose the following text specifically for ${platform}. Adapt the tone, length, and format to match the best practices for ${platform}. Include relevant hashtags if appropriate.
User Content:
${textContent}

CRITICAL: Respond ONLY with a JSON object. No markdown blocks.
Format:
{
  "content": "The repurposed content ready for posting.",
  "changes": [
    { "type": "Tone/Length/Format", "description": "Short description of change", "rationale": "Why it works for ${platform}" }
  ]
}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: MODEL,
        temperature: 0.6,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      let result = { content: "Error", changes: [] };
      try {
        result = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        console.error("Failed to parse AI repurpose:", responseText);
      }

      res.status(200).json({ result });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/ai/optimize
  router.post('/optimize', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { content: textContent } = req.body;
      if (!textContent) throw new AppError(400, 'VALIDATION_ERROR', 'Content is required for optimization');

      const prompt = `System: You are an elite AI content editor. Analyze the provided text and grade it out of 100 on five metrics: clarity, structure, toneConsistency, platformFit, and readability. Ensure the overall score is an average. Also provide 1-3 actionable suggestions to improve the text.
User Content:
${textContent}

CRITICAL: Respond ONLY with a JSON object without markdown blocks.
Format:
{
  "score": {
    "overall": 85,
    "breakdown": {
      "clarity": 88,
      "structure": 75,
      "toneConsistency": 92,
      "platformFit": 80,
      "readability": 90
    }
  },
  "suggestions": [
    {
      "id": "sug_1",
      "category": "clarity",
      "impact": "high",
      "description": "Simplify the opening paragraph."
    }
  ]
}`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'system', content: prompt }],
        model: MODEL,
        temperature: 0.1,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      
      let parsed = {
        score: {
          overall: 72,
          breakdown: { clarity: 70, structure: 70, toneConsistency: 70, platformFit: 70, readability: 70 },
          timestamp: new Date().toISOString()
        },
        suggestions: []
      };

      try {
        parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
        parsed.score.timestamp = new Date().toISOString() as any;
      } catch (e) {
        console.error("Failed to parse AI optimization:", responseText);
      }

      res.status(200).json(parsed);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/ai/apply-suggestion
  router.post('/apply-suggestion', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const { contentId, suggestion } = req.body;
      
      const existingContent = await contentService.findById(contentId);
      if (!existingContent || existingContent.userId !== authReq.userId) {
        throw new AppError(404, 'CONTENT_NOT_FOUND', 'Content not found');
      }

      const currentScore = typeof existingContent.engagementScore === 'object' && existingContent.engagementScore !== null
        ? existingContent.engagementScore
        : {
            overall: 72,
            breakdown: { clarity: 82, structure: 78, toneConsistency: 75, platformFit: 65, readability: 60 },
            timestamp: new Date().toISOString()
          };

      const impactBoost = suggestion.impact === 'high' ? 8 : (suggestion.impact === 'medium' ? 5 : 3);
      const cat = suggestion.category;
      
      const newBreakdown: any = { ...currentScore.breakdown };
      if (cat in newBreakdown) {
        newBreakdown[cat] = Math.min(100, newBreakdown[cat] + impactBoost);
      }
      
      const vals = Object.values(newBreakdown) as number[];
      const weights = [0.25, 0.2, 0.2, 0.2, 0.15];
      const newOverall = Math.round(vals.reduce((s, v, i) => s + v * weights[i], 0));

      const newScore = {
        overall: newOverall,
        breakdown: newBreakdown,
        timestamp: new Date() as any
      };

      await contentService.updateContent(contentId, {
        engagementScore: newScore
      });

      res.status(200).json({ newScore });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
