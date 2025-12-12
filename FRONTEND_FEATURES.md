# Recall MVP - Frontend Implementation Guide
## UI/UX Build Specification with Mocked Backend

**Purpose:** Complete specifications for building the Recall MVP frontend with mocked data and simulated backend  
**Target Audience:** AI coding agents, frontend developers  
**Stack:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui  
**Backend:** Mocked with MSW (Mock Service Worker) or static data

---

## 1. PROJECT SETUP

### Initialize Next.js Project

```bash
# Create Next.js 14 app with TypeScript
npx create-next-app@latest recall-mvp --typescript --tailwind --app --eslint

cd recall-mvp

# Install UI library
npx shadcn-ui@latest init

# Install dependencies
npm install zustand date-fns lucide-react class-variance-authority clsx tailwind-merge
npm install -D @types/node

# Install mock service worker (for API mocking)
npm install msw --save-dev
npx msw init public
```

### Project Structure

```
recall-mvp/
├── app/
│   ├── (auth)/
│   │   └── onboarding/
│   │       ├── page.tsx         # Onboarding form
│   │       └── [step]/page.tsx  # Multi-step flow
│   ├── (senior)/
│   │   ├── conversation/
│   │   │   └── page.tsx         # Senior conversation UI
│   │   └── dashboard/
│   │       └── page.tsx         # Senior home
│   ├── (family)/
│   │   ├── portal/
│   │   │   └── page.tsx         # Chapter library
│   │   └── chapter/
│   │       └── [id]/page.tsx    # Chapter detail
│   ├── layout.tsx
│   ├── page.tsx                 # Landing page
│   └── globals.css
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── conversation/
│   │   ├── WaveformVisualizer.tsx
│   │   ├── TranscriptDisplay.tsx
│   │   └── ConversationControls.tsx
│   ├── chapter/
│   │   ├── ChapterCard.tsx
│   │   ├── ChapterDetail.tsx
│   │   └── AudioPlayer.tsx
│   └── common/
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   ├── stores/
│   │   ├── conversationStore.ts
│   │   └── chapterStore.ts
│   ├── mocks/
│   │   ├── handlers.ts          # MSW handlers
│   │   └── data.ts              # Mock data
│   ├── types.ts
│   └── utils.ts
└── public/
    └── mockServiceWorker.js
```

---

## 2. TYPE DEFINITIONS

### Core Types (`lib/types.ts`)

```typescript
// User Types
export type UserRole = 'senior' | 'family';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  seniorId?: string; // For family members
  createdAt: Date;
}

// Session Types
export interface ConversationSession {
  id: string;
  userId: string;
  transcript: Message[];
  audioUrl?: string;
  duration: number; // seconds
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed';
}

export interface Message {
  id: string;
  speaker: 'agent' | 'user';
  text: string;
  timestamp: Date;
  audioTimestamp?: number; // For audio sync
}

// Chapter Types
export interface Chapter {
  id: string;
  sessionId: string;
  userId: string;
  title: string;
  content: string; // Markdown formatted
  excerpt: string; // First 100 chars
  audioHighlightUrl?: string;
  audioDuration?: number; // seconds
  pdfUrl?: string;
  entities: EntityMention[];
  metadata: ChapterMetadata;
  createdAt: Date;
}

export interface EntityMention {
  type: 'person' | 'place' | 'topic';
  name: string;
  mentions: number;
}

export interface ChapterMetadata {
  sessionNumber: number;
  wordCount: number;
  emotionalTone: 'positive' | 'neutral' | 'bittersweet' | 'melancholic';
  lifePeriod?: string; // "1950s", "Navy Years", etc.
}

// Conversation State
export interface ConversationState {
  isActive: boolean;
  sessionId?: string;
  messages: Message[];
  duration: number;
  isAgentSpeaking: boolean;
}
```

---

## 3. STATE MANAGEMENT (Zustand)

### Conversation Store (`lib/stores/conversationStore.ts`)

