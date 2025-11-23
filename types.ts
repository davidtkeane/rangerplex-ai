
export enum Sender {
  USER = 'user',
  AI = 'ai',
}

// We keep the Enum for "Quick Access" / defaults, but we will allow string overrides
export enum ModelType {
  // Gemini (Future & Latest Series)
  GEMINI_3_PRO = 'gemini-3-pro',
  GEMINI_3_PREVIEW = 'gemini-3-pro-preview',
  GEMINI_2_5_PRO = 'gemini-2.5-pro',
  FAST = 'gemini-2.5-flash',
  GEMINI_2_5_LITE = 'gemini-2.5-flash-lite',
  REASONING = 'gemini-2.0-flash-thinking-exp-01-21',
  DEEP_RESEARCH = 'gemini-3-pro-preview', // Use 3.0 Preview for deep research
  GEMINI_2_FLASH = 'gemini-2.0-flash',

  // Agentic
  MULTI_AGENT = 'multi-agent-council',

  // Local
  LOCAL = 'local-llm',

  // OpenAI (Future & Latest Series)
  GPT_4_1 = 'gpt-4.1',
  GPT_4_1_MINI = 'gpt-4.1-mini',
  GPT4O = 'gpt-4o',
  GPT4O_MINI = 'gpt-4o-mini',
  O1 = 'o1',
  O1_MINI = 'o1-mini',
  O3_MINI = 'o3-mini',

  // Anthropic (Claude 4 - Latest 2025)
  CLAUDE_SONNET_4_5 = 'claude-sonnet-4-5-20250929', // Newest Sonnet 4.5!
  CLAUDE_HAIKU_4_5 = 'claude-haiku-4-5-20251001', // Newest Haiku 4.5!
  CLAUDE_OPUS_4_1 = 'claude-opus-4-1-20250805', // Most Powerful Opus 4.1!
  CLAUDE_SONNET_4 = 'claude-sonnet-4-20250514', // Legacy Sonnet 4
  CLAUDE_OPUS_4 = 'claude-opus-4-20250514', // Legacy Opus 4

  // Anthropic (Claude 3 - Legacy)
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-20250219', // Claude 3.7 Sonnet
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022', // Claude 3.5 Sonnet (Popular!)
  CLAUDE_3_5_HAIKU = 'claude-3-5-haiku-20241022', // Claude 3.5 Haiku
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307', // Claude 3 Haiku

  // Perplexity
  PERPLEXITY_SONAR = 'sonar',
  PERPLEXITY_SONAR_PRO = 'sonar-pro',
  PERPLEXITY_REASONING = 'sonar-reasoning-pro',

  // Hugging Face
  HF_LLAMA3_70B = 'meta-llama/Meta-Llama-3-70B-Instruct',
  HF_MISTRAL = 'mistralai/Mistral-7B-Instruct-v0.3',
  HF_QWEN_2_5 = 'Qwen/Qwen2.5-72B-Instruct',

  // xAI (Grok)
  GROK_2 = 'grok-2-1212',
  GROK_2_VISION = 'grok-2-vision-1212',
  GROK_BETA = 'grok-beta'
}

export interface GroundingSource {
  title?: string;
  uri?: string;
}

export interface Attachment {
  mimeType: string;
  data: string; // base64
  name: string;
  size?: number;
}

export interface DocumentChunk {
  id: string;
  text: string;
  embedding: number[];
  source: string;
}

export interface MessageStats {
  model: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ScriptOutput {
  output: string;
  error?: string;
}

export interface Feedback {
  rating: 'up' | 'down';
  reason?: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  provider: 'dall-e-3' | 'imagen-3' | 'flux-1' | 'grok';
  revisedPrompt?: string;
}

export interface AudioData {
  url: string; // Blob URL
  duration?: number;
  transcript?: string;
}

export interface ArtifactData {
  id: string;
  type: 'html' | 'react';
  title: string;
  code: string;
}

export interface Message {
  id: string;
  sender: Sender;
  agentName?: string;
  agentColor?: string;
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  isThinking?: boolean; // Loading state
  thoughtProcess?: string; // The actual chain of thought text
  groundingSources?: GroundingSource[];
  contextUsed?: DocumentChunk[];
  stats?: MessageStats;
  scriptOutput?: ScriptOutput; // For Code Interpreter
  feedback?: Feedback;
  generatedImages?: GeneratedImage[];
  audioData?: AudioData;
  artifact?: ArtifactData;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  updatedAt: number;
  knowledgeBase: DocumentChunk[];
  isStarred?: boolean;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error';
  type: 'websocket' | 'stdio' | 'internal';
}

export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  color: string;
  systemInstruction: string;
  model: string;
  temperature: number;
}

