## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2026-01-18 - Timing Attacks and Error Leakage in Cron Jobs
**Vulnerability:** The cron job endpoint used direct string comparison for `CRON_SECRET` (vulnerable to timing attacks) and returned raw error messages to the client (leaking internal details).
**Learning:** Direct string comparison leaks information about the secret's length and content via response time. Returning `error.message` directly exposes stack traces or database errors.
**Prevention:** Use `crypto.timingSafeEqual` with hashed inputs (to ensure equal length) for all secret comparisons. Always wrap sensitive logic in try/catch blocks that log the error server-side (using the `Logger` class) but return generic 500 errors to the client.
