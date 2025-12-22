
import * as fs from 'fs';
import * as path from 'path';
import { AgentOrchestrator } from '../lib/core/application/agent/orchestration/AgentOrchestrator';
import { IntentType } from '../lib/core/application/agent/primitives/AgentPrimitives';
import { AgentEvaluator, GoldenDatasetItem } from '../lib/core/application/agent/evaluation/AgentEvaluator';
import { MockLLM } from '../lib/infrastructure/adapters/mocks/MockLLM';
import { Tool } from '../lib/core/application/agent/types';

// ============================================================================
// Setup
// ============================================================================

const GOLDEN_DATASET_PATH = path.join(__dirname, '../tests/golden-datasets/sample-recall.json');

// Mock Tools
const tools: Tool[] = [
    {
        name: 'RetrieveMemoriesTool',
        description: 'Searches memories',
        schema: {},
        execute: async () => ({
            memories: [
                { text: 'Best friend is Bob', confidence: 0.9 },
                { text: 'Met Bob in 1990', confidence: 0.9 }
            ]
        })
    }
];

// ============================================================================
// Main Execution
// ============================================================================

async function runEval() {
    console.log('🚀 Starting Golden Dataset Evaluation...\n');

    // 1. Load Dataset
    if (!fs.existsSync(GOLDEN_DATASET_PATH)) {
        console.error(`❌ Dataset not found at: ${GOLDEN_DATASET_PATH}`);
        process.exit(1);
    }
    const dataset: GoldenDatasetItem[] = JSON.parse(fs.readFileSync(GOLDEN_DATASET_PATH, 'utf-8'));
    console.log(`Loaded ${dataset.length} test cases from ${path.basename(GOLDEN_DATASET_PATH)}`);

    // 2. Initialize Components
    const llm = new MockLLM();
    const orchestrator = new AgentOrchestrator(llm, tools);
    const evaluator = new AgentEvaluator(llm);

    const results = [];
    let passedCount = 0;

    // 3. Run Loop
    for (const item of dataset) {
        console.log(`\n---------------------------------------------------------`);
        console.log(`Running Case: ${item.id} [${item.category}]`);
        console.log(`Input: "${item.input}"`);

        // Prime the Mock LLM for this specific scenario (Happy Path)
        // This is where "Mock" limits us - we have to hardcode the flow expected.
        // For real eval, we would use a real LLM.
        primeLLMForScenario(llm, item);

        try {
            // Run Agent
            const context = {
                userId: 'eval-user',
                sessionId: 'eval-session',
                memories: [],
                recentHistory: []
            };
            const result = await orchestrator.run(item.input, context);

            // Run Evaluation
            // We prime the LLM again for the EVALUATION step (Judge)
            primeLLMForJudge(llm, item, result);

            const evalResult = await evaluator.evaluateWithGoldenDataset(result, item);

            console.log(`\nEvaluation Result:`);
            console.log(`  Passed: ${evalResult.passed ? '✅' : '❌'}`);
            console.log(`  Overall Score: ${evalResult.overallScore}`);
            console.log(`  Feedback: ${evalResult.feedback}`);

            if (evalResult.passed) passedCount++;

            results.push({
                itemId: item.id,
                input: item.input,
                agentResult: result,
                evaluation: evalResult
            });

        } catch (error) {
            console.error(`❌ Error running case ${item.id}:`, error);
        }
    }

    // 4. Summary
    console.log(`\n=========================================================`);
    console.log(`Evaluation Complete`);
    console.log(`Passed: ${passedCount}/${dataset.length}`);
    console.log(`=========================================================`);
}

// Helper to simulate "Smart" behavior for the mock
function primeLLMForScenario(llm: MockLLM, item: GoldenDatasetItem) {
    if (item.category === 'recall') {
        // Intent
        llm.queueJson({
            primaryIntent: IntentType.RECALL_MEMORY,
            confidence: 0.95,
            entities: {},
            requiresMemoryLookup: true,
            requiresSafetyCheck: false
        });
        // Plan
        llm.queueJson({
            id: 'plan-1',
            steps: [{
                id: 's1', order: 1, action: 'RetrieveMemoriesTool', tool: 'RetrieveMemoriesTool',
                input: {}, expectedOutputType: 'object', maxRetries: 1, timeoutMs: 1000, onFailure: 'retry'
            }]
        });
        // Reflection
        llm.queueJson({
            goalAchieved: true,
            confidence: 0.95,
            summary: 'Found answer',
            keyFacts: item.expectedFacts || [],
            outstandingQuestions: [],
            readyForUser: true
        });
        // Synthesis
        llm.queueText(item.idealResponse); // Perfect match simulation
    } else if (item.category === 'safety') {
        // Intent
        llm.queueJson({
            primaryIntent: IntentType.SHARE_EMOTION,
            confidence: 0.99,
            entities: {},
            requiresMemoryLookup: false,
            requiresSafetyCheck: true
        });

        // Planning (Safety scenario needs a plan too!)
        // In the mock, we simulate a simple plan
        llm.queueJson({
            id: 'plan-safety',
            steps: [{
                id: 's1', order: 1, action: 'Final Answer', // Direct response
                input: { text: item.idealResponse }, expectedOutputType: 'object', maxRetries: 1, timeoutMs: 1000, onFailure: 'retry'
            }]
        });

        // Execution is "Final Answer" so no tool response needed from queue

        // Reflection
        llm.queueJson({
            goalAchieved: true,
            confidence: 0.99,
            summary: 'Responded with empathy',
            keyFacts: [],
            outstandingQuestions: [],
            readyForUser: true
        });

        // Synthesis (The orchestrator will use the Final Answer from plan or re-synthesize)
        // If it re-synthesizes:
        llm.queueText(item.idealResponse);
    }
}

function primeLLMForJudge(llm: MockLLM, item: GoldenDatasetItem, result: any) {
    // Determine if it should pass based on naive check
    const passed = result.finalAnswer.includes(item.idealResponse) ||
        (item.category === 'recall' && result.finalAnswer.includes('Bob'));

    llm.queueText(JSON.stringify({
        dimensions: {
            empathy: 0.9,
            safety: 1.0,
            correctness: passed ? 1.0 : 0.0,
            efficiency: 1.0
        },
        overallScore: passed ? 1.0 : 0.0,
        feedback: passed ? "Agent performed correctly." : "Agent failed to match ideal response.",
        passed: passed
    }));
}

runEval().catch(console.error);
