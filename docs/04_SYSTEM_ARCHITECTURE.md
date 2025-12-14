# 04. System Architecture

## 4.1 High-Level Overview

Recall follows a **Hexagonal Architecture (Ports & Adapters)** pattern to ensure strict separation of concerns, testability, and independence from external frameworks. The core business logic resides in the center, isolated from the "Infrastructure" (Database, AI APIs, Web Framework).

### **Architectural Layers**

1.  **Core Domain (Inner Layer)**
    -   Contains pure business entities (`User`, `Chapter`, `Session`).
    -   Contains domain invariants and business rules.
    -   *Dependency Rule:* Depends on nothing.

2.  **Application Layer (Middle Layer)**
    -   Contains Use Cases (`StartSessionUseCase`, `GenerateChapterUseCase`).
    -   Orchestrates the flow of data between the Domain and the outside world.
    -   Defines `Ports` (Interfaces) that infrastructure must implement.
    -   *Dependency Rule:* Depends only on Domain.

3.  **Infrastructure Layer (Outer Layer)**
    -   Contains Adapters (`GeminiService`, `DrizzleRepository`, `NextJS API`).
    -   Implements the Ports defined in the Application layer.
    -   *Dependency Rule:* Depends on Application and Domain.

---

## 4.2 Component Responsibilities

### **Frontend (Next.js)**
-   **Responsibility:** Rendering UI, capturing audio, playing audio, managing local state.
-   **Communication:** Communicates with Backend via REST API and WebSockets (for voice).

### **Backend (Next.js Server Actions / API Routes)**
-   **Responsibility:** Authentication, request validation, Use Case execution.
-   **Dependency Injection:** Uses a DI Container to resolve dependencies for Use Cases.

### **Database (PostgreSQL + Drizzle)**
-   **Responsibility:** Persistent storage of relational data (Users, Sessions) and JSONB documents (Entities, Metadata).

### **AI Services (Vertex AI + ElevenLabs)**
-   **Gemini (Vertex AI):**
    -   "The Director": Conversation strategy and goal setting.
    -   "The Biographer": Content generation and AoT decomposition.
    -   "The Analyst": Image analysis (Vision).
-   **ElevenLabs:**
    -   TTS (Text-to-Speech) with emotional control.
    -   Voice orchestration (in some flows).

### **Vector Store (Pinecone)**
-   **Responsibility:** Semantic search for long-term memory retrieval ("Recall").

---

## 4.3 Data Flow Diagrams

### **Voice Interaction Loop**

```mermaid
sequenceDiagram
    participant User
    participant Client (Browser)
    participant API (Next.js)
    participant Director (Gemini)
    participant Voice (ElevenLabs)

    User->>Client: Speaks ("I remember...")
    Client->>API: POST /api/voice/message (Audio/Text)
    API->>Director: Analyze(History, Input)
    Director-->>API: Strategy("Ask about feelings") & Text
    API->>Voice: GenerateSpeech(Text)
    Voice-->>API: Audio Buffer
    API-->>Client: Audio Response
    Client->>User: Plays Audio
```

### **Chapter Generation Pipeline (Async)**

```mermaid
graph TD
    A[Session Completed] --> B[Job Queue]
    B --> C[Worker Process]
    C --> D[AoT Decomposition]
    D --> E{Phase 1: Atoms}
    E --> F[Extract Narrative]
    E --> G[Extract Quotes]
    E --> H[Extract Sensory Details]
    F & G & H --> I[Phase 2: Synthesis]
    I --> J[Draft Chapter Markdown]
    J --> K[Save to DB]
    K --> L[Notify User]
```
