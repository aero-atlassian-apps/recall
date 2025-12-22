# Tool Contracts & Standards

## Overview

Tools are the effectors of the agent. To ensure safety and reliability, all tools must adhere to the `Tool` interface and specific behavioral contracts.

## Interface

```typescript
interface Tool {
    name: string;
    description: string;
    schema: Record<string, any>; // Zod-compatible JSON schema
    execute(input: any): Promise<unknown>; // Returns structured data
}
```

## Standards

### 1. Structured Output
Tools MUST return **structured data** (Objects/Arrays) rather than plain text strings.
-   **Bad**: `return "Found 2 memories: Bob (0.9), Alice (0.8)"`
-   **Good**: `return { memories: [{ text: "Bob", score: 0.9 }, ...] }`
*Reason*: The `StepExecutor` and `ObservationReflector` need to parse results programmatically.

### 2. Idempotency & Safety
-   **Read-Only**: Tools that only read data (e.g., `RetrieveMemories`) should be marked safe and can be retried safely.
-   **Side-Effects**: Tools that modify state (`SaveFact`, `SendEmail`) must be carefully managed. The planner should avoid retrying them blindly if the status is unknown.

### 3. Error Handling
-   **Exceptions**: If a tool fails due to technical errors (DB down), throw an `Error`. The `StepExecutor` will handle retries based on the plan policy (`retry` vs `abort`).
-   **Logical Failures**: If the tool succeeds technically but finds nothing (e.g., "No memories found"), return a successful result with empty data: `{ found: false, items: [] }`.

### 4. Input Validation
Tools are responsible for validating their own inputs (using the `schema`). If input is invalid, throw a descriptive error so the Agent can potentially self-correct (re-plan).

## Required Metadata
All tools must provide:
-   **Description**: Clear, natural language description of *when* to use the tool.
    -   *Example*: "Use this to look up details about the user's past, relationships, or preferences."
-   **Schema**: Parameter definitions including types and descriptions.
