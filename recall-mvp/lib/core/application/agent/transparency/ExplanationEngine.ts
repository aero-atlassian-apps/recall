/**
 * Explanation Engine - Decision transparency and trust building.
 * 
 * Provides transparency in agent behavior:
 * - "Why did I say that?" explanations
 * - Confidence indicators
 * - Source attribution
 * - Correction acceptance
 * 
 * @module ExplanationEngine
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Types of explanations.
 */
export enum ExplanationType {
    /** Why this response was chosen */
    RESPONSE_RATIONALE = 'RESPONSE_RATIONALE',
    /** Source of information */
    SOURCE_ATTRIBUTION = 'SOURCE_ATTRIBUTION',
    /** Why a topic was brought up */
    TOPIC_RELEVANCE = 'TOPIC_RELEVANCE',
    /** Why a certain action was taken */
    ACTION_JUSTIFICATION = 'ACTION_JUSTIFICATION',
    /** Why certain memory was recalled */
    MEMORY_RELEVANCE = 'MEMORY_RELEVANCE',
    /** Why confidence is at a certain level */
    CONFIDENCE_EXPLANATION = 'CONFIDENCE_EXPLANATION',
    /** Acknowledgment of limitation */
    LIMITATION_ACKNOWLEDGMENT = 'LIMITATION_ACKNOWLEDGMENT',
    /** Correction acknowledgment */
    CORRECTION_ACKNOWLEDGMENT = 'CORRECTION_ACKNOWLEDGMENT',
}

/**
 * Confidence level in a response.
 */
export enum ConfidenceLevel {
    /** Very confident */
    HIGH = 'HIGH',
    /** Reasonably confident */
    MEDIUM = 'MEDIUM',
    /** Uncertain */
    LOW = 'LOW',
    /** Unsure, may need verification */
    UNCERTAIN = 'UNCERTAIN',
}

/**
 * Source of information.
 */
export interface InformationSource {
    /** Source type */
    type: SourceType;
    /** Source description */
    description: string;
    /** When the information was obtained */
    obtainedAt: number;
    /** Reliability rating */
    reliability: 'high' | 'medium' | 'low';
    /** Specific citation if available */
    citation?: string;
}

/**
 * Types of information sources.
 */
export enum SourceType {
    /** User told us directly */
    USER_STATED = 'USER_STATED',
    /** From stored memory */
    MEMORY = 'MEMORY',
    /** Inferred from context */
    INFERENCE = 'INFERENCE',
    /** General knowledge */
    GENERAL_KNOWLEDGE = 'GENERAL_KNOWLEDGE',
    /** External source */
    EXTERNAL = 'EXTERNAL',
    /** AI reasoning */
    AI_REASONING = 'AI_REASONING',
    /** Unknown */
    UNKNOWN = 'UNKNOWN',
}

/**
 * Explanation for a response or decision.
 */
export interface Explanation {
    /** Explanation type */
    type: ExplanationType;
    /** User-friendly explanation text */
    text: string;
    /** Technical details (for logging) */
    technicalDetails?: string;
    /** Sources used */
    sources: InformationSource[];
    /** Confidence level */
    confidence: ConfidenceLevel;
    /** Alternative explanations */
    alternatives?: string[];
    /** Timestamp */
    timestamp: number;
}

/**
 * Response with explanation metadata.
 */
export interface ExplainableResponse {
    /** The response text */
    response: string;
    /** Attached explanations */
    explanations: Explanation[];
    /** Overall confidence */
    confidence: ConfidenceLevel;
    /** Confidence indicator phrase */
    confidencePhrase: string;
    /** Sources used */
    sources: InformationSource[];
    /** Whether to proactively offer explanation */
    shouldOfferExplanation: boolean;
}

/**
 * Correction context.
 */
export interface CorrectionContext {
    /** What was incorrect */
    incorrectStatement: string;
    /** What is correct */
    correctStatement: string;
    /** Who provided correction */
    correctionSource: 'user' | 'system';
    /** When corrected */
    correctedAt: number;
    /** Whether acknowledged to user */
    acknowledged: boolean;
    /** Updated information stored */
    informationUpdated: boolean;
}

