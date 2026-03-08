/**
 * Mock Data for ContentOS Demo
 * All data lives in-memory — no backend required
 */

export interface User {
  id: string;
  email: string;
  name: string;
  preferences: {
    defaultTone?: string;
    defaultPersona?: string;
    preferredFormats?: string[];
  };
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  archived: boolean;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

export type LifecycleStage = 'idea' | 'draft' | 'refine' | 'optimize' | 'repurpose' | 'publish' | 'analyze';

export interface ContentPiece {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  body: string;
  tone: string | null;
  persona: string | null;
  stage: LifecycleStage;
  sourceContentId?: string | null;
  targetFormat?: string | null;
  engagementScore?: EngagementScore | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata: {
    wordCount: number;
    readingTime: number;
    tags: string[];
  };
}

export interface Idea {
  id: string;
  projectId: string;
  title: string;
  description: string;
  rationale: string;
  selected: boolean;
  createdAt: string;
}

export interface ScoreBreakdown {
  clarity: number;
  structure: number;
  toneConsistency: number;
  platformFit: number;
  readability: number;
}

export interface EngagementScore {
  overall: number;
  breakdown: ScoreBreakdown;
  timestamp: string;
}

export interface Suggestion {
  id: string;
  category: string;
  description: string;
  recommendation: string;
  explanation: string;
  impact: 'high' | 'medium' | 'low';
}

export interface PerformanceMetrics {
  id: string;
  contentId: string;
  views: number;
  engagement: number;
  conversions: number;
  engagementRate: number;
  qualitativeFeedback: string;
  recordedAt: string;
}

// ====== DEMO USER ======
export const demoUser: User = {
  id: 'u-001',
  email: 'creator@contentos.ai',
  name: 'Alex Creator',
  preferences: {
    defaultTone: 'professional',
    preferredFormats: ['blog', 'twitter', 'linkedin'],
  },
  createdAt: '2026-02-01T10:00:00Z',
};

// ====== SAMPLE PROJECTS ======
export const sampleProjects: Project[] = [
  {
    id: 'p-001',
    userId: 'u-001',
    name: 'AI in Healthcare Blog Series',
    description: 'A comprehensive blog series exploring how AI is transforming diagnostics, drug discovery, and patient care across India.',
    archived: false,
    contentCount: 4,
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-03-07T14:30:00Z',
  },
  {
    id: 'p-002',
    userId: 'u-001',
    name: 'Startup Growth Playbook',
    description: 'Content strategy for early-stage Indian startups covering fundraising, product-market fit, and scaling.',
    archived: false,
    contentCount: 2,
    createdAt: '2026-03-01T09:00:00Z',
    updatedAt: '2026-03-06T16:00:00Z',
  },
  {
    id: 'p-003',
    userId: 'u-001',
    name: 'Sustainable Tech Newsletter',
    description: 'Weekly newsletter about green technology and sustainable innovation in the Indian tech ecosystem.',
    archived: false,
    contentCount: 1,
    createdAt: '2026-03-04T11:00:00Z',
    updatedAt: '2026-03-05T10:00:00Z',
  },
];

// ====== SAMPLE CONTENT ======
export const sampleContent: ContentPiece[] = [
  {
    id: 'c-001',
    projectId: 'p-001',
    userId: 'u-001',
    title: 'How AI is Revolutionizing Early Disease Detection in Rural India',
    body: `Artificial intelligence is no longer a futuristic concept in Indian healthcare — it's a present-day revolution. In rural India, where access to specialist doctors remains limited, AI-powered diagnostic tools are bridging critical gaps in early disease detection.

From retinal scans that detect diabetic retinopathy to chest X-ray analysis for tuberculosis, deep learning models are enabling primary health centers to offer diagnostic accuracy that was once available only in metropolitan hospitals.

Key developments include:

1. **Retinal AI Screening**: Companies like Forus Health have deployed AI-assisted retinal cameras in over 30 states, screening millions for preventable blindness.

2. **TB Detection at Scale**: AI algorithms trained on Indian patient data can now detect tuberculosis from chest X-rays with 95%+ accuracy, reducing diagnostic time from days to minutes.

3. **Maternal Health Monitoring**: Wearable devices combined with AI analysis are helping ANM workers identify high-risk pregnancies in tribal regions.

4. **Cancer Screening**: AI-powered pathology tools are enabling early detection of cervical cancer in areas where pathologists are scarce.

The impact is measurable: early detection rates in pilot districts have improved by 40%, while false negative rates have dropped by 60%.

However, challenges remain. Data privacy concerns, the need for localized training datasets, and integration with existing health infrastructure require careful navigation.

The future lies in building AI systems that are not just technically excellent but culturally sensitive and accessible to the diverse populations they serve.`,
    tone: 'professional',
    persona: null,
    stage: 'optimize',
    engagementScore: {
      overall: 72,
      breakdown: {
        clarity: 82,
        structure: 78,
        toneConsistency: 75,
        platformFit: 65,
        readability: 60,
      },
      timestamp: '2026-03-07T12:00:00Z',
    },
    publishedAt: null,
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-03-07T14:30:00Z',
    version: 5,
    metadata: {
      wordCount: 247,
      readingTime: 2,
      tags: ['AI', 'healthcare', 'India', 'diagnostics'],
    },
  },
  {
    id: 'c-002',
    projectId: 'p-001',
    userId: 'u-001',
    title: 'The Ethics of AI in Indian Healthcare',
    body: `As artificial intelligence becomes embedded in India's healthcare systems, ethical questions demand urgent attention. Who is responsible when an AI misdiagnoses? How do we ensure algorithms don't perpetuate existing biases against marginalized communities?

These aren't theoretical concerns — they're practical challenges facing every hospital deploying AI today.`,
    tone: 'educational',
    persona: null,
    stage: 'draft',
    engagementScore: null,
    publishedAt: null,
    createdAt: '2026-03-02T09:00:00Z',
    updatedAt: '2026-03-05T11:00:00Z',
    version: 2,
    metadata: {
      wordCount: 62,
      readingTime: 1,
      tags: ['AI', 'ethics', 'healthcare'],
    },
  },
  {
    id: 'c-003',
    projectId: 'p-002',
    userId: 'u-001',
    title: '5 Fundraising Myths Every Indian Founder Must Unlearn',
    body: `The Indian startup ecosystem has matured dramatically, yet many founders still operate under outdated fundraising assumptions. Here are five myths that could be holding your startup back.`,
    tone: 'conversational',
    persona: null,
    stage: 'idea',
    engagementScore: null,
    publishedAt: null,
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-03-06T16:00:00Z',
    version: 1,
    metadata: {
      wordCount: 35,
      readingTime: 1,
      tags: ['startups', 'fundraising', 'India'],
    },
  },
];

// ====== MOCK AI IDEA RESPONSES ======
export const mockIdeaTopics: Record<string, Idea[]> = {
  default: [
    {
      id: 'idea-1',
      projectId: '',
      title: 'AI-Powered Personalized Learning for Bharat',
      description: 'Explore how adaptive learning platforms are using AI to create personalized education pathways for students in tier 2 and tier 3 cities. Cover both EdTech startups and government initiatives.',
      rationale: 'Education technology is a massive growth sector in India, and personalization is the key differentiator. This topic resonates with parents, educators, and investors alike.',
      selected: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'idea-2',
      projectId: '',
      title: 'The Rise of Vernacular Content Platforms',
      description: 'Analyze the explosion of regional language content platforms in India. From ShareChat to Koo, understand why the next 500 million internet users prefer content in their mother tongue.',
      rationale: 'India has 22 scheduled languages and 780+ dialects — the vernacular internet opportunity is enormous and often underreported in English-language media.',
      selected: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'idea-3',
      projectId: '',
      title: 'How UPI Changed India\'s Digital Economy Forever',
      description: 'A deep dive into UPI\'s journey from 21 million transactions in 2016 to 12 billion+ monthly transactions today. Explore the ripple effects on MSMEs, gig workers, and rural commerce.',
      rationale: 'UPI is India\'s greatest fintech success story and has global relevance. This topic attracts readers interested in fintech, policy, and economic development.',
      selected: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'idea-4',
      projectId: '',
      title: 'Green Hydrogen: India\'s Next Big Clean Energy Bet',
      description: 'India has committed $2.3B to its National Green Hydrogen Mission. Explore the technology, economics, and geopolitical implications of India becoming a green hydrogen hub.',
      rationale: 'Climate tech is a priority for India\'s economic strategy. This topic connects technology, sustainability, and policy — appealing to a broad, educated audience.',
      selected: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'idea-5',
      projectId: '',
      title: 'Inside India\'s AI Regulation Playbook',
      description: 'As the EU implements the AI Act and the US debates regulation, India is charting its own course. Explore India\'s approach to AI governance — balancing innovation with safety.',
      rationale: 'AI regulation is one of the most debated topics globally. India\'s unique approach offers fresh perspectives for technology and policy audiences.',
      selected: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

// ====== MOCK AI SUGGESTIONS ======
export const mockSuggestions = {
  expand: {
    content: `The impact extends beyond clinical outcomes. AI-driven diagnostics are fundamentally reshaping the economics of rural healthcare delivery. A single AI-powered screening unit can process 200+ patients per day — a throughput impossible for human specialists alone.

Moreover, the cost per diagnosis has dropped by an estimated 70% in pilot programs across Rajasthan and Tamil Nadu. This cost reduction makes mass screening programs economically viable for the first time in India's healthcare history.

Community health workers (ASHAs) trained to operate AI tools report increased confidence in their diagnostic referrals, creating a positive feedback loop that strengthens the entire primary healthcare ecosystem.`,
    explanation: 'Added economic impact data, specific state examples, and human element (ASHA workers) to strengthen the narrative and make it more compelling for readers interested in healthcare delivery.',
  },
  refine: {
    content: `Artificial intelligence is transforming healthcare delivery across rural India today. Where specialist doctors are scarce, AI diagnostic tools are filling critical gaps — enabling primary health centers to match metropolitan-level diagnostic accuracy.

The results speak for themselves: 40% improvement in early detection rates and 60% reduction in false negatives across pilot districts.`,
    explanation: 'Tightened the opening paragraphs for stronger impact. Removed generic statements, led with the transformation narrative, and front-loaded the key statistics to hook readers immediately.',
  },
  rephrase: {
    content: `India\'s rural healthcare revolution has an unlikely hero: artificial intelligence. In villages where the nearest specialist might be hours away, AI is stepping in — analyzing retinal scans, reading chest X-rays, and monitoring pregnancies with remarkable precision.

This isn\'t science fiction. It\'s happening right now, in primary health centers across 30+ states.`,
    explanation: 'Rephrased with a storytelling approach to increase engagement. The "unlikely hero" framing creates intrigue, while concrete examples make the technology tangible and relatable.',
  },
};

// ====== MOCK REPURPOSED CONTENT ======
export const mockRepurposedContent = {
  twitter: {
    content: `🧵 AI is revolutionizing healthcare in rural India. Here's how:

1/ Retinal AI screening has reached 30+ states, detecting diabetic retinopathy before it causes blindness

2/ TB detection from chest X-rays now takes minutes, not days — with 95%+ accuracy

3/ AI-powered wearables help health workers identify high-risk pregnancies in tribal areas

4/ Early detection rates improved 40% in pilot districts

5/ The future: AI systems that are culturally sensitive & accessible to all of India's diverse populations 🇮🇳

#AIforBharat #HealthTech #DigitalIndia`,
    changes: [
      { type: 'structure', description: 'Split into numbered thread format', rationale: 'Twitter threads perform 3x better than single tweets for educational content' },
      { type: 'length', description: 'Condensed from 247 to 95 words', rationale: 'Twitter requires concise, scannable content' },
      { type: 'style', description: 'Added emojis and hashtags', rationale: 'Platform convention for discoverability and engagement' },
    ],
  },
  linkedin: {
    content: `AI is no longer a futuristic concept in Indian healthcare — it's a present-day revolution.

In rural India, where specialist doctors are scarce, AI-powered diagnostic tools are achieving remarkable results:

📊 40% improvement in early detection rates
📉 60% reduction in false negatives  
🏥 30+ states with AI retinal screening
⚡ TB diagnosis in minutes, not days

The technology spans retinal AI screening, chest X-ray analysis, maternal health monitoring, and cancer screening.

But here's what excites me most: this isn't just about technology. It's about equity. About ensuring that a farmer's daughter in Jharkhand has access to the same diagnostic quality as someone in Mumbai.

Challenges remain — data privacy, localized training datasets, and infrastructure integration. But the trajectory is clear.

What role do you think AI should play in making healthcare truly accessible? I'd love to hear your thoughts below.

#HealthTech #ArtificialIntelligence #DigitalIndia #Innovation`,
    changes: [
      { type: 'structure', description: 'Added statistics block, personal reflection, and CTA', rationale: 'LinkedIn rewards professional storytelling with personal perspective and engagement prompts' },
      { type: 'style', description: 'Added emoji bullets and conversational closing', rationale: 'LinkedIn best practices: visual breaks + discussion prompt drive 2x comments' },
      { type: 'length', description: 'Optimized to ~150 words', rationale: 'LinkedIn sweet spot: long enough for depth, short enough for mobile reading' },
    ],
  },
  blog: {
    content: `# How AI is Revolutionizing Early Disease Detection in Rural India

## The AI Healthcare Revolution

Artificial intelligence is no longer a futuristic concept in Indian healthcare — it's a present-day revolution. In rural India, where access to specialist doctors remains limited, AI-powered diagnostic tools are bridging critical gaps.

## Key Breakthroughs

### Retinal AI Screening
Companies like Forus Health have deployed AI-assisted retinal cameras across 30+ states, screening millions for preventable blindness.

### TB Detection at Scale  
AI algorithms trained on Indian patient data detect tuberculosis from chest X-rays with 95%+ accuracy, reducing diagnostic time from days to minutes.

### Maternal Health Monitoring
Wearable devices combined with AI are helping ANM workers identify high-risk pregnancies in tribal regions.

### Cancer Screening
AI-powered pathology tools enable early detection of cervical cancer in areas where pathologists are scarce.

## Impact by the Numbers

| Metric | Improvement |
|--------|------------|
| Early detection rates | +40% |
| False negative rates | -60% |
| States with AI screening | 30+ |
| TB diagnosis speed | Days → Minutes |

## Looking Ahead

The future lies in building AI systems that are not just technically excellent but culturally sensitive and accessible to India's diverse populations.

---

*Want to learn more about AI in Indian healthcare? Subscribe to our newsletter for weekly insights.*`,
    changes: [
      { type: 'structure', description: 'Added headings, subheadings, data table, and CTA', rationale: 'Blog format requires scannable structure with clear hierarchy' },
      { type: 'formatting', description: 'Added markdown formatting with table', rationale: 'Data tables increase credibility and scannability in blog posts' },
      { type: 'style', description: 'Added newsletter CTA', rationale: 'Standard blog best practice for reader retention' },
    ],
  },
};

// ====== MOCK OPTIMIZATION SUGGESTIONS ======
export const mockOptimizationSuggestions: Suggestion[] = [
  {
    id: 'sug-1',
    category: 'readability',
    description: 'Several sentences exceed 30 words, reducing readability for mobile readers',
    recommendation: 'Break the third paragraph into shorter sentences. Replace "AI-powered diagnostic tools are bridging critical gaps in early disease detection" with "AI diagnostic tools are closing gaps in early detection."',
    explanation: 'Shorter sentences improve comprehension by 25% on mobile devices, where 70% of content is consumed.',
    impact: 'high',
  },
  {
    id: 'sug-2',
    category: 'structure',
    description: 'Missing conclusion paragraph that ties back to the opening thesis',
    recommendation: 'Add a 2-3 sentence conclusion that reinforces the transformation narrative and includes a forward-looking statement.',
    explanation: 'Articles with strong conclusions see 35% higher completion rates and more social shares.',
    impact: 'high',
  },
  {
    id: 'sug-3',
    category: 'platformFit',
    description: 'Content lacks a compelling meta description for SEO',
    recommendation: 'Add a 155-character meta description: "Discover how AI is transforming rural Indian healthcare — from TB detection in minutes to retinal screening across 30 states."',
    explanation: 'Meta descriptions improve click-through rates from search results by up to 5.8%.',
    impact: 'medium',
  },
  {
    id: 'sug-4',
    category: 'clarity',
    description: 'Technical terms like "ANM workers" and "retinal cameras" are not explained',
    recommendation: 'Add brief parenthetical explanations: "ANM (Auxiliary Nurse Midwife) workers" and "retinal cameras (devices that photograph the back of the eye)".',
    explanation: 'Unexplained jargon alienates 40% of general readers who may not have medical background.',
    impact: 'medium',
  },
  {
    id: 'sug-5',
    category: 'toneConsistency',
    description: 'Tone shifts from formal in opening to more casual in the statistics section',
    recommendation: 'Maintain the professional analytical tone throughout. Rephrase "The impact is measurable" to "The quantitative impact is significant" for consistency.',
    explanation: 'Consistent tone builds reader trust and establishes author authority on the subject.',
    impact: 'low',
  },
];

// ====== MOCK ANALYTICS ======
export const mockAnalytics: PerformanceMetrics[] = [
  {
    id: 'pm-001',
    contentId: 'c-001',
    views: 2847,
    engagement: 423,
    conversions: 67,
    engagementRate: 14.85,
    qualitativeFeedback: 'Very informative article. Loved the data points about rural healthcare.',
    recordedAt: '2026-03-07T18:00:00Z',
  },
];

// ====== TONE PROFILES ======
export const toneProfiles = [
  { key: 'professional', name: 'Professional', icon: '💼', description: 'Formal, data-driven, authoritative' },
  { key: 'conversational', name: 'Conversational', icon: '💬', description: 'Friendly, approachable, relatable' },
  { key: 'educational', name: 'Educational', icon: '📚', description: 'Clear, structured, step-by-step' },
  { key: 'inspirational', name: 'Inspirational', icon: '✨', description: 'Motivational, aspirational, empowering' },
  { key: 'technical', name: 'Technical', icon: '⚙️', description: 'Precise, detailed, expert-level' },
];

// ====== PLATFORM FORMATS ======
export const platformFormats = [
  { key: 'blog', name: 'Blog Post', icon: '📝', maxLength: 2000, description: 'Long-form with headings, images, SEO' },
  { key: 'twitter', name: 'Twitter/X Thread', icon: '🐦', maxLength: 280, description: 'Short-form thread, hashtags, emojis' },
  { key: 'linkedin', name: 'LinkedIn Post', icon: '💼', maxLength: 700, description: 'Professional storytelling with CTA' },
];

// ====== WORKFLOW STAGES ======
export const workflowStages: { key: LifecycleStage; label: string; icon: string; description: string }[] = [
  { key: 'idea', label: 'Ideate', icon: '💡', description: 'Generate and select content ideas' },
  { key: 'draft', label: 'Draft', icon: '✍️', description: 'Write your first draft' },
  { key: 'refine', label: 'Refine', icon: '🔧', description: 'Polish with AI suggestions' },
  { key: 'optimize', label: 'Optimize', icon: '📊', description: 'Improve engagement scores' },
  { key: 'repurpose', label: 'Repurpose', icon: '🔄', description: 'Adapt for different platforms' },
  { key: 'publish', label: 'Publish', icon: '🚀', description: 'Export and publish content' },
  { key: 'analyze', label: 'Analyze', icon: '📈', description: 'Track performance metrics' },
];
