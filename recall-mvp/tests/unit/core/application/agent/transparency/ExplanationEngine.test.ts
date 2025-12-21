/**
 * Unit Tests for ExplanationEngine
 *
 * Tests decision transparency features:
 * - Confidence expression
 * - Source attribution
 * - Decision recording
 * - Correction handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ExplanationEngine,
    ExplanationType,
    ConfidenceLevel,
    SourceType,
} from '../../../../lib/core/application/agent/transparency/ExplanationEngine';

describe('ExplanationEngine', () => {
    let engine: ExplanationEngine;

    beforeEach(() => {
        engine = new ExplanationEngine();
    });

    describe('Explainable Response Creation', () => {
        it('creates response with source attribution', () => {
            const response = engine.createExplainableResponse(
                "Your grandson's birthday is March 15th.",
                [
                    {
                        type: SourceType.USER_STATED,
                        description: 'User mentioned in conversation',
                        obtainedAt: Date.now() - 86400000,
                        reliability: 'high',
                        citation: 'My grandson was born on March 15th',
                    },
                ],
                ConfidenceLevel.HIGH
            );

            expect(response.response).toContain("grandson's birthday");
            expect(response.confidence).toBe(ConfidenceLevel.HIGH);
            expect(response.sources.length).toBe(1);
        });

        it('includes confidence phrase', () => {
            const response = engine.createExplainableResponse(
                'Some information',
                [],
                ConfidenceLevel.MEDIUM
            );

            expect(response.confidencePhrase.length).toBeGreaterThan(0);
        });

        it('recommends explanation for low confidence', () => {
            const response = engine.createExplainableResponse(
                'Uncertain information',
                [{ type: SourceType.INFERENCE, description: 'Inferred', obtainedAt: Date.now(), reliability: 'low' }],
                ConfidenceLevel.LOW
            );

            expect(response.shouldOfferExplanation).toBe(true);
        });

        it('does not recommend explanation for high confidence', () => {
            const response = engine.createExplainableResponse(
                'Certain information',
                [{ type: SourceType.USER_STATED, description: 'User stated', obtainedAt: Date.now(), reliability: 'high' }],
                ConfidenceLevel.HIGH
            );

            expect(response.shouldOfferExplanation).toBe(false);
        });
    });

    describe('Confidence Expression', () => {
        it('adds high confidence language', () => {
            const statement = engine.expressWithConfidence('Today is Sunday', ConfidenceLevel.HIGH);

            expect(statement).toMatch(/confident|know|based on|mentioned/i);
            expect(statement).toContain('Sunday');
        });

        it('adds medium confidence language', () => {
            const statement = engine.expressWithConfidence('The meeting is at 3pm', ConfidenceLevel.MEDIUM);

            expect(statement).toMatch(/believe|understand|seems|remember/i);
        });

        it('adds low confidence language', () => {
            const statement = engine.expressWithConfidence('That happened in 1965', ConfidenceLevel.LOW);

            expect(statement).toMatch(/think|not sure|mistaken|may be wrong/i);
        });

        it('adds uncertain language', () => {
            const statement = engine.expressWithConfidence('Her name is Mary', ConfidenceLevel.UNCERTAIN);

            expect(statement).toMatch(/not sure|don't know|guess|can't say/i);
        });
    });

    describe('Confidence Determination', () => {
        it('returns high confidence for reliable recent user-stated info', () => {
            const confidence = engine.determineConfidence({
                sourceReliability: 'high',
                sourceAge: 'recent',
                corroboratingEvidence: 2,
                sourceType: SourceType.USER_STATED,
            });

            expect(confidence).toBe(ConfidenceLevel.HIGH);
        });

        it('returns low confidence for unreliable old inferred info', () => {
            const confidence = engine.determineConfidence({
                sourceReliability: 'low',
                sourceAge: 'very_old',
                corroboratingEvidence: 0,
                sourceType: SourceType.INFERENCE,
            });

            expect(confidence).toBe(ConfidenceLevel.LOW);
        });

        it('returns medium confidence for mixed factors', () => {
            const confidence = engine.determineConfidence({
                sourceReliability: 'medium',
                sourceAge: 'old',
                corroboratingEvidence: 1,
                sourceType: SourceType.MEMORY,
            });

            expect(confidence).toBe(ConfidenceLevel.MEDIUM);
        });
    });

    describe('Decision Recording', () => {
        it('records a decision', () => {
            const record = engine.recordDecision(
                'Brought up the garden topic',
                'User has shown high interest in gardening',
                {
                    alternatives: ['Discuss the weather', 'Ask about family'],
                    inputs: ['User interest profile', 'Recent topics'],
                    confidence: ConfidenceLevel.HIGH,
                }
            );

            expect(record.decision).toBe('Brought up the garden topic');
            expect(record.alternativesConsidered).toContain('Discuss the weather');
        });

        it('retrieves recent decisions', () => {
            engine.recordDecision('Decision 1', 'Reason 1');
            engine.recordDecision('Decision 2', 'Reason 2');
            engine.recordDecision('Decision 3', 'Reason 3');

            const recent = engine.getRecentDecisions(2);
            expect(recent.length).toBe(2);
        });

        it('bounds decision history', () => {
            for (let i = 0; i < 120; i++) {
                engine.recordDecision(`Decision ${i}`, 'Reason');
            }

            const all = engine.getRecentDecisions(200);
            expect(all.length).toBeLessThanOrEqual(100);
        });

        it('finds decision by topic', () => {
            engine.recordDecision('Mentioned gardening', 'User loves gardening');
            engine.recordDecision('Asked about weather', 'Small talk');

            const found = engine.findDecisionAbout('gardening');
            expect(found?.decision).toContain('gardening');
        });
    });

    describe('Decision Explanation', () => {
        it('generates explanation from decision record', () => {
            const record = engine.recordDecision(
                'Recommended calling daughter',
                'User mentioned feeling lonely',
                {
                    alternatives: ['Suggested outdoor walk'],
                    inputs: ['Emotional state analysis'],
                }
            );

            const explanation = engine.explainDecision(record);

            expect(explanation.type).toBe(ExplanationType.ACTION_JUSTIFICATION);
            expect(explanation.text).toContain('lonely');
        });
    });

    describe('Why I Said That', () => {
        it('explains user-stated source', () => {
            const explanation = engine.explainWhyISaidThat(
                "Your daughter's name is Sarah",
                [
                    {
                        type: SourceType.USER_STATED,
                        description: 'User mentioned',
                        obtainedAt: Date.now(),
                        reliability: 'high',
                        citation: 'My daughter Sarah came to visit',
                    },
                ]
            );

            expect(explanation).toContain('told me');
        });

        it('explains memory source', () => {
            const explanation = engine.explainWhyISaidThat(
                'You enjoy cooking',
                [
                    {
                        type: SourceType.MEMORY,
                        description: 'From past conversation',
                        obtainedAt: Date.now() - 604800000,
                        reliability: 'high',
                    },
                ]
            );

            expect(explanation).toContain('remember');
        });

        it('explains inference source', () => {
            const explanation = engine.explainWhyISaidThat(
                'You probably enjoy outdoor activities',
                [
                    {
                        type: SourceType.INFERENCE,
                        description: 'Inferred from interests',
                        obtainedAt: Date.now(),
                        reliability: 'medium',
                    },
                ]
            );

            expect(explanation).toContain('gather');
        });

        it('includes context when provided', () => {
            const explanation = engine.explainWhyISaidThat(
                'The birthday is coming up',
                [{ type: SourceType.MEMORY, description: '', obtainedAt: Date.now(), reliability: 'high' }],
                'it seemed relevant to your current mood'
            );

            expect(explanation).toContain('relevant');
        });
    });

    describe('Correction Handling', () => {
        it('generates graceful acknowledgment', () => {
            const result = engine.handleCorrection(
                "Actually, his birthday is March 16th",
                "grandson's birthday",
                'March 15th',
                'March 16th'
            );

            expect(result.acknowledgment).toContain('March 16th');
            expect(result.acknowledgment).toMatch(/thank|apolog|sorry|appreciate/i);
            expect(result.shouldUpdateMemory).toBe(true);
        });

        it('creates correction context', () => {
            const result = engine.handleCorrection(
                'Correction',
                'topic',
                'wrong',
                'right'
            );

            expect(result.correctionContext.incorrectStatement).toContain('wrong');
            expect(result.correctionContext.correctStatement).toContain('right');
            expect(result.correctionContext.acknowledged).toBe(true);
        });

        it('stores correction in history', () => {
            engine.handleCorrection('Correction', 'topic', 'wrong', 'right');

            const history = engine.getCorrectionHistory();
            expect(history.length).toBe(1);
        });
    });

    describe('Limitation Acknowledgment', () => {
        it('acknowledges memory limitation', () => {
            const acknowledgment = engine.acknowledgeLimitation('memory');

            expect(acknowledgment).toMatch(/memory|correct|remind/i);
        });

        it('acknowledges knowledge limitation', () => {
            const acknowledgment = engine.acknowledgeLimitation('knowledge');

            expect(acknowledgment).toMatch(/know|unsure|share/i);
        });

        it('acknowledges capability limitation', () => {
            const acknowledgment = engine.acknowledgeLimitation('capability');

            expect(acknowledgment).toMatch(/can't|limitations|try/i);
        });

        it('acknowledges certainty limitation', () => {
            const acknowledgment = engine.acknowledgeLimitation('certainty');

            expect(acknowledgment).toMatch(/certain|mistakes|judgment/i);
        });
    });

    describe('Proactive Explanation', () => {
        it('recommends explanation for low confidence', () => {
            const should = engine.shouldOfferExplanation(
                ConfidenceLevel.LOW,
                [],
                false
            );

            expect(should).toBe(true);
        });

        it('recommends explanation for unreliable sources', () => {
            const should = engine.shouldOfferExplanation(
                ConfidenceLevel.MEDIUM,
                [{ type: SourceType.MEMORY, description: '', obtainedAt: Date.now(), reliability: 'low' }],
                false
            );

            expect(should).toBe(true);
        });

        it('recommends explanation for important topics with medium confidence', () => {
            const should = engine.shouldOfferExplanation(
                ConfidenceLevel.MEDIUM,
                [{ type: SourceType.MEMORY, description: '', obtainedAt: Date.now(), reliability: 'high' }],
                true // Important topic
            );

            expect(should).toBe(true);
        });

        it('does not recommend for high confidence normal topics', () => {
            const should = engine.shouldOfferExplanation(
                ConfidenceLevel.HIGH,
                [{ type: SourceType.USER_STATED, description: '', obtainedAt: Date.now(), reliability: 'high' }],
                false
            );

            expect(should).toBe(false);
        });

        it('generates transparency message', () => {
            const message = engine.generateTransparencyMessage(
                ConfidenceLevel.LOW,
                'the appointment time'
            );

            expect(message).toContain('appointment time');
        });
    });

    describe('History Management', () => {
        it('gets explanation log', () => {
            const record = engine.recordDecision('Test', 'Reason');
            engine.explainDecision(record);

            const log = engine.getExplanationLog();
            expect(log.length).toBe(1);
        });

        it('clears all history', () => {
            engine.recordDecision('Decision', 'Reason');
            engine.handleCorrection('Correction', 'topic', 'wrong', 'right');

            engine.clearHistory();

            expect(engine.getRecentDecisions().length).toBe(0);
            expect(engine.getCorrectionHistory().length).toBe(0);
        });
    });
});
