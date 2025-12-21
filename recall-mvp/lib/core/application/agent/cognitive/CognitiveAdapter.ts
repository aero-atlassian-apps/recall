/**
 * Cognitive Adapter - Accessibility adaptations for cognitive needs.
 * 
 * Adapts responses for users with varying cognitive capacities:
 * - Complexity scoring and simplification
 * - Repetition handling
 * - Pacing control
 * - Clarification strategies
 * 
 * @module CognitiveAdapter
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Cognitive adaptation settings.
 */
export interface CognitiveSettings {
    /** Maximum sentence length */
    maxSentenceLength: number;
    /** Maximum paragraph sentences */
    maxParagraphSentences: number;
    /** Reading level target (grade level) */
    targetReadingLevel: number;
    /** Whether to use simple vocabulary */
    useSimpleVocabulary: boolean;
    /** Speaking pace multiplier */
    speakingPaceMultiplier: number;
    /** Whether to add pauses between chunks */
    addPauses: boolean;
    /** Pause duration in milliseconds */
    pauseDurationMs: number;
    /** Whether to repeat key information */
    repeatKeyInfo: boolean;
    /** Whether to ask for confirmation */
    askForConfirmation: boolean;
    /** Maximum response length (words) */
    maxResponseWords: number;
}

/**
 * Complexity analysis result.
 */
export interface ComplexityAnalysis {
    /** Overall complexity score (0-100) */
    score: number;
    /** Reading level (grade) */
    readingLevel: number;
    /** Average sentence length */
    avgSentenceLength: number;
    /** Complex word percentage */
    complexWordPercent: number;
    /** Passive voice percentage */
    passiveVoicePercent: number;
    /** Issues found */
    issues: ComplexityIssue[];
    /** Whether simplification is recommended */
    needsSimplification: boolean;
}

/**
 * Complexity issue.
 */
export interface ComplexityIssue {
    /** Issue type */
    type: 'long_sentence' | 'complex_word' | 'jargon' | 'passive_voice' | 'nested_clause';
    /** Description */
    description: string;
    /** Position in text */
    position: number;
    /** Suggested fix */
    suggestion?: string;
}

/**
 * Adapted response result.
 */
export interface AdaptedResponse {
    /** Adapted text */
    text: string;
    /** Speaking rate multiplier */
    speakingRate: number;
    /** Pause points (indices) */
    pausePoints: number[];
    /** Whether confirmation should be asked */
    shouldConfirm: boolean;
    /** Summary of key points */
    keyPointsSummary?: string;
    /** Simplification applied */
    simplificationsApplied: string[];
}

/**
 * Repetition context for handling repeated questions.
 */
export interface RepetitionContext {
    /** Question/topic */
    topic: string;
    /** Times asked */
    timesAsked: number;
    /** Last asked */
    lastAsked: number;
    /** Previous responses given */
    previousResponses: string[];
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SETTINGS: CognitiveSettings = {
    maxSentenceLength: 15,
    maxParagraphSentences: 3,
    targetReadingLevel: 6, // 6th grade
    useSimpleVocabulary: true,
    speakingPaceMultiplier: 0.9,
    addPauses: true,
    pauseDurationMs: 500,
    repeatKeyInfo: true,
    askForConfirmation: true,
    maxResponseWords: 100,
};

/**
 * Complex words to simplify.
 */
const WORD_SIMPLIFICATIONS: Record<string, string> = {
    'utilize': 'use',
    'implement': 'do',
    'facilitate': 'help',
    'comprehensive': 'full',
    'subsequently': 'then',
    'approximately': 'about',
    'assistance': 'help',
    'commence': 'start',
    'terminate': 'end',
    'endeavor': 'try',
    'inquire': 'ask',
    'obtain': 'get',
    'sufficient': 'enough',
    'demonstrate': 'show',
    'regarding': 'about',
    'numerous': 'many',
    'additional': 'more',
    'previously': 'before',
    'currently': 'now',
    'immediately': 'right away',
    'however': 'but',
    'therefore': 'so',
    'consequently': 'so',
    'nevertheless': 'still',
    'furthermore': 'also',
    'accomplish': 'do',
    'acquire': 'get',
    'beneficial': 'good',
    'components': 'parts',
    'concerning': 'about',
    'considerable': 'big',
    'determine': 'find out',
    'difficulty': 'trouble',
    'discontinue': 'stop',
    'eliminate': 'remove',
    'establish': 'set up',
    'evaluate': 'check',
    'indicate': 'show',
    'initial': 'first',
    'locate': 'find',
    'maintain': 'keep',
    'modify': 'change',
    'notify': 'tell',
    'observe': 'see',
    'occur': 'happen',
    'perform': 'do',
    'permit': 'let',
    'portion': 'part',
    'possess': 'have',
    'previous': 'past',
    'primary': 'main',
    'probability': 'chance',
    'provide': 'give',
    'purchase': 'buy',
    'receive': 'get',
    'recommend': 'suggest',
    'require': 'need',
    'reside': 'live',
    'retain': 'keep',
    'similar': 'like',
    'submit': 'send',
    'transmit': 'send',
    'attempt': 'try',
};

/**
 * Jargon patterns to flag.
 */
const JARGON_PATTERNS = [
    /synerg/i,
    /leverage/i,
    /optimize/i,
    /scalable/i,
    /paradigm/i,
    /holistic/i,
    /proactive/i,
    /streamline/i,
    /bandwidth/i,
    /deep dive/i,
    /circle back/i,
    /low-hanging fruit/i,
    /move the needle/i,
    /touch base/i,
];

// ============================================================================
// Cognitive Adapter Class
// ============================================================================

/**
 * Cognitive Adapter - Adapts responses for cognitive accessibility.
 * 
 * Usage:
 * ```typescript
 * const adapter = new CognitiveAdapter();
 * 
 * // Analyze complexity
 * const analysis = adapter.analyzeComplexity(response);
 * if (analysis.needsSimplification) {
 *   const adapted = adapter.adaptResponse(response);
 *   return adapted.text;
 * }
 * 
 * // Handle repetition gracefully
 * const repetitionResponse = adapter.handleRepetition(
 *   "What day is it?",
 *   repetitionContext
 * );
 * ```
 */
export class CognitiveAdapter {
    private settings: CognitiveSettings;
    private repetitionHistory: Map<string, RepetitionContext> = new Map();

