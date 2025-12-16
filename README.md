# Recall MVP - Documentation

Welcome to the Recall MVP technical documentation. This repository contains the source code for the Recall application, an AI-powered voice companion for preserving senior memories.

## 📚 Documentation Suite

This project follows a strict "Zero-Trust" documentation policy. All definitive documentation is located in the `docs/` directory.

### Core Product
-   [01. Executive & Product Vision](docs/01_EXECUTIVE_VISION.md)
-   [02. User Experience & Functional Design](docs/02_USER_EXPERIENCE.md)
-   [03. System Architecture](docs/03_SYSTEM_ARCHITECTURE.md)
-   [04. Technical Architecture](docs/04_TECHNICAL_ARCHITECTURE.md)
-   [05. Core Logic & Algorithms](docs/05_CORE_LOGIC.md)
-   [06. Data & Database Design](docs/06_DATA_MODEL.md)

### Operations & Scale
-   [07. Performance & Scalability](docs/07_PERFORMANCE_SCALABILITY.md)
-   [08. Security & Compliance](docs/08_SECURITY_COMPLIANCE.md)
-   [09. DevOps & Infrastructure](docs/09_DEVOPS_INFRASTRUCTURE.md)
-   [10. Operations & Observability](docs/10_OPERATIONS_OBSERVABILITY.md)

### Future
-   [11. Launch Roadmap & Evolution](docs/11_LAUNCH_ROADMAP.md)

## 🚀 Run Locally (One Command)

We prioritize a seamless "local-first" development experience. You can bring up the entire stack (Frontend, Backend, Database, and Seeded Data) with a single command.

### Prerequisites
*   Docker & Docker Compose installed and running.

### Start the System

```bash
cd recall-mvp
docker compose up
```

This command will:
1.  Build the Next.js application container.
2.  Start a local PostgreSQL database.
3.  Wait for the database to be healthy.
4.  **Run Migrations:** Automatically apply the schema.
5.  **Seed Data:** Populate the database with a test Senior user, Family user, and a sample Session/Chapter.
6.  **Start the Server:** Available at `http://localhost:3000`.

### Local Credentials & Mocks
By default, the local environment runs in **Mock Mode**:
*   **AI Service:** Mocks responses (no API key needed).
*   **Vector Store:** Mocks retrieval (no Pinecone key needed).
*   **Email:** Mocks sending (logs to console).

**Test Users:**
*   **Senior:** `senior@example.com` (Role: senior)
*   **Family:** `family@example.com` (Role: family)

To switch to **Real Integrations**:
1.  Copy `recall-mvp/.env.example` to `recall-mvp/.env` (if not using docker-compose environment).
2.  Edit `docker-compose.yml` to set `USE_MOCKS=false`.
3.  Provide valid API keys in `docker-compose.yml` or your `.env` file for `GOOGLE_APPLICATION_CREDENTIALS_JSON`, `ELEVENLABS_API_KEY`, etc.

## 💻 Manual Development

If you prefer running services directly on your machine:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

## 🏗️ Project Structure

-   `recall-mvp/app`: Next.js App Router (Frontend + API)
-   `recall-mvp/lib`: Core Logic (Hexagonal Architecture)
    -   `core/domain`: Entities
    -   `core/application`: Use Cases
    -   `infrastructure`: Adapters (DB, AI, Email)
-   `recall-mvp/components`: React Components
-   `recall-mvp/tests`: Test Suites
