## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2026-01-01 - Missing Middleware Auth Bypass
**Vulnerability:** The application architecture assumed `middleware.ts` existed to verify sessions and inject trusted `x-user-id` headers. However, the file was missing, allowing attackers to spoof these headers on API endpoints and completely bypass authentication (acting as any user).
**Learning:** Architecture-as-Documentation (comments saying "handled by middleware") can become dangerous if the implementation is missing. Trusting internal headers without verifying the "trust boundary" (where they are injected) is a critical failure.
**Prevention:**
1.  Verify the existence of critical infrastructure components (middleware) during build/test.
2.  Explicitly strip sensitive headers (like `x-user-id`) at the network edge or in the very first line of middleware to prevent spoofing.
3.  Do not rely solely on comments for security assertions.