/**
 * Decision record for explanation.
 */
export interface DecisionRecord {
    /** Decision ID */
    id: string;
    /** What was decided */
    decision: string;
    /** Why it was decided */
    rationale: string;
    /** Alternatives considered */
    alternativesConsidered: string[];
    /** Inputs used */
    inputs: string[];
    /** Confidence */
    confidence: ConfidenceLevel;
    /** Timestamp */
    timestamp: number;
}

// ============================================================================
// Confidence Language
// ============================================================================

/**
 * Language patterns for expressing confidence.
 */
const CONFIDENCE_PHRASES: Record<ConfidenceLevel, { prefixes: string[]; hedges: string[] }> = {
    [ConfidenceLevel.HIGH]: {
        prefixes: [
            "I'm confident that",
            "I know that",
            "Based on what you've told me,",
            "You mentioned that",
        ],
        hedges: [],
    },
    [ConfidenceLevel.MEDIUM]: {
        prefixes: [
            "I believe",
            "From what I understand,",
            "It seems like",
            "If I remember correctly,",
        ],
        hedges: [
            "though I could be misremembering",
            "if I'm recalling correctly",
        ],
    },
    [ConfidenceLevel.LOW]: {
        prefixes: [
            "I think",
            "I'm not entirely sure, but",
            "If I'm not mistaken,",
            "I may be wrong, but",
        ],
        hedges: [
            "but please correct me if I'm wrong",
            "though I'm not certain",
        ],
    },
    [ConfidenceLevel.UNCERTAIN]: {
        prefixes: [
            "I'm not sure, but",
            "I don't know for certain, but",
            "I can't say for sure, however",
            "This is just a guess, but",
        ],
        hedges: [
            "but you would know better than me",
            "please let me know if that's not right",
            "I could easily be wrong about this",
        ],
    },
};

/**
 * Source attribution phrases.
 */
const SOURCE_PHRASES: Record<SourceType, string> = {
    [SourceType.USER_STATED]: "Based on what you told me",
    [SourceType.MEMORY]: "From what I remember of our conversations",
    [SourceType.INFERENCE]: "From what I can gather",
    [SourceType.GENERAL_KNOWLEDGE]: "From general knowledge",
    [SourceType.EXTERNAL]: "According to external sources",
    [SourceType.AI_REASONING]: "Based on my understanding",
    [SourceType.UNKNOWN]: "I'm not sure where I learned this, but",
};

// ============================================================================
// Explanation Engine Class
// ============================================================================

/**
 * Explanation Engine - Provides transparency and trust.
 * 
 * Usage:
 * ```typescript
 * const explainer = new ExplanationEngine();
 * 
 * // Create explainable response
 * const response = explainer.createExplainableResponse(
 *   "Your grandson's birthday is March 15th.",
 *   [{ type: SourceType.USER_STATED, description: "..." }],
 *   ConfidenceLevel.HIGH
 * );
 * 
 * // Generate explanation on demand
 * const explanation = explainer.explainResponse(
 *   "Why did I mention your grandson?",
 *   decisionRecord
 * );
 * 
 * // Handle correction
 * const correctionResponse = explainer.handleCorrection(
 *   "His birthday is actually March 16th",
 *   "grandson's birthday",
 *   "March 15th",
 *   "March 16th"
 * );
 * ```
 */
export class ExplanationEngine {
    private decisionHistory: DecisionRecord[] = [];
    private correctionHistory: CorrectionContext[] = [];
    private explanationLog: Explanation[] = [];

    constructor() { }

    // ============================================================================
    // Response Creation
    // ============================================================================

