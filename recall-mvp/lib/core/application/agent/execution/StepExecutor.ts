/**
 * Step Executor - Encapsulates the execution logic for a single planned step.
 * 
 * Responsibilities:
 * - Execute the tool specified in the step
 * - Handle tool errors gracefully
 * - Track token usage and costs
 * - Return a structured result
 * 
 * @module StepExecutor
 */

import {
    PlannedStep,
    StepExecutor as IStepExecutor,
    ExecutionContext,
    StepResult
} from '../primitives/AgentPrimitives';
import { LLMPort } from '../../ports/LLMPort';
import { Tool } from '../types';

export class StepExecutor implements IStepExecutor {
    constructor(
        private llm: LLMPort,
        private tools: Tool[]
    ) { }

    async execute(step: PlannedStep, context: ExecutionContext): Promise<StepResult> {
        const startTime = Date.now();

        // 1. Identify Tool
        const toolName = step.tool || step.action; // Fallback to action if tool not explicit
        const tool = this.tools.find(t => t.name === toolName);

        // 2. Execution Logic
        let output: unknown;
        let success = false;
        let errorMsg: string | undefined;

        try {
            if (tool) {
                // Execute Tool
                // @ts-ignore - Tool interface compatibility assumption
                output = await tool.execute(step.input);
                success = true;
            } else if (step.action === 'Final Answer') {
                // Special case for Final Answer execution (just pass through)
                output = step.input;
                success = true;
            } else {
                // Tool Not Found
                errorMsg = `Tool '${toolName}' not found. Available tools: ${this.tools.map(t => t.name).join(', ')}`;
                success = false;
            }
        } catch (error: any) {
            errorMsg = `Tool execution failed: ${error.message}`;
            success = false;
        }

        // 3. Retry Logic (Simple inline check, main retry loop typically in Orchestrator)
        // If we wanted to do internal retries here, we could. 
        // For now, we return failure and let Orchestrator decide.

        const durationMs = Date.now() - startTime;

        return {
            stepId: step.id,
            success,
            output: output,
            error: errorMsg,
            tokensUsed: 0, // TODO: Hook up actual token tracking from Tool/LLM
            costCents: 0, // TODO: Hook up cost tracking
            durationMs: durationMs,
            trace: {
                toolName,
                input: step.input,
                error: errorMsg
            }
        };
    }
}