```typescript
import { create } from 'zustand';
import { ConversationState, Message } from '@/lib/types';

interface ConversationStore extends ConversationState {
  // Actions
  startSession: (sessionId: string) => void;
  endSession: () => void;
  addMessage: (message: Message) => void;
  setAgentSpeaking: (speaking: boolean) => void;
  updateDuration: (duration: number) => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  // Initial state
  isActive: false,
  sessionId: undefined,
  messages: [],
  duration: 0,
  isAgentSpeaking: false,

  // Actions
  startSession: (sessionId) => set({ 
    isActive: true, 
    sessionId, 
    messages: [],
    duration: 0 
  }),

  endSession: () => set({ 
    isActive: false 
  }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  setAgentSpeaking: (speaking) => set({ 
    isAgentSpeaking: speaking 
  }),

  updateDuration: (duration) => set({ duration }),

  reset: () => set({
    isActive: false,
    sessionId: undefined,
    messages: [],
    duration: 0,
    isAgentSpeaking: false
  })
}));
```

### Chapter Store (`lib/stores/chapterStore.ts`)

```typescript
import { create } from 'zustand';
import { Chapter } from '@/lib/types';

interface ChapterStore {
  chapters: Chapter[];
  selectedChapter?: Chapter;
  filter: {
    search: string;
    tags: string[];
  };
  
  // Actions
  setChapters: (chapters: Chapter[]) => void;
  selectChapter: (chapterId: string) => void;
  setSearch: (search: string) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
}

export const useChapterStore = create<ChapterStore>((set) => ({
  chapters: [],
  selectedChapter: undefined,
  filter: {
    search: '',
    tags: []
  },

  setChapters: (chapters) => set({ chapters }),

  selectChapter: (chapterId) => set((state) => ({
    selectedChapter: state.chapters.find((c) => c.id === chapterId)
  })),

  setSearch: (search) => set((state) => ({
    filter: { ...state.filter, search }
  })),

  toggleTag: (tag) => set((state) => ({
    filter: {
      ...state.filter,
      tags: state.filter.tags.includes(tag)
        ? state.filter.tags.filter((t) => t !== tag)
        : [...state.filter.tags, tag]
    }
  })),

  clearFilters: () => set({
    filter: { search: '', tags: [] }
  })
}));
```

---

## 4. MOCK DATA & API

### Mock Data (`lib/mocks/data.ts`)

```typescript
import { User, ConversationSession, Chapter } from '@/lib/types';

export const mockUsers: User[] = [
  {
    id: 'user-arthur',
    name: 'Arthur Thompson',
    email: 'arthur@example.com',
    role: 'senior',
    createdAt: new Date('2025-12-01')
  },
  {
    id: 'user-sarah',
    name: 'Sarah Thompson',
    email: 'sarah@example.com',
    role: 'family',
    seniorId: 'user-arthur',
    createdAt: new Date('2025-12-01')
  }
];

export const mockSessions: ConversationSession[] = [
  {
    id: 'session-001',
    userId: 'user-arthur',
    transcript: [
      {
        id: 'msg-001',
        speaker: 'agent',
        text: "Hi Arthur, it's wonderful to talk with you today. What's been on your mind lately?",
        timestamp: new Date('2025-12-10T10:00:00')
      },
      {
        id: 'msg-002',
        speaker: 'user',
        text: "Oh, I was just thinking about my first job at the Ford plant.",
        timestamp: new Date('2025-12-10T10:00:15')
      },
      {
        id: 'msg-003',
        speaker: 'agent',
        text: "The Ford plant — that sounds like an important place in your life. What did the factory floor smell like when you first walked in?",
        timestamp: new Date('2025-12-10T10:00:30')
      }
    ],
    duration: 1380, // 23 minutes
    startedAt: new Date('2025-12-10T10:00:00'),
    endedAt: new Date('2025-12-10T10:23:00'),
    status: 'completed'
  }
];

export const mockChapters: Chapter[] = [
  {
    id: 'chapter-001',
    sessionId: 'session-001',
    userId: 'user-arthur',
    title: "The Ford Plant: Arthur's First Real Job",
    content: `In 1952, at eighteen years old, Arthur walked through the doors of the Ford plant on 5th Street for the first time. He'd just finished high school, and his father had arranged the interview through a connection with the foreman, Bill. The job was simple on paper—mechanic's apprentice—but Arthur remembers it as the moment he became a man.

