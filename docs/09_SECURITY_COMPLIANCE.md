# 09. Security & Compliance

## 9.1 Threat Model

1.  **Unauthorized Access:** Family member seeing another family's stories.
    -   *Mitigation:* Strict RLS (Row Level Security) logic in Application Layer. `where(eq(chapters.userId, currentUserId))`.

2.  **Prompt Injection:** User tricking AI into generating offensive content.
    -   *Mitigation:* System Prompt fencing ("You are Recall. You do not discuss politics/hate speech."). Output validation (Safety Filters).

3.  **Data Leakage:** API Keys exposed in client.
    -   *Mitigation:* All keys in `.env.local` (server-only). Next.js build-time checks.

---

## 9.2 Authentication Flow

-   **Magic Link / OTP:** No passwords to store/leak.
-   **Session:** HTTP-only Secure Cookies.
-   **CSRF:** Protection enabled by default in Next.js Server Actions.

---

## 9.3 Data Protection

-   **At Rest:** Database encryption (AES-256) provided by Cloud Provider (Neon/Supabase).
-   **In Transit:** TLS 1.3 for all HTTP/WS traffic.
-   **PII:** "Emergency Contact" info is considered PII and access is logged.

---

## 9.4 Compliance (GDPR/CCPA)

-   **Right to Access:** `GET /api/user/export` provides full JSON dump.
-   **Right to Erasure:** `DELETE /api/user/me` triggers hard delete of all records.
-   **Consent:** Explicit opt-in for "Voice Recording" during onboarding.