    constructor(settings?: Partial<CognitiveSettings>) {
        this.settings = { ...DEFAULT_SETTINGS, ...settings };
    }

    // ============================================================================
    // Complexity Analysis
    // ============================================================================

    /**
     * Analyze text complexity.
     */
    analyzeComplexity(text: string): ComplexityAnalysis {
        const sentences = this.splitSentences(text);
        const words = this.tokenize(text);
        const issues: ComplexityIssue[] = [];

        // Calculate average sentence length
        const avgSentenceLength = words.length / Math.max(1, sentences.length);

        // Check for long sentences
        sentences.forEach((sentence, idx) => {
            const sentenceWords = this.tokenize(sentence);
            if (sentenceWords.length > this.settings.maxSentenceLength) {
                issues.push({
                    type: 'long_sentence',
                    description: `Sentence ${idx + 1} has ${sentenceWords.length} words (max: ${this.settings.maxSentenceLength})`,
                    position: text.indexOf(sentence),
                    suggestion: 'Consider breaking into shorter sentences',
                });
            }
        });

        // Count complex words
        let complexWordCount = 0;
        for (const word of words) {
            if (this.isComplexWord(word)) {
                complexWordCount++;
                if (WORD_SIMPLIFICATIONS[word.toLowerCase()]) {
                    issues.push({
                        type: 'complex_word',
                        description: `"${word}" can be simplified`,
                        position: text.indexOf(word),
                        suggestion: `Use "${WORD_SIMPLIFICATIONS[word.toLowerCase()]}" instead`,
                    });
                }
            }
        }
        const complexWordPercent = (complexWordCount / Math.max(1, words.length)) * 100;

        // Check for jargon
        for (const pattern of JARGON_PATTERNS) {
            const match = text.match(pattern);
            if (match) {
                issues.push({
                    type: 'jargon',
                    description: `"${match[0]}" is jargon`,
                    position: text.indexOf(match[0]),
                    suggestion: 'Use simpler language',
                });
            }
        }

        // Check for passive voice (simple heuristic)
        const passivePatterns = text.match(/\b(was|were|been|being|is|are)\s+\w+ed\b/gi) || [];
        const passiveVoicePercent = (passivePatterns.length / Math.max(1, sentences.length)) * 100;

        passivePatterns.forEach(match => {
            issues.push({
                type: 'passive_voice',
                description: `Passive voice: "${match}"`,
                position: text.indexOf(match),
                suggestion: 'Consider using active voice',
            });
        });

        // Calculate reading level (Flesch-Kincaid approximation)
        const avgSyllables = this.estimateAvgSyllables(words);
        const readingLevel = Math.round(
            0.39 * avgSentenceLength + 11.8 * avgSyllables - 15.59
        );

        // Calculate overall score (0=simple, 100=complex)
        const score = Math.min(100, Math.max(0,
            (avgSentenceLength / 25) * 30 +
            (complexWordPercent) * 0.4 +
            (readingLevel / 12) * 30
        ));

        return {
            score: Math.round(score),
            readingLevel: Math.max(1, Math.min(16, readingLevel)),
            avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
            complexWordPercent: Math.round(complexWordPercent * 10) / 10,
            passiveVoicePercent: Math.round(passiveVoicePercent * 10) / 10,
            issues,
            needsSimplification: score > 50 || readingLevel > this.settings.targetReadingLevel,
        };
    }