"The smell hit you first," Arthur recalls. *"Motor oil, hot metal, cigarette smoke all mixed together. It was deafening—presses banging, engines roaring. But I loved it. I felt like I was part of something big."*

Bill took Arthur under his wing that first week. He was patient, Arthur says, never making him feel stupid for asking questions. They worked side by side on the assembly line, and Arthur learned not just how to fix engines, but how to work with his hands and take pride in a job well done.

The Ford plant would become Arthur's second home for the next forty years. But that first day—the noise, the smell, the handshake from Bill—that was the day Arthur stopped being a kid and started building the life he'd look back on with pride.`,
    excerpt: "In 1952, at eighteen years old, Arthur walked through the doors of the Ford plant on 5th Street for the first time...",
    audioHighlightUrl: '/mock-audio/chapter-001-highlight.mp3',
    audioDuration: 154, // 2:34
    pdfUrl: '/mock-pdfs/chapter-001.pdf',
    entities: [
      { type: 'person', name: 'Bill (foreman)', mentions: 3 },
      { type: 'person', name: 'Father', mentions: 1 },
      { type: 'place', name: 'Ford plant, 5th Street', mentions: 5 },
      { type: 'topic', name: 'First job', mentions: 2 }
    ],
    metadata: {
      sessionNumber: 1,
      wordCount: 211,
      emotionalTone: 'positive',
      lifePeriod: '1950s'
    },
    createdAt: new Date('2025-12-10T10:30:00')
  },
  {
    id: 'chapter-002',
    sessionId: 'session-002',
    userId: 'user-arthur',
    title: "Navy Days: Seeing the World at Nineteen",
    content: `Arthur enlisted in the Navy in 1953, just a year after starting at the Ford plant. "I wanted adventure," he says with a chuckle. *"Working on the factory floor was good money, but I wanted to see what was out there beyond our little town."*

His first deployment took him to the Pacific. Arthur remembers standing on the deck of the destroyer, watching dolphins race alongside the ship. The ocean stretched endlessly in every direction, and for the first time in his life, Arthur felt truly free...`,
    excerpt: "Arthur enlisted in the Navy in 1953, just a year after starting at the Ford plant...",
    audioHighlightUrl: '/mock-audio/chapter-002-highlight.mp3',
    audioDuration: 118,
    entities: [
      { type: 'topic', name: 'Navy service', mentions: 8 },
      { type: 'place', name: 'Pacific Ocean', mentions: 3 }
    ],
    metadata: {
      sessionNumber: 2,
      wordCount: 187,
      emotionalTone: 'positive',
      lifePeriod: '1950s'
    },
    createdAt: new Date('2025-12-08T14:45:00')
  }
];
```

### MSW Handlers (`lib/mocks/handlers.ts`)

```typescript
import { http, HttpResponse } from 'msw';
import { mockUsers, mockSessions, mockChapters } from './data';

export const handlers = [
  // Get user by ID
  http.get('/api/users/:id', ({ params }) => {
    const user = mockUsers.find((u) => u.id === params.id);
    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(user);
  }),

  // Start conversation session
  http.post('/api/sessions/start', async () => {
    const newSession = {
      sessionId: `session-${Date.now()}`,
      startedAt: new Date().toISOString()
    };
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return HttpResponse.json(newSession);
  }),

  // Send message in conversation
  http.post('/api/sessions/:id/messages', async ({ request, params }) => {
    const body = await request.json();
    
    // Mock agent response based on user message
    const agentResponse = {
      id: `msg-${Date.now()}`,
      speaker: 'agent',
      text: mockAgentResponse(body.message),
      timestamp: new Date().toISOString()
    };
    
    // Simulate thinking time
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    return HttpResponse.json(agentResponse);
  }),

  // End conversation and generate chapter
  http.post('/api/sessions/:id/end', async () => {
    // Simulate chapter generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    return HttpResponse.json({
      success: true,
      chapterId: `chapter-${Date.now()}`
    });
  }),

  // Get all chapters for user
  http.get('/api/chapters/:userId', () => {
    return HttpResponse.json(mockChapters);
  }),

  // Get single chapter
  http.get('/api/chapters/detail/:id', ({ params }) => {
    const chapter = mockChapters.find((c) => c.id === params.id);
    if (!chapter) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(chapter);
  })
];

// Mock agent response generator
function mockAgentResponse(userMessage: string): string {
  const responses = [
    "That's a wonderful memory. Can you tell me more about what that was like?",
    "I can almost picture it. What stands out most to you about that time?",
    "That's really interesting. How did that make you feel?",
    "I'd love to hear more details. What else do you remember?",
    "That sounds special. Who else was there with you?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
```

