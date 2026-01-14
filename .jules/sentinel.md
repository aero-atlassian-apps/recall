## 2024-05-23 - Default-Value Auth Bypass in Cron Jobs
**Vulnerability:** The cron job endpoint checked `authHeader !== 'Bearer ' + process.env.CRON_SECRET`. When `CRON_SECRET` was undefined, this resolved to `"Bearer undefined"`, allowing attackers to bypass authentication by sending that exact header string.
**Learning:** Relying on implicit string concatenation with environment variables can create accidental "fail-open" scenarios where a missing configuration creates a vulnerability rather than an error.
**Prevention:** Always explicitly check if the secret/environment variable exists (`if (!secret)`) before performing the comparison, or ensure the application fails to start if critical secrets are missing.

## 2024-05-24 - Over-Permissive Route Configuration
**Vulnerability:** Defining public routes purely by path (e.g., `/api/users`) unintentionally exposed sensitive operations (GET/list) when only specific methods (POST/create) were intended for public access.
**Learning:** Route-based allowlists are often too coarse. "Public" often means "Public for a specific action," not "Public for everything on this resource."
**Prevention:** When defining public API routes, always pair the path check with a method check (e.g., `path === '/api/users' && method === 'POST'`) to enforce the Principle of Least Privilege.
