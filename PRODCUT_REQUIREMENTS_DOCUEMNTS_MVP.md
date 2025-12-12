# Product Requirements Document: Recall MVP
## The AI Memory Companion - Hackathon Edition

**Version:** 1.0 MVP  
**Last Updated:** December 2025  
**Product Type:** B2C AI Voice Platform (Demo/Hackathon Build)  
**Primary Channel:** ElevenLabs Conversational AI  
**Tech Stack:** TypeScript/Node.js Full Stack  
**Timeline:** 2-3 Day Hackathon Build

---

## EXECUTIVE SUMMARY

### Product Thesis
Recall is an AI-powered voice companion that engages seniors in meaningful conversations to preserve their life stories and provide therapeutic reminiscence experiences. Unlike passive memory apps, Recall proactively asks intelligent questions, remembers previous conversations, and autonomously creates beautiful narrative chapters for families.

### MVP Scope (Hackathon Focus)
This MVP focuses on **demonstrating the core conversation and memory preservation loop** in a fully functional prototype. We're building a **proof of concept** that shows:

1. **Adaptive voice conversations** with real-time question strategy selection
2. **Semantic memory storage** that enables context-aware follow-ups
3. **Autonomous narrative generation** from raw conversations
4. **Family-facing artifacts** (text chapters + audio highlights)

### What's OUT of Scope for MVP
- B2B sales features and facility management
- Payment/subscription system  
- Mobile apps (web-based only)
- Multi-language support
- Advanced analytics dashboard
- Clinical outcome tracking
- Complex scheduling system (simple manual triggering for demo)

### Success Criteria
✅ Complete end-to-end demo: conversation → memory storage → chapter generation  
✅ 15-20 minute conversation with adaptive questioning  
✅ Memory persists across multiple sessions  
✅ Professional-quality chapter delivered to "family member"  
✅ Sub-2-second response latency during conversation

---

## 1. PROBLEM STATEMENT

### Primary Problem
**Cognitive decline without intervention** - 6.7M Americans live with Alzheimer's. Reminiscence therapy shows 23% improvement in autobiographical memory, but requires expensive therapists ($100-150/session).

### Secondary Problem  
**Lost family history** - 78% of families report significant memory loss when elderly relatives pass. Passive memory capture tools have <10% completion rates.

### Our Solution
Autonomous AI agent that delivers structured reminiscence therapy through natural voice conversations, at <$3/session equivalent cost.

---

## 2. USER PERSONAS

### Primary: Arthur (The Senior)
- **Age:** 75-85 years old
- **Tech:** Comfortable with basic web browser (Chrome/Edge)
- **State:** Healthy aging or mild cognitive impairment
- **Goal:** Share life stories without burdening family
- **Pain:** Loneliness, fear of being forgotten

**Success Metric:** "I look forward to our conversations"

### Secondary: Sarah (The Adult Child)
- **Age:** 50-60 years old
- **Relationship:** Daughter managing father's care
- **Goal:** Preserve Dad's stories before it's too late
- **Pain:** Guilt about not spending enough time, regret prevention

**Success Metric:** Receives weekly chapters that capture Dad's authentic voice

---

## 3. CORE MVP FEATURES

### 3.1 Voice Conversation System

#### Capabilities
- **Real-time voice conversation** powered by ElevenLabs Conversational AI
- **Adaptive questioning** with 3 core strategies:
  - **Sensory Deepening:** "What did the factory smell like?"
  - **Temporal Threading:** Connects current topic to past mentions
  - **Graceful Exit:** Detects fatigue and ends naturally
  
#### Technical Requirements
- **Latency:** <2 second response time
- **Voice Quality:** Natural, warm, patient tone
- **Session Duration:** 15-20 minutes optimal
- **Interruption Handling:** Agent stops when user speaks

#### User Flow
1. User clicks "Start Conversation" button in web app
2. Browser initiates WebRTC/WebSocket connection to ElevenLabs
3. Agent greets user: "Hi Arthur, it's wonderful to talk with you today. What's been on your mind lately?"
4. Conversation flows naturally with context-aware questions
5. Agent gracefully closes: "Thank you for sharing these wonderful memories today"

---

### 3.2 Semantic Memory System

#### Architecture
**Vector-based storage** using embeddings for semantic search (NOT rigid entity graphs).

