import { MultiAgentOrchestrator, AgentMessageType } from '../lib/core/application/agent/orchestration/MultiAgentOrchestrator';
import { AgentRegistry, AgentRole, createDefaultRegistry } from '../lib/core/application/agent/registry/AgentRegistry';
import { SupervisorAgent } from '../lib/core/application/agent/orchestration/SupervisorAgent';
import { AgentContext, Tool } from '../lib/core/application/agent/types';
import { AgenticRunResult, HaltReason, AgentPhase } from '../lib/core/application/agent/primitives/AgentPrimitives';

// Mock LLM
const mockLLM = {
    generateText: async (prompt: string) => {
        if (prompt.includes("review")) {
            return JSON.stringify({ approved: true, feedback: "Good work.", score: 0.9 });
        }
        if (prompt.includes("Final PROPOSED RESPONSE")) {
            return JSON.stringify({ ready: true, summary: "Looks clean." });
        }
        return "I have processed your request.";
    },
    generateJson: async (prompt: string) => {
        if (prompt.includes("intent")) {
            return { primaryIntent: "ASK_QUESTION", confidence: 0.9, entities: {}, requiresMemoryLookup: false, requiresSafetyCheck: false };
        }
        return {};
    }
};

// Mock Agent
class MockWorkerAgent {
    async run(goal: string, context: AgentContext): Promise<AgenticRunResult> {
        return {
            success: true,
            finalAnswer: "Result for: " + goal,
            steps: [],
            observations: [],
            totalTokens: 100,
            totalCostCents: 1,
            durationMs: 10,
            traceId: "test-trace"
        };
    }
    getState() { return { phase: AgentPhase.IDLE, stepCount: 0, tokenCount: 0, costCents: 0, startTime: Date.now(), isHalted: false }; }
    async halt() { }
}

async function verify() {
    console.log("Verifying Multi-Agent Orchestration...");

    const registry = createDefaultRegistry();

    // Override factory for testing
    registry.registerFactory(AgentRole.SUPERVISOR, (config) => new SupervisorAgent(mockLLM as any, [], config as any));
    registry.registerFactory(AgentRole.PLANNER, () => new MockWorkerAgent() as any);
    registry.registerFactory(AgentRole.EXECUTOR, () => new MockWorkerAgent() as any);

    const orchestrator = new MultiAgentOrchestrator(registry);

    const context: AgentContext = {
        userId: "user-1",
        sessionId: "session-1",
        memories: [],
        recentHistory: []
    };

    const stages = [
        {
            name: 'plan',
            agentId: 'planner',
            inputTransform: (prev: any, ctx: any) => "Plan for " + ctx.goal,
            approvalRequired: false,
            onFailure: 'abort' as const
        },
        {
            name: 'execute',
            agentId: 'executor',
            inputTransform: (prev: any) => "Execute " + prev,
            approvalRequired: false,
            onFailure: 'abort' as const
        }
    ];

    console.log("  Running Supervised Pipeline...");
    const result = await orchestrator.runSupervisedPipeline(stages, 'supervisor-director', context, "Find my keys");

    if (result.success) {
        console.log("  ✅ Passed: Supervised pipeline executed successfully.");
        console.log("  Pipeline Result:", result.finalOutput);
    } else {
        console.error("  ❌ Failed: Pipeline failed.");
        console.error(result);
    }

    console.log("\nMulti-Agent Orchestration verification complete!");
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
