# Recall MVP - Backend Architecture
## Production-Ready API Implementation with TypeScript

**Purpose:** Complete backend specifications for building the Recall MVP API with real integrations  
**Target Audience:** AI coding agents, backend developers  
**Stack:** Node.js + TypeScript + Next.js API Routes / Express  
**Key Integrations:** ElevenLabs, OpenAI, Pinecone, PostgreSQL

---

## 1. ARCHITECTURE OVERVIEW

### System Design Philosophy
- **API-First:** Clean REST API that can serve web, mobile, and future clients
- **Async Processing:** Heavy operations (chapter generation, embeddings) run in background jobs
- **Scalability:** Designed to handle 100+ concurrent conversations
- **Type Safety:** End-to-end TypeScript for reliability

### Tech Stack

```typescript
// Runtime & Framework
Runtime: Node.js 20+ LTS
Framework: Next.js 14 API Routes (or Express if standalone)
Language: TypeScript 5.3+

// Database
Primary: PostgreSQL 15+ (Supabase managed)
ORM: Drizzle ORM
Vector DB: Pinecone (free tier → paid as we scale)

// AI Services
Voice: ElevenLabs Conversational AI SDK
LLM: OpenAI GPT-4o & GPT-4o-mini
Embeddings: OpenAI text-embedding-3-small

// Background Jobs
Queue: BullMQ + Redis (or Vercel Cron for simple setup)

// Storage
Files: AWS S3 or Vercel Blob (audio, PDFs)

// Monitoring
Logging: Winston or Pino
Errors: Sentry
Metrics: Datadog or Vercel Analytics
```

---

## 2. PROJECT STRUCTURE

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── users.ts
│   │   │   ├── sessions.ts
│   │   │   ├── chapters.ts
│   │   │   └── health.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── errorHandler.ts
│   │       └── validation.ts
│   ├── services/
│   │   ├── conversationalist/
│   │   │   ├── ConversationalistAgent.ts
│   │   │   ├── strategies/
│   │   │   │   ├── SensoryDeepeningStrategy.ts
│   │   │   │   ├── TemporalThreadingStrategy.ts
│   │   │   │   └── GracefulExitStrategy.ts
│   │   │   └── prompts.ts
│   │   ├── memory/
│   │   │   ├── MemoryService.ts
│   │   │   ├── VectorStore.ts
│   │   │   └── EntityExtractor.ts
│   │   ├── biographer/
│   │   │   ├── BiographerAgent.ts
│   │   │   ├── ChapterGenerator.ts
│   │   │   └── AudioProcessor.ts
│   │   ├── elevenlabs/
│   │   │   └── ElevenLabsClient.ts
│   │   └── openai/
│   │       ├── OpenAIClient.ts
│   │       └── embeddings.ts
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── jobs/
│   │   ├── chapterGeneration.ts
│   │   └── entityExtraction.ts
│   ├── lib/
│   │   ├── types.ts
│   │   ├── config.ts
│   │   └── utils.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

---

## 3. DATABASE SCHEMA

### Drizzle ORM Schema (`db/schema.ts`)

```typescript
import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

// Users Table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull(), // 'senior' | 'family'
  seniorId: uuid('senior_id').references(() => users.id),
  phoneNumber: varchar('phone_number', { length: 50 }),
  preferences: jsonb('preferences').$type<{
    conversationSchedule?: string[];
    voiceTone?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Sessions Table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  transcriptRaw: text('transcript_raw'), // JSON string of Message[]
  audioUrl: varchar('audio_url', { length: 512 }),
  duration: integer('duration'), // seconds
  status: varchar('status', { length: 50 }).notNull(), // 'active' | 'completed' | 'failed'
  metadata: jsonb('metadata').$type<{
    strategy_usage?: { [key: string]: number };
    avg_response_length?: number;
    sentiment_distribution?: { [key: string]: number };
  }>(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at')
});

// Chapters Table
export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 512 }).notNull(),
  content: text('content').notNull(), // Markdown
  excerpt: text('excerpt').notNull(),
  audioHighlightUrl: varchar('audio_highlight_url', { length: 512 }),
  audioDuration: integer('audio_duration'), // seconds
  pdfUrl: varchar('pdf_url', { length: 512 }),
  entities: jsonb('entities').$type<Array<{
    type: 'person' | 'place' | 'topic';
    name: string;
    mentions: number;
  }>>(),
  metadata: jsonb('metadata').$type<{
    sessionNumber: number;
    wordCount: number;
    emotionalTone: string;
    lifePeriod?: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Background Jobs Table (optional, if not using BullMQ)
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 100 }).notNull(), // 'chapter_generation', 'entity_extraction'
  status: varchar('status', { length: 50 }).notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  payload: jsonb('payload'),
  result: jsonb('result'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at')
});

// Indexes (add to migrations)
// CREATE INDEX idx_sessions_user_id ON sessions(user_id);
// CREATE INDEX idx_chapters_user_id ON chapters(user_id);
// CREATE INDEX idx_chapters_session_id ON chapters(session_id);
```