export interface ModelParams {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  systemPromptOverride?: string;
}

export interface SavedPrompt {
  id: string;
  trigger: string; // e.g. "/fix"
  text: string;
}

export interface CommandState {
  web: boolean;
  visual: boolean;
  flash: boolean;
  deep: boolean;
}

export interface VoiceConfig {
  provider: 'browser' | 'openai' | 'elevenlabs';
  voiceId: string; // "Rachel" or specific ID
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CNY' | 'CAD' | 'AUD';

export interface AppSettings {
  // Keys
  geminiApiKey: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  perplexityApiKey?: string;
  braveApiKey?: string;
  elevenLabsApiKey?: string;
  huggingFaceApiKey?: string;
  xaiApiKey?: string; // Grok

  // Config
  corsProxyUrl?: string;
  ollamaBaseUrl: string;
  ollamaModelId: string;

  // Lists (Cached)
  availableModels: {
    gemini: string[];
    openai: string[];
    anthropic: string[];
    ollama: string[];
    huggingface: string[];
    grok: string[];
  };

  // Agents
  councilAgents: AgentConfig[];

  mcpServers: MCPServerConfig[];

  // UI
  userAvatar?: string;
  aiAvatar?: string;
  loginBackgroundImage?: string;
  theme: 'dark' | 'light' | 'tron';
  matrixMode: boolean;
  autoHideModelSelector: boolean;
  enableWebSearchForLLMs: boolean;
  enableDuckDuckGo: boolean;
  enableVoiceResponse: boolean;
  enableCloudSync: boolean;
  currency: Currency;

  // Media
  voiceConfig: VoiceConfig;

  // Advanced
  modelParams: ModelParams;
  savedPrompts: SavedPrompt[];
  // Security / Prank Mode
  securityMode: 'none' | 'bribe' | 'hacker' | 'time' | 'panic' | 'escape';
  lockScreenEnabled: boolean;
  ollamaLoadingEffect: 'neural' | 'terminal' | 'pulse' | 'none';

  // Ranger Vision Mode
  visionModeEnabled: boolean;
  visionModeAutoActivate: boolean;
  visionModeIdleTime: number; // minutes
  visionModeShowClock: boolean;
  holidayMode: boolean;
  celebrationEffects: boolean;
  showHeaderControls: boolean;
  holidayEffect: 'snow' | 'confetti' | 'sparkles';
  useStudyNotesInChat: boolean;

  // Ranger Radio
  radioEnabled: boolean;
  radioAutoPlay: boolean;
  radioVolume: number; // 0.0 to 1.0
  radioLastStation: string | null; // station ID
  radioMinimized: boolean;
}

export const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: 'researcher',
    name: "Lead Researcher",
    role: "fact-gatherer",
    color: "bg-blue-600",
    systemInstruction: "You are a Lead Researcher. Your goal is to provide comprehensive, factual, and well-sourced information. Focus on accuracy and breadth of data.",
    model: ModelType.FAST,
    temperature: 0.3
  },
  {
    id: 'skeptic',
    name: "The Skeptic",
    role: "critic",
    color: "bg-red-600",
    systemInstruction: "You are a Critical Reviewer (The Skeptic). Your job is to analyze research for bias, logical fallacies, or missing perspectives. Play Devil's Advocate.",
    model: ModelType.FAST,
    temperature: 0.7
  },
  {
    id: 'synthesizer',
    name: "The Synthesizer",
    role: "mediator",
    color: "bg-purple-600",
    systemInstruction: "You are the Creative Synthesizer. Your job is to read the Research and the Criticism, and produce a final, balanced, and innovative conclusion.",
    model: ModelType.FAST,
    temperature: 0.6
  }
];