#### Storage Schema
```typescript
interface ConversationChunk {
  chunkId: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  text: string; // ~500 token segment
  embedding: number[]; // 1536-dim vector
  metadata: {
    peopleeMentioned: string[];
    placesMentioned: string[];
    temporalMarkers: string[];
    emotionalValence: 'positive' | 'negative' | 'neutral' | 'bittersweet';
    topicTags: string[];
  };
}
```

#### Pre-Conversation Context Retrieval
Before each session, system loads:
1. **Recent context:** Last 2 sessions (10 chunks)
2. **Semantic similarity:** Related memories from any session
3. **Gap detection:** Under-explored life phases

#### Memory Contradiction Handling
**Critical Rule:** NEVER challenge the user's memory
- Store both versions with timestamps
- Active narrative uses most recent version
- Log contradictions for family context only

**Example:**
- Session 1: "I bought the Chevy in Spring 1960"  
- Session 5: "It was Fall of '62"  
- Agent Response: "Fall of '62... I can picture the leaves changing. Did you drive it off the lot that day?"

---

### 3.3 Biography Generation

#### Autonomous Chapter Creation (30-minute SLA)

**Step 1: Session Analysis (5 min)**
- Identify primary narrative arc ("Arthur's first job as a mechanic")
- Extract key entities (people, places, dates)
- Detect emotional peaks (vivid quotes)

**Step 2: Quote Selection (5 min)**
Criteria:
- Emotionally resonant (laughter, tears)
- Vivid sensory detail
- 10-30 seconds of audio

**Step 3: Narrative Synthesis (15 min)**
```markdown
# [Chapter Title]

[OPENING: 1 paragraph - When/where, why significant]

[BODY: 2-3 paragraphs - Chronological narrative with facts, sensory details, emotions]
- Include 1-2 verbatim quotes in italics
- Reference previous chapters if relevant

[CLOSING: 1 paragraph - Reflection on meaning/values]

Word Count: 300-500 words
```

**Step 4: Distribution (5 min)**
- Email to family with:
  - Text chapter (embedded + PDF)
  - Audio highlight (30-60s MP3)
  - Metadata footer

---

### 3.4 MVP User Flows

#### Flow 1: First Conversation (New User)
```
1. Sarah (family) creates account for Arthur
2. Sarah enters: Name, relationship, email
3. System sends Arthur link: "Ready to share your stories?"
4. Arthur clicks → web app opens
5. Brief intro: "I'm Recall, here to learn about your life"
6. 15-min conversation (general life phase: childhood, career, family)
7. Session ends → Chapter generated → Emailed to Sarah within 30 min
```

#### Flow 2: Subsequent Conversation (Returning User)
```
1. Arthur clicks "Continue Conversation" 
2. System loads recent context (last session)
3. Agent: "Last time you mentioned the Ford plant. Want to tell me more about Bill, the foreman?"
4. Conversation flows with temporal threading
5. New chapter references previous chapters
```

#### Flow 3: Family Member Views Chapters
```
1. Sarah opens email notification
2. Reads chapter with embedded audio player
3. Clicks "View All Chapters" → Family portal
4. Portal shows:
   - Timeline of all chapters
   - Entity index (people, places mentioned)
   - Search functionality
```

---

## 4. MVP TECH STACK (TypeScript Only)

### Frontend
```typescript
Framework: Next.js 14 (App Router)
Language: TypeScript
UI: React + Tailwind CSS + shadcn/ui
State: Zustand (lightweight global state)
Audio: ElevenLabs Web SDK + WebRTC
Deployment: Vercel
```

### Backend (API)
```typescript
Runtime: Node.js 20+
Framework: Next.js API Routes (serverless functions)
Language: TypeScript
Validation: Zod
HTTP Client: node-fetch / axios
Background Jobs: Vercel Cron (for demo) or BullMQ (if self-hosted)
```

### Database
```typescript
Primary DB: PostgreSQL (Supabase managed)
ORM: Drizzle ORM (lightweight, TypeScript-first)
Vector DB: Pinecone (managed, free tier)
```

### AI Services
```typescript
Voice AI: ElevenLabs Conversational AI
LLM: OpenAI GPT-4o (conversation + chapter generation)
Embeddings: OpenAI text-embedding-3-small
```

### Infrastructure
```typescript
Hosting: Vercel (frontend + API)
Storage: S3 or Vercel Blob (audio files, PDFs)
Email: Resend (transactional emails)
Monitoring: Vercel Analytics + Sentry
```

