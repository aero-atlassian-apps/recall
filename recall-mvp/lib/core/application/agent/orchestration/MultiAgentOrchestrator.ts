/**
 * Multi-Agent Orchestrator - Coordination layer for multi-agent workflows.
 * 
 * Manages agent pipelines, hand-offs, message passing, and approval gates
 * for complex multi-agent workflows.
 * 
 * @module MultiAgentOrchestrator
 */

import { AgenticRunner, AgenticRunResult, HaltReason, AgentPhase } from '../primitives/AgentPrimitives';
import { AgentContext } from '../types';
import { AgentRegistry, AgentRole } from '../registry/AgentRegistry';

// ============================================================================
// Types
// ============================================================================

/**
 * Message between agents.
 */
export interface AgentMessage {
    /** Unique message ID */
    id: string;
    /** Sender agent ID */
    from: string;
    /** Recipient agent ID */
    to: string;
    /** Message type */
    type: AgentMessageType;
    /** Message payload */
    payload: unknown;
    /** Transferred context */
    context: TransferredContext;
    /** Timestamp */
    timestamp: number;
}

export enum AgentMessageType {
    /** Hand off control to another agent */
    HANDOFF = 'HANDOFF',
    /** Request information or action */
    REQUEST = 'REQUEST',
    /** Response to a request */
    RESPONSE = 'RESPONSE',
    /** Critique/review of output */
    CRITIQUE = 'CRITIQUE',
    /** Approval of output */
    APPROVAL = 'APPROVAL',
    /** Rejection of output */
    REJECTION = 'REJECTION',
}

/**
 * Context transferred between agents.
 */
export interface TransferredContext {
    /** Original goal */
    goal: string;
    /** Accumulated observations */
    observations: unknown[];
    /** Key facts learned */
    keyFacts: string[];
    /** Token budget remaining */
    tokenBudgetRemaining: number;
    /** Cost budget remaining */
    costBudgetRemaining: number;
    /** Previous agent results */
    previousResults: AgentStageResult[];
}

/**
 * A stage in a pipeline.
 */
export interface PipelineStage {
    /** Stage name */
    name: string;
    /** Agent ID to use */
    agentId: string;
    /** Transform previous output to this stage's input */
    inputTransform: (prevOutput: unknown, context: TransferredContext) => string;
    /** Whether this stage requires approval before proceeding */
    approvalRequired: boolean;
    /** Optional timeout override */
    timeoutMs?: number;
    /** Condition to skip this stage */
    skipIf?: (context: TransferredContext) => boolean;
    /** On failure behavior */
    onFailure: 'abort' | 'skip' | 'retry';
    /** Max retries if onFailure is 'retry' */
    maxRetries?: number;
}

/**
 * Result of a pipeline stage.
 */