export const DEFAULT_SAVED_PROMPTS: SavedPrompt[] = [
  { id: '1', trigger: 'rewrite', text: 'Rewrite the following text to be more professional and concise:' },
  { id: '2', trigger: 'code', text: 'Analyze the following code for bugs and performance improvements:' },
  { id: '3', trigger: 'summarize', text: 'Summarize the following content into bullet points:' },
  { id: '4', trigger: 'eli5', text: 'Explain this concept like I am 5 years old:' },
  { id: '5', trigger: 'news', text: 'What is the latest news on:' },
  { id: '6', trigger: 'outline', text: 'Create a structured outline with headings and bullets for:' },
  { id: '7', trigger: 'email', text: 'Draft a friendly email about:' },
  { id: '8', trigger: 'spec', text: 'Write a short product spec with goals, non-goals, and acceptance criteria for:' },
  { id: '9', trigger: 'qa', text: 'Generate test cases and edge cases for:' },
  { id: '10', trigger: 'bugs', text: 'List potential bugs and mitigations for this feature:' },
  { id: '11', trigger: 'perf', text: 'Suggest performance optimizations for:' },
  { id: '12', trigger: 'migrate', text: 'Plan a migration steps list (phased) for moving from X to Y:' },
  { id: '13', trigger: 'prompt', text: 'Improve this prompt for clarity, constraints, and explicit outputs:' },
  { id: '14', trigger: 'meeting', text: 'Summarize this meeting transcript into action items and owners:' },
  { id: '15', trigger: 'debate', text: 'List pros/cons and a recommendation for:' },
  { id: '16', trigger: 'study', text: 'Create study notes with key ideas, examples, and mnemonics for:' },
  { id: '17', trigger: 'compare', text: 'Compare two options across criteria (cost, speed, quality, risk):' },
  { id: '18', trigger: 'roadmap', text: 'Draft a 3-phase roadmap with milestones and risks for:' },
  { id: '19', trigger: 'sql', text: 'Write SQL queries for these requirements (assume common sense schema if missing):' },
  { id: '20', trigger: 'regex', text: 'Write a regex that matches:' }
];

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  anthropicApiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
  perplexityApiKey: import.meta.env.VITE_PERPLEXITY_API_KEY || '',
  braveApiKey: import.meta.env.VITE_BRAVE_SEARCH_API_KEY || '',
  elevenLabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',
  huggingFaceApiKey: import.meta.env.VITE_HUGGINGFACE_ACCESS_TOKEN || '',
  xaiApiKey: import.meta.env.VITE_GROK_API_KEY || '',
  corsProxyUrl: 'http://localhost:3010',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModelId: 'llama3',

  availableModels: {
    gemini: [
      'gemini-3-pro',
      'gemini-3-pro-preview',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-thinking-exp-01-21'
    ],
    openai: [
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4o',
      'gpt-4o-mini',
      'o1',
      'o1-mini',
      'o3-mini'
    ],
    anthropic: [
      'claude-sonnet-4-5-20250929',  // Sonnet 4.5 (Latest!)
      'claude-haiku-4-5-20251001',   // Haiku 4.5 (Latest!)
      'claude-opus-4-1-20250805',    // Opus 4.1 (Latest!)
      'claude-sonnet-4-20250514',    // Sonnet 4 (Legacy)
      'claude-opus-4-20250514',      // Opus 4 (Legacy)
      'claude-3-7-sonnet-20250219',  // Claude 3.7 Sonnet
      'claude-3-5-sonnet-20241022',  // Claude 3.5 Sonnet (Popular!)
      'claude-3-5-haiku-20241022',   // Claude 3.5 Haiku
      'claude-3-haiku-20240307'      // Claude 3 Haiku
    ],
    ollama: ['deepseek-coder:6.7b', 'llama3.2', 'mistral', 'deepseek-r1'],
    huggingface: [
      'meta-llama/Meta-Llama-3.1-70B-Instruct',
      'mistralai/Mistral-Large-Instruct-2411',
      'Qwen/Qwen2.5-72B-Instruct'
    ],
    grok: [
      'grok-2-1212',
      'grok-2-vision-1212',
      'grok-beta'
    ]
  },

  councilAgents: DEFAULT_AGENTS,

  mcpServers: [
    { id: 'internal-firecrawl', name: 'Built-in Firecrawl (HTML Parser)', url: 'internal', status: 'connected', type: 'internal' },
    { id: 'internal-researcher', name: 'Built-in Auto Researcher', url: 'internal', status: 'connected', type: 'internal' }
  ],
  theme: 'dark',
  matrixMode: false,
  autoHideModelSelector: true,
  enableWebSearchForLLMs: true,
  enableDuckDuckGo: true,
  enableVoiceResponse: false,
  enableCloudSync: true, // ✅ ENABLED by default - saves to server + IndexedDB for data persistence
  currency: 'USD',

  voiceConfig: {
    provider: 'browser',
    voiceId: ''
  },

  modelParams: {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192
  },

  savedPrompts: DEFAULT_SAVED_PROMPTS,

  securityMode: 'hacker',
  lockScreenEnabled: false,
  ollamaLoadingEffect: 'terminal',

  visionModeEnabled: true,
  visionModeAutoActivate: true,
  visionModeIdleTime: 5,
  visionModeShowClock: true,

  holidayMode: false,
  celebrationEffects: true,
  showHeaderControls: true,
  holidayEffect: 'snow',
  useStudyNotesInChat: true,

  radioEnabled: false,
  radioAutoPlay: false,
  radioVolume: 0.3,
  radioLastStation: 'soma-defcon', // 💻 DEF CON Radio - Music for hacking and coding
  radioMinimized: true
};

