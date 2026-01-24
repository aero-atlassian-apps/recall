## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2025-05-24 - IDOR in Nested API Routes
**Vulnerability:** The `/api/users/[id]/preferences` endpoint relied on the `id` path parameter without verifying it against the authenticated user's session ID (injected via `x-user-id` header).
**Learning:** Middleware authentication (verifying *who* you are) does not automatically provide authorization (verifying *what* you can touch). Explicit checks matching session identity to resource identity are required in every route handler.
**Prevention:** Always verify `req.headers.get('x-user-id') === params.id` at the start of any route handler that operates on user-specific resources.
