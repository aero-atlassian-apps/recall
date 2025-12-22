# Prompt Engineering Governance

## Overview

Prompts are treated as **code** in the Recall architecture. They are versioned, managed via a registry, and audited for quality and safety.

## The Prompt Registry (`PromptRegistry.ts`)

We use a centralized `PromptRegistry` to manage all system, task, and safety prompts.
-   **Versioning**: All prompts have semantic properties (`id`, `version`).
-   **Structure**: Prompts are defined as templates with explicit variables (`{{variable}}`).
-   **Metadata**: Prompts include `tokenEstimate`, `category`, and `tags`.

### Usage
```typescript
const registry = new PromptRegistry();
const prompt = registry.getOrThrow('intent-recognition', '1.0.0');
const text = registry.render('intent-recognition', { user_input: "..." });
```

## Governance Workflow

1.  **Creation**: New prompts are added to `PromptRegistry` (or a factory) with a new version number.
2.  **Audit**: Run `npx tsx scripts/prompt-audit.ts` to check for:
    -   Vague language ("maybe", "I think").
    -   Missing JSON structure definitions.
    -   Incomplete metadata.
3.  **Testing**: Run `npx tsx scripts/run-eval.ts` to verify that prompt changes do not regress core scenarios.

## Prompt Guidelines

### 1. Structural
-   **Strict JSON**: For agentic steps, always require JSON output. Provide a TypeScript interface or example.
-   **Markdown Wrappers**: Ask models to wrap JSON in ````json ... ```` for reliable parsing.
-   **Input Sections**: Clearly demarcate input headers (e.g., `USER INPUT:`, `CONTEXT:`).

### 2. Tone & Safety
-   **Empathy**: System prompts must enforce an empathetic, patient persona ("Biographer").
-   **Safety**: Explicitly instruct the model to flag distress.
-   **Zero-Promise**: Do not promise external actions (e.g., "I will call a doctor") unless a tool exists and is authorized.

### 3. Efficiency
-   **Conciseness**: Avoid polite filler ("Please", "I would appreciate").
-   **Chain of Thought**: Ask for `reasoning` field in JSON before the final classification/answer to improve logic.