export interface TrainingExample {
  messages: {
    role: "user" | "model" | "system";
    content: string;
  }[];
}

// Model capabilities helper - returns icons/badges for model features
export interface ModelCapabilities {
  vision: boolean;      // Can analyze uploaded images
  reasoning: boolean;   // Advanced reasoning (o1, o3, etc.)
  speed: 'fast' | 'balanced' | 'powerful';
  imageGen: boolean;    // Can generate images (Note: handled by separate /imagine service)
}

export const getModelCapabilities = (modelId: string): ModelCapabilities => {
  const defaults: ModelCapabilities = {
    vision: false,
    reasoning: false,
    speed: 'balanced',
    imageGen: false // Note: Image generation is handled by DALL-E/Imagen/Flux via /imagine
  };

  // OpenAI Models
  if (modelId.includes('gpt-4o')) return { ...defaults, vision: true, speed: 'balanced' };
  if (modelId.includes('gpt-4.1')) return { ...defaults, vision: true, speed: 'balanced' };
  if (modelId.includes('o1') || modelId.includes('o3')) return { ...defaults, reasoning: true, speed: 'powerful' };

  // Anthropic (Claude) - All Claude 3+ have vision
  if (modelId.includes('claude')) {
    const caps: ModelCapabilities = { ...defaults, vision: true };
    if (modelId.includes('haiku')) caps.speed = 'fast';
    else if (modelId.includes('opus')) caps.speed = 'powerful';
    else caps.speed = 'balanced'; // Sonnet
    return caps;
  }

  // Gemini Models
  if (modelId.includes('gemini')) {
    const caps: ModelCapabilities = { ...defaults, vision: true };
    if (modelId.includes('flash')) caps.speed = 'fast';
    else if (modelId.includes('pro')) caps.speed = 'powerful';
    else caps.speed = 'balanced';
    return caps;
  }

  // Perplexity
  if (modelId.includes('sonar')) return { ...defaults, speed: 'fast' };

  // Grok
  if (modelId.includes('grok')) {
    if (modelId.includes('vision')) return { ...defaults, vision: true, speed: 'balanced' };
    return { ...defaults, speed: 'balanced' };
  }

  // Local/Ollama
  if (modelId.includes('deepseek') || modelId.includes('llama') || modelId.includes('mistral')) {
    return { ...defaults, speed: 'fast' };
  }

  return defaults;
};

export const getModelBadges = (modelId: string): string => {
  const caps = getModelCapabilities(modelId);
  const badges: string[] = [];

  if (caps.vision) badges.push('👁️');
  if (caps.reasoning) badges.push('🧠');
  if (caps.speed === 'fast') badges.push('⚡');
  if (caps.speed === 'powerful') badges.push('💎');

  return badges.join(' ');
};
