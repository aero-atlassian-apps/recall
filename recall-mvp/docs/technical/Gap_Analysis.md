# Architectural Gap Analysis & Deviation Report

## Overview
This document outlines the known gaps between the current implementation and the ideal "North Star" requirements for the Recall Agentic System. It serves as a roadmap for future hardening and feature development.

## 1. Context Management
*   **Requirement**: "Intelligent semantic pruning to retain long-term memories relevant to the current turn."
*   **Current State**: `ContextManager.ts` implements a basic sliding window with a placeholder for memory selection (`selectMemories`).
*   **Gap**: No embedding-based semantic search is currently integrated for memory selection. It relies on `ContextConfig` heuristics.
*   **Deviation**: Accepted for MVP to prioritize latency over perfect recall.

## 2. Planning & Execution
*   **Requirement**: "Parallel execution of independent steps."
*   **Current State**: `EnhancedAgentPlanner.ts` validates dependencies and identifies parallel groups, but `AgentOrchestrator.ts` executes steps sequentially (loop).
*   **Gap**: The Orchestrator does not yet spawn concurrent `StepExecutor` instances for parallel groups.
*   **Deviation**: Sequential execution is safer and easier to debug for the initial release.

## 3. Observability
*   **Requirement**: "Live dashboards for cost and latency."
*   **Current State**: `AgentLoopMonitor.ts` tracks all metrics in memory and emits events. `run-eval.ts` logs them.
*   **Gap**: No external exporter (e.g., to Datadog/Prometheus) is implemented.
*   **Deviation**: Logs are sufficient for current scale.

## 4. Safety & Privacy
*   **Requirement**: "PII Redaction before LLM transmission."
*   **Current State**: Prompts include safety checks (`IntentRecognizer`, `ObservationReflector`), asking the model to be safe.
*   **Gap**: No mechanical PII scrubber (regex/NLP) sits between the user input and the LLM Port.
*   **Deviation**: Relying on Model alignment and prompt engineering for now.

## 5. Tooling
*   **Requirement**: "Robust retry backoff strategies."
*   **Current State**: `StepExecutor` has a placeholder for internal retries. `AgentOrchestrator` handles plan-level retries.
*   **Gap**: No exponential backoff implementation for transient API failures.

## 6. Hallucination Detection
*   **Requirement**: "Automated fact verification."
*   **Current State**: `ObservationReflector` prompts the model to perform a "Hallucination Check" and cite sources.
*   **Gap**: No independent verifier agent or logic-based checker.
*   **Deviation**: Single-pass reflection is cost-effective but less rigorous than multi-agent debate.