---

## 5. MVP TECHNICAL IMPLEMENTATION

### 5.1 ElevenLabs Integration Architecture (CRITICAL DESIGN DECISION)

#### Chosen Approach: **Option A - Conversational AI Agent**

ElevenLabs offers two integration paths. We're using **Option A** for the MVP because it provides built-in turn-taking and lower latency.

**Option A: Conversational AI Agent (Agent-based)**
- ✅ **Pros:** Built-in turn-taking, sub-second latency, handles interruptions
- ❌ **Cons:** Limited prompt control compared to full custom solution
- **Use Case:** When you want ElevenLabs to handle conversation flow management
- **Estimated Time:** 4-6 hours integration

**Option B: Text-to-Speech API + Custom VAD** *(Fallback only)*
- ✅ **Pros:** Full control over conversation logic and prompt engineering
- ❌ **Cons:** Must implement turn-taking, VAD, interruption handling yourself
- **Use Case:** If Option A's prompts prove insufficient for strategy switching
- **Estimated Time:** 12+ hours (significant complexity)

#### Implementation Workflow (Option A)

```typescript
// 1. User clicks "Start Conversation"
// Frontend creates ElevenLabs agent session

const elevenLabsConfig = {
  agentId: process.env.ELEVENLABS_AGENT_ID!,
  systemPrompt: `You are Recall, conducting reminiscence therapy with ${userName}.
  
  CURRENT MEMORY CONTEXT:
  ${memoryContext}
  
  STRATEGY: Use sensory deepening - ask about specific sensory details (smell, sound, texture).
  
  Tone: Warm, curious, patient. Never challenge their memory.`,
  
  firstMessage: "Hi Arthur, it's wonderful to talk with you today. What's been on your mind lately?"
};

// 2. Agent's system prompt includes:
//    - Current memory context (last 2 sessions)
//    - Strategic directive (sensory deepening, temporal threading, etc.)

// 3. User speaks → ElevenLabs transcribes + generates response
//    - Agent handles turn-taking automatically
//    - Streams audio back to frontend

// 4. Backend receives transcript webhook → extracts entities asynchronously
```

#### Fallback Plan (If Prompts Insufficient)

**If** ElevenLabs Agent doesn't support dynamic prompt updates or strategy switching:

1. **Immediate Workaround (Day 1):** Use single "general reminiscence" prompt for demo
2. **Day 2 Pivot Decision:** Evaluate if we have time to downgrade to Option B
3. **Estimated Impact:** +8 additional hours if we pivot to custom TTS + VAD

**Mitigation:** Pre-test ElevenLabs Agent prompt flexibility in Week Before Hackathon (see Section 12)

#### Technical Specifications

| Component | Technology | Requirement |
|-----------|-----------|-------------|
| **Voice Input** | ElevenLabs Conversational AI | WebRTC connection, <500ms latency |
| **Transcription** | ElevenLabs built-in STT | Real-time transcript webhook |
| **Response Generation** | ElevenLabs Agent (GPT-4 powered) | Custom system prompts |
| **Voice Output** | ElevenLabs TTS | Natural, warm voice (e.g., "Sarah" voice) |
| **Turn-Taking** | ElevenLabs VAD | Automatic interruption detection |

---

### 5.2 Core Services Architecture

```typescript
// Conversationalist Agent Service
class ConversationalistAgent {
  async generateNextQuestion(
    userUtterance: string,
    sessionContext: SessionContext
  ): Promise<string> {
    // 1. Assess user state (word count, sentiment)
    const userState = await this.assessUserState(userUtterance);
    
    // 2. Select questioning strategy
    const strategy = this.selectStrategy(userState, sessionContext);
    
    // 3. Load relevant memories
    const memories = await this.memoryService.retrieveContext(
      sessionContext.userId,
      userUtterance
    );
    
    // 4. Generate question via LLM
    const question = await this.llm.complete({
      strategy,
      memories,
      conversationHistory: sessionContext.history
    });
    
    return question;
  }
}
```

