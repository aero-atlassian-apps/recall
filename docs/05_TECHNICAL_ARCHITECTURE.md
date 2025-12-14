# 05. Technical Architecture

## 5.1 Tech Stack

| Component | Technology | Version / Note |
| :--- | :--- | :--- |
| **Framework** | Next.js | 15+ (App Router) |
| **Language** | TypeScript | ^5.4.0 |
| **Styling** | Tailwind CSS | v4 (Alpha/Beta) |
| **UI Library** | shadcn/ui | Radix Primitives |
| **Database** | PostgreSQL | Neon / Supabase |
| **ORM** | Drizzle ORM | Type-safe SQL |
| **AI LLM** | Google Gemini 1.5 Pro | Vertex AI SDK |
| **Voice AI** | ElevenLabs | Conversational AI SDK |
| **Vector DB** | Pinecone | Semantic Search |
| **Testing** | Vitest & Playwright | Unit & E2E |

---

## 5.2 API Design Principles

-   **Resource Oriented:** `/api/users`, `/api/sessions/{id}/chapters`.
-   **Stateless:** No server-side sessions; authenticates via JWT/Cookies per request.
-   **Type Safety:** Uses shared DTOs (Data Transfer Objects) between frontend and backend where possible.
-   **Error Handling:** Returns standard HTTP codes (200, 400, 401, 404, 500) with JSON error details: `{ "code": "ERR_INVALID_INPUT", "message": "..." }`.

---

## 5.3 Communication Patterns

1.  **Synchronous (Request/Response):**
    -   Used for critical UI interactions: Login, Fetching Chapters, Updating Profile.
    -   Implemented via Next.js Server Actions or API Routes.

2.  **Asynchronous (Event/Job):**
    -   Used for heavy AI tasks: Chapter Generation, Image Analysis (sometimes), Email Notifications.
    -   Implemented via a `jobs` table polling mechanism (or BullMQ in future scaling).

3.  **Real-Time (WebSocket/Streaming):**
    -   Used for Voice Conversation.
    -   ElevenLabs SDK manages the WebSocket connection for low-latency audio streaming.

---

## 5.4 Authentication & Authorization

-   **Auth Model:**
    -   Role-Based Access Control (RBAC): `senior` vs `family`.
    -   **Senior:** Can only access *own* sessions/chapters.
    -   **Family:** Can access *associated* senior's data (via `seniorId`).
-   **Implementation:**
    -   Custom auth or Auth.js (NextAuth).
    -   Protected Routes via Middleware.

---

## 5.5 Configuration & Secrets

-   **Environment Variables:** Managed via `.env.local` (dev) and Platform Secrets (prod).
-   **Secrets:**
    -   `GOOGLE_CLOUD_PROJECT` / `GOOGLE_APPLICATION_CREDENTIALS` (Vertex AI)
    -   `ELEVENLABS_API_KEY`
    -   `DATABASE_URL`
    -   `PINECONE_API_KEY`
-   **Client-Side Exposure:** STRICTLY FORBIDDEN. All API keys must remain server-side. Next.js `NEXT_PUBLIC_` prefix used only for public/analytics keys.