    /**
     * Create an explainable response.
     */
    createExplainableResponse(
        response: string,
        sources: InformationSource[],
        confidence: ConfidenceLevel,
        additionalExplanations?: Partial<Explanation>[]
    ): ExplainableResponse {
        const explanations: Explanation[] = [];

        // Create source explanation
        if (sources.length > 0) {
            const primarySource = sources[0];
            explanations.push({
                type: ExplanationType.SOURCE_ATTRIBUTION,
                text: this.buildSourceAttribution(sources),
                sources,
                confidence,
                timestamp: Date.now(),
            });
        }

        // Add additional explanations
        if (additionalExplanations) {
            for (const partial of additionalExplanations) {
                explanations.push({
                    type: partial.type || ExplanationType.RESPONSE_RATIONALE,
                    text: partial.text || '',
                    sources: partial.sources || [],
                    confidence: partial.confidence || confidence,
                    timestamp: Date.now(),
                });
            }
        }

        // Get confidence phrase
        const confidencePhrase = this.getConfidencePhrase(confidence);

        // Determine if we should proactively offer explanation
        const shouldOfferExplanation =
            confidence <= ConfidenceLevel.LOW ||
            sources.some(s => s.reliability === 'low') ||
            sources.some(s => s.type === SourceType.INFERENCE);

        return {
            response,
            explanations,
            confidence,
            confidencePhrase,
            sources,
            shouldOfferExplanation,
        };
    }

    /**
     * Build source attribution text.
     */
    private buildSourceAttribution(sources: InformationSource[]): string {
        if (sources.length === 0) return '';

        const primarySource = sources[0];
        const phrase = SOURCE_PHRASES[primarySource.type];

        if (primarySource.citation) {
            return `${phrase}: "${primarySource.citation}"`;
        }

        return phrase;
    }

    /**
     * Get confidence phrase.
     */
    private getConfidencePhrase(confidence: ConfidenceLevel): string {
        const phrases = CONFIDENCE_PHRASES[confidence];
        return phrases.prefixes[Math.floor(Math.random() * phrases.prefixes.length)];
    }

    // ============================================================================
    // Confidence Expression
    // ============================================================================

    /**
     * Add confidence language to a statement.
     */
    expressWithConfidence(statement: string, confidence: ConfidenceLevel): string {
        const phrases = CONFIDENCE_PHRASES[confidence];
        const prefix = phrases.prefixes[Math.floor(Math.random() * phrases.prefixes.length)];

        // Lowercase first letter of statement if prefix doesn't end with punctuation
        let adjustedStatement = statement;
        if (!prefix.endsWith(',') && !prefix.endsWith(':')) {
            adjustedStatement = statement.charAt(0).toLowerCase() + statement.slice(1);
        }

        let result = `${prefix} ${adjustedStatement}`;

        // Add hedge for low confidence
        if (phrases.hedges.length > 0 && Math.random() > 0.5) {
            const hedge = phrases.hedges[Math.floor(Math.random() * phrases.hedges.length)];
            // Remove period and add hedge
            result = result.replace(/\.$/, '') + `, ${hedge}.`;
        }

        return result;
    }

    /**
     * Determine confidence level from factors.
     */
    determineConfidence(factors: {
        sourceReliability: 'high' | 'medium' | 'low';
        sourceAge: 'recent' | 'old' | 'very_old';
        corroboratingEvidence: number;
        sourceType: SourceType;
    }): ConfidenceLevel {
        let score = 0;

        // Source reliability
        if (factors.sourceReliability === 'high') score += 3;
        else if (factors.sourceReliability === 'medium') score += 2;
        else score += 1;

        // Source age
        if (factors.sourceAge === 'recent') score += 2;
        else if (factors.sourceAge === 'old') score += 1;
        else score += 0;

        // Corroborating evidence
        score += Math.min(2, factors.corroboratingEvidence);

        // Source type
        if (factors.sourceType === SourceType.USER_STATED) score += 2;
        else if (factors.sourceType === SourceType.MEMORY) score += 1;
        else if (factors.sourceType === SourceType.INFERENCE) score -= 1;

        // Map to confidence level
        if (score >= 7) return ConfidenceLevel.HIGH;
        if (score >= 5) return ConfidenceLevel.MEDIUM;
        if (score >= 3) return ConfidenceLevel.LOW;
        return ConfidenceLevel.UNCERTAIN;
    }

