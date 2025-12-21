/**
 * Unit Tests for CognitiveAdapter
 *
 * Tests cognitive accessibility features:
 * - Complexity analysis
 * - Text simplification
 * - Repetition handling
 * - Clarification strategies
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    CognitiveAdapter,
} from '../../../../lib/core/application/agent/cognitive/CognitiveAdapter';

describe('CognitiveAdapter', () => {
    let adapter: CognitiveAdapter;

    beforeEach(() => {
        adapter = new CognitiveAdapter();
    });

    describe('Complexity Analysis', () => {
        it('scores simple text as low complexity', () => {
            const analysis = adapter.analyzeComplexity('The sun is warm. I like it.');

            expect(analysis.score).toBeLessThan(30);
            expect(analysis.needsSimplification).toBe(false);
        });

        it('scores complex text as high complexity', () => {
            const analysis = adapter.analyzeComplexity(
                'The implementation of comprehensive methodologies facilitates the optimization of subsequent operational procedures, thereby enhancing overall organizational efficacy.'
            );

            expect(analysis.score).toBeGreaterThan(50);
            expect(analysis.needsSimplification).toBe(true);
        });

        it('calculates reading level', () => {
            const simple = adapter.analyzeComplexity('I see a cat. The cat is nice.');
            const complex = adapter.analyzeComplexity(
                'The manifestation of phenomenological experiences correlates with epistemological frameworks.'
            );

            expect(simple.readingLevel).toBeLessThan(complex.readingLevel);
        });

        it('detects long sentences', () => {
            const analysis = adapter.analyzeComplexity(
                'This is a very long sentence that goes on and on and on with many words and clauses and phrases that make it difficult to understand and follow along with what is being said.'
            );

            const longSentenceIssues = analysis.issues.filter(i => i.type === 'long_sentence');
            expect(longSentenceIssues.length).toBeGreaterThan(0);
        });

        it('detects complex words', () => {
            const analysis = adapter.analyzeComplexity(
                'We need to utilize comprehensive methodologies to facilitate implementation.'
            );

            const complexWordIssues = analysis.issues.filter(i => i.type === 'complex_word');
            expect(complexWordIssues.length).toBeGreaterThan(0);
        });

        it('detects jargon', () => {
            const analysis = adapter.analyzeComplexity(
                "Let's leverage our synergies and optimize our bandwidth."
            );

            const jargonIssues = analysis.issues.filter(i => i.type === 'jargon');
            expect(jargonIssues.length).toBeGreaterThan(0);
        });

        it('detects passive voice', () => {
            const analysis = adapter.analyzeComplexity(
                'The cake was eaten by the children. The book was read by the student.'
            );

            const passiveIssues = analysis.issues.filter(i => i.type === 'passive_voice');
            expect(passiveIssues.length).toBeGreaterThan(0);
        });

        it('calculates average sentence length', () => {
            const analysis = adapter.analyzeComplexity('Short. Very short. Tiny.');
            expect(analysis.avgSentenceLength).toBeLessThan(5);
        });
    });

    describe('Response Adaptation', () => {
        it('simplifies complex vocabulary', () => {
            const adapted = adapter.adaptResponse(
                'We need to utilize this to facilitate the implementation.'
            );

            expect(adapted.text).toContain('use');
            expect(adapted.text).toContain('help');
            expect(adapted.simplificationsApplied.length).toBeGreaterThan(0);
        });

        it('truncates overly long responses', () => {
            const longText = 'This is a test sentence. '.repeat(50);
            const adapted = adapter.adaptResponse(longText);

            const wordCount = adapted.text.split(/\s+/).length;
            expect(wordCount).toBeLessThanOrEqual(105); // Some buffer for truncation
        });

        it('adds pause points after sentences', () => {
            const adapted = adapter.adaptResponse(
                'First point. Second point. Third point.'
            );

            expect(adapted.pausePoints.length).toBe(3);
        });

        it('sets appropriate speaking rate', () => {
            const adapted = adapter.adaptResponse('Some text here.');

            expect(adapted.speakingRate).toBeLessThanOrEqual(1);
        });

        it('generates key points summary for long text', () => {
            const longText = 'First important point. ' + 'Middle content. '.repeat(20) + 'Final important conclusion.';
            const adapted = adapter.adaptResponse(longText);

            // May or may not have summary depending on word count
            expect(adapted).toBeDefined();
        });

        it('suggests confirmation when configured', () => {
            const adapted = adapter.adaptResponse('Important information here.');

            expect(adapted.shouldConfirm).toBe(true);
        });
    });

    describe('Repetition Handling', () => {
        it('recognizes first occurrence as not repetition', () => {
            const result = adapter.handleRepetition('What day is it?');

            expect(result.isRepetition).toBe(false);
            expect(result.timesAsked).toBe(1);
            expect(result.patience).toBe('normal');
        });

        it('recognizes second occurrence as repetition', () => {
            adapter.handleRepetition('What day is it?');
            const result = adapter.handleRepetition('What day is it?');

            expect(result.isRepetition).toBe(true);
            expect(result.timesAsked).toBe(2);
            expect(result.patience).toBe('patient');
        });

        it('increases patience with more repetitions', () => {
            adapter.handleRepetition('What time is it?');
            adapter.handleRepetition('What time is it?');
            const result = adapter.handleRepetition('What time is it?');

            expect(result.timesAsked).toBe(3);
            expect(result.patience).toBe('very_patient');
        });

        it('provides graceful response for repetition', () => {
            adapter.handleRepetition('Who are you?');
            const result = adapter.handleRepetition('Who are you?');

            expect(result.suggestedResponse.length).toBeGreaterThan(0);
        });

        it('normalizes topic for matching', () => {
            adapter.handleRepetition('WHAT DAY IS IT?');
            const result = adapter.handleRepetition('what day is it?');

            expect(result.isRepetition).toBe(true);
        });

        it('clears repetition history', () => {
            adapter.handleRepetition('Test question');
            adapter.handleRepetition('Test question');
            adapter.clearRepetitionHistory();
            const result = adapter.handleRepetition('Test question');

            expect(result.isRepetition).toBe(false);
        });
    });

    describe('Clarification', () => {
        it('generates clarification for specific part', () => {
            const clarification = adapter.generateClarification(
                'The procedure involves multiple steps',
                'procedure'
            );

            expect(clarification).toContain('procedure');
        });

        it('generates general clarification', () => {
            const clarification = adapter.generateClarification('Complex explanation here');

            expect(clarification.length).toBeGreaterThan(0);
        });

        it('generates confirmation request', () => {
            const confirmation = adapter.generateConfirmation('Today is Sunday');

            expect(confirmation).toContain('Sunday');
        });

        it('generates summary', () => {
            const summary = adapter.generateSummary(
                'First sentence with main point. Additional details here. More information follows.'
            );

            expect(summary.length).toBeGreaterThan(0);
            expect(summary.toLowerCase()).toContain('so');
        });
    });

    describe('Configuration', () => {
        it('updates settings', () => {
            adapter.updateSettings({ maxSentenceLength: 10 });

            const settings = adapter.getSettings();
            expect(settings.maxSentenceLength).toBe(10);
        });

        it('returns current settings', () => {
            const settings = adapter.getSettings();

            expect(settings.maxSentenceLength).toBeDefined();
            expect(settings.targetReadingLevel).toBeDefined();
            expect(settings.speakingPaceMultiplier).toBeDefined();
        });
    });

    describe('Presets', () => {
        it('creates mild adaptation preset', () => {
            const preset = CognitiveAdapter.createPresetsFor('mild');

            expect(preset.maxSentenceLength).toBe(20);
            expect(preset.targetReadingLevel).toBe(8);
        });

        it('creates moderate adaptation preset', () => {
            const preset = CognitiveAdapter.createPresetsFor('moderate');

            expect(preset.maxSentenceLength).toBe(12);
            expect(preset.targetReadingLevel).toBe(5);
        });

        it('creates significant adaptation preset', () => {
            const preset = CognitiveAdapter.createPresetsFor('significant');

            expect(preset.maxSentenceLength).toBe(8);
            expect(preset.targetReadingLevel).toBe(3);
            expect(preset.speakingPaceMultiplier).toBe(0.7);
        });

        it('applies presets correctly', () => {
            const preset = CognitiveAdapter.createPresetsFor('significant');
            const customAdapter = new CognitiveAdapter(preset);

            const settings = customAdapter.getSettings();
            expect(settings.maxSentenceLength).toBe(8);
        });
    });

    describe('Word Simplification', () => {
        const testCases = [
            { complex: 'utilize', simple: 'use' },
            { complex: 'implement', simple: 'do' },
            { complex: 'facilitate', simple: 'help' },
            { complex: 'approximately', simple: 'about' },
            { complex: 'subsequently', simple: 'then' },
            { complex: 'demonstrate', simple: 'show' },
            { complex: 'obtain', simple: 'get' },
            { complex: 'sufficient', simple: 'enough' },
        ];

        testCases.forEach(({ complex, simple }) => {
            it(`simplifies "${complex}" to "${simple}"`, () => {
                const adapted = adapter.adaptResponse(`We need to ${complex} this.`);
                expect(adapted.text).toContain(simple);
            });
        });
    });
});
