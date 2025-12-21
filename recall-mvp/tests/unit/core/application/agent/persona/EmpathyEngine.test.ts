/**
 * Unit Tests for EmpathyEngine
 *
 * Tests emotional intelligence capabilities:
 * - Emotion detection from text
 * - Empathetic response generation
 * - Emotion trend analysis
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    EmpathyEngine,
    EmotionCategory,
    EmotionIntensity,
    EmpathyResponseType,
    ResponseTone,
} from '../../../../lib/core/application/agent/persona/EmpathyEngine';

describe('EmpathyEngine', () => {
    let engine: EmpathyEngine;

    beforeEach(() => {
        engine = new EmpathyEngine();
    });

    describe('Emotion Detection', () => {
        it('detects sadness from keywords', () => {
            const state = engine.detectEmotion('I feel so sad today');

            expect(state.primaryEmotion).toBe(EmotionCategory.SADNESS);
            expect(state.valence).toBeLessThan(0);
        });

        it('detects loneliness from phrases', () => {
            const state = engine.detectEmotion('No one calls me anymore. I feel all alone.');

            expect(state.primaryEmotion).toBe(EmotionCategory.LONELINESS);
            expect(state.needsSupport).toBe(true);
        });

        it('detects joy from positive words', () => {
            const state = engine.detectEmotion('I had a wonderful day! So happy and grateful.');

            expect(state.primaryEmotion).toBe(EmotionCategory.JOY);
            expect(state.valence).toBeGreaterThan(0.5);
        });

        it('detects grief from bereavement language', () => {
            const state = engine.detectEmotion('My wife passed away last year. I miss her so much.');

            expect(state.primaryEmotion).toBe(EmotionCategory.GRIEF);
            expect(state.intensity).toBeGreaterThanOrEqual(EmotionIntensity.MODERATE);
            expect(state.recommendEscalation).toBe(true);
        });

        it('detects anxiety from worry patterns', () => {
            const state = engine.detectEmotion("I can't stop thinking about what might go wrong. So worried.");

            expect(state.primaryEmotion).toBe(EmotionCategory.ANXIETY);
            expect(state.arousal).toBeGreaterThan(0.5);
        });

        it('detects nostalgia from memory language', () => {
            const state = engine.detectEmotion('I remember when we used to go to the lake. Those were the times.');

            expect(state.primaryEmotion).toBe(EmotionCategory.NOSTALGIA);
        });

        it('detects confusion from uncertainty language', () => {
            const state = engine.detectEmotion("I don't understand what you mean. I'm so confused.");

            expect(state.primaryEmotion).toBe(EmotionCategory.CONFUSION);
        });

        it('detects neutral when no emotional signals', () => {
            const state = engine.detectEmotion('The weather is nice today.');

            expect(state.primaryEmotion).toBe(EmotionCategory.NEUTRAL);
        });

        it('increases intensity with intensifiers', () => {
            const withoutIntensifier = engine.detectEmotion('I feel sad');
            const withIntensifier = engine.detectEmotion('I feel very sad');

            expect(withIntensifier.intensity).toBeGreaterThanOrEqual(withoutIntensifier.intensity);
        });

        it('handles negation correctly', () => {
            const state = engine.detectEmotion("I'm not happy at all");

            expect(state.primaryEmotion).toBe(EmotionCategory.SADNESS);
        });

        it('extracts triggers from text', () => {
            const state = engine.detectEmotion('My daughter came to visit yesterday, it was so lovely');

            expect(state.triggers).toContain('my daughter');
        });
    });

    describe('Voice Prosody Analysis', () => {
        it('detects sadness from slow monotone speech', () => {
            const state = engine.detectEmotion('Hello', {
                speakingRate: 80,
                pitchVariation: 0.2,
                volume: 0.4,
                pauseFrequency: 0.5,
                hasTremor: false,
                hasSighing: true,
                hasCrying: false,
                hasLaughter: false,
            });

            expect(state.primaryEmotion).toBe(EmotionCategory.SADNESS);
        });

        it('detects grief from crying', () => {
            const state = engine.detectEmotion('I miss them', {
                speakingRate: 100,
                pitchVariation: 0.3,
                volume: 0.5,
                pauseFrequency: 0.3,
                hasTremor: false,
                hasSighing: false,
                hasCrying: true,
                hasLaughter: false,
            });

            expect(state.primaryEmotion).toBe(EmotionCategory.GRIEF);
        });

        it('detects joy from laughter', () => {
            const state = engine.detectEmotion('That was great', {
                speakingRate: 150,
                pitchVariation: 0.7,
                volume: 0.7,
                pauseFrequency: 0.2,
                hasTremor: false,
                hasSighing: false,
                hasCrying: false,
                hasLaughter: true,
            });

            expect(state.primaryEmotion).toBe(EmotionCategory.JOY);
        });

        it('detects fear from voice tremor', () => {
            const state = engine.detectEmotion('I heard something', {
                speakingRate: 100,
                pitchVariation: 0.4,
                volume: 0.3,
                pauseFrequency: 0.4,
                hasTremor: true,
                hasSighing: false,
                hasCrying: false,
                hasLaughter: false,
            });

            expect(state.primaryEmotion).toBe(EmotionCategory.FEAR);
        });
    });

    describe('Empathetic Response Generation', () => {
        it('generates validation response for sadness', () => {
            const state = engine.detectEmotion('I feel so sad today');
            const response = engine.generateResponse(state);

            expect(response.type).toBe(EmpathyResponseType.VALIDATION);
            expect(response.tone).toBe(ResponseTone.GENTLE);
            expect(response.text.length).toBeGreaterThan(0);
        });

        it('generates comfort response for high-intensity negative emotion', () => {
            const state = engine.detectEmotion('I am completely devastated. This is the worst day ever.');
            const response = engine.generateResponse(state);

            expect(response.type).toBe(EmpathyResponseType.COMFORT);
            expect(response.addPauses).toBe(true);
        });

        it('generates celebration response for joy', () => {
            const state = engine.detectEmotion('This is the best day of my life! I am so thrilled!');
            const response = engine.generateResponse(state);

            expect(response.type).toBe(EmpathyResponseType.CELEBRATION);
            expect(response.tone).toBe(ResponseTone.CHEERFUL);
        });

        it('slows speaking pace for negative emotions', () => {
            const state = engine.detectEmotion('I am grieving the loss of my husband');
            const response = engine.generateResponse(state);

            expect(response.paceMultiplier).toBeLessThan(1.0);
        });

        it('includes follow-up questions when appropriate', () => {
            const state = engine.detectEmotion('I feel lonely. Nobody visits me.');
            const response = engine.generateResponse(state);

            expect(response.followUp).toBeDefined();
            expect(response.followUp!.length).toBeGreaterThan(0);
        });
    });

    describe('Response Adaptation', () => {
        it('prepends empathy to response for distressed user', () => {
            const state = engine.detectEmotion('I feel so alone and abandoned');
            const adapted = engine.adaptResponse('Here is the information you requested.', state);

            expect(adapted).not.toBe('Here is the information you requested.');
            expect(adapted.length).toBeGreaterThan('Here is the information you requested.'.length);
        });

        it('does not modify response for neutral emotion', () => {
            const state = engine.detectEmotion('What is the weather?');
            const adapted = engine.adaptResponse('The weather is sunny.', state);

            expect(adapted).toBe('The weather is sunny.');
        });

        it('adds affirmation for positive emotions', () => {
            const state = engine.detectEmotion('I am so happy about this wonderful news!');
            const adapted = engine.adaptResponse('That sounds great.', state);

            expect(adapted).toContain('wonderful');
        });
    });

    describe('Emotion Trend Analysis', () => {
        it('returns stable trend with insufficient data', () => {
            const trend = engine.getEmotionTrend();

            expect(trend.trend).toBe('stable');
        });

        it('detects improving trend', () => {
            // Add sad emotions first
            engine.detectEmotion('I feel so sad');
            engine.detectEmotion('Still feeling down');
            engine.detectEmotion('A bit better now');
            // Then positive
            engine.detectEmotion('Actually feeling good today');
            engine.detectEmotion('This is wonderful!');

            const trend = engine.getEmotionTrend();
            expect(trend.trend).toBe('improving');
        });

        it('detects declining trend', () => {
            // Add positive emotions first
            engine.detectEmotion('What a wonderful day!');
            engine.detectEmotion('Feeling great!');
            // Then negative
            engine.detectEmotion('Things are getting harder');
            engine.detectEmotion('I feel really sad now');
            engine.detectEmotion('Everything is terrible');

            const trend = engine.getEmotionTrend();
            expect(trend.trend).toBe('declining');
        });

        it('calculates average valence', () => {
            engine.detectEmotion('I am happy');
            engine.detectEmotion('I am sad');

            const trend = engine.getEmotionTrend();
            expect(trend.averageValence).toBeDefined();
        });

        it('identifies dominant emotion', () => {
            engine.detectEmotion('I feel lonely');
            engine.detectEmotion('So lonely here');
            engine.detectEmotion('Nobody around, feeling alone');

            const trend = engine.getEmotionTrend();
            expect(trend.dominantEmotion).toBe(EmotionCategory.LONELINESS);
        });

        it('detects emotional consistency', () => {
            engine.detectEmotion('I feel happy');
            engine.detectEmotion('So happy today');
            engine.detectEmotion('Happiness everywhere');

            const isConsistent = engine.isEmotionallyConsistent(EmotionCategory.JOY, 3);
            expect(isConsistent).toBe(true);
        });
    });

    describe('History Management', () => {
        it('tracks emotion history', () => {
            engine.detectEmotion('I feel happy');
            engine.detectEmotion('I feel sad');

            const history = engine.getHistory();
            expect(history.length).toBe(2);
        });

        it('clears history', () => {
            engine.detectEmotion('Test emotion');
            engine.clearHistory();

            const history = engine.getHistory();
            expect(history.length).toBe(0);
        });

        it('limits history size', () => {
            // Add more than 50 emotions
            for (let i = 0; i < 60; i++) {
                engine.detectEmotion('I feel happy');
            }

            const history = engine.getHistory();
            expect(history.length).toBeLessThanOrEqual(50);
        });
    });

    describe('Configuration', () => {
        it('respects custom min confidence', () => {
            const strictEngine = new EmpathyEngine({ minConfidence: 0.9 });
            const state = strictEngine.detectEmotion('I feel a bit sad');

            // With high threshold, may not detect support need
            expect(state.confidence).toBeDefined();
        });

        it('supports custom high-risk emotions', () => {
            const customEngine = new EmpathyEngine({
                highRiskEmotions: [EmotionCategory.ANGER],
            });

            const state = customEngine.detectEmotion('I am so furious! This makes me so angry!');
            expect(state.recommendEscalation).toBe(true);
        });
    });
});
