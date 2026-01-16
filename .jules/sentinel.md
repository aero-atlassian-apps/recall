## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2026-01-16 - IDOR in Export Endpoint due to Skipped Authz Check
**Vulnerability:** The `GET /api/users/[id]/export` endpoint relied on upstream authentication but failed to perform an *authorization* check to ensure the authenticated user matched the requested `id`. This allowed any authenticated user to export the data of any other user.
**Learning:** "Skipped for MVP" or "Assuming upstream check" comments are red flags. Authentication (Who are you?) does not imply Authorization (What can you do?). Even with global middleware, resource-specific ownership checks must be implemented in the route handler.
**Prevention:** Implement strict ownership checks (`request.headers.get('x-user-id') === params.id`) at the beginning of every user-specific route handler, regardless of upstream middleware.
