## 2026-01-23 - IDOR in Family Chapter Access
**Vulnerability:** The `GET /api/family/chapters/[id]` endpoint relied on `searchParams.get('userId')` to identify the requester, ignoring the secure `x-user-id` header injected by middleware. This allowed any authenticated user to impersonate another by simply changing the `userId` query parameter.
**Learning:** Even when robust authentication middleware exists (injecting `x-user-id`), individual endpoints can still be vulnerable if they bypass these headers in favor of user-controlled input (query params or body).
**Prevention:** Always use the trusted `x-user-id` (or equivalent context object) provided by the authentication layer. Never trust client-supplied user IDs for authorization checks.
