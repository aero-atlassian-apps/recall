/**
 * Agent Orchestrator - The Central Brain.
 * 
 * Coordinates the entire agentic lifecycle:
 * 1. Intent Recognition
 * 2. Planning (AoT)
 * 3. Execution (ReAct Loop)
 * 4. Reflection
 * 5. Synthesis
 * 
 * @module AgentOrchestrator
 */

import { LLMPort } from '../../ports/LLMPort';
import { AgentContext, AgentStep, Tool } from '../types';
import {
    AgenticRunner,
    AgenticRunResult,
    AgentState,
    AgentPhase,
    HaltReason,
    IntentType,
    ExecutionPlan,
    ProcessedObservation,
    ObservationType,
    PlannedStep,
    ExecutionContext
} from '../primitives/AgentPrimitives';

import { ContextManager } from '../context/ContextManager';
import { AgentLoopMonitor } from '../monitoring/AgentLoopMonitor';
import { IntentRecognizer } from '../recognition/IntentRecognizer';
import { EnhancedAgentPlanner } from '../planning/EnhancedAgentPlanner';
import { StepExecutor } from '../execution/StepExecutor';
import { ObservationReflector } from '../reflection/ObservationReflector';
import { AnswerSynthesizer } from '../execution/AnswerSynthesizer'; // Check path

export class AgentOrchestrator implements AgenticRunner {
    private state: AgentState;
    private contextManager: ContextManager;
    private intentRecognizer: IntentRecognizer;
    private planner: EnhancedAgentPlanner;
    private stepExecutor: StepExecutor;
    private reflector: ObservationReflector;
    private synthesizer: AnswerSynthesizer;
    private monitor: AgentLoopMonitor;

    constructor(
        private llm: LLMPort,
        private tools: Tool[]
    ) {
        this.contextManager = new ContextManager();
        this.intentRecognizer = new IntentRecognizer(llm);
        this.planner = new EnhancedAgentPlanner(llm); // Default config
        this.stepExecutor = new StepExecutor(llm, tools);
        this.reflector = new ObservationReflector(llm);
        this.synthesizer = new AnswerSynthesizer(llm);

        // Initialize monitor with default config (should be passed in via config)
        this.monitor = new AgentLoopMonitor({
            maxSteps: 20,
            maxTimeMs: 60000,
            maxTokens: 10000,
            maxCostCents: 50,
            maxReplanAttempts: 3
        });

        this.state = {
            phase: AgentPhase.IDLE,
            stepCount: 0,
            tokenCount: 0,
            costCents: 0,
            startTime: 0,
            isHalted: false
        };
    }