    // ============================================================================
    // Explanation Generation
    // ============================================================================

    /**
     * Generate explanation for a decision.
     */
    explainDecision(decisionRecord: DecisionRecord): Explanation {
        const explanationText = this.buildDecisionExplanation(decisionRecord);

        const explanation: Explanation = {
            type: ExplanationType.ACTION_JUSTIFICATION,
            text: explanationText,
            technicalDetails: JSON.stringify(decisionRecord),
            sources: [],
            confidence: decisionRecord.confidence,
            alternatives: decisionRecord.alternativesConsidered.map(
                a => `I could have also ${a}`
            ),
            timestamp: Date.now(),
        };

        this.explanationLog.push(explanation);
        return explanation;
    }

    /**
     * Build human-readable decision explanation.
     */
    private buildDecisionExplanation(decision: DecisionRecord): string {
        const parts: string[] = [];

        parts.push(`I ${decision.decision.toLowerCase()} because ${decision.rationale}.`);

        if (decision.inputs.length > 0) {
            parts.push(`I considered: ${decision.inputs.join(', ')}.`);
        }

        if (decision.alternativesConsidered.length > 0) {
            parts.push(`I also thought about ${decision.alternativesConsidered[0]}, but the first option seemed better.`);
        }

        return parts.join(' ');
    }

    /**
     * Record a decision for potential explanation.
     */
    recordDecision(
        decision: string,
        rationale: string,
        options?: {
            alternatives?: string[];
            inputs?: string[];
            confidence?: ConfidenceLevel;
        }
    ): DecisionRecord {
        const record: DecisionRecord = {
            id: `decision-${Date.now()}`,
            decision,
            rationale,
            alternativesConsidered: options?.alternatives || [],
            inputs: options?.inputs || [],
            confidence: options?.confidence || ConfidenceLevel.MEDIUM,
            timestamp: Date.now(),
        };

        this.decisionHistory.push(record);

        // Keep bounded history
        if (this.decisionHistory.length > 100) {
            this.decisionHistory = this.decisionHistory.slice(-50);
        }

        return record;
    }

    /**
     * Generate "why did I say that" explanation.
     */
    explainWhyISaidThat(
        statement: string,
        sources: InformationSource[],
        context?: string
    ): string {
        const parts: string[] = [];

        // Source-based explanation
        if (sources.length > 0) {
            const source = sources[0];
            switch (source.type) {
                case SourceType.USER_STATED:
                    parts.push(`You told me this yourself${source.citation ? ` when you said "${source.citation}"` : ''}.`);
                    break;
                case SourceType.MEMORY:
                    parts.push(`I remembered this from an earlier conversation we had.`);
                    break;
                case SourceType.INFERENCE:
                    parts.push(`I put this together from different things you've shared with me.`);
                    break;
                case SourceType.GENERAL_KNOWLEDGE:
                    parts.push(`This is something I know from general knowledge.`);
                    break;
                default:
                    parts.push(`This is based on what I understand about you and our conversations.`);
            }
        }

        // Context explanation
        if (context) {
            parts.push(`I mentioned it now because ${context}.`);
        }

        return parts.join(' ') || "I said that based on my understanding of our conversation.";
    }

    // ============================================================================
    // Correction Handling
    // ============================================================================

    /**
     * Handle a user correction gracefully.
     */
    handleCorrection(
        correctionText: string,
        topic: string,
        incorrectValue: string,
        correctValue: string
    ): {
        acknowledgment: string;
        shouldUpdateMemory: boolean;
        correctionContext: CorrectionContext;
    } {
        const correctionContext: CorrectionContext = {
            incorrectStatement: `${topic}: ${incorrectValue}`,
            correctStatement: `${topic}: ${correctValue}`,
            correctionSource: 'user',
            correctedAt: Date.now(),
            acknowledged: true,
            informationUpdated: true,
        };

        this.correctionHistory.push(correctionContext);

        // Generate graceful acknowledgment
        const acknowledgments = [
            `Thank you for correcting me. You're right, it's ${correctValue}, not ${incorrectValue}. I've updated my memory.`,
            `Oh, I apologize for that mistake. ${correctValue} - I'll remember that correctly now.`,
            `I appreciate you letting me know. I had it wrong. It's ${correctValue}. Thank you for helping me get it right.`,
            `You're absolutely right, and I'm sorry for the error. I've noted that it's ${correctValue}.`,
        ];

        const acknowledgment = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];