    /**
     * Check if a word is complex.
     */
    private isComplexWord(word: string): boolean {
        // Complex if: > 3 syllables or in simplification list
        const syllables = this.countSyllables(word);
        return syllables > 3 || WORD_SIMPLIFICATIONS.hasOwnProperty(word.toLowerCase());
    }

    /**
     * Estimate average syllables per word.
     */
    private estimateAvgSyllables(words: string[]): number {
        if (words.length === 0) return 0;
        const total = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
        return total / words.length;
    }

    /**
     * Count syllables in a word (simple heuristic).
     */
    private countSyllables(word: string): number {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3) return 1;

        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }

    // ============================================================================
    // Response Adaptation
    // ============================================================================

    /**
     * Adapt a response for cognitive accessibility.
     */
    adaptResponse(text: string): AdaptedResponse {
        const simplificationsApplied: string[] = [];
        let adaptedText = text;

        // Simplify vocabulary
        if (this.settings.useSimpleVocabulary) {
            for (const [complex, simple] of Object.entries(WORD_SIMPLIFICATIONS)) {
                const regex = new RegExp(`\\b${complex}\\b`, 'gi');
                if (regex.test(adaptedText)) {
                    adaptedText = adaptedText.replace(regex, simple);
                    simplificationsApplied.push(`${complex} → ${simple}`);
                }
            }
        }

        // Split long sentences
        adaptedText = this.splitLongSentences(adaptedText);

        // Truncate if too long
        const words = this.tokenize(adaptedText);
        if (words.length > this.settings.maxResponseWords) {
            adaptedText = this.truncateResponse(adaptedText, this.settings.maxResponseWords);
            simplificationsApplied.push('Truncated for length');
        }

        // Identify pause points (after sentences)
        const pausePoints: number[] = [];
        let index = 0;
        for (const char of adaptedText) {
            if (char === '.' || char === '!' || char === '?') {
                pausePoints.push(index);
            }
            index++;
        }

        // Generate key points summary if long
        let keyPointsSummary: string | undefined;
        if (words.length > 50) {
            keyPointsSummary = this.extractKeyPoints(adaptedText);
        }

        return {
            text: adaptedText,
            speakingRate: this.settings.speakingPaceMultiplier,
            pausePoints: this.settings.addPauses ? pausePoints : [],
            shouldConfirm: this.settings.askForConfirmation,
            keyPointsSummary,
            simplificationsApplied,
        };
    }

    /**
     * Split long sentences.
     */
    private splitLongSentences(text: string): string {
        const sentences = this.splitSentences(text);
        const result: string[] = [];

        for (const sentence of sentences) {
            const words = this.tokenize(sentence);
            if (words.length > this.settings.maxSentenceLength) {
                // Try to split at conjunctions
                const splitPoints = [' and ', ' but ', ' because ', ' so ', ' when ', ' which ', ' that '];
                let splitSentence = sentence;

                for (const point of splitPoints) {
                    if (splitSentence.includes(point)) {
                        const parts = splitSentence.split(point);
                        if (parts.length === 2 && parts[0].length > 20 && parts[1].length > 20) {
                            splitSentence = parts[0].trim() + '. ' +
                                parts[1].charAt(0).toUpperCase() + parts[1].slice(1).trim();
                            break;
                        }
                    }
                }
                result.push(splitSentence);
            } else {
                result.push(sentence);
            }
        }

        return result.join(' ');
    }

    /**
     * Truncate response to word limit.
     */
    private truncateResponse(text: string, maxWords: number): string {
        const words = this.tokenize(text);
        if (words.length <= maxWords) return text;

        // Find a good breaking point
        const truncatedWords = words.slice(0, maxWords);
        let truncatedText = truncatedWords.join(' ');

        // End at sentence boundary if possible
        const lastPeriod = truncatedText.lastIndexOf('.');
        if (lastPeriod > truncatedText.length * 0.6) {
            truncatedText = truncatedText.slice(0, lastPeriod + 1);
        }

        return truncatedText;
    }

    /**
     * Extract key points from text.
     */
    private extractKeyPoints(text: string): string {
        const sentences = this.splitSentences(text);
        // Take first and last sentence as key points
        if (sentences.length <= 2) {
            return sentences.join(' ');
        }
        return `${sentences[0]} ${sentences[sentences.length - 1]}`;
    }

    // ============================================================================
    // Repetition Handling
    // ============================================================================