```typescript
// Memory Service
class MemoryService {
  async storeConversation(
    sessionId: string,
    transcript: string
  ): Promise<void> {
    // 1. Chunk conversation (~500 tokens each)
    const chunks = this.chunkText(transcript);
    
    // 2. Generate embeddings
    const embeddings = await this.openai.createEmbeddings(chunks);
    
    // 3. Extract metadata (entities, sentiment)
    const metadata = await this.extractMetadata(chunks);
    
    // 4. Store in vector DB
    await this.pinecone.upsert({
      vectors: embeddings.map((emb, i) => ({
        id: `${sessionId}_chunk_${i}`,
        values: emb,
        metadata: metadata[i]
      }))
    });
  }
  
  async retrieveContext(
    userId: string,
    currentTopic?: string
  ): Promise<Memory[]> {
    // Recent context (last 2 sessions)
    const recent = await this.getRecentSessions(userId, 2);
    
    // Semantic search (if topic provided)
    let related = [];
    if (currentTopic) {
      const topicEmbedding = await this.openai.embed(currentTopic);
      related = await this.pinecone.query({
        vector: topicEmbedding,
        topK: 5,
        filter: { userId }
      });
    }
    
    return [...recent, ...related];
  }
}
```

```typescript
// Biographer Agent Service
class BiographerAgent {
  async generateChapter(sessionId: string): Promise<Chapter> {
    // 1. Load session transcript
    const session = await this.db.getSession(sessionId);
    
    // 2. Analyze session
    const analysis = await this.analyzeSession(session.transcript);
    
    // 3. Select best quotes
    const quotes = await this.selectQuotes(session.transcript, analysis);
    
    // 4. Generate narrative via LLM
    const narrative = await this.llm.complete({
      systemPrompt: CHAPTER_GENERATION_PROMPT,
      context: {
        transcript: session.transcript,
        analysis,
        quotes,
        previousChapters: await this.getPreviousChapters(session.userId)
      }
    });
    
    // 5. Extract audio highlights
    const audioHighlight = await this.extractAudioClip(
      session.audioUrl,
      quotes[0].timestamp
    );
    
    // 6. Create PDF
    const pdf = await this.generatePDF(narrative);
    
    // 7. Store chapter
    const chapter = await this.db.createChapter({
      sessionId,
      userId: session.userId,
      title: analysis.primaryNarrativeArc,
      content: narrative,
      audioUrl: audioHighlight,
      pdfUrl: pdf
    });
    
    // 8. Send email to family
    await this.emailService.sendChapterNotification(chapter);
    
    return chapter;
  }
}
```

### 5.2 Database Schema

```typescript
// Drizzle ORM Schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'senior' | 'family'
  seniorId: uuid('senior_id').references(() => users.id), // for family members
  createdAt: timestamp('created_at').defaultNow()
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  transcript: text('transcript').notNull(),
  audioUrl: varchar('audio_url', { length: 512 }),
  duration: integer('duration'), // seconds
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at')
});

export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  audioHighlightUrl: varchar('audio_highlight_url', { length: 512 }),
  pdfUrl: varchar('pdf_url', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow()
});

// Vector memory stored in Pinecone (not PostgreSQL)
```

### 5.3 API Endpoints

```typescript
// Core API Routes (Next.js App Router)

// POST /api/sessions/start
// Creates new conversation session
{
  userId: string;
} → {
  sessionId: string;
  elevenLabsUrl: string;
}

// POST /api/sessions/:id/messages
// Real-time conversation endpoint (WebSocket alternative)
{
  message: string;
  audioChunk?: string; // base64
} → {
  response: string;
  strategy: string;
}

// POST /api/sessions/:id/end
// Ends session and triggers chapter generation
{
  transcript: string;
} → {
  success: boolean;
  chapterId: string;
}

// GET /api/chapters/:userId
// Lists all chapters for a user
→ Chapter[]

// GET /api/chapters/:id
// Gets single chapter details
→ Chapter

// POST /api/users
// Creates new user (senior + family members)
{
  name: string;
  email: string;
  role: 'senior' | 'family';
  seniorId?: string;
} → User
```

---

## 6. MVP UI/UX SCREENS

### Screen 1: Landing Page
**Purpose:** Onboarding for family members  
**Components:**
- Hero section: "Preserve Your Parent's Stories with AI"
- 3-step explainer: Chat → Remember → Share
- CTA: "Get Started Free"

### Screen 2: Family Onboarding
**Purpose:** Create account for senior + family  
**Form Fields:**
- Senior's name
- Senior's email (optional)
- Your name
- Your email
- Your relationship
- CTA: "Create Account"

