/**
 * Unit Tests for ProactiveEngine
 *
 * Tests anticipatory companion behaviors:
 * - Proactive action generation
 * - Milestone management
 * - Trigger scheduling
 * - Quiet hours
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ProactiveEngine,
    ProactiveBehaviorType,
    TimeOfDay,
    MilestoneType,
    ProactiveContext,
} from '../../../../lib/core/application/agent/proactive/ProactiveEngine';
import { TopicInterest } from '../../../../lib/core/application/agent/persona/PersonaManager';

describe('ProactiveEngine', () => {
    let engine: ProactiveEngine;

    beforeEach(() => {
        engine = new ProactiveEngine();
    });

    const createContext = (overrides: Partial<ProactiveContext> = {}): ProactiveContext => ({
        timeOfDay: TimeOfDay.MORNING,
        dayOfWeek: 1, // Monday
        currentDate: '2024-03-15',
        daysSinceLastInteraction: 1,
        recentTopics: ['gardening', 'family'],
        interests: [
            { topic: 'gardening', category: 'HOBBIES' as any, interestLevel: 0.9, lastDiscussed: Date.now(), subtopics: ['roses'] },
        ],
        emotionalTrend: 'neutral',
        availableMemories: [],
        upcomingMilestones: [],
        ...overrides,
    });

    describe('Proactive Action Generation', () => {
        it('generates actions for eligible triggers', () => {
            const context = createContext();
            const actions = engine.getProactiveActions(context);

            expect(actions.length).toBeGreaterThan(0);
        });

        it('returns empty when disabled', () => {
            engine.updateConfig({ enabled: false });
            const context = createContext();
            const actions = engine.getProactiveActions(context);

            expect(actions.length).toBe(0);
        });

        it('respects daily message limit', () => {
            engine.updateConfig({ maxMessagesPerDay: 1 });
            const context = createContext();

            engine.getProactiveActions(context);
            const secondBatch = engine.getProactiveActions(context);

            expect(secondBatch.length).toBe(0);
        });

        it('resets daily count on new day', () => {
            engine.updateConfig({ maxMessagesPerDay: 1 });

            let context = createContext({ currentDate: '2024-03-15' });
            engine.getProactiveActions(context);

            context = createContext({ currentDate: '2024-03-16' });
            const actions = engine.getProactiveActions(context);

            expect(actions.length).toBeGreaterThan(0);
        });

        it('respects quiet hours', () => {
            engine.updateConfig({
                respectQuietHours: true,
                quietHoursStart: 21,
                quietHoursEnd: 8,
            });

            const context = createContext({ timeOfDay: TimeOfDay.LATE_NIGHT });
            const actions = engine.getProactiveActions(context);

            expect(actions.length).toBe(0);
        });

        it('limits returned actions', () => {
            const context = createContext();
            const actions = engine.getProactiveActions(context);

            expect(actions.length).toBeLessThanOrEqual(3);
        });
    });

    describe('Greeting Behavior', () => {
        it('generates morning greeting', () => {
            const context = createContext({ timeOfDay: TimeOfDay.MORNING });
            const actions = engine.getProactiveActions(context);

            const greeting = actions.find(a => a.trigger.type === ProactiveBehaviorType.GREETING);
            expect(greeting).toBeDefined();
            expect(greeting?.message).toMatch(/morning|hello|day/i);
        });

        it('personalizes greeting for long absence', () => {
            const context = createContext({
                timeOfDay: TimeOfDay.MORNING,
                daysSinceLastInteraction: 5,
            });
            const actions = engine.getProactiveActions(context);

            const greeting = actions.find(a => a.trigger.type === ProactiveBehaviorType.GREETING);
            expect(greeting?.message).toContain('while');
        });
    });

    describe('Wellbeing Check Behavior', () => {
        it('generates wellbeing check in afternoon', () => {
            const context = createContext({ timeOfDay: TimeOfDay.AFTERNOON });
            const actions = engine.getProactiveActions(context);

            const check = actions.find(a => a.trigger.type === ProactiveBehaviorType.WELLBEING_CHECK);
            expect(check).toBeDefined();
        });

        it('emphasizes check for negative emotional trend', () => {
            const context = createContext({
                timeOfDay: TimeOfDay.AFTERNOON,
                emotionalTrend: 'negative',
            });
            const actions = engine.getProactiveActions(context);

            const check = actions.find(a => a.trigger.type === ProactiveBehaviorType.WELLBEING_CHECK);
            expect(check?.message).toContain('thinking about you');
        });
    });

    describe('Memory Prompt Behavior', () => {
        it('generates memory prompt when memories available', () => {
            const context = createContext({
                timeOfDay: TimeOfDay.AFTERNOON,
                availableMemories: [
                    {
                        memoryContent: 'The summer we spent at the lake was wonderful.',
                        sharedDate: Date.now() - 86400000,
                        topics: ['family', 'vacation'],
                        peopleMentioned: ['husband'],
                    },
                ],
            });

            const actions = engine.getProactiveActions(context);
            const memoryPrompt = actions.find(a => a.trigger.type === ProactiveBehaviorType.MEMORY_PROMPT);

            expect(memoryPrompt).toBeDefined();
            expect(memoryPrompt?.message).toContain('lake');
        });

        it('skips memory prompt when no memories', () => {
            const context = createContext({
                timeOfDay: TimeOfDay.AFTERNOON,
                availableMemories: [],
            });

            const actions = engine.getProactiveActions(context);
            const memoryPrompt = actions.find(a => a.trigger.type === ProactiveBehaviorType.MEMORY_PROMPT);

            expect(memoryPrompt).toBeUndefined();
        });
    });

    describe('Conversation Starter Behavior', () => {
        it('generates conversation starter based on interests', () => {
            const context = createContext({
                timeOfDay: TimeOfDay.MORNING,
                interests: [
                    { topic: 'cooking', category: 'HOBBIES' as any, interestLevel: 0.9, lastDiscussed: Date.now(), subtopics: ['baking'] },
                ],
            });

            const actions = engine.getProactiveActions(context);
            const starter = actions.find(a => a.trigger.type === ProactiveBehaviorType.CONVERSATION_STARTER);

            expect(starter?.message).toContain('cooking');
        });

        it('skips when no interests', () => {
            const context = createContext({
                interests: [],
            });

            const actions = engine.getProactiveActions(context);
            const starter = actions.find(a => a.trigger.type === ProactiveBehaviorType.CONVERSATION_STARTER);

            expect(starter).toBeUndefined();
        });
    });

    describe('Follow-Up Behavior', () => {
        it('generates follow-up based on recent topics', () => {
            const context = createContext({
                timeOfDay: TimeOfDay.MORNING,
                recentTopics: ['doctor visit'],
            });

            const actions = engine.getProactiveActions(context);
            const followUp = actions.find(a => a.trigger.type === ProactiveBehaviorType.FOLLOW_UP);

            expect(followUp?.message).toContain('doctor visit');
        });
    });

    describe('Milestone Management', () => {
        it('adds a milestone', () => {
            engine.addMilestone({
                id: 'wife-birthday',
                title: "Wife's Birthday",
                date: '03-15',
                type: MilestoneType.BIRTHDAY,
                relatedPerson: 'Wife',
                acknowledge: true,
            });

            const milestones = engine.getAllMilestones();
            expect(milestones.length).toBe(1);
            expect(milestones[0].title).toBe("Wife's Birthday");
        });

        it('updates existing milestone', () => {
            engine.addMilestone({
                id: 'test',
                title: 'Original',
                date: '01-01',
                type: MilestoneType.CUSTOM,
                acknowledge: true,
            });

            engine.addMilestone({
                id: 'test',
                title: 'Updated',
                date: '01-01',
                type: MilestoneType.CUSTOM,
                acknowledge: true,
            });

            const milestones = engine.getAllMilestones();
            expect(milestones.length).toBe(1);
            expect(milestones[0].title).toBe('Updated');
        });

        it('removes milestone', () => {
            engine.addMilestone({
                id: 'to-remove',
                title: 'Remove Me',
                date: '01-01',
                type: MilestoneType.CUSTOM,
                acknowledge: true,
            });

            const removed = engine.removeMilestone('to-remove');
            expect(removed).toBe(true);
            expect(engine.getAllMilestones().length).toBe(0);
        });

        it('gets upcoming milestones', () => {
            engine.addMilestone({
                id: 'upcoming',
                title: 'Upcoming Event',
                date: '03-17',
                type: MilestoneType.ANNIVERSARY,
                acknowledge: true,
            });

            const upcoming = engine.getUpcomingMilestones(7, '2024-03-15');
            expect(upcoming.length).toBe(1);
        });

        it('triggers milestone action on milestone day', () => {
            engine.addMilestone({
                id: 'today',
                title: 'Today Event',
                date: '03-15',
                type: MilestoneType.BIRTHDAY,
                acknowledge: true,
            });

            const context = createContext({
                currentDate: '2024-03-15',
                timeOfDay: TimeOfDay.MORNING,
            });

            const actions = engine.getProactiveActions(context);
            const milestoneAction = actions.find(a => a.trigger.type === ProactiveBehaviorType.MILESTONE);

            expect(milestoneAction).toBeDefined();
            expect(milestoneAction?.message).toContain('Today Event');
        });
    });

    describe('Trigger Management', () => {
        it('adds custom trigger', () => {
            engine.addTrigger({
                id: 'custom-trigger',
                type: ProactiveBehaviorType.ACTIVITY_SUGGESTION,
                preferredTime: [TimeOfDay.AFTERNOON],
                daysOfWeek: [1, 2, 3, 4, 5],
                priority: 5,
                cooldownMinutes: 120,
                enabled: true,
                description: 'Suggest afternoon walk',
            });

            const triggers = engine.getTriggers();
            const custom = triggers.find(t => t.id === 'custom-trigger');
            expect(custom).toBeDefined();
        });

        it('enables/disables trigger', () => {
            engine.setTriggerEnabled('morning-greeting', false);

            const triggers = engine.getTriggers();
            const greeting = triggers.find(t => t.id === 'morning-greeting');
            expect(greeting?.enabled).toBe(false);
        });
    });

    describe('Configuration', () => {
        it('updates configuration', () => {
            engine.updateConfig({
                maxMessagesPerDay: 10,
                minIntervalMinutes: 30,
            });

            const config = engine.getConfig();
            expect(config.maxMessagesPerDay).toBe(10);
            expect(config.minIntervalMinutes).toBe(30);
        });

        it('resets daily counts', () => {
            const context = createContext();
            engine.getProactiveActions(context);

            engine.resetDailyCounts();

            const actions = engine.getProactiveActions(context);
            expect(actions.length).toBeGreaterThan(0);
        });
    });

    describe('Time of Day Helper', () => {
        const testCases = [
            { hour: 6, expected: TimeOfDay.EARLY_MORNING },
            { hour: 9, expected: TimeOfDay.MORNING },
            { hour: 13, expected: TimeOfDay.MIDDAY },
            { hour: 15, expected: TimeOfDay.AFTERNOON },
            { hour: 18, expected: TimeOfDay.EVENING },
            { hour: 21, expected: TimeOfDay.NIGHT },
            { hour: 23, expected: TimeOfDay.LATE_NIGHT },
        ];

        testCases.forEach(({ hour, expected }) => {
            it(`returns ${expected} for hour ${hour}`, () => {
                const result = ProactiveEngine.getTimeOfDay(hour);
                expect(result).toBe(expected);
            });
        });
    });
});