export interface AgentStageResult {
    /** Stage name */
    stageName: string;
    /** Agent ID */
    agentId: string;
    /** Whether it succeeded */
    success: boolean;
    /** The result */
    result: AgenticRunResult | null;
    /** Duration in ms */
    durationMs: number;
    /** Whether it was skipped */
    skipped: boolean;
    /** Skip reason if skipped */
    skipReason?: string;
    /** Approval status if required */
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

/**
 * Complete pipeline result.
 */
export interface PipelineResult {
    /** Whether the pipeline succeeded */
    success: boolean;
    /** Results from each stage */
    stageResults: AgentStageResult[];
    /** Final output */
    finalOutput: unknown;
    /** Total duration */
    totalDurationMs: number;
    /** Total tokens used */
    totalTokens: number;
    /** Total cost in cents */
    totalCostCents: number;
    /** Messages exchanged */
    messages: AgentMessage[];
    /** Halt reason if halted */
    haltReason?: HaltReason;
}

/**
 * Result of a critique.
 */
export interface CritiqueResult {
    /** Whether the output passed critique */
    passed: boolean;
    /** Critique score (0-1) */
    score: number;
    /** Issues found */
    issues: CritiqueIssue[];
    /** Suggestions for improvement */
    suggestions: string[];
    /** Summary */
    summary: string;
}

export interface CritiqueIssue {
    /** Issue type */
    type: 'accuracy' | 'completeness' | 'clarity' | 'safety' | 'format';
    /** Severity */
    severity: 'low' | 'medium' | 'high';
    /** Description */
    description: string;
    /** Location in output */
    location?: string;
}

/**
 * Approval request.
 */
export interface ApprovalRequest {
    /** Checkpoint name */
    checkpoint: string;
    /** Data to approve */
    data: unknown;
    /** Context */
    context: TransferredContext;
    /** Timeout for approval */
    timeoutMs: number;
}

/**
 * Approval result.
 */
export interface ApprovalResult {
    /** Whether approved */
    approved: boolean;
    /** Approver (user or system) */
    approver: string;
    /** Comments */
    comments?: string;
    /** Modifications requested */
    modifications?: unknown;
    /** Timestamp */
    timestamp: number;
}

/**
 * Approval handler function.
 */
export type ApprovalHandler = (request: ApprovalRequest) => Promise<ApprovalResult>;

// ============================================================================
// Multi-Agent Orchestrator
// ============================================================================

/**
 * Orchestrates multi-agent workflows.
 * 
 * Usage:
 * ```typescript
 * const orchestrator = new MultiAgentOrchestrator(registry);
 * 
 * // Define a pipeline
 * const pipeline: PipelineStage[] = [
 *   {
 *     name: 'plan',
 *     agentId: 'planner',
 *     inputTransform: (_, ctx) => ctx.goal,
 *     approvalRequired: false,
 *     onFailure: 'abort',
 *   },
 *   {
 *     name: 'execute',
 *     agentId: 'executor',
 *     inputTransform: (plan, _) => `Execute: ${JSON.stringify(plan)}`,
 *     approvalRequired: false,
 *     onFailure: 'retry',
 *     maxRetries: 2,
 *   },
 *   {
 *     name: 'review',
 *     agentId: 'critic',
 *     inputTransform: (result, _) => `Review: ${JSON.stringify(result)}`,
 *     approvalRequired: true,
 *     onFailure: 'abort',
 *   },
 * ];
 * 
 * const result = await orchestrator.runPipeline(pipeline, context, goal);
 * ```
 */
export class MultiAgentOrchestrator {
    private registry: AgentRegistry;
    private agents: Map<string, AgenticRunner> = new Map();
    private messages: AgentMessage[] = [];
    private approvalHandler?: ApprovalHandler;

    constructor(registry: AgentRegistry) {
        this.registry = registry;
    }

    /**
     * Set the approval handler.
     */
    setApprovalHandler(handler: ApprovalHandler): void {
        this.approvalHandler = handler;
    }

    // ============================================================================
    // Pipeline Execution
    // ============================================================================

