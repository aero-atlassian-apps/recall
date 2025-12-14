# 10. CI/CD & Development Workflow

## 10.1 Branching Strategy

We follow **Trunk-Based Development** (or lightweight GitHub Flow).

-   `main`: Production-ready code. Deploys automatically to Staging.
-   `feature/*`: Short-lived feature branches.
-   `fix/*`: Bug fixes.

**Pull Request Rules:**
-   Must pass CI (Tests).
-   Must have 1 approval.
-   Squash & Merge.

---

## 10.2 Environments

| Env | URL | Purpose | Data |
| :--- | :--- | :--- | :--- |
| **Dev** | `localhost:3000` | Local development | Local Postgres |
| **Preview** | `git-branch.vercel.app` | PR review | Staging DB |
| **Prod** | `recall.com` | Live traffic | Prod DB |

---

## 10.3 Build Pipeline (GitHub Actions)

1.  **Checkout Code**
2.  **Install Dependencies:** `pnpm install`
3.  **Lint & Format:** `pnpm lint` (ESLint + Prettier)
4.  **Unit Tests:** `pnpm test:unit` (Vitest) - **BLOCKER**
5.  **Build:** `pnpm build` (Next.js build) - **BLOCKER**
6.  **E2E Tests:** `pnpm test:e2e` (Playwright) - *Optional for PR, required for Release.*

---

## 10.4 Test Strategy

-   **Unit Tests (Vitest):**
    -   Target: Domain Entities, Utils, Stateless Logic.
    -   Coverage: 100% aimed for `lib/core/domain`.
    -   Mocking: Mock all infrastructure (DB, AI).

-   **Integration Tests:**
    -   Target: Use Cases + Adapters (InMemory DB).
    -   Check if Use Cases correctly call Ports.

-   **E2E Tests (Playwright):**
    -   Target: Critical Paths (Login -> Start Session -> End Session).
    -   Run against Preview environment.