### Initialize MSW (`app/layout.tsx`)

```typescript
'use client';

import { useEffect } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Initialize MSW in browser
      const startMocking = async () => {
        const { worker } = await import('@/lib/mocks/browser');
        worker.start();
      };
      startMocking();
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

---

## 5. COMPONENT IMPLEMENTATIONS

### Landing Page (`app/page.tsx`)

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-50 to-neutral-50 py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 max-w-3xl mx-auto">
            Preserve Your Parent's Stories with AI
          </h1>
          
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Turn meaningful conversations into lasting memories. 
            Recall uses AI to capture life stories through natural voice conversations.
          </p>
          
          <Link href="/onboarding">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started Free →
            </Button>
          </Link>
          
          {/* Demo Video Placeholder */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="aspect-video bg-neutral-200 rounded-xl shadow-xl flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center cursor-pointer hover:bg-primary-600 transition">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="🎙️"
              title="Chat"
              description="Natural voice conversations powered by AI that adapt to your parent's storytelling style."
            />
            <FeatureCard
              icon="🧠"
              title="Remember"
              description="AI remembers past conversations and asks intelligent follow-up questions."
            />
            <FeatureCard
              icon="📖"
              title="Share"
              description="Beautiful narrative chapters automatically created and shared with your family."
            />
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition border border-neutral-300">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
}
```

### Conversation Interface (`app/(senior)/conversation/page.tsx`)

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useConversationStore } from '@/lib/stores/conversationStore';
import { Button } from '@/components/ui/button';
import { WaveformVisualizer } from '@/components/conversation/WaveformVisualizer';
import { TranscriptDisplay } from '@/components/conversation/TranscriptDisplay';
import { formatDuration } from '@/lib/utils';