    /**
     * Run a multi-stage pipeline.
     */
    async runPipeline(
        stages: PipelineStage[],
        context: AgentContext,
        goal: string,
        initialBudget?: { tokens: number; costCents: number }
    ): Promise<PipelineResult> {
        const startTime = Date.now();
        const stageResults: AgentStageResult[] = [];
        const messages: AgentMessage[] = [];

        let transferredContext: TransferredContext = {
            goal,
            observations: [],
            keyFacts: [],
            tokenBudgetRemaining: initialBudget?.tokens || 50000,
            costBudgetRemaining: initialBudget?.costCents || 100,
            previousResults: [],
        };

        let previousOutput: unknown = null;
        let totalTokens = 0;
        let totalCost = 0;

        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const stageStart = Date.now();

            // Check skip condition
            if (stage.skipIf && stage.skipIf(transferredContext)) {
                stageResults.push({
                    stageName: stage.name,
                    agentId: stage.agentId,
                    success: true,
                    result: null,
                    durationMs: 0,
                    skipped: true,
                    skipReason: 'Skip condition met',
                });
                continue;
            }

            // Get or create agent
            let agent = this.agents.get(stage.agentId);
            if (!agent) {
                try {
                    agent = this.registry.create(stage.agentId, context);
                    this.agents.set(stage.agentId, agent);
                } catch (error) {
                    console.error(`[Orchestrator] Failed to create agent ${stage.agentId}:`, error);

                    if (stage.onFailure === 'abort') {
                        return this.createFailedResult(stageResults, messages, startTime, 'Agent creation failed');
                    }

                    stageResults.push({
                        stageName: stage.name,
                        agentId: stage.agentId,
                        success: false,
                        result: null,
                        durationMs: Date.now() - stageStart,
                        skipped: stage.onFailure === 'skip',
                        skipReason: stage.onFailure === 'skip' ? 'Agent creation failed' : undefined,
                    });
                    continue;
                }
            }

            // Transform input
            const stageGoal = stage.inputTransform(previousOutput, transferredContext);

            // Record handoff message
            const handoffMessage = this.createMessage(
                i === 0 ? 'orchestrator' : stages[i - 1].agentId,
                stage.agentId,
                AgentMessageType.HANDOFF,
                { goal: stageGoal, previousOutput },
                transferredContext
            );
            messages.push(handoffMessage);

            // Execute with retries
            let result: AgenticRunResult | null = null;
            let attempts = 0;
            const maxAttempts = stage.onFailure === 'retry' ? (stage.maxRetries || 1) + 1 : 1;

            while (attempts < maxAttempts) {
                attempts++;
                try {
                    result = await agent.run(stageGoal, context);

                    if (result.success) break;

                    if (stage.onFailure !== 'retry' || attempts >= maxAttempts) break;

                    console.log(`[Orchestrator] Stage ${stage.name} failed, retrying (${attempts}/${maxAttempts})`);
                } catch (error) {
                    console.error(`[Orchestrator] Stage ${stage.name} error:`, error);
                    if (attempts >= maxAttempts) break;
                }
            }

            const stageDuration = Date.now() - stageStart;

            // Update totals
            if (result) {
                totalTokens += result.totalTokens;
                totalCost += result.totalCostCents;
                transferredContext.tokenBudgetRemaining -= result.totalTokens;
                transferredContext.costBudgetRemaining -= result.totalCostCents;
            }

            // Handle result
            if (!result || !result.success) {
                if (stage.onFailure === 'abort') {
                    stageResults.push({
                        stageName: stage.name,
                        agentId: stage.agentId,
                        success: false,
                        result,
                        durationMs: stageDuration,
                        skipped: false,
                    });
                    return this.createFailedResult(stageResults, messages, startTime, `Stage ${stage.name} failed`);
                }

                stageResults.push({
                    stageName: stage.name,
                    agentId: stage.agentId,
                    success: false,
                    result,
                    durationMs: stageDuration,
                    skipped: stage.onFailure === 'skip',
                    skipReason: stage.onFailure === 'skip' ? 'Stage failed, skipping' : undefined,
                });
                continue;
            }

            // Check approval if required
            if (stage.approvalRequired) {
                const approvalResult = await this.requestApproval({
                    checkpoint: stage.name,
                    data: result.finalAnswer,
                    context: transferredContext,
                    timeoutMs: stage.timeoutMs || 30000,
                });

                if (!approvalResult.approved) {
                    stageResults.push({
                        stageName: stage.name,
                        agentId: stage.agentId,
                        success: false,
                        result,
                        durationMs: stageDuration,
                        skipped: false,
                        approvalStatus: 'rejected',
                    });

                    if (stage.onFailure === 'abort') {
                        return this.createFailedResult(stageResults, messages, startTime, 'Approval rejected');
                    }
                    continue;
                }
            }

            // Success
            stageResults.push({
                stageName: stage.name,
                agentId: stage.agentId,
                success: true,
                result,
                durationMs: stageDuration,
                skipped: false,
                approvalStatus: stage.approvalRequired ? 'approved' : undefined,
            });

            // Update for next stage
            previousOutput = result.finalAnswer;
            transferredContext.previousResults.push(stageResults[stageResults.length - 1]);

            if (result.observations) {
                transferredContext.observations.push(...result.observations);
            }
        }

        // All stages complete
        return {
            success: stageResults.every((r) => r.success || r.skipped),
            stageResults,
            finalOutput: previousOutput,
            totalDurationMs: Date.now() - startTime,
            totalTokens,
            totalCostCents: totalCost,
            messages,
        };
    }

