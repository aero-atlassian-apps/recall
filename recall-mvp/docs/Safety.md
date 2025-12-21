# Safety, Governance & Tool Contracts

Recall is designed for a vulnerable user base (seniors). Safety is not an "add-on" but a fundamental part of the system architecture.

## Tool Contracts & Permission Boundaries

Every tool available to the agent is governed by a `ToolContract`.

- **Type Safety**: Tool inputs are validated using Zod at the boundary.
- **Permission Mapping**: Tools are mapped to permission levels (e.g., `READ_ONLY`, `READ_WRITE`, `SENSITIVE`).
- **Audit Logs**: Every tool execution is recorded by the `EnhancedAgentTracer` with input/output payloads.

## Graduated Autonomy

The `AutonomyControl` system manages how much freedom the agent has based on the risk level of the task.

| Level | Risk Category | Behavior |
| :--- | :--- | :--- |
| **L0: No Autonomy** | Critical | Every step requires human-in-the-loop (HITL) confirmation. |
| **L1: Supervised** | High | Agent can plan, but execution of "Write" tools requires a "YES" from the supervisor. |
| **L2: Guarded** | Medium | Agent can execute most tools but is automatically halted if `WellbeingGuard` triggers. |
| **L3: Full Autonomy** | Low | Standard ReAct loop with standard safety filters. |

## Wellbeing Guard (Real-Time Monitoring)

The `WellbeingGuard` acts as a parallel observer during the `RECOGNIZING_INTENT` and `REFLECTING` states.

- **Scam Detection**: Analyzing intents for "requests for money," "unknown links," or "pressure tactics."
- **Crisis Intervention**: Identifying markers of self-harm, cognitive distress, or extreme isolation.
- **Policy Enforcement**: Ensuring the agent NEVER takes a medical or legal stance beyond generic, safe advice.

## Emergency Halt

The `AgentLoopMonitor` can trigger an `Emergency Halt` across any state if:
1.  Budget is exceeded.
2.  Too many loops are detected (recursion prevention).
3.  Safety triggers return a `CRITICAL` severity rating.
4.  The `SupervisorAgent` rejects a plan as potentially harmful.

## Circuit Breakers

Infrastructure adapters (LLM, Vector DB) use circuit breakers to prevent cascading failures. If an external service is down, the agent gracefully degrades to `SAFE_MODE` (offline capabilities only).
