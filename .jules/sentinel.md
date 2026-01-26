## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2026-01-26 - Missing Header-to-Param Verification (IDOR)
**Vulnerability:** The `/api/users/[id]/preferences` endpoint blindly trusted the `id` route parameter without verifying it against the authenticated user ID in the `x-user-id` header injected by middleware.
**Learning:** Middleware authentication alone is insufficient for authorization. It authenticates *who* the user is, but endpoints must still verify *if* that user has permission to access the specific resource requested.
**Prevention:** In every route handler that uses a user ID parameter, explicitly check: `req.headers.get('x-user-id') === params.id`. Do not assume middleware handles resource-specific authorization.