    /**
     * Run a pipeline where every step (or flagged steps) is reviewed by a Supervisor.
     */
    async runSupervisedPipeline(
        stages: PipelineStage[],
        supervisorAgentId: string,
        context: AgentContext,
        goal: string,
        initialBudget?: { tokens: number; costCents: number }
    ): Promise<PipelineResult> {
        const startTime = Date.now();
        const stageResults: AgentStageResult[] = [];
        const messages: AgentMessage[] = [];

        let transferredContext: TransferredContext = {
            goal,
            observations: [],
            keyFacts: [],
            tokenBudgetRemaining: initialBudget?.tokens || 50000,
            costBudgetRemaining: initialBudget?.costCents || 100,
            previousResults: [],
        };

        // Get Supervisor
        let supervisor = this.agents.get(supervisorAgentId);
        if (!supervisor) {
            supervisor = this.registry.create(supervisorAgentId, context);
            this.agents.set(supervisorAgentId, supervisor);
        }

        let previousOutput: unknown = null;
        let totalTokens = 0;
        let totalCost = 0;

        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            const stageStart = Date.now();

            // 1. Execute normal stage logic (delegated to runPipeline-like logic here for simplicity or call internal)
            // For now, let's execute the stage
            let agent = this.agents.get(stage.agentId);
            if (!agent) {
                agent = this.registry.create(stage.agentId, context);
                this.agents.set(stage.agentId, agent);
            }

            const stageGoal = stage.inputTransform(previousOutput, transferredContext);
            const result = await agent.run(stageGoal, context);

            totalTokens += result.totalTokens;
            totalCost += result.totalCostCents;

            const stageRes: AgentStageResult = {
                stageName: stage.name,
                agentId: stage.agentId,
                success: result.success,
                result,
                durationMs: Date.now() - stageStart,
                skipped: false
            };

            // 2. Supervisor Review
            if (stageRes.success && (supervisor as any).reviewStage) {
                console.log(`[Orchestrator] Requesting Supervisor review for stage: ${stage.name}`);
                const review = await (supervisor as any).reviewStage(stageRes, transferredContext, context);

                if (!review.approved) {
                    console.log(`[Orchestrator] Supervisor REJECTED stage ${stage.name}: ${review.feedback}`);
                    stageRes.success = false;
                    stageRes.approvalStatus = 'rejected';
                    stageResults.push(stageRes);
                    if (stage.onFailure === 'abort') {
                        return this.createFailedResult(stageResults, messages, startTime, `Supervisor rejected stage ${stage.name}: ${review.feedback}`);
                    }
                    continue;
                }

                stageRes.approvalStatus = 'approved';
                console.log(`[Orchestrator] Supervisor APPROVED stage ${stage.name}`);
            }

            stageResults.push(stageRes);
            if (stageRes.success) {
                previousOutput = result.finalAnswer;
                transferredContext.previousResults.push(stageRes);
            } else if (stage.onFailure === 'abort') {
                return this.createFailedResult(stageResults, messages, startTime, `Stage ${stage.name} failed`);
            }
        }

        // Final decision by Supervisor
        if ((supervisor as any).finalizeDecision) {
            const finalDecision = await (supervisor as any).finalizeDecision(previousOutput, stageResults, context);
            if (!finalDecision.ready) {
                return this.createFailedResult(stageResults, messages, startTime, `Final decision rejected: ${finalDecision.summary}`);
            }
        }

        return {
            success: stageResults.every((r) => r.success || r.skipped),
            stageResults,
            finalOutput: previousOutput,
            totalDurationMs: Date.now() - startTime,
            totalTokens,
            totalCostCents: totalCost,
            messages,
        };
    }

    /**
     * Create a failed pipeline result.
     */
    private createFailedResult(
        stageResults: AgentStageResult[],
        messages: AgentMessage[],
        startTime: number,
        reason: string
    ): PipelineResult {
        return {
            success: false,
            stageResults,
            finalOutput: null,
            totalDurationMs: Date.now() - startTime,
            totalTokens: stageResults.reduce((sum, r) => sum + (r.result?.totalTokens || 0), 0),
            totalCostCents: stageResults.reduce((sum, r) => sum + (r.result?.totalCostCents || 0), 0),
            messages,
            haltReason: HaltReason.ERROR,
        };
    }

    // ============================================================================
    // Critique
    // ============================================================================

    /**
     * Request a critique of output.
     */
    async requestCritique(
        output: unknown,
        criticId: string,
        context: AgentContext
    ): Promise<CritiqueResult> {
        let critic = this.agents.get(criticId);
        if (!critic) {
            critic = this.registry.create(criticId, context);
            this.agents.set(criticId, critic);
        }

        const critiqueGoal = `
Critique the following output for quality, accuracy, and completeness:

OUTPUT:
${JSON.stringify(output, null, 2)}

Provide a structured critique with:
1. Overall score (0-1)
2. Issues found (type, severity, description)
3. Suggestions for improvement
4. Summary

Output JSON format.
`;

        const result = await critic.run(critiqueGoal, context);

        if (!result.success) {
            return {
                passed: false,
                score: 0,
                issues: [{ type: 'accuracy', severity: 'high', description: 'Critique failed' }],
                suggestions: [],
                summary: 'Unable to complete critique',
            };
        }

        try {
            // Parse critique result
            const critiqueData = JSON.parse(result.finalAnswer);
            return {
                passed: critiqueData.score >= 0.7,
                score: critiqueData.score,
                issues: critiqueData.issues || [],
                suggestions: critiqueData.suggestions || [],
                summary: critiqueData.summary || 'Critique complete',
            };
        } catch {
            return {
                passed: true,
                score: 0.7,
                issues: [],
                suggestions: [],
                summary: result.finalAnswer,
            };
        }
    }

    // ============================================================================
    // Approval
    // ============================================================================

    /**
     * Request approval for a checkpoint.
     */
    async requestApproval(request: ApprovalRequest): Promise<ApprovalResult> {
        if (this.approvalHandler) {
            return this.approvalHandler(request);
        }

        // Default: auto-approve
        console.log(`[Orchestrator] Auto-approving checkpoint: ${request.checkpoint}`);
        return {
            approved: true,
            approver: 'system',
            comments: 'Auto-approved (no handler set)',
            timestamp: Date.now(),
        };
    }

    // ============================================================================
    // Message Handling
    // ============================================================================

    /**
     * Create a message between agents.
     */
    private createMessage(
        from: string,
        to: string,
        type: AgentMessageType,
        payload: unknown,
        context: TransferredContext
    ): AgentMessage {
        const message: AgentMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            from,
            to,
            type,
            payload,
            context: { ...context },
            timestamp: Date.now(),
        };
        this.messages.push(message);
        return message;
    }

    /**
     * Get all messages.
     */
    getMessages(): AgentMessage[] {
        return [...this.messages];
    }

    /**
     * Get messages for an agent.
     */
    getMessagesFor(agentId: string): AgentMessage[] {
        return this.messages.filter((m) => m.to === agentId);
    }

    /**
     * Clear messages.
     */
    clearMessages(): void {
        this.messages = [];
    }

    // ============================================================================
    // Agent Management
    // ============================================================================

    /**
     * Get an agent instance.
     */
    getAgent(id: string): AgenticRunner | undefined {
        return this.agents.get(id);
    }

    /**
     * List active agents.
     */
    listActiveAgents(): string[] {
        return Array.from(this.agents.keys());
    }

    /**
     * Clear cached agents.
     */
    clearAgents(): void {
        this.agents.clear();
    }
}