### Screen 3: Senior Conversation Interface
**Purpose:** Where Arthur has voice conversations  
**Components:**
- Large "Start Conversation" button
- Waveform visualizer (shows agent is listening)
- Transcript display (live updating)
- "End Conversation" button
- Session timer

### Screen 4: Family Portal - Chapter Library
**Purpose:** View all generated chapters  
**Components:**
- Timeline view (chronological)
- Chapter cards with:
  - Title
  - Date
  - Excerpt (first 100 chars)
  - Audio player icon
  - "Read full chapter" link
- Search bar
- Entity filter (People, Places, Topics)

### Screen 5: Chapter Detail View
**Purpose:** Read full chapter with audio  
**Components:**
- Chapter title + metadata
- Full narrative text
- Embedded audio highlight player
- Download PDF button
- "Share with family" button

---

## 7. SUCCESS METRICS

### Demo Day Metrics
✅ **Functional Demo:** Complete 2-session flow with same user  
✅ **Memory Persistence:** Agent references Session 1 details in Session 2  
✅ **Chapter Quality:** Judges rate 4+/5 for "captures authentic voice"  
✅ **Technical Performance:** <2s response latency, zero crashes  

### User Experience Metrics
- **Conversation Duration:** 15+ minutes sustained engagement
- **Response Richness:** 30+ words per user response by Session 2
- **Temporal Threading:** 2+ references to past memories per session
- **Family Satisfaction:** Email chapters feel "professional quality"

---

## 8. MVP DEVELOPMENT TIMELINE

### Day 1: Core Infrastructure (8 hours)
- ✅ Set up Next.js project + Supabase DB
- ✅ Implement user/session/chapter schemas
- ✅ Integrate ElevenLabs Web SDK
- ✅ Build basic conversation interface
- ✅ OpenAI GPT-4 integration for question generation

### Day 2: Memory & Intelligence (8 hours)
- ✅ Pinecone integration for vector storage
- ✅ Implement 3 questioning strategies
- ✅ Build memory retrieval logic
- ✅ Chapter generation pipeline
- ✅ Email delivery system

### Day 3: Polish & Demo Prep (8 hours - includes rehearsal)
- ✅ UI styling (Tailwind + shadcn/ui) - 2 hours
- ✅ Family portal implementation - 2 hours
- ✅ Audio highlight extraction - 1 hour
- ✅ PDF generation - 1 hour
- ✅ End-to-end testing with sample data - 1 hour
- ✅ Deploy to Vercel - 0.5 hour
- ✅ **Demo script rehearsal + backup video** - 2 hours ← CRITICAL!

**Note:** Most hackathon teams lose because they can't explain their tech under pressure. The2-hour rehearsal buffer is non-negotiable.

---

## 9. ERROR HANDLING STRATEGY (MVP SCOPE)

Real-world hackathon demos fail because of unhandled errors. Here's our defensive plan:

| Error Scenario | User-Facing Behavior | Technical Mitigation | Priority |
|----------------|---------------------|----------------------|----------|
| **ElevenLabs API outage** | "We're having technical difficulties. Try again in 5 minutes." | Cache last conversation state in localStorage, allow resume from same point | P0 |
| **Slow chapter generation (>30 min)** | Email says: "Your chapter is being prepared—expect it within 1 hour" | Queue job with 60-min timeout, send apologetic email if fails | P1 |
| **Database write failure mid-session** | "Your conversation was saved. Chapter will arrive shortly." | Write transcript to S3 as backup, have cron job retry DB insert | P1 |
| **Pinecone vector upsert fails** | Silent failure, log error | Retry 3 times with exponential backoff, degrade gracefully (no memory = still works) | P2 |
| **User's internet drops mid-conversation** | "Connection lost. Click here to resume" | Store session state in backend, generate partial chapter from what we have | P2 |
| **OpenAI rate limit hit** | "Our AI is busy. Retrying in 10 seconds..." | Implement exponential backoff, fallback to GPT-4o-mini | P1 |

### Implementation Priority

