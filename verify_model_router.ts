import { ModelRouter, ModelProfile, TaskComplexity, ModelTier, ModelConfig } from './lib/core/application/agent/routing/ModelRouter';
import { AgentRegistry, AgentRole } from './lib/core/application/agent/registry/AgentRegistry';
import { LLMPort } from './lib/core/application/ports/LLMPort';
import { AgentContext } from './lib/core/application/agent/types';

// 1. Mock LLM for verification
class MockLLM implements LLMPort {
    async generateText(prompt: string, options?: { model?: string }): Promise<string> {
        console.log(`[MockLLM] generateText called with model: ${options?.model}`);
        if (prompt.includes('Intent Recognition')) {
            return JSON.stringify({
                primaryIntent: 'GREETING',
                confidence: 0.9,
                entities: {},
                requiresMemoryLookup: false,
                requiresSafetyCheck: false,
                reasoning: 'Verified'
            });
        }
        return JSON.stringify({
            thought: "I should respond simply.",
            action: "Final Answer",
            actionInput: "Hello! I am your AI companion."
        });
    }
    async generateJson<T>(prompt: string, schema?: any, options?: { model?: string }): Promise<T> {
        console.log(`[MockLLM] generateJson called with model: ${options?.model}`);
        return {} as T;
    }
    async analyzeImage(imageBase64: string, mimeType: string, prompt: string, options?: { model?: string }): Promise<string> {
        return "Mock image analysis";
    }
}

// 2. Setup Router Configurations
const models: ModelConfig[] = [
    {
        id: 'gemini-1.5-flash',
        name: 'Gemini Flash',
        provider: 'google',
        tier: ModelTier.FLASH,
        costPer1KInputTokens: 0.03,
        costPer1KOutputTokens: 0.1,
        maxContextTokens: 1000000,
        maxOutputTokens: 8192,
        latencyP50Ms: 200,
        latencyP95Ms: 500,
        capabilities: [TaskComplexity.CLASSIFICATION, TaskComplexity.FORMATTING],
        qualityScores: {
            [TaskComplexity.CLASSIFICATION]: 0.9,
            [TaskComplexity.REASONING]: 0.4
        },
        available: true
    },
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini Pro',
        provider: 'google',
        tier: ModelTier.PRO,
        costPer1KInputTokens: 0.125,
        costPer1KOutputTokens: 0.375,
        maxContextTokens: 2000000,
        maxOutputTokens: 8192,
        latencyP50Ms: 800,
        latencyP95Ms: 2000,
        capabilities: [TaskComplexity.REASONING, TaskComplexity.CODE, TaskComplexity.SAFETY_CRITICAL],
        qualityScores: {
            [TaskComplexity.CLASSIFICATION]: 0.95,
            [TaskComplexity.REASONING]: 0.95
        },
        available: true
    }
];

async function verifyRouting() {
    console.log("=== Phase 7: Model Router Verification ===");

    const llm = new MockLLM();
    const router = new ModelRouter(models);
    const registry = AgentRegistry.createDefaultRegistry(llm, router);

    const context: AgentContext = {
        userId: 'user-123',
        sessionId: 'session-456',
        userName: 'Alice',
        environment: 'web'
    };

    // Test Case 1: Simple Retrieval (should route to Flash if configured)
    console.log("\n--- Test Case 1: Simple Query (Expect Flash) ---");
    const agent = registry.create('conversational-director', context, llm, router);
    // Note: conversational-director is BALANCED, but a very short prompt might trigger CLASSIFICATION logic
    const result1 = await agent.run("Hello there", context);
    console.log(`Final Answer: ${result1.finalAnswer}`);
    console.log(`Models Used: ${result1.steps.map(s => s.action).join(', ')}`);

    // Test Case 2: Complex Reasoning
    console.log("\n--- Test Case 2: Complex Query (Expect Pro) ---");
    const complexGoal = "Please analyze the historical significance of the 1969 moon landing and how it affected international relations during the Cold War.";
    const result2 = await agent.run(complexGoal, context);
    console.log(`Final Answer: ${result2.finalAnswer}`);

    console.log("\n=== Verification Complete ===");
}

verifyRouting().catch(console.error);