### Database Migrations

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  }
} satisfies Config;
```

```bash
# Generate migration
npx drizzle-kit generate:pg

# Run migration
npx drizzle-kit push:pg
```

---

## 4. API ENDPOINTS

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://recall-mvp.vercel.app/api`

### Authentication
For MVP: Simple API key in headers  
```typescript
headers: {
  'Authorization': 'Bearer ${API_KEY}'
}
```

Future: JWT tokens with user sessions

---

### User Endpoints

#### `POST /api/users`
Create new user account (onboarding)

**Request:**
```typescript
{
  name: string;
  email: string;
  role: 'senior' | 'family';
  seniorId?: string; // Required if role === 'family'
  phoneNumber?: string;
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}
```

**Implementation:**
```typescript
// app/api/users/route.ts
import { db } from '@/db';
import { users } from '@/db/schema';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validation
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert user
    const [newUser] = await db.insert(users).values({
      name: body.name,
      email: body.email,
      role: body.role,
      seniorId: body.seniorId,
      phoneNumber: body.phoneNumber
    }).returning();
    
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
```

#### `GET /api/users/:id`
Get user by ID

**Response:**
```typescript
{
  id: string;
  name: string;
  email: string;
  role: string;
  seniorId?: string;
  createdAt: string;
}
```

---

### Session Endpoints

#### `POST /api/sessions/start`
Start new conversation session

**Request:**
```typescript
{
  userId: string;
}
```

**Response:**
```typescript
{
  sessionId: string;
  userId: string;
  startedAt: string;
  elevenLabsConfig?: {
    agentId: string;
    conversationId: string;
  };
}
```

**Implementation:**
```typescript
// app/api/sessions/start/route.ts
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { ElevenLabsClient } from '@/services/elevenlabs/ElevenLabsClient';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    // Create session in DB
    const [session] = await db.insert(sessions).values({
      userId,
      status: 'active',
      startedAt: new Date(),
      transcriptRaw: '[]'
    }).returning();
    
    // Optional: Initialize ElevenLabs conversation
    const elevenLabs = new ElevenLabsClient();
    const conversationConfig = await elevenLabs.startConversation({
      userId,
      sessionId: session.id
    });
    
    return NextResponse.json({
      sessionId: session.id,
      userId: session.userId,
      startedAt: session.startedAt,
      elevenLabsConfig: conversationConfig
    });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: 'Failed to start session' },
      { status: 500 }
    );
  }
}
```

#### `POST /api/sessions/:id/messages`
Process message in active conversation

**Request:**
```typescript
{
  message: string;
  speaker: 'user' | 'agent';
  timestamp?: string;
}
```

**Response:**
```typescript
{
  id: string;
  speaker: 'agent';
  text: string;
  timestamp: string;
  strategy?: string; // Which questioning strategy was used
}
```