export default function ConversationPage() {
  const {
    isActive,
    sessionId,
    messages,
    duration,
    isAgentSpeaking,
    startSession,
    endSession,
    addMessage,
    setAgentSpeaking,
    updateDuration
  } = useConversationStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = async () => {
    // Call mock API to start session
    const response = await fetch('/api/sessions/start', {
      method: 'POST'
    });
    const data = await response.json();
    
    startSession(data.sessionId);
    
    // Add initial greeting
    setTimeout(() => {
      addMessage({
        id: `msg-${Date.now()}`,
        speaker: 'agent',
        text: "Hi Arthur, it's wonderful to talk with you today. What's been on your mind lately?",
        timestamp: new Date()
      });
    }, 1000);
    
    // Start duration timer
    timerRef.current = setInterval(() => {
      updateDuration(duration + 1);
    }, 1000);
  };

  const handleEnd = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Call mock API to end session
    await fetch(`/api/sessions/${sessionId}/end`, {
      method: 'POST'
    });
    
    endSession();
  };

  const handleSimulateUserMessage = async () => {
    const userText = "I was thinking about my first job at the Ford plant.";
    
    // Add user message
    addMessage({
      id: `msg-${Date.now()}`,
      speaker: 'user',
      text: userText,
      timestamp: new Date()
    });
    
    // Simulate agent thinking
    setAgentSpeaking(true);
    
    // Get agent response from mock API
    const response = await fetch(`/api/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    const agentMessage = await response.json();
    
    // Add agent response
    addMessage({
      ...agentMessage,
      timestamp: new Date(agentMessage.timestamp)
    });
    
    setAgentSpeaking(false);
  };

  if (!isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-primary-50 flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          {/* Microphone Icon */}
          <div className="mb-8 inline-block">
            <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center">
              <svg className="w-16 h-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-semibold text-neutral-900 mb-4">
            Ready to chat?
          </h1>
          
          <Button 
            size="lg" 
            className="rounded-full px-12 py-6 text-lg"
            onClick={handleStart}
          >
            Start Conversation
          </Button>
          
          {/* Previous conversations */}
          <div className="mt-16">
            <h2 className="text-lg font-semibold mb-4">Previous Conversations</h2>
            <div className="space-y-3">
              <PreviousConversationCard title="The Ford Plant" date="Dec 10" />
              <PreviousConversationCard title="Navy Days" date="Dec 8" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-neutral-900 text-white px-6 py-4 flex justify-between items-center">
        <div className="font-mono text-lg">
          Session {formatDuration(duration)}
        </div>
        <Button 
          variant="destructive" 
          onClick={handleEnd}
          className="flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          End Call
        </Button>
      </div>
      
      {/* Waveform Visualizer */}
      <div className="p-6">
        <WaveformVisualizer isActive={isAgentSpeaking} />
      </div>
      
      {/* Transcript */}
      <div className="flex-1 overflow-y-auto">
        <TranscriptDisplay messages={messages} />
      </div>
      
      {/* Demo button to simulate user message */}
      <div className="p-4 bg-neutral-100 text-center">
        <Button onClick={handleSimulateUserMessage} variant="outline">
          Simulate User Response (Demo)
        </Button>
      </div>
    </div>
  );
}

function PreviousConversationCard({ title, date }: { title: string; date: string }) {
  return (
    <div className="bg-white p-4 rounded-md border-l-4 border-primary-500 shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📖</span>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-neutral-600">{date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Waveform Visualizer (`components/conversation/WaveformVisualizer.tsx`)

```typescript
'use client';

import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isActive: boolean;
}

export function WaveformVisualizer({ isActive }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bars = 40;
    const barWidth = canvas.width / bars;
    
    let animationId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < bars; i++) {
        const barHeight = isActive
          ? Math.random() * canvas.height * 0.7 + 10
          : canvas.height * 0.1;
        
        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;
        
        ctx.fillStyle = '#0ea5e9'; // primary-500
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => cancelAnimationFrame(animationId);
  }, [isActive]);

  return (
    <div className="bg-primary-50 rounded-lg p-6">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={120}
        className="w-full h-30"
      />
    </div>
  );
}
```

### Transcript Display (`components/conversation/TranscriptDisplay.tsx`)

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { Message } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TranscriptDisplayProps {
  messages: Message[];
}

export function TranscriptDisplay({ messages }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-neutral-50 p-8 space-y-4 max-w-4xl mx-auto">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.speaker === 'agent';
  
  return (
    <div className={cn(
      "flex items-start gap-3",
      !isAgent && "flex-row-reverse"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0",
        isAgent ? "bg-neutral-200" : "bg-primary-500"
      )}>
        {isAgent ? "🎙️" : "👤"}
      </div>
      
      {/* Message bubble */}
      <div className={cn(
        "max-w-[75%] px-4 py-3 rounded-lg",
        isAgent 
          ? "bg-white border border-neutral-300 rounded-bl-none" 
          : "bg-primary-500 text-white rounded-br-none"
      )}>
        <p className="text-base leading-relaxed">{message.text}</p>
      </div>
    </div>
  );
}
```

### Chapter Library (`app/(family)/portal/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useChapterStore } from '@/lib/stores/chapterStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChapterCard } from '@/components/chapter/ChapterCard';
import { Sidebar } from '@/components/common/Sidebar';