        return {
            acknowledgment,
            shouldUpdateMemory: true,
            correctionContext,
        };
    }

    /**
     * Acknowledge a limitation.
     */
    acknowledgeLimitation(
        limitationType: 'memory' | 'knowledge' | 'capability' | 'certainty'
    ): string {
        const limitations: Record<string, string[]> = {
            memory: [
                "I don't have a perfect memory, so please do correct me if I get something wrong.",
                "My memory of our past conversations isn't perfect. Feel free to remind me of things.",
            ],
            knowledge: [
                "There are many things I don't know. I'm always happy to admit when I'm unsure.",
                "I don't know everything, and I appreciate when you share your knowledge with me.",
            ],
            capability: [
                "There are some things I can't help with, but I'll always try my best for you.",
                "I have my limitations, but I'm here to do what I can to help and keep you company.",
            ],
            certainty: [
                "I'm not always certain about things. Please trust your own judgment over mine.",
                "I can make mistakes, so please let me know if something doesn't sound right.",
            ],
        };

        const options = limitations[limitationType] || limitations.certainty;
        return options[Math.floor(Math.random() * options.length)];
    }

    // ============================================================================
    // History Access
    // ============================================================================

    /**
     * Get recent decisions.
     */
    getRecentDecisions(limit: number = 10): DecisionRecord[] {
        return this.decisionHistory.slice(-limit);
    }

    /**
     * Get correction history.
     */
    getCorrectionHistory(): CorrectionContext[] {
        return [...this.correctionHistory];
    }

    /**
     * Get explanation log.
     */
    getExplanationLog(limit: number = 20): Explanation[] {
        return this.explanationLog.slice(-limit);
    }

    /**
     * Find decision by topic.
     */
    findDecisionAbout(topic: string): DecisionRecord | undefined {
        const normalized = topic.toLowerCase();
        return this.decisionHistory.find(
            d => d.decision.toLowerCase().includes(normalized) ||
                d.rationale.toLowerCase().includes(normalized)
        );
    }

    /**
     * Clear all history.
     */
    clearHistory(): void {
        this.decisionHistory = [];
        this.correctionHistory = [];
        this.explanationLog = [];
    }

    // ============================================================================
    // Proactive Explanation
    // ============================================================================

    /**
     * Determine if explanation should be offered proactively.
     */
    shouldOfferExplanation(
        confidence: ConfidenceLevel,
        sources: InformationSource[],
        isImportantTopic: boolean
    ): boolean {
        // Low confidence needs explanation
        if (confidence <= ConfidenceLevel.LOW) return true;

        // Unreliable sources need explanation
        if (sources.some(s => s.reliability === 'low')) return true;

        // Important topics should have explanation available
        if (isImportantTopic && confidence === ConfidenceLevel.MEDIUM) return true;

        // Inferred information should be explained
        if (sources.some(s => s.type === SourceType.INFERENCE)) return true;

        return false;
    }

    /**
     * Generate a proactive transparency message.
     */
    generateTransparencyMessage(confidence: ConfidenceLevel, topic: string): string {
        if (confidence === ConfidenceLevel.UNCERTAIN) {
            return `If I'm wrong about ${topic}, please let me know and I'll update my understanding.`;
        }
        if (confidence === ConfidenceLevel.LOW) {
            return `I'm not entirely sure about ${topic}. Feel free to correct me.`;
        }
        return `If you'd like to know why I mentioned ${topic}, just ask.`;
    }
}