// ============================================================================
// Pre-built Pipelines
// ============================================================================

/**
 * Create a standard Plan-Execute-Review pipeline.
 */
export function createPlanExecuteReviewPipeline(
    plannerAgentId: string,
    executorAgentId: string,
    reviewerAgentId: string
): PipelineStage[] {
    return [
        {
            name: 'plan',
            agentId: plannerAgentId,
            inputTransform: (_, ctx) => `Create a plan to achieve: ${ctx.goal}`,
            approvalRequired: false,
            onFailure: 'abort',
        },
        {
            name: 'execute',
            agentId: executorAgentId,
            inputTransform: (plan, ctx) => `Execute this plan: ${JSON.stringify(plan)}\n\nGoal: ${ctx.goal}`,
            approvalRequired: false,
            onFailure: 'retry',
            maxRetries: 2,
        },
        {
            name: 'review',
            agentId: reviewerAgentId,
            inputTransform: (result, ctx) => `Review this result against the goal.\n\nGoal: ${ctx.goal}\n\nResult: ${JSON.stringify(result)}`,
            approvalRequired: true,
            onFailure: 'abort',
        },
    ];
}

/**
 * Create a Generate-Critique-Refine pipeline.
 */
export function createGenerateCritiqueRefinePipeline(
    generatorAgentId: string,
    criticAgentId: string
): PipelineStage[] {
    return [
        {
            name: 'generate',
            agentId: generatorAgentId,
            inputTransform: (_, ctx) => ctx.goal,
            approvalRequired: false,
            onFailure: 'abort',
        },
        {
            name: 'critique',
            agentId: criticAgentId,
            inputTransform: (content, ctx) => `Critique this content:\n\n${JSON.stringify(content)}\n\nOriginal goal: ${ctx.goal}`,
            approvalRequired: false,
            onFailure: 'skip', // Skip critique on failure
        },
        {
            name: 'refine',
            agentId: generatorAgentId,
            inputTransform: (critique, ctx) => {
                const prevResult = ctx.previousResults.find((r) => r.stageName === 'generate');
                return `Refine this content based on critique:\n\nOriginal: ${JSON.stringify(prevResult?.result?.finalAnswer)}\n\nCritique: ${JSON.stringify(critique)}`;
            },
            approvalRequired: false,
            onFailure: 'skip', // Use original if refinement fails
            skipIf: (ctx) => {
                const critique = ctx.previousResults.find((r) => r.stageName === 'critique');
                return !critique?.success; // Skip refinement if critique failed
            },
        },
    ];
}