export default function PortalPage() {
  const { chapters, setChapters, filter, setSearch, toggleTag } = useChapterStore();

  useEffect(() => {
    // Fetch chapters from mock API
    fetch('/api/chapters/user-arthur')
      .then((res) => res.json())
      .then(setChapters);
  }, [setChapters]);

  const filteredChapters = chapters.filter((chapter) => {
    // Search filter
    if (filter.search && !chapter.title.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    
    // Tag filter
    if (filter.tags.length > 0) {
      const chapterTopics = chapter.entities.filter((e) => e.type === 'topic').map((e) => e.name);
      if (!filter.tags.some((tag) => chapterTopics.includes(tag))) {
        return false;
      }
    }
    
    return true;
  });

  const allTags = Array.from(
    new Set(chapters.flatMap((c) => c.entities.filter((e) => e.type === 'topic').map((e) => e.name)))
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 bg-neutral-50 p-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">📖 Arthur's Chapters</h1>
        <div className="h-px bg-neutral-300 mb-6" />
        
        {/* Search */}
        <div className="mb-6 max-w-2xl">
          <Input
            type="search"
            placeholder="Search chapters..."
            value={filter.search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12"
          />
        </div>
        
        {/* Filter Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={filter.tags.includes(tag) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleTag(tag)}
              className="rounded-full"
            >
              {tag}
            </Button>
          ))}
        </div>
        
        {/* Chapter Grid */}
        <div className="grid gap-4">
          {filteredChapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
        
        {filteredChapters.length === 0 && (
          <div className="text-center py-16 text-neutral-600">
            <p className="text-lg">No chapters found matching your filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
```

### Chapter Card (`components/chapter/ChapterCard.tsx`)

```typescript
import Link from 'next/link';
import { Chapter } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export function ChapterCard({ chapter }: { chapter: Chapter }) {
  return (
    <Link href={`/chapter/${chapter.id}`}>
      <div className="bg-white p-6 rounded-lg border border-neutral-300 shadow-sm hover:shadow-md transition cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">📖</div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              {chapter.title}
            </h3>
            
            <p className="text-sm text-neutral-600 mb-3">
              {formatDistanceToNow(chapter.createdAt, { addSuffix: true })} • {chapter.metadata.wordCount} words
            </p>
            
            <p className="text-neutral-700 line-clamp-2 mb-4">
              {chapter.excerpt}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-primary-500 font-medium hover:underline">
                Read Chapter →
              </span>
              
              {chapter.audioHighlightUrl && (
                <div className="flex items-center gap-1 text-sm text-neutral-600">
                  <span>🎵</span>
                  <span>{Math.floor(chapter.audioDuration! / 60)}:{(chapter.audioDuration! % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

---

## 6. USER FLOWS

### Flow 1: First-Time Onboarding
1. User lands on `/` (landing page)
2. Clicks "Get Started Free" → `/onboarding`
3. Fills out form (senior name, family email)
4. System creates accounts → Redirects to `/portal` (family view)

### Flow 2: Senior Conversation
1. Senior visits `/conversation`
2. Sees "Start Conversation" button
3. Clicks → Session starts
4. Messages appear in transcript
5. After 15-20 min, clicks "End Call"
6. System shows "Chapter will be ready in 30 minutes"

### Flow 3: Family Views Chapter
1. Family receives email notification
2. Clicks link → `/chapter/[id]`
3. Reads chapter, plays audio highlight
4. Clicks "Download PDF" or "Share"

---

## 7. RESPONSIVE BEHAVIOR

### Mobile (<640px)
- Sidebar becomes slide-out drawer
- Chapter cards stack vertically
- Search bar full width
- Conversation controls fixed at bottom

### Tablet (640px-1024px)
- Sidebar collapsible with toggle
- 2-column chapter grid
- Maintain most desktop features

### Desktop (>1024px)
- Fixed sidebar
- 3-column chapter grid (if space allows)
- Full features enabled

---

## 8. DEPLOYMENT INSTRUCTIONS

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod

# Environment variables needed:
# (None for MVP with mocked backend)
```

---

**END OF FRONTEND IMPLEMENTATION GUIDE**

This document provides complete specifications for building a fully functional frontend with realistic mocked data. The UI will feel production-ready even though the backend is simulated, perfect for demos and iterative development.
