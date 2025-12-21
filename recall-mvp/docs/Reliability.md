# Reliability & Evaluation

The Recall system is built for resilience and measurable quality.

## Failure Modes & Recovery

| Mode | Trigger | Recovery Strategy |
| :--- | :--- | :--- |
| **Hallucination** | Reflection step detects mismatch | Re-reasoning with higher temperature or model upgrade. |
| **Token Overflow** | `ContextBudgetManager` over budget | Priority-based pruning of history and observations. |
| **Tool Error** | Tool returns error observation | Re-planning state triggered to find alternative path. |
| **Model Outage** | LLM API returns 500/timeout | `ModelRouter` switches to a fallback provider (e.g., Anthropic -> Gemini). |
| **Safety Block** | `WellbeingGuard` critical hit | Immediate transition to `DONE` with a safe fallback response. |

## Evaluation Methodology

Quality is monitored via three distinct metrics:

1.  **Confidence Scoring**: The agent predicts its own confidence. If < 0.8, it triggers a `Self-Reflect` loop.
2.  **Cost vs. Quality Analysis**: Track the performance of the `ModelRouter` to ensure Flash models are not compromising task outcomes.
3.  **Trace Analysis**: Using the `EnhancedAgentTracer` to identify bottleneck states (e.g., where replanning happens most).

## Observability

The `EnhancedAgentTracer` provides OTel-compatible spans for every interaction:
- **Phase Durations**: Which state (THINKING vs. ACTING) takes the longest.
- **Token Breakdown**: Cost per step.
- **State Transitions**: Visualization of the agent's internal path.
