# Prompt Strategy & Composition

Recall uses an "AI-First" prompt strategy, emphasizing structured reasoning, safety boundaries, and high-empathy communication.

## Prompt Composition Hierarchy

The system context is built dynamically by the `ContextBudgetManager`. Sources are injected in a specific priority order to ensure core safety and intent are never pruned.

1.  **System Blueprint** (Highest Priority): Immutable Core Personality and Safety Instruction.
2.  **Instruction Augmentations**: Dynamic role-specific instructions (e.g., Biographer role).
3.  **Wellbeing Boundaries**: Real-time safety filters (loneliness, scam protection).
4.  **RELEVANT MEMORIES**: Context retrieved via RAG (Semantic/Episodic).
5.  **Conversation history**: Recent context window.
6.  **Task State**: Current plan, observations, and tool contract results.

## Structured Output (ReAct)

Every reasoning step is forced into a structured JSON schema. This ensures the State Machine can parse the agent's intent without brittle regex.

```json
{
  "thought": "The user is expressing sadness about a lost friend. I should prioritize empathy.",
  "action": "recall_memory",
  "action_input": "stories about friendship and childhood",
  "emotion_detected": "SADNESS",
  "confidence": 0.95
}
```

## Safety & Empathy (Implicit Layers)

### Wellbeing Guard
Every user input is analyzed for risk factors before the agent begins planning:
- **Crisis Detection**: Alerts on self-harm or deep depression markers.
- **Scam Protection**: Detects suspicious requests for money or sensitive info.
- **Medical Awareness**: Prevents the AI from giving unvalidated medical advice.

### Empathy Engine
The response synthesis phase is wrapped in an `EmpathyEngine` that adjusts:
- **Pacing**: Slower, more rhythmic responses for stressful topics.
- **Tone**: Warm, validating, and patient language.
- **Cognitive Load**: Simplifying complex explanations for users with high cognitive fatigue.

## Best Practices
- **No Concatenation**: Prompts are built from discrete sources via `ContextSource` objects.
- **Zod Validation**: All structured outputs are validated against Zod schemas at runtime.
- **One-Shot Examples**: Role-specific factories inject high-quality examples to anchor model behavior.