**Implementation:**
```typescript
// app/api/sessions/[id]/messages/route.ts
import { ConversationalistAgent } from '@/services/conversationalist/ConversationalistAgent';
import { MemoryService } from '@/services/memory/MemoryService';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { message, speaker } = await req.json();
    const sessionId = params.id;
    
    // Get session from DB
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    // Parse current transcript
    const transcript = JSON.parse(session.transcriptRaw || '[]');
    
    // Add user message to transcript
    transcript.push({
      id: `msg-${Date.now()}`,
      speaker,
      text: message,
      timestamp: new Date().toISOString()
    });
    
    // If user message, generate agent response
    if (speaker === 'user') {
      // Load conversation context
      const memoryService = new MemoryService();
      const context = await memoryService.retrieveContext(
        session.userId,
        message
      );
      
      // Generate agent response
      const agent = new ConversationalistAgent();
      const response = await agent.generateNextQuestion(message, {
        userId: session.userId,
        sessionId: session.id,
        history: transcript,
        memories: context
      });
      
      // Add agent response to transcript
      transcript.push({
        id: `msg-${Date.now() + 1}`,
        speaker: 'agent',
        text: response.text,
        timestamp: new Date().toISOString(),
        strategy: response.strategy
      });
      
      // Update session in DB
      await db.update(sessions)
        .set({ transcriptRaw: JSON.stringify(transcript) })
        .where(eq(sessions.id, sessionId));
      
      return NextResponse.json({
        id: `msg-${Date.now() + 1}`,
        speaker: 'agent',
        text: response.text,
        timestamp: new Date().toISOString(),
        strategy: response.strategy
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

#### `POST /api/sessions/:id/end`
End conversation and trigger chapter generation

**Response:**
```typescript
{
  success: boolean;
  sessionId: string;
  chapterId: string;
  estimatedCompletionTime: string; // ISO timestamp
}
```

**Implementation:**
```typescript
// app/api/sessions/[id]/end/route.ts
import { db } from '@/db';
import { sessions, jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    // Update session status
    await db.update(sessions)
      .set({ 
        status: 'completed',
        endedAt: new Date()
      })
      .where(eq(sessions.id, sessionId));
    
    // Queue chapter generation job
    const [job] = await db.insert(jobs).values({
      type: 'chapter_generation',
      status: 'pending',
      payload: { sessionId }
    }).returning();
    
    // Trigger background job (if using BullMQ)
    // await chapterGenerationQueue.add('generate', { sessionId });
    
    return NextResponse.json({
      success: true,
      sessionId,
      jobId: job.id,
      estimatedCompletionTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}
```

---

### Chapter Endpoints

#### `GET /api/chapters/:userId`
List all chapters for a user

**Query Params:**
- `search?: string` - Filter by title/content
- `tags?: string[]` - Filter by topics

**Response:**
```typescript
{
  chapters: Chapter[];
  total: number;
}
```

#### `GET /api/chapters/detail/:id`
Get single chapter with full content

**Response:**
```typescript
Chapter
```

---

## 5. CORE SERVICES

### 5.1 ElevenLabs Conversational AI Agent (Option A Implementation)

**As specified in MVP PRD Section 5.1**, we're using Option A for built-in turn-taking and faster implementation.

#### Key Implementation Points:
1. Inject memory context into system prompts for temporal threading
2. Handle WebSocket connection from frontend
3. Implement graceful error handling with retry logic
4. Pre-test API integration before hackathon (critical!)

```typescript
// services/elevenlabs/ElevenLabsClient.ts
import { ElevenLabsClient as ElevenLabsSDK } from 'elevenlabs';
import { MemoryService } from '@/services/memory/MemoryService';

export class ElevenLabsClient {
  private client: ElevenLabsSDK;
  private memoryService: MemoryService;
  
  constructor() {
    this.client = new ElevenLabsSDK({
      apiKey: process.env.ELEVENLABS_API_KEY!
    });
    this.memoryService = new MemoryService();
  }
  
  async startConversation(config: {
    userId: string;
    sessionId: string;
    userName: string;
  }) {
    // 1. Get memory context for temporal threading
    const memories = await this.memoryService.retrieveContext(config.userId);
    
    // 2. Build system prompt with injected memories
    const systemPrompt = `You are Recall, conducting reminiscence therapy with ${config.userName}.

MEMORY CONTEXT:
${memories. map(m => `- ${m.text}`).join('\n') || 'No previous conversations'}

STRATEGY:
- Sensory Deepening: Ask about specific sensory details
- Temporal Threading: Reference past mentions from memory context
- Graceful Exit: Wrap up if user seems tired

RULES:
- ONE question at a time (max 25 words)
- Never challenge their memory
- Warm, curious, patient tone`;

    // 3. Initialize ElevenLabs conversation
    const conversation = await this.client.conversationalAI.startConversation({
      agentId: process.env.ELEVENLABS_AGENT_ID!,
      systemPrompt,
      firstMessage: `Hi ${config.userName}, it's wonderful to talk with you today.`,
      metadata: { userId: config.userId, sessionId: config.sessionId }
    });
    
    return {
      conversationId: conversation.conversationId,
      wsUrl: conversation.websocketUrl
    };
  }
}
```

#### Error Handling with Retry Logic

```typescript
// lib/retryUtils.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      const delay = delayMs * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Usage in API routes
const conversation = await retryWithBackoff(
  () => elevenLabsClient.startConversation(config),
  3,
  1000
);
```

#### Error Handling Middleware

```typescript
// api/middleware/errorHandler.ts
export const API_ERRORS = {
  ELEVENLABS_OUTAGE: {
    userMessage: "We're having technical difficulties. Try again in 5 minutes.",
    statusCode: 503
  },
  OPENAI_RATE_LIMIT: {
    userMessage: "Our AI is busy. Retrying in 10 seconds...",
    statusCode: 429
  },
  DB_WRITE_FAILURE: {
    userMessage: "Your conversation was saved. Chapter will arrive shortly.",
    statusCode: 500
  }
};

export function handleAPIError(error: unknown): NextResponse {
  if (error instanceof Error && error.message.includes('ElevenLabs')) {
    return NextResponse.json(
      API_ERRORS.ELEVENLABS_OUTAGE,
      { status: 503 }
    );
  }
  
  return NextResponse.json(
    { userMessage: 'Something went wrong. Please try again.' },
    { status: 500 }
  );
}
```

**PRE-HACKATHON TEST (CRITICAL):**
```bash
# Test ElevenLabs integration 48 hours before hackathon
npm run test:integration -- elevenlabs

# Verify:
# 1. API key works
# 2. Agent ID is correct
# 3. WebSocket connection succeeds
# 4. Transcript webhook delivers
```

---

### 5.2 Conversationalist Agent Service

```typescript
// services/conversationalist/ConversationalistAgent.ts
import { OpenAIClient } from '@/services/openai/OpenAIClient';
import { 
  SensoryDeepeningStrategy,
  TemporalThreadingStrategy,
  GracefulExitStrategy
} from './strategies';

interface SessionContext {
  userId: string;
  sessionId: string;
  history: Message[];
  memories: Memory[];
}

export class ConversationalistAgent {
  private openai: OpenAIClient;
  private strategies: Map<string, QuestioningStrategy>;
  
  constructor() {
    this.openai = new OpenAIClient();
    this.strategies = new Map([
      ['sensory_deepening', new SensoryDeepeningStrategy()],
      ['temporal_threading', new TemporalThreadingStrategy()],
      ['graceful_exit', new GracefulExitStrategy()]
    ]);
  }
  
  async generateNextQuestion(
    userUtterance: string,
    context: SessionContext
  ): Promise<{ text: string; strategy: string }> {
    // 1. Assess user state
    const userState = this.assessUserState(userUtterance, context);
    
    // 2. Select strategy
    const strategyName = this.selectStrategy(userState, context);
    const strategy = this.strategies.get(strategyName)!;
    
    // 3. Build prompt
    const prompt = strategy.buildPrompt(userUtterance, context);
    
    // 4. Generate question
    const response = await this.openai.complete({
      messages: [
        { role: 'system', content: prompt.system },
        ...context.history.map(msg => ({
          role: msg.speaker === 'agent' ? 'assistant' : 'user',
          content: msg.text
        })),
        { role: 'user', content: userUtterance }
      ],
      temperature: 0.7,
      max_tokens: 100
    });
    
    return {
      text: response.choices[0].message.content,
      strategy: strategyName
    };
  }
  
  private assessUserState(utterance: string, context: SessionContext) {
    const words = utterance.split(/\s+/);
    
    return {
      wordCount: words.length,
      sensoryWordCount: this.countSensoryWords(words),
      sessionDuration: context.history.length,
      sentiment: this.analyzeSentiment(utterance)
    };
  }
  
  private selectStrategy(userState: any, context: SessionContext): string {
    // If user response is very brief, use sensory deepening
    if (userState.wordCount < 15 && userState.sensoryWordCount === 0) {
      return 'sensory_deepening';
    }
    
    // If we can connect to past memories, use temporal threading
    if (context.memories.length > 0) {
      return 'temporal_threading';
    }
    
    // If session is long, prepare graceful exit
    if (userState.sessionDuration > 30 && userState.wordCount < 10) {
      return 'graceful_exit';
    }
    
    // Default: sensory deepening
    return 'sensory_deepening';
  }
  
  private countSensoryWords(words: string[]): number {
    const sensoryTerms = ['smell', 'sound', 'feel', 'taste', 'look', 'color', 'texture'];
    return words.filter(w => sensoryTerms.includes(w.toLowerCase())).length;
  }
  
  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    // Simple sentiment (use proper lib like sentiment.js in production)
    const positiveWords = ['love', 'happy', 'great', 'wonderful', 'amazing'];
    const negativeWords = ['sad', 'difficult', 'hard', 'pain', 'lost'];
    
    const lower = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lower.includes(w)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}
```

### Sensory Deepening Strategy

```typescript
// services/conversationalist/strategies/SensoryDeepeningStrategy.ts
export class SensoryDeepeningStrategy {
  buildPrompt(userUtterance: string, context: SessionContext) {
    return {
      system: `You are Recall, conducting reminiscence therapy with ${context.userId}.

CURRENT STATE:
- User's last response: ${userUtterance.length} chars, brief answer
- Strategy: SENSORY DEEPENING

YOUR TASK:
Generate ONE question (max 25 words) that asks about a SPECIFIC sensory detail:
- Smell, sound, texture, visual appearance, taste
- Aim to trigger episodic memory

TONE: Warm, curious, patient. Never challenge their memory.`
    };
  }
}
```

---

### Memory Service

```typescript
// services/memory/MemoryService.ts
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIClient } from '@/services/openai/OpenAIClient';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class MemoryService {
  private pinecone: Pinecone;
  private openai: OpenAIClient;
  private index: any;
  
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });
    this.index = this.pinecone.index('recall-memories');
    this.openai = new OpenAIClient();
  }
  
  async storeConversation(sessionId: string, transcript: string): Promise<void> {
    // 1. Chunk conversation (~500 tokens each)
    const chunks = this.chunkText(transcript, 500);
    
    // 2. Generate embeddings
    const embeddings = await this.openai.createEmbeddings(
      chunks.map(c => c.text)
    );
    
    // 3. Extract metadata
    const metadata = await Promise.all(
      chunks.map(c => this.extractMetadata(c.text))
    );
    
    // 4. Upsert to Pinecone
    const vectors = chunks.map((chunk, i) => ({
      id: `${sessionId}_chunk_${i}`,
      values: embeddings[i],
      metadata: {
        sessionId,
        userId: chunk.userId,
        text: chunk.text,
        ...metadata[i]
      }
    }));
    
    await this.index.upsert(vectors);
  }
  
  async retrieveContext(
    userId: string,
    currentTopic?: string
  ): Promise<Memory[]> {
    // 1. Get recent sessions
    const recentSessions = await db.select()
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .orderBy(sessions.startedAt)
      .limit(2);
    
    const recentIds = recentSessions.map(s => s.id);
    const recentMemories = await this.index.query({
      filter: { sessionId: { $in: recentIds } },
      topK: 10,
      includeMetadata: true
    });
    
    // 2. If topic provided, semantic search
    let relatedMemories: any[] = [];
    if (currentTopic) {
      const embedding = await this.openai.createEmbedding(currentTopic);
      relatedMemories = await this.index.query({
        vector: embedding,
        filter: { userId },
        topK: 5,
        includeMetadata: true
      });
    }
    
    // 3. Combine and deduplicate
    const allMemories = [...recentMemories.matches, ...relatedMemories.matches];
    const unique = Array.from(
      new Map(allMemories.map(m => [m.id, m])).values()
    );
    
    return unique.map(m => ({
      text: m.metadata.text,
      timestamp: m.metadata.timestamp,
      entities: m.metadata.entities
    }));
  }
  
  private chunkText(text: string, tokensPerChunk: number): any[] {
    // Simple chunking (use tiktoken for accurate token count)
    const words = text.split(/\s+/);
    const chunks = [];
    
    for (let i = 0; i < words.length; i += tokensPerChunk) {
      chunks.push({
        text: words.slice(i, i + tokensPerChunk).join(' '),
        userId: 'user-id' // TODO: extract from context
      });
    }
    
    return chunks;
  }
  
  private async extractMetadata(text: string) {
    // Use GPT-4 to extract entities
    const prompt = `Extract people, places, and temporal markers from this text:
"${text}"

Return JSON: { "people": [], "places": [], "temporal_markers": [] }`;
    
    const response = await this.openai.complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
}
```

---

### Biographer Agent Service

```typescript
// services/biographer/BiographerAgent.ts
import { OpenAIClient } from '@/services/openai/OpenAIClient';
import { db } from '@/db';
import { chapters, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class BiographerAgent {
  private openai: OpenAIClient;
  
  constructor() {
    this.openai = new OpenAIClient();
  }
  
  async generateChapter(sessionId: string): Promise<string> {
    // 1. Load session transcript
    const [session] = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);
    
    if (!session) throw new Error('Session not found');
    
    const transcript = JSON.parse(session.transcriptRaw || '[]');
    
    // 2. Analyze session
    const analysis = await this.analyzeSession(transcript);
    
    // 3. Generate narrative
    const narrative = await this.generateNarrative(transcript, analysis);
    
    // 4. Create chapter in DB
    const [chapter] = await db.insert(chapters).values({
      sessionId,
      userId: session.userId,
      title: analysis.title,
      content: narrative.content,
      excerpt: narrative.content.substring(0, 150) + '...',
      entities: analysis.entities,
      metadata: {
        sessionNumber: analysis.sessionNumber,
        wordCount: narrative.wordCount,
        emotionalTone: analysis.tone,
        lifePeriod: analysis.period
      }
    }).returning();
    
    return chapter.id;
  }
  
  private async analyzeSession(transcript: Message[]) {
    const fullText = transcript.map(m => m.text).join('\n');
    
    const prompt = `Analyze this conversation transcript and extract:
1. Primary narrative arc (one-line summary)
2. Key entities (people, places, topics mentioned)
3. Emotional tone (positive/neutral/bittersweet/melancholic)
4. Life period (e.g., "1950s", "Navy Years", "Childhood")

Transcript:
${fullText}

Return JSON with: { "title", "entities": [{"type", "name", "mentions"}], "tone", "period" }`;
    
    const response = await this.openai.complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  private async generateNarrative(transcript: Message[], analysis: any) {
    const userMessages = transcript.filter(m => m.speaker === 'user');
    const fullText = userMessages.map(m => m.text).join('\n');
    
    const prompt = `Generate a biographical chapter from this conversation.

TITLE: ${analysis.title}

TRANSCRIPT:
${fullText}

REQUIREMENTS:
1. Structure: Opening paragraph (context) → Body (2-3 paragraphs with narrative) → Closing (reflection)
2. Include 1-2 verbatim quotes in italics
3. Word count: 300-500 words
4. CRITICAL: Zero fabrication - every claim must trace to transcript
5. Write in warm, literary style

OUTPUT FORMAT:
# ${analysis.title}

[Chapter content]`;
    
    const response = await this.openai.complete({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const content = response.choices[0].message.content;
    
    return {
      content,
      wordCount: content.split(/\s+/).length
    };
  }
}
```

---

## 6. BACKGROUND JOBS

### Chapter Generation Worker

```typescript
// jobs/chapterGeneration.ts
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BiographerAgent } from '@/services/biographer/BiographerAgent';
import { EmailService } from '@/services/email/EmailService';

export async function processChapterGeneration(jobId: string) {
  try {
    // Update job status
    await db.update(jobs)
      .set({ status: 'processing', startedAt: new Date() })
      .where(eq(jobs.id, jobId));
    
    // Get job payload
    const [job] = await db.select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);
    
    const { sessionId } = job.payload as any;
    
    // Generate chapter
    const biographer = new BiographerAgent();
    const chapterId = await biographer.generateChapter(sessionId);
    
    // Send email notification
    const emailService = new EmailService();
    await emailService.sendChapterNotification(chapterId);
    
    // Update job as completed
    await db.update(jobs)
      .set({ 
        status: 'completed',
        result: { chapterId },
        completedAt: new Date()
      })
      .where(eq(jobs.id, jobId));
  } catch (error) {
    // Mark job as failed
    await db.update(jobs)
      .set({ 
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      })
      .where(eq(jobs.id, jobId));
    
    throw error;
  }
}
```

---

## 7. EXTERNAL SERVICE INTEGRATIONS

### OpenAI Client

```typescript
// services/openai/OpenAIClient.ts
import OpenAI from 'openai';

export class OpenAIClient {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }
  
  async complete(params: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
    response_format?: any;
  }) {
    return await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: params.messages as any,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 500,
      response_format: params.response_format
    });
  }
  
  async createEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    
    return response.data[0].embedding;
  }
  
  async createEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts
    });
    
    return response.data.map(d => d.embedding);
  }
}
```

### ElevenLabs Client

```typescript
// services/elevenlabs/ElevenLabsClient.ts
import { ElevenLabsClient as ElevenLabsSDK } from 'elevenlabs';

