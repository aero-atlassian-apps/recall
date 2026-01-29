## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2026-01-29 - Missing IDOR Check in User Preferences
**Vulnerability:** The `/api/users/[id]/preferences` endpoint blindly trusted the `id` parameter without verifying it against the authenticated user context (`x-user-id`), allowing any authenticated user to modify another's preferences.
**Learning:** While `proxy.ts` middleware handles authentication and injects user context, it does NOT enforce authorization for specific resources. Developers must manually implement the check `req.headers.get('x-user-id') === params.id` in every user-specific route.
**Prevention:** Mandate a helper function or middleware extension that enforces ownership for dynamic routes (e.g., `requireOwnership(req, params.id)`) to avoid ad-hoc and easily missed checks.