**Day 1 (Must Have):**
- ElevenLabs error handling (display friendly message, don't crash)
- Basic retry logic for API calls (3 attempts)

**Day 2 (Should Have):**
- Session state persistence (localStorage + backend)
- Graceful degradation (partial chapters better than nothing)

**Day 3 (Nice to Have):**
- S3 backup for transcripts
- Comprehensive error logging (Sentry)

### Demo Day Contingency Plan

**If live demo fails:**
1. Have pre-recorded demo video ready (2-minute version)
2. Fallback to screenshots walkthrough
3. Show codebase architecture on screen

**Practice Run:** Do full end-to-end test 24 hours before demo

---

## 10. POST-MVP ROADMAP

### V1.5 (Month 2)
- SMS/phone call initiation (Twilio)
- Adaptive scheduling (ML-based timing)
- Multi-language support (Spanish)

### V2.0 (Month 4)
- Mobile app (React Native)
- Payment integration (Stripe)
- B2B facility management portal
- Clinical outcome tracking

---

## APPENDIX A: PROMPT TEMPLATES

### Conversationalist System Prompt
```markdown
You are Recall, an AI companion conducting reminiscence therapy with {userName}, age {age}.

Your goal: Help them share life stories through warm, natural conversation.

CURRENT STATE:
- Session duration: {duration} minutes
- User's last response: {lastResponse} ({wordCount} words)
- Recommended strategy: {strategy}

MEMORY CONTEXT:
{recentMemories}

YOUR NEXT QUESTION:
Generate ONE question (max 25 words) using the {strategy} strategy.
Tone: Warm, curious, patient. Never challenge their memory.
```

### Chapter Generation Prompt
```markdown
Generate a biographical chapter from this conversation transcript.

TRANSCRIPT:
{transcript}

REQUIREMENTS:
1. Title: Clear, engaging (e.g., "The Ford Plant: Arthur's First Real Job")
2. Structure:
   - Opening (1 paragraph): Set context
   - Body (2-3 paragraphs): Narrative flow with sensory details
   - Closing (1 paragraph): Reflection on meaning
3. Include 1-2 verbatim quotes in italics
4. Word count: 300-500
5. CRITICAL: Zero fabrication - every claim must come from transcript

OUTPUT:
# [Title]

[Chapter content]
```

---

## 11. DEMO SCRIPT (90-Second Version for Judges)

Hackathon judges spend 3-5 minutes per team. Nail this narrative arc:

### Setup (5 seconds)
*"Recall helps seniors share life stories through AI voice conversations."*

### Problem (15 seconds)
*"78% of families lose their parents' memories forever when they pass away. Existing memory preservation tools require typing or filling out forms—they have less than 10% completion rates because seniors don't use them. We needed something that works through natural conversation."*

### Live Demo (60 seconds)

**[Switch to Arthur persona on screen]**

1. **Show:** User clicks "Start Conversation" → immediate voice connection
   - *Callout:* "Notice the sub-second response time—powered by ElevenLabs Conversational AI"

2. **Show:** Agent asks sensory question → user gives rich 30-second response
   - *Example:* Agent: "What did the factory smell like?" 
   - Arthur: *[Pre-recorded 30s response about motor oil, hot metal]*

3. **Show:** Conversation transcript appears live on screen
   - *Callout:* "The AI is extracting entities in real-time—people, places, dates"

4. **Show:** 30 seconds later, family receives beautifully formatted chapter via email
   - *Callout:* "Autonomous narrative generation with verbatim quotes and audio highlights"

### Impact (10 seconds)
*"In 20 minutes, we captured a memory that Arthur's grandchildren will treasure forever. This is reminiscence therapy at scale—no therapist required, less than $3 per session."*

### Ask (5 seconds)
*"We're piloting with 3 senior living facilities in January. If you know anyone in Memory Care, we'd love to connect."*

---

## 12. PRE-HACKATHON SETUP CHECKLIST (DO THIS WEEK BEFORE!)

**Most hackathon failures come from Day 1 wasted on setup.** Complete these 48 hours before hackathon starts:

### Critical Path Items (Must Complete)

- [ ] **Create ElevenLabs account** + test API key
  - Test: Make one API call, verify voice response works
  - Budget: Ensure $50+ credits available
  
- [ ] **Create OpenAI account** + test GPT-4o API key
  - Test: Generate one completion, verify embeddings API works
  - Budget: Load $50 minimum credits

- [ ] **Create Pinecone account** + create index
  - Index name: `recall-memories`
  - Dimensions: 1536 (for OpenAI embeddings)
  - Test: Upsert 1 vector, query it back

- [ ] **Set up Supabase project** + run schema migration locally
  - Create project
  - Run Drizzle schema push
  - Test: Insert one user, one session

- [ ] **Deploy "Hello World" Next.js app to Vercel**
  - Test deployment pipeline works
  - Verify environment variables injection works
  - Test: API route returns 200 OK

- [ ] **Create Gmail account for transactional emails**
  - Set up Resend API key
  - Test: Send one test email, verify delivery

- [ ] **Clone starter template repo** (if using one)
  - Verify all dependencies install: `npm install`
  - Verify dev server runs: `npm run dev`

### If ANY of these fail, you'll lose 4-6 hours on Day 1. DO NOT SKIP THIS.

### Backup Plan Items

- [ ] Download all documentation PDFs (ElevenLabs, OpenAI, Pinecone) in case of internet issues
- [ ] Have local PostgreSQL running as backup to Supabase
- [ ] Pre-record 2-minute backup demo video in case live demo fails

---

## 13. HACKATHON JUDGING OPTIMIZATION

Most hackathons score on these criteria. Tailor your demo accordingly:

### Judging Rubric (Typical Breakdown)

| Criteria | Weight | How to Win It | Our Strategy |
|----------|--------|---------------|--------------|
| **Technical Complexity** | 30% | Show hard stuff: real-time voice AI, semantic memory, autonomous generation | Highlight: "We integrated 4 AI APIs: ElevenLabs, OpenAI GPT-4, OpenAI Embeddings, and Pinecone vector DB" |
| **Impact** | 25% | Quantify the problem, show clinical evidence | Emphasize: "6.7M Alzheimer's patients, 23% memory improvement from reminiscence therapy" |
| **Completeness** | 20% | End-to-end working demo | Show: Conversation → Chapter → Email delivery (full loop) |
| **Presentation** | 15% | Clear narrative, confident delivery | Practice 90-second pitch 10+ times |
| **Design** | 10% | Professional UI/UX | Use Tailwind + shadcn/ui for clean, modern look |

### Win Condition
Score 85+ on **Technical + Impact** = guaranteed Top 3

### What Judges Love
- **Real-time demos** (not slides)
- **Quantified impact** ("6.7M people" not "lots of people")
- **Technical depth** (show code, explain architecture)
- **Clear business model** ("$3/session vs $150 therapist")

### What Judges Hate
- PowerPoint decks with no demo
- Vague problems ("memory is important")
- Broken demos or "imagine if it worked"
- Reading from script (sounds rehearsed but nervous)

---

## 14. DE-SCOPE PRIORITY (If Behind Schedule on Day 3)

**Give yourself permission to cut features.** Here's the order:

### Cut These First (Least Demo Impact)

1. **PDF generation** 
   - Cut: PDF export button
   - Keep: Text chapter in email
   - Time Saved: 2 hours
   - Impact: Judges won't notice

2. **Audio highlight extraction**
   - Cut: 30-second MP3 clip
   - Keep: Link to full session recording
   - Time Saved: 2 hours
   - Impact: Minor, can explain verbally

3. **Family portal UI**
   - Cut: Full chapter library interface
   - Keep: Just send emails, add "Coming Soon" landing page
   - Time Saved: 3 hours
   - Impact: Moderate, but email delivery proves the core loop

4. **Entity index UI**
   - Cut: People/Places/Topics filter sidebar
   - Keep: Simple list of chapters
   - Time Saved: 2 hours
   - Impact: Low, judges won't notice in 90-second demo

### NEVER Cut These (Core Value Prop)

- ✅ **Voice conversation** (this IS the product)
- ✅ **Chapter generation** (this IS the wow moment)
- ✅ **Email delivery** (proves end-to-end automation)
- ✅ **Memory persistence across sessions** (proves intelligence, not just ChatGPT wrapper)

### Decision Matrix

**If you're behind by:**
- **2 hours:** Cut #1 (PDF)
- **4 hours:** Cut #1, #2 (PDF + audio)
- **6 hours:** Cut #1-3 (PDF + audio + portal)
- **8+ hours:** Show pre-recorded demo video, focus on code quality

**Time Check Points:**
- End of Day 1: Should have basic voice conversation working
- End of Day 2 Noon: Should have chapter generation working
- End of Day 2: Should have email delivery working
- Day 3 Morning: Start de-scoping if not on track

---

**END OF MVP PRD**

This MVP focuses on **proving the core value proposition** in a hackathon setting: AI that can hold meaningful conversations, remember context, and autonomously create compelling life story chapters. Everything else is out of scope for the initial build.
