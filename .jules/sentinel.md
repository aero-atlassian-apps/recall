## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2026-01-28 - Implicit Authorization Assumption in Service Layer
**Vulnerability:** The `UserProfileUpdater` service and `GET/PATCH /api/users/[id]/preferences` endpoints allowed any authenticated user to modify any other user's profile because the route handler failed to compare the authenticated `x-user-id` with the target `id`.
**Learning:** The architecture relies on `proxy.ts` for authentication (setting `x-user-id`), but resource-level authorization (IDOR checks) is left entirely to individual route handlers. Domain services like `UserProfileUpdater` blindly trust the caller.
**Prevention:** Route handlers must explicitly validate `req.headers.get('x-user-id') === params.id` before calling services. Ideally, pass the authenticated context to the service layer so it can enforce ownership checks internally.
