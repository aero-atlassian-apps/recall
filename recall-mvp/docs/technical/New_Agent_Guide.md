# How to Add New Agent Capabilities

## Overview

Adding new capabilities (or "Agents") to the system involves defining new **Intents**, **Standard Operating Procedures (Prompts)**, and potentially **Tools**.

## Step-by-Step Guide

### 1. Define the Intent
If the new capability represents a distinct user goal (e.g., "Schedule Event"), add it to `IntentType` in `AgentPrimitives.ts`.
```typescript
export enum IntentType {
    // ...
    SCHEDULE_EVENT = 'SCHEDULE_EVENT',
}
```

### 2. Update Intent Recognition
Update the `intent-recognition` prompt in `PromptRegistry.ts` (or via factory) to include the new intent in the classification list and provide examples/logic for when to select it.

### 3. Register Prompts
Add any specific prompts needed for this capability to the `PromptRegistry`.
-   **Task Prompt**: How to decompose or execute this task.
-   **Safety Prompt**: Any specific guardrails.

### 4. Create Tools (If needed)
If the agent needs to perform new actions (e.g., Calendar API), create a new Tool that implements the `Tool` interface.
```typescript
const CalendarTool: Tool = {
    name: 'CalendarTool',
    schema: { action: 'create', time: 'string' ... },
    execute: async (input) => { ... }
};
```
Register the tool with the `AgentOrchestrator` (usually passed in via configuration/factory).

### 5. Verify
1.  Add a new test case to `tests/golden-datasets/` that targets this new intent.
    ```json
    {
      "category": "schedule",
      "input": "Schedule a meeting with Dr. Smith tomorrow",
      "expectedIntent": "SCHEDULE_EVENT",
      ...
    }
    ```
2.  Run `npx tsx scripts/run-eval.ts` to ensure the agent correctly identifies and executes the new capability without regressing others.

## Deployment
-   Bump the version of modified prompts in `PromptRegistry`.
-   Use `run-eval.ts` to validate performance before merging.