    public async run(goal: string, context: AgentContext): Promise<AgenticRunResult> {
        this.resetState();
        this.monitor.reset(); // Reset monitor
        const startTime = Date.now();
        const runId = `run-${startTime}`;

        try {
            // 1. INTENT RECOGNITION
            this.updatePhase(AgentPhase.RECOGNIZING_INTENT);
            console.log(`[Orchestrator] Recognizing intent for: "${goal}"`);
            const intent = await this.intentRecognizer.recognize(goal, context);
            console.log(`[Orchestrator] Intent: ${intent.primaryIntent} (${intent.confidence})`);

            // Short-circuit for Greetings / End Session
            if (intent.primaryIntent === IntentType.GREETING || intent.primaryIntent === IntentType.END_SESSION) {
                // @ts-ignore
                const reply = await this.synthesizer.synthesizeSimpleReply(goal, intent, context);
                return this.buildResult(true, reply, [], [], undefined, startTime);
            }

            // 2. PLANNING (AoT)
            this.updatePhase(AgentPhase.PLANNING);
            console.log(`[Orchestrator] Generating plan...`);
            let plan: ExecutionPlan;

            // Simple logic: if simple query, make simple plan. If share memory, make verification plan.
            if (intent.primaryIntent === IntentType.ASK_QUESTION && intent.confidence > 0.8) {
                plan = await this.planner.createSimplePlan(goal, context);
            } else {
                // Full decomposition for complex tasks
                const decomposition = {
                    subTasks: [{
                        id: 'main',
                        description: goal,
                        type: 'GENERATION' as any,
                        complexity: 'medium' as any,
                        optional: false
                    }],
                    dependencies: new Map(),
                    estimatedComplexity: 'medium' as any
                };
                plan = await this.planner.generate(decomposition, { maxSteps: 10 });
            }
            console.log(`[Orchestrator] Plan generated with ${plan.steps.length} steps.`);

            // 3. EXECUTION LOOP
            this.updatePhase(AgentPhase.EXECUTING);
            const stepsTaken: AgentStep[] = [];
            const observations: ProcessedObservation[] = [];

            const executionContext: ExecutionContext = {
                agentContext: context,
                previousResults: [],
                observations: [],
                tokenCount: 0,
                costCents: 0
            };

            let finalReflection: any;

            for (const step of plan.steps) {
                // Check monitor limits
                if (this.monitor.shouldHalt()) {
                    const haltReason = this.monitor.getHaltReason();
                    this.halt(haltReason || HaltReason.MAX_STEPS); // Fallback
                    break;
                }

                if (this.state.isHalted) break;
                if (this.state.stepCount >= (plan.maxRetries || 10)) {
                    this.halt(HaltReason.MAX_STEPS);
                    break;
                }

                this.state.stepCount++;
                console.log(`[Orchestrator] Executing Step ${step.order}: ${step.action}`);

                // EXECUTE
                const result = await this.stepExecutor.execute(step, executionContext);

                // Track usage in state AND monitor
                executionContext.previousResults.push(result);
                this.state.tokenCount += result.tokensUsed;
                this.state.costCents += result.costCents;

                this.monitor.recordStep({
                    stepId: step.id,
                    stepName: step.action,
                    inputTokens: 0, // Need to get actuals if avail
                    outputTokens: result.tokensUsed, // Approximation if split not avail
                    costCents: result.costCents,
                    durationMs: result.durationMs,
                    model: 'unknown'
                });

                // OBSERVE
                this.updatePhase(AgentPhase.OBSERVING);
                const observation: ProcessedObservation = {
                    stepId: step.id,
                    type: result.success ? ObservationType.INFORMATION : ObservationType.ERROR,
                    insight: `Result: ${JSON.stringify(result.output)}`, // Simplified
                    confidence: 1,
                    invalidatesPlan: false,
                    rawData: result.output
                };
                observations.push(observation);
                executionContext.observations.push(observation);

                stepsTaken.push({
                    thought: `Executing step ${step.id}`,
                    action: step.action,
                    actionInput: step.input,
                    observation: observation.insight
                });

                // REFLECT
                this.updatePhase(AgentPhase.REFLECTING);
                const reflection = await this.reflector.validate(observations, goal);

                if (reflection.goalAchieved && reflection.readyForUser) {
                    console.log(`[Orchestrator] Goal achieved!`);
                    finalReflection = reflection;
                    break; // Done!
                }

                // Break loop if error and not recoverable (simplified)
                if (!result.success && step.onFailure === 'abort') {
                    console.error(`[Orchestrator] Critical step failed.`);
                    break;
                }
            }

            // 4. SYNTHESIS
            this.updatePhase(AgentPhase.SYNTHESIZING);
            let finalAnswer = "";

            if (finalReflection && finalReflection.goalAchieved) {
                finalAnswer = await this.synthesizer.synthesize(finalReflection, context);
            } else {
                finalAnswer = "I tried to help, but I couldn't fully complete the task based on the steps I took.";
                if (observations.length > 0) {
                    // Fallback synthesis
                    finalAnswer += " Here is what I found: " + observations.map(o => o.insight).join('. ');
                }
            }

            this.updatePhase(AgentPhase.DONE);
            return this.buildResult(true, finalAnswer, stepsTaken, observations, finalReflection, startTime);

        } catch (error: any) {
            console.error("[Orchestrator] Fatal Error:", error);
            this.updatePhase(AgentPhase.ERROR);
            return this.buildResult(false, `System Error: ${error.message}`, [], [], undefined, startTime);
        }
    }

    public getState(): AgentState {
        return { ...this.state };
    }

    public async halt(reason: HaltReason): Promise<void> {
        this.state.isHalted = true;
        console.warn(`[Orchestrator] Halted: ${reason}`);
    }

    private updatePhase(phase: AgentPhase) {
        this.state.phase = phase;
    }

    private resetState() {
        this.state = {
            phase: AgentPhase.IDLE,
            stepCount: 0,
            tokenCount: 0,
            costCents: 0,
            startTime: Date.now(),
            isHalted: false
        };
    }

    private buildResult(
        success: boolean,
        finalAnswer: string,
        steps: AgentStep[],
        observations: ProcessedObservation[],
        reflection: any,
        startTime: number
    ): AgenticRunResult {
        return {
            success,
            finalAnswer,
            steps,
            observations,
            reflection,
            totalTokens: this.state.tokenCount,
            totalCostCents: this.state.costCents,
            durationMs: Date.now() - startTime,
            traceId: `trace-${startTime}`
        };
    }
}
