# 12. Observability & Operations

## 12.1 Logging

-   **Library:** `pino` or `console` (structured).
-   **Structure:** `{ level: 'info', timestamp: '...', component: 'GeminiService', message: '...', metadata: {...} }`
-   **Destination:** Vercel Logs -> Datadog / Logflare (Integration).
-   **PII Rule:** NEVER log raw audio content or user emails in plain text.

---

## 12.2 Monitoring & Metrics

-   **Dashboard:** Vercel Analytics / Datadog.
-   **Key Metrics:**
    -   `vitals.ttfb` (Time to First Byte)
    -   `api.error_rate` (5xx responses)
    -   `job.chapter_generation.duration`
    -   `voice.connection_drops`

---

## 12.3 Alerting

-   **Channel:** Slack (`#ops-alerts`) + PagerDuty (Critical).
-   **Triggers:**
    -   Error Rate > 1% for 5 mins -> **High Priority**.
    -   Database CPU > 80% -> **Warning**.
    -   "Credit Card Failed" -> **Business Alert**.

---

## 12.4 Incident Response

1.  **Ack:** On-call engineer acknowledges alert.
2.  **Triage:** Is it code, infra, or 3rd party (OpenAI/Google down)?
    -   *If 3rd party:* Update Status Page.
    -   *If Code:* Revert last deployment immediately.
3.  **Resolve:** Fix root cause.
4.  **Post-Mortem:** Write "What happened, why, and how to prevent it."