export class ElevenLabsClient {
  private client: ElevenLabsSDK;
  
  constructor() {
    this.client = new ElevenLabsSDK({
      apiKey: process.env.ELEVENLABS_API_KEY!
    });
  }
  
  async startConversation(params: {
    userId: string;
    sessionId: string;
  }) {
    // Initialize conversational AI session
    const conversation = await this.client.conversationalAI.startConversation({
      agentId: process.env.ELEVENLABS_AGENT_ID!,
      metadata: {
        userId: params.userId,
        sessionId: params.sessionId
      }
    });
    
    return {
      agentId: conversation.agentId,
      conversationId: conversation.conversationId
    };
  }
}
```

---

## 8. ENVIRONMENT VARIABLES

```bash
# .env
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/recall_mvp

# OpenAI
OPENAI_API_KEY=sk-...

# ElevenLabs
ELEVENLABS_API_KEY=...
ELEVENLABS_AGENT_ID=...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=recall-memories

# AWS S3 (or Vercel Blob)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=recall-mvp-storage

# Email (Resend)
RESEND_API_KEY=...
FROM_EMAIL=chapters@recall.app

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379
```

---

## 9. DEPLOYMENT

### Vercel Deployment (Recommended for MVP)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Docker Deployment (Alternative)

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 10. TESTING STRATEGY

### Unit Tests
```typescript
// tests/unit/ConversationalistAgent.test.ts
import { ConversationalistAgent } from '@/services/conversationalist/ConversationalistAgent';

describe('ConversationalistAgent', () => {
  it('should select sensory deepening for brief responses', async () => {
    const agent = new ConversationalistAgent();
    const response = await agent.generateNextQuestion('I worked there', {
      userId: 'test-user',
      sessionId: 'test-session',
      history: [],
      memories: []
    });
    
    expect(response.strategy).toBe('sensory_deepening');
  });
});
```

---

## 11. MONITORING & LOGGING

```typescript
// lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Usage
logger.info({ userId: '123', sessionId: '456' }, 'Session started');
logger.error({ error: err }, 'Failed to generate chapter');
```

---

**END OF BACKEND ARCHITECTURE**

This document provides a production-ready backend implementation with real AI integrations, database schema, API design, and deployment instructions. All code is TypeScript-first and follows best practices for scalability and maintainability.
