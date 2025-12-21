/**
 * Unit Tests for SessionContinuity
 *
 * Tests multi-session memory and relationship tracking:
 * - Story arc management
 * - Topic thread tracking
 * - Shared memory management
 * - Relationship milestones
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    SessionContinuityManager,
    StoryArcStatus,
    SharedMemoryType,
    RelationshipMilestoneType,
} from '../../../../lib/core/application/agent/continuity/SessionContinuity';

describe('SessionContinuityManager', () => {
    let manager: SessionContinuityManager;

    beforeEach(() => {
        manager = new SessionContinuityManager('user-123');
    });

    describe('Session Management', () => {
        it('starts a new session', () => {
            manager.startSession('session-abc');
            const context = manager.getResumptionContext();

            expect(context).toBeDefined();
        });

        it('increments total conversations on session start', () => {
            manager.startSession();
            manager.startSession();

            const stats = manager.getStats();
            expect(stats.totalConversations).toBe(2);
        });

        it('ends session and creates summary', () => {
            manager.startSession();
            const summary = manager.endSession({
                topicsDiscussed: ['family', 'weather'],
                primaryEmotion: 'JOY',
                newInformation: ['Granddaughter is visiting'],
                openQuestions: ['How was the visit?'],
            });

            expect(summary.topicsDiscussed).toContain('family');
            expect(summary.newInformation).toContain('Granddaughter is visiting');
        });

        it('calculates session duration', () => {
            manager.startSession();
            // Wait a tiny bit for time to pass
            const summary = manager.endSession({
                topicsDiscussed: ['test'],
            });

            expect(summary.durationMinutes).toBeDefined();
        });

        it('provides resumption context', () => {
            manager.startSession();
            manager.endSession({
                topicsDiscussed: ['gardening'],
                openQuestions: ['How are the roses?'],
            });

            const context = manager.getResumptionContext();

            expect(context.lastSession).toBeDefined();
            expect(context.suggestedStarters.length).toBeGreaterThan(0);
        });
    });

    describe('Story Arc Management', () => {
        it('creates a new story arc', () => {
            const arc = manager.startStoryArc('Summer at the Lake', ['family', 'nostalgia']);

            expect(arc.title).toBe('Summer at the Lake');
            expect(arc.status).toBe(StoryArcStatus.STARTED);
            expect(arc.emotionalThemes).toContain('family');
        });

        it('adds segments to story arc', () => {
            const arc = manager.startStoryArc('My Wedding Day');
            const segment = manager.addStorySegment(
                arc.id,
                'It was a beautiful sunny day in June.',
                { emotion: 'JOY', followUpQuestions: ['What was the ceremony like?'] }
            );

            expect(segment).not.toBeNull();
            expect(segment!.content).toContain('June');
        });

        it('updates arc status when segments added', () => {
            const arc = manager.startStoryArc('Test Story');
            manager.addStorySegment(arc.id, 'First part of the story');

            const updatedArc = manager.getStoryArc(arc.id);
            expect(updatedArc?.status).toBe(StoryArcStatus.IN_PROGRESS);
        });

        it('extracts characters from segments', () => {
            const arc = manager.startStoryArc('Family Story');
            manager.addStorySegment(arc.id, 'My mother was a wonderful woman.');

            const updatedArc = manager.getStoryArc(arc.id);
            expect(updatedArc?.characters).toContain('mother');
        });

        it('completes a story arc', () => {
            const arc = manager.startStoryArc('Short Story');
            manager.addStorySegment(arc.id, 'The end.');
            manager.completeStoryArc(arc.id);

            const completed = manager.getStoryArc(arc.id);
            expect(completed?.status).toBe(StoryArcStatus.COMPLETE);
            expect(completed?.isActive).toBe(false);
            expect(completed?.completionPercent).toBe(100);
        });

        it('returns null for non-existent arc', () => {
            const segment = manager.addStorySegment('non-existent', 'text');
            expect(segment).toBeNull();
        });

        it('gets active story arcs', () => {
            manager.startStoryArc('Active Story');
            const arc2 = manager.startStoryArc('Complete Story');
            manager.completeStoryArc(arc2.id);

            const active = manager.getActiveStoryArcs();
            expect(active.length).toBe(1);
            expect(active[0].title).toBe('Active Story');
        });
    });

    describe('Topic Thread Management', () => {
        it('tracks new topic discussion', () => {
            const thread = manager.trackTopicDiscussion('gardening', 'Roses are the favorite');

            expect(thread.topic).toBe('gardening');
            expect(thread.discussionCount).toBe(1);
        });

        it('increments count for existing topic', () => {
            manager.trackTopicDiscussion('cooking');
            const thread = manager.trackTopicDiscussion('cooking');

            expect(thread.discussionCount).toBe(2);
        });

        it('adds key points to topic', () => {
            manager.trackTopicDiscussion('health', 'Blood pressure is normal');
            manager.trackTopicDiscussion('health', 'Started new medication');

            const topics = manager.getAllTopicThreads();
            const healthTopic = topics.find(t => t.topic === 'health');

            expect(healthTopic?.keyPoints.length).toBe(2);
        });

        it('adds open follow-ups', () => {
            manager.trackTopicDiscussion('family');
            manager.addOpenFollowUp('family', 'How is your daughter doing?');

            const topics = manager.getTopicsNeedingFollowUp();
            expect(topics.length).toBeGreaterThan(0);
            expect(topics[0].openFollowUps).toContain('How is your daughter doing?');
        });

        it('marks follow-up as addressed', () => {
            const thread = manager.trackTopicDiscussion('test');
            manager.addOpenFollowUp('test', 'Question 1');
            manager.markFollowUpAddressed(thread.id, 0);

            const topics = manager.getTopicsNeedingFollowUp();
            const testTopic = topics.find(t => t.topic === 'test');
            expect(testTopic?.needsFollowUp).toBe(false);
        });

        it('normalizes topic names for matching', () => {
            manager.trackTopicDiscussion('GARDENING');
            const thread = manager.trackTopicDiscussion('gardening');

            expect(thread.discussionCount).toBe(2);
        });
    });

    describe('Shared Memory Management', () => {
        it('adds shared memory', () => {
            const memory = manager.addSharedMemory(
                SharedMemoryType.USER_STORY,
                'The summer we drove across the country',
                {
                    people: ['husband', 'children'],
                    emotionalSignificance: 'high',
                    tags: ['travel', 'family'],
                }
            );

            expect(memory.type).toBe(SharedMemoryType.USER_STORY);
            expect(memory.emotionalSignificance).toBe('high');
        });

        it('references memory increments count', () => {
            const memory = manager.addSharedMemory(
                SharedMemoryType.SHARED_LAUGH,
                'We laughed about the cat incident'
            );
            manager.referenceMemory(memory.id);
            manager.referenceMemory(memory.id);

            const memories = manager.getAllSharedMemories();
            const updated = memories.find(m => m.id === memory.id);
            expect(updated?.referenceCount).toBe(2);
        });

        it('marks memory as favorite', () => {
            const memory = manager.addSharedMemory(
                SharedMemoryType.WISDOM,
                'Life is too short to worry'
            );
            manager.markMemoryFavorite(memory.id, true);

            const favorites = manager.getFavoriteMemories();
            expect(favorites.length).toBe(1);
            expect(favorites[0].content).toContain('Life is too short');
        });

        it('gets memories by type', () => {
            manager.addSharedMemory(SharedMemoryType.USER_STORY, 'Story 1');
            manager.addSharedMemory(SharedMemoryType.WISDOM, 'Wisdom 1');
            manager.addSharedMemory(SharedMemoryType.USER_STORY, 'Story 2');

            const stories = manager.getMemoriesByType(SharedMemoryType.USER_STORY);
            expect(stories.length).toBe(2);
        });

        it('gets most referenced memories', () => {
            const m1 = manager.addSharedMemory(SharedMemoryType.USER_STORY, 'Popular story');
            manager.addSharedMemory(SharedMemoryType.USER_STORY, 'Less popular');

            manager.referenceMemory(m1.id);
            manager.referenceMemory(m1.id);
            manager.referenceMemory(m1.id);

            const top = manager.getMostReferencedMemories(1);
            expect(top[0].content).toContain('Popular');
        });
    });

    describe('Relationship Milestones', () => {
        it('adds first conversation milestone automatically', () => {
            manager.startSession();

            const milestones = manager.getAllMilestones();
            expect(milestones.some(m => m.type === RelationshipMilestoneType.FIRST_CONVERSATION)).toBe(true);
        });

        it('adds 10 conversations milestone', () => {
            for (let i = 0; i < 10; i++) {
                manager.startSession();
            }

            const milestones = manager.getAllMilestones();
            expect(milestones.some(m => m.type === RelationshipMilestoneType.TEN_CONVERSATIONS)).toBe(true);
        });

        it('acknowledges milestone', () => {
            manager.startSession();
            const milestones = manager.getUnacknowledgedMilestones();

            if (milestones.length > 0) {
                manager.acknowledgeMilestone(milestones[0].id);
                const remaining = manager.getUnacknowledgedMilestones();
                expect(remaining.length).toBeLessThan(milestones.length);
            }
        });

        it('prevents duplicate milestone types', () => {
            manager.addMilestone(
                RelationshipMilestoneType.TRUST_ESTABLISHED,
                'Trust',
                'Trust established'
            );
            manager.addMilestone(
                RelationshipMilestoneType.TRUST_ESTABLISHED,
                'Trust Again',
                'Another trust'
            );

            const trustMilestones = manager.getAllMilestones().filter(
                m => m.type === RelationshipMilestoneType.TRUST_ESTABLISHED
            );
            expect(trustMilestones.length).toBe(1);
        });
    });

    describe('Statistics', () => {
        it('calculates total conversation time', () => {
            manager.startSession();
            manager.endSession({ topicsDiscussed: ['test'] });

            const time = manager.getTotalConversationTime();
            expect(time).toBeDefined();
        });

        it('provides stats summary', () => {
            manager.startSession();
            manager.startStoryArc('Test Arc');
            manager.addSharedMemory(SharedMemoryType.WISDOM, 'Test wisdom');

            const stats = manager.getStats();

            expect(stats.totalConversations).toBe(1);
            expect(stats.storyArcCount).toBe(1);
            expect(stats.sharedMemoryCount).toBe(1);
        });
    });

    describe('Serialization', () => {
        it('exports all data', () => {
            manager.startSession();
            manager.startStoryArc('Test Arc');
            manager.addSharedMemory(SharedMemoryType.USER_STORY, 'Test story');

            const exported = manager.export();

            expect(exported.userId).toBe('user-123');
            expect(exported.storyArcs.length).toBe(1);
            expect(exported.sharedMemories.length).toBe(1);
        });

        it('imports saved data', () => {
            const newManager = new SessionContinuityManager('user-456');
            newManager.import({
                totalConversations: 50,
                storyArcs: [
                    {
                        id: 'arc-1',
                        title: 'Imported Arc',
                        status: StoryArcStatus.COMPLETE,
                        startedAt: Date.now() - 1000000,
                        updatedAt: Date.now(),
                        segments: [],
                        characters: [],
                        locations: [],
                        emotionalThemes: [],
                        isActive: false,
                        completionPercent: 100,
                    },
                ],
            });

            const stats = newManager.getStats();
            expect(stats.totalConversations).toBe(50);
            expect(stats.storyArcCount).toBe(1);
        });
    });

    describe('Session History', () => {
        it('gets recent sessions', () => {
            manager.startSession('session-1');
            manager.endSession({ topicsDiscussed: ['a'] });
            manager.startSession('session-2');
            manager.endSession({ topicsDiscussed: ['b'] });

            const recent = manager.getRecentSessions(1);
            expect(recent.length).toBe(1);
        });

        it('gets session by id', () => {
            manager.startSession('unique-session');
            manager.endSession({ topicsDiscussed: ['test'] });

            const session = manager.getSession('unique-session');
            expect(session?.sessionId).toBe('unique-session');
        });
    });
});
