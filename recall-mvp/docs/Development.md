# Development Guide: Adding New Agents

Adding a new agent role to Recall requires following the safety and registry protocols.

## Extension Pattern

1.  **Define Role**: Add your role to the `AgentRole` enum in `AgentRegistry.ts`.
2.  **Create Contract**: If the agent requires new tools, define their Zod schemas in `ToolContracts.ts`.
3.  **Implement Factory**: Register a new factory in the `AgentRegistry`.
4.  **Configure State Machine**: Tune the `EnhancedReActAgentConfig` for the specific needs (e.g., high maxSteps for researchers).

## The Registry Pattern

```typescript
const registry = new AgentRegistry();

registry.registerFactory(AgentRole.MEMORY_KEEPER, (config, context, llm, router, v, e) => {
    return new EnhancedReActAgent(llm, router, memoryKeeperTools, {
        ...config,
        role: 'memory-keeper',
        maxSteps: 5,
        tokenBudget: 50000,
    }, v, e);
});
```

## Safety Checklist
- [ ] **System Prompt**: Does it include the immutable safety rules?
- [ ] **Capability Mapping**: Is the agent only assigned tools it strictly needs?
- [ ] **Cost Budgeting**: Is the token budget appropriate for the role's model profile?
- [ ] **Trace Integration**: Is the custom logic calling `tracer.startSpan` and `tracer.recordEvent`?