    /**
     * Handle a repeated question gracefully.
     */
    handleRepetition(topic: string, previousResponse?: string): {
        isRepetition: boolean;
        timesAsked: number;
        suggestedResponse: string;
        patience: 'normal' | 'patient' | 'very_patient';
    } {
        const normalized = topic.toLowerCase().trim();
        let context = this.repetitionHistory.get(normalized);

        if (!context) {
            context = {
                topic: normalized,
                timesAsked: 0,
                lastAsked: Date.now(),
                previousResponses: [],
            };
            this.repetitionHistory.set(normalized, context);
        }

        context.timesAsked++;
        context.lastAsked = Date.now();
        if (previousResponse) {
            context.previousResponses.push(previousResponse);
        }

        const isRepetition = context.timesAsked > 1;
        let patience: 'normal' | 'patient' | 'very_patient' = 'normal';
        let suggestedResponse = '';

        if (context.timesAsked === 2) {
            patience = 'patient';
            suggestedResponse = "Let me share that with you again. ";
        } else if (context.timesAsked === 3) {
            patience = 'very_patient';
            suggestedResponse = "Of course, I'm happy to go over that again. ";
        } else if (context.timesAsked > 3) {
            patience = 'very_patient';
            suggestedResponse = "Absolutely, here it is again. No trouble at all. ";
        }

        // Clean up old repetitions (older than 1 hour)
        const oneHourAgo = Date.now() - 3600000;
        for (const [key, ctx] of this.repetitionHistory) {
            if (ctx.lastAsked < oneHourAgo) {
                this.repetitionHistory.delete(key);
            }
        }

        return {
            isRepetition,
            timesAsked: context.timesAsked,
            suggestedResponse,
            patience,
        };
    }

    /**
     * Get all repetition contexts.
     */
    getRepetitionHistory(): Map<string, RepetitionContext> {
        return new Map(this.repetitionHistory);
    }

    /**
     * Clear repetition history.
     */
    clearRepetitionHistory(): void {
        this.repetitionHistory.clear();
    }

    // ============================================================================
    // Clarification
    // ============================================================================

    /**
     * Generate a clarification for complex topic.
     */
    generateClarification(originalText: string, confusedPart?: string): string {
        if (confusedPart) {
            return `Let me explain "${confusedPart}" more simply. `;
        }
        return "Let me say that in a simpler way. ";
    }

    /**
     * Generate confirmation request.
     */
    generateConfirmation(keyPoint: string): string {
        const templates = [
            `Does that make sense? The main thing is: ${keyPoint}`,
            `To make sure I was clear: ${keyPoint}. Is that right?`,
            `Just to confirm you understood: ${keyPoint}`,
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Generate a summary for confirmation.
     */
    generateSummary(text: string): string {
        const sentences = this.splitSentences(text);
        if (sentences.length <= 1) return text;

        // Build simple summary
        const firstSentence = sentences[0];
        return `So, ${firstSentence.toLowerCase().replace(/^so,?\s*/i, '')}`;
    }

    // ============================================================================
    // Utility Methods
    // ============================================================================

    /**
     * Split text into sentences.
     */
    private splitSentences(text: string): string[] {
        return text
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Tokenize text into words.
     */
    private tokenize(text: string): string[] {
        return text
            .split(/\s+/)
            .map(w => w.replace(/[^a-zA-Z']/g, ''))
            .filter(w => w.length > 0);
    }

    // ============================================================================
    // Configuration
    // ============================================================================

    /**
     * Update settings.
     */
    updateSettings(settings: Partial<CognitiveSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }

    /**
     * Get current settings.
     */
    getSettings(): CognitiveSettings {
        return { ...this.settings };
    }

    /**
     * Create settings for specific cognitive needs.
     */
    static createPresetsFor(need: 'mild' | 'moderate' | 'significant'): Partial<CognitiveSettings> {
        switch (need) {
            case 'mild':
                return {
                    maxSentenceLength: 20,
                    targetReadingLevel: 8,
                    speakingPaceMultiplier: 0.95,
                    maxResponseWords: 150,
                };
            case 'moderate':
                return {
                    maxSentenceLength: 12,
                    targetReadingLevel: 5,
                    speakingPaceMultiplier: 0.85,
                    addPauses: true,
                    askForConfirmation: true,
                    maxResponseWords: 80,
                };
            case 'significant':
                return {
                    maxSentenceLength: 8,
                    targetReadingLevel: 3,
                    speakingPaceMultiplier: 0.7,
                    addPauses: true,
                    pauseDurationMs: 800,
                    repeatKeyInfo: true,
                    askForConfirmation: true,
                    maxResponseWords: 50,
                };
        }
    }
}
