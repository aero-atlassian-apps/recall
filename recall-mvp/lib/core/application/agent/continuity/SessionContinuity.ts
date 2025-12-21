/**
 * Session Continuity - Multi-session memory and relationship tracking.
 * 
 * Enables real companion-like behavior across sessions:
 * - Story arc tracking
 * - Topic resumption
 * - Relationship deepening
 * - Shared history building
 * 
 * @module SessionContinuity
 */

// ============================================================================
// Types
// ============================================================================

/**
 * A story arc that spans multiple sessions.
 */
export interface StoryArc {
    /** Unique ID */
    id: string;
    /** Arc title/theme */
    title: string;
    /** Status */
    status: StoryArcStatus;
    /** When arc started */
    startedAt: number;
    /** Last updated */
    updatedAt: number;
    /** Story segments */
    segments: StorySegment[];
    /** Key characters/people */
    characters: string[];
    /** Key locations */
    locations: string[];
    /** Time period covered */
    timePeriod?: string;
    /** Emotional themes */
    emotionalThemes: string[];
    /** Whether still collecting */
    isActive: boolean;
    /** Completion percentage (0-100) */
    completionPercent: number;
}

/**
 * Status of a story arc.
 */
export enum StoryArcStatus {
    /** Just started */
    STARTED = 'STARTED',
    /** Actively being explored */
    IN_PROGRESS = 'IN_PROGRESS',
    /** Paused/dormant */
    PAUSED = 'PAUSED',
    /** Complete story captured */
    COMPLETE = 'COMPLETE',
}

/**
 * A segment within a story arc.
 */
export interface StorySegment {
    /** Segment ID */
    id: string;
    /** Content */
    content: string;
    /** When shared */
    sharedAt: number;
    /** Session ID where shared */
    sessionId: string;
    /** Emotion during sharing */
    emotion?: string;
    /** Follow-up questions asked */
    followUpQuestions: string[];
    /** Whether answered */
    followUpAnswered: boolean;
}

/**
 * A conversation topic thread.
 */
export interface TopicThread {
    /** Topic ID */
    id: string;
    /** Topic name */
    topic: string;
    /** First mentioned */
    firstMentioned: number;
    /** Last discussed */
    lastDiscussed: number;
    /** Times discussed */
    discussionCount: number;
    /** Key points from discussions */
    keyPoints: ThreadKeyPoint[];
    /** Open questions/follow-ups */
    openFollowUps: string[];
    /** Related story arcs */
    relatedArcs: string[];
    /** Importance score (0-1) */
    importance: number;
    /** Whether needs follow-up */
    needsFollowUp: boolean;
}

/**
 * A key point from a topic discussion.
 */
export interface ThreadKeyPoint {
    /** Point content */
    content: string;
    /** When mentioned */
    mentionedAt: number;
    /** Session ID */
    sessionId: string;
    /** Whether this was new information */
    wasNewInfo: boolean;
}

/**
 * Session summary for continuity.
 */
export interface SessionSummary {
    /** Session ID */
    sessionId: string;
    /** Start time */
    startedAt: number;
    /** End time */
    endedAt: number;
    /** Duration (minutes) */
    durationMinutes: number;
    /** Topics discussed */
    topicsDiscussed: string[];
    /** Primary emotion */
    primaryEmotion?: string;
    /** Story arcs advanced */
    arcsAdvanced: string[];
    /** New information learned */
    newInformation: string[];
    /** Open questions for next time */
    openQuestions: string[];
    /** Quality rating (1-5) */
    qualityRating: number;
    /** Notes */
    notes: string;
}

/**
 * Shared memory between companion and user.
 */
export interface SharedMemory {
    /** Memory ID */
    id: string;
    /** Type of memory */
    type: SharedMemoryType;
    /** Memory content */
    content: string;
    /** When created */
    createdAt: number;
    /** Times referenced */
    referenceCount: number;
    /** Last referenced */
    lastReferenced: number;
    /** People involved */
    people: string[];
    /** Emotional significance */
    emotionalSignificance: 'low' | 'medium' | 'high' | 'profound';
    /** Whether favorite */
    isFavorite: boolean;
    /** Tags */
    tags: string[];
}

/**
 * Types of shared memories.
 */
export enum SharedMemoryType {
    /** A story the user told */
    USER_STORY = 'USER_STORY',
    /** A joke or funny moment */
    SHARED_LAUGH = 'SHARED_LAUGH',
    /** A breakthrough or realization */
    BREAKTHROUGH = 'BREAKTHROUGH',
    /** A piece of wisdom shared */
    WISDOM = 'WISDOM',
    /** A tradition or ritual discussed */
    TRADITION = 'TRADITION',
    /** A life lesson */
    LIFE_LESSON = 'LIFE_LESSON',
    /** A favorite quote or saying */
    FAVORITE_SAYING = 'FAVORITE_SAYING',
    /** A significant moment */
    SIGNIFICANT_MOMENT = 'SIGNIFICANT_MOMENT',
}

/**
 * Relationship milestone.
 */
export interface RelationshipMilestone {
    /** Milestone ID */
    id: string;
    /** Title */
    title: string;
    /** Description */
    description: string;
    /** When achieved */
    achievedAt: number;
    /** Type */
    type: RelationshipMilestoneType;
    /** Whether acknowledged to user */
    acknowledged: boolean;
}

/**
 * Types of relationship milestones.
 */
export enum RelationshipMilestoneType {
    /** First conversation */
    FIRST_CONVERSATION = 'FIRST_CONVERSATION',
    /** First week together */
    FIRST_WEEK = 'FIRST_WEEK',
    /** First month */
    FIRST_MONTH = 'FIRST_MONTH',
    /** 10th conversation */
    TEN_CONVERSATIONS = 'TEN_CONVERSATIONS',
    /** 50th conversation */
    FIFTY_CONVERSATIONS = 'FIFTY_CONVERSATIONS',
    /** 100th conversation */
    HUNDRED_CONVERSATIONS = 'HUNDRED_CONVERSATIONS',
    /** First shared laugh */
    FIRST_LAUGH = 'FIRST_LAUGH',
    /** Deep conversation achieved */
    DEEP_CONVERSATION = 'DEEP_CONVERSATION',
    /** Trust established */
    TRUST_ESTABLISHED = 'TRUST_ESTABLISHED',
    /** Six months */
    SIX_MONTHS = 'SIX_MONTHS',
    /** One year */
    ONE_YEAR = 'ONE_YEAR',
}

/**
 * Context for session resumption.
 */
export interface ResumptionContext {
    /** Last session summary */
    lastSession?: SessionSummary;
    /** Days since last conversation */
    daysSinceLast: number;
    /** Priority topics to follow up */
    priorityFollowUps: TopicThread[];
    /** Active story arcs */
    activeArcs: StoryArc[];
    /** Recent milestones to acknowledge */
    recentMilestones: RelationshipMilestone[];
    /** Suggested conversation starters */
    suggestedStarters: string[];
    /** Relationship context */
    relationshipSummary: string;
}

// ============================================================================
// Session Continuity Manager
// ============================================================================

/**
 * Session Continuity Manager.
 * 
 * Usage:
 * ```typescript
 * const continuity = new SessionContinuityManager('user-123');
 * 
 * // Get context for resuming conversation
 * const context = continuity.getResumptionContext();
 * 
 * // Track a new story arc
 * const arc = continuity.startStoryArc('Summer of 1965', ['family', 'vacation']);
 * 
 * // Add segment to arc
 * continuity.addStorySegment(arc.id, 'We used to drive to the lake every Sunday...');
 * 
 * // Track topic discussion
 * continuity.trackTopicDiscussion('gardening', 'Roses are her favorite flowers');
 * 
 * // End session
 * continuity.endSession({
 *   topicsDiscussed: ['gardening', 'family'],
 *   primaryEmotion: 'NOSTALGIA',
 *   newInformation: ['Roses are favorite'],
 * });
 * ```
 */
export class SessionContinuityManager {
    private userId: string;
    private sessionId: string;
    private sessionStartTime: number;

    private storyArcs: StoryArc[] = [];
    private topicThreads: TopicThread[] = [];
    private sessionHistory: SessionSummary[] = [];
    private sharedMemories: SharedMemory[] = [];
    private milestones: RelationshipMilestone[] = [];

    private totalConversations: number = 0;
    private firstConversationDate: number = Date.now();

    constructor(userId: string, sessionId?: string) {
        this.userId = userId;
        this.sessionId = sessionId || `session-${Date.now()}`;
        this.sessionStartTime = Date.now();
    }

    // ============================================================================
    // Session Management
    // ============================================================================

    /**
     * Start a new session.
     */
    startSession(sessionId?: string): void {
        this.sessionId = sessionId || `session-${Date.now()}`;
        this.sessionStartTime = Date.now();
        this.totalConversations++;

        // Check for conversation count milestones
        this.checkConversationMilestones();
    }

    /**
     * End current session and save summary.
     */
    endSession(details: {
        topicsDiscussed: string[];
        primaryEmotion?: string;
        newInformation?: string[];
        openQuestions?: string[];
        qualityRating?: number;
        notes?: string;
    }): SessionSummary {
        const endTime = Date.now();
        const durationMinutes = Math.round((endTime - this.sessionStartTime) / 60000);

        // Identify advanced arcs
        const arcsAdvanced = this.storyArcs
            .filter(arc => arc.updatedAt >= this.sessionStartTime)
            .map(arc => arc.id);

        const summary: SessionSummary = {
            sessionId: this.sessionId,
            startedAt: this.sessionStartTime,
            endedAt: endTime,
            durationMinutes,
            topicsDiscussed: details.topicsDiscussed,
            primaryEmotion: details.primaryEmotion,
            arcsAdvanced,
            newInformation: details.newInformation || [],
            openQuestions: details.openQuestions || [],
            qualityRating: details.qualityRating || 3,
            notes: details.notes || '',
        };

        this.sessionHistory.push(summary);

        // Keep bounded history
        if (this.sessionHistory.length > 100) {
            this.sessionHistory = this.sessionHistory.slice(-50);
        }

        // Update topic threads
        for (const topic of details.topicsDiscussed) {
            this.trackTopicDiscussion(topic);
        }

        // Add open questions as follow-ups
        if (details.openQuestions) {
            for (const question of details.openQuestions) {
                this.addOpenFollowUp(details.topicsDiscussed[0] || 'general', question);
            }
        }

        return summary;
    }

    /**
     * Get context for resuming conversation.
     */
    getResumptionContext(): ResumptionContext {
        const lastSession = this.sessionHistory[this.sessionHistory.length - 1];
        const daysSinceLast = lastSession
            ? Math.floor((Date.now() - lastSession.endedAt) / (1000 * 60 * 60 * 24))
            : 0;

        // Get priority follow-ups
        const priorityFollowUps = this.topicThreads
            .filter(t => t.needsFollowUp && t.openFollowUps.length > 0)
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 3);

        // Get active story arcs
        const activeArcs = this.storyArcs
            .filter(arc => arc.isActive && arc.status !== StoryArcStatus.COMPLETE)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 3);

        // Get unacknowledged milestones
        const recentMilestones = this.milestones
            .filter(m => !m.acknowledged && (Date.now() - m.achievedAt) < 7 * 24 * 60 * 60 * 1000)
            .slice(0, 2);

        // Generate suggested starters
        const suggestedStarters = this.generateResumptionStarters(
            lastSession,
            priorityFollowUps,
            activeArcs,
            daysSinceLast
        );

        // Build relationship summary
        const relationshipSummary = this.buildRelationshipSummary();

        return {
            lastSession,
            daysSinceLast,
            priorityFollowUps,
            activeArcs,
            recentMilestones,
            suggestedStarters,
            relationshipSummary,
        };
    }

    /**
     * Generate resumption conversation starters.
     */
    private generateResumptionStarters(
        lastSession: SessionSummary | undefined,
        followUps: TopicThread[],
        activeArcs: StoryArc[],
        daysSince: number
    ): string[] {
        const starters: string[] = [];

        // Time-based opening
        if (daysSince > 7) {
            starters.push(`It's been over a week since we talked. I've missed our conversations.`);
        } else if (daysSince > 3) {
            starters.push(`It's nice to talk again. How have you been these past few days?`);
        }

        // Follow-up based
        if (followUps.length > 0) {
            const topic = followUps[0];
            if (topic.openFollowUps.length > 0) {
                starters.push(`I've been thinking about ${topic.topic}. ${topic.openFollowUps[0]}`);
            } else {
                starters.push(`Last time you mentioned ${topic.topic}. How are things going with that?`);
            }
        }

        // Story arc based
        if (activeArcs.length > 0) {
            const arc = activeArcs[0];
            starters.push(`I'd love to hear more about "${arc.title}" sometime if you feel like sharing.`);
        }

        // Last session based
        if (lastSession && lastSession.topicsDiscussed.length > 0) {
            starters.push(`We talked about ${lastSession.topicsDiscussed[0]} last time. Any new thoughts on that?`);
        }

        return starters;
    }

    /**
     * Build relationship summary for context.
     */
    private buildRelationshipSummary(): string {
        const daysTogether = Math.floor(
            (Date.now() - this.firstConversationDate) / (1000 * 60 * 60 * 24)
        );
        const arcCount = this.storyArcs.length;
        const memoryCount = this.sharedMemories.length;

        let summary = `We've been talking for ${daysTogether} days over ${this.totalConversations} conversations. `;

        if (arcCount > 0) {
            summary += `We've explored ${arcCount} story ${arcCount === 1 ? 'arc' : 'arcs'} together. `;
        }

        if (memoryCount > 0) {
            summary += `We share ${memoryCount} special ${memoryCount === 1 ? 'memory' : 'memories'}. `;
        }

        return summary.trim();
    }

    // ============================================================================
    // Story Arc Management
    // ============================================================================

    /**
     * Start a new story arc.
     */
    startStoryArc(title: string, themes: string[] = []): StoryArc {
        const arc: StoryArc = {
            id: `arc-${Date.now()}`,
            title,
            status: StoryArcStatus.STARTED,
            startedAt: Date.now(),
            updatedAt: Date.now(),
            segments: [],
            characters: [],
            locations: [],
            emotionalThemes: themes,
            isActive: true,
            completionPercent: 0,
        };

        this.storyArcs.push(arc);
        return arc;
    }

    /**
     * Add a segment to a story arc.
     */
    addStorySegment(
        arcId: string,
        content: string,
        options?: {
            emotion?: string;
            followUpQuestions?: string[];
        }
    ): StorySegment | null {
        const arc = this.storyArcs.find(a => a.id === arcId);
        if (!arc) return null;

        const segment: StorySegment = {
            id: `seg-${Date.now()}`,
            content,
            sharedAt: Date.now(),
            sessionId: this.sessionId,
            emotion: options?.emotion,
            followUpQuestions: options?.followUpQuestions || [],
            followUpAnswered: false,
        };

        arc.segments.push(segment);
        arc.updatedAt = Date.now();
        arc.status = StoryArcStatus.IN_PROGRESS;

        // Update completion estimate
        arc.completionPercent = Math.min(100, arc.segments.length * 20);

        // Extract characters
        this.extractCharacters(content, arc);

        return segment;
    }

    /**
     * Extract character names from content.
     */
    private extractCharacters(content: string, arc: StoryArc): void {
        // Simple pattern for names (capitalized words)
        const namePattern = /\b(my\s+)?(mother|father|mom|dad|grandma|grandpa|grandmother|grandfather|brother|sister|wife|husband|son|daughter|uncle|aunt|cousin|friend|neighbor)\b/gi;
        const matches = content.match(namePattern);
        if (matches) {
            for (const match of matches) {
                const normalized = match.replace(/^my\s+/i, '').toLowerCase();
                if (!arc.characters.includes(normalized)) {
                    arc.characters.push(normalized);
                }
            }
        }

        // Also look for proper names
        const properNamePattern = /\b([A-Z][a-z]+)\b(?:\s+(?:was|is|said|told|asked|went))/g;
        let match: RegExpExecArray | null;
        while ((match = properNamePattern.exec(content)) !== null) {
            const name = match[1];
            if (!arc.characters.includes(name) && name.length > 2) {
                arc.characters.push(name);
            }
        }
    }

    /**
     * Mark a story arc as complete.
     */
    completeStoryArc(arcId: string): void {
        const arc = this.storyArcs.find(a => a.id === arcId);
        if (arc) {
            arc.status = StoryArcStatus.COMPLETE;
            arc.isActive = false;
            arc.completionPercent = 100;
            arc.updatedAt = Date.now();

            // Check for deep conversation milestone
            if (arc.segments.length >= 5) {
                this.addMilestone(
                    RelationshipMilestoneType.DEEP_CONVERSATION,
                    'Deep Conversation',
                    `Completed story arc: "${arc.title}"`
                );
            }
        }
    }

    /**
     * Get active story arcs.
     */
    getActiveStoryArcs(): StoryArc[] {
        return this.storyArcs.filter(arc => arc.isActive);
    }

    /**
     * Get story arc by ID.
     */
    getStoryArc(arcId: string): StoryArc | undefined {
        return this.storyArcs.find(a => a.id === arcId);
    }

    /**
     * Get all story arcs.
     */
    getAllStoryArcs(): StoryArc[] {
        return [...this.storyArcs];
    }

    // ============================================================================
    // Topic Thread Management
    // ============================================================================

    /**
     * Track discussion of a topic.
     */
    trackTopicDiscussion(topic: string, keyPoint?: string): TopicThread {
        let thread = this.topicThreads.find(
            t => t.topic.toLowerCase() === topic.toLowerCase()
        );

        if (!thread) {
            thread = {
                id: `topic-${Date.now()}`,
                topic,
                firstMentioned: Date.now(),
                lastDiscussed: Date.now(),
                discussionCount: 1,
                keyPoints: [],
                openFollowUps: [],
                relatedArcs: [],
                importance: 0.5,
                needsFollowUp: false,
            };
            this.topicThreads.push(thread);
        } else {
            thread.discussionCount++;
            thread.lastDiscussed = Date.now();
            thread.importance = Math.min(1, thread.importance + 0.1);
        }

        if (keyPoint) {
            thread.keyPoints.push({
                content: keyPoint,
                mentionedAt: Date.now(),
                sessionId: this.sessionId,
                wasNewInfo: true,
            });
        }

        return thread;
    }

    /**
     * Add an open follow-up for a topic.
     */
    addOpenFollowUp(topic: string, question: string): void {
        const thread = this.topicThreads.find(
            t => t.topic.toLowerCase() === topic.toLowerCase()
        );

        if (thread) {
            if (!thread.openFollowUps.includes(question)) {
                thread.openFollowUps.push(question);
                thread.needsFollowUp = true;
            }
        }
    }

    /**
     * Mark a follow-up as addressed.
     */
    markFollowUpAddressed(topicId: string, followUpIndex: number): void {
        const thread = this.topicThreads.find(t => t.id === topicId);
        if (thread && followUpIndex < thread.openFollowUps.length) {
            thread.openFollowUps.splice(followUpIndex, 1);
            thread.needsFollowUp = thread.openFollowUps.length > 0;
        }
    }

    /**
     * Get topics needing follow-up.
     */
    getTopicsNeedingFollowUp(): TopicThread[] {
        return this.topicThreads
            .filter(t => t.needsFollowUp)
            .sort((a, b) => b.importance - a.importance);
    }

    /**
     * Get all topic threads.
     */
    getAllTopicThreads(): TopicThread[] {
        return [...this.topicThreads];
    }

    // ============================================================================
    // Shared Memory Management
    // ============================================================================

    /**
     * Add a shared memory.
     */
    addSharedMemory(
        type: SharedMemoryType,
        content: string,
        options?: {
            people?: string[];
            emotionalSignificance?: 'low' | 'medium' | 'high' | 'profound';
            tags?: string[];
        }
    ): SharedMemory {
        const memory: SharedMemory = {
            id: `memory-${Date.now()}`,
            type,
            content,
            createdAt: Date.now(),
            referenceCount: 0,
            lastReferenced: Date.now(),
            people: options?.people || [],
            emotionalSignificance: options?.emotionalSignificance || 'medium',
            isFavorite: false,
            tags: options?.tags || [],
        };

        this.sharedMemories.push(memory);
        return memory;
    }

    /**
     * Reference a shared memory.
     */
    referenceMemory(memoryId: string): void {
        const memory = this.sharedMemories.find(m => m.id === memoryId);
        if (memory) {
            memory.referenceCount++;
            memory.lastReferenced = Date.now();
        }
    }

    /**
     * Mark memory as favorite.
     */
    markMemoryFavorite(memoryId: string, isFavorite: boolean): void {
        const memory = this.sharedMemories.find(m => m.id === memoryId);
        if (memory) {
            memory.isFavorite = isFavorite;
        }
    }

    /**
     * Get favorite memories.
     */
    getFavoriteMemories(): SharedMemory[] {
        return this.sharedMemories.filter(m => m.isFavorite);
    }

    /**
     * Get memories by type.
     */
    getMemoriesByType(type: SharedMemoryType): SharedMemory[] {
        return this.sharedMemories.filter(m => m.type === type);
    }

    /**
     * Get most referenced memories.
     */
    getMostReferencedMemories(limit: number = 5): SharedMemory[] {
        return [...this.sharedMemories]
            .sort((a, b) => b.referenceCount - a.referenceCount)
            .slice(0, limit);
    }

    /**
     * Get all shared memories.
     */
    getAllSharedMemories(): SharedMemory[] {
        return [...this.sharedMemories];
    }

    // ============================================================================
    // Milestone Management
    // ============================================================================

    /**
     * Add a relationship milestone.
     */
    addMilestone(
        type: RelationshipMilestoneType,
        title: string,
        description: string
    ): RelationshipMilestone {
        // Check if already exists
        const existing = this.milestones.find(m => m.type === type);
        if (existing) return existing;

        const milestone: RelationshipMilestone = {
            id: `milestone-${Date.now()}`,
            title,
            description,
            achievedAt: Date.now(),
            type,
            acknowledged: false,
        };

        this.milestones.push(milestone);
        return milestone;
    }

    /**
     * Check and add conversation count milestones.
     */
    private checkConversationMilestones(): void {
        if (this.totalConversations === 1) {
            this.addMilestone(
                RelationshipMilestoneType.FIRST_CONVERSATION,
                'First Conversation',
                'We had our very first conversation'
            );
        } else if (this.totalConversations === 10) {
            this.addMilestone(
                RelationshipMilestoneType.TEN_CONVERSATIONS,
                '10 Conversations',
                "We've talked 10 times now"
            );
        } else if (this.totalConversations === 50) {
            this.addMilestone(
                RelationshipMilestoneType.FIFTY_CONVERSATIONS,
                '50 Conversations',
                "We've shared 50 conversations"
            );
        } else if (this.totalConversations === 100) {
            this.addMilestone(
                RelationshipMilestoneType.HUNDRED_CONVERSATIONS,
                '100 Conversations',
                "We've reached 100 conversations together!"
            );
        }
    }

    /**
     * Acknowledge a milestone.
     */
    acknowledgeMilestone(milestoneId: string): void {
        const milestone = this.milestones.find(m => m.id === milestoneId);
        if (milestone) {
            milestone.acknowledged = true;
        }
    }

    /**
     * Get unacknowledged milestones.
     */
    getUnacknowledgedMilestones(): RelationshipMilestone[] {
        return this.milestones.filter(m => !m.acknowledged);
    }

    /**
     * Get all milestones.
     */
    getAllMilestones(): RelationshipMilestone[] {
        return [...this.milestones];
    }

    // ============================================================================
    // Session History
    // ============================================================================

    /**
     * Get recent sessions.
     */
    getRecentSessions(limit: number = 10): SessionSummary[] {
        return this.sessionHistory.slice(-limit);
    }

    /**
     * Get session by ID.
     */
    getSession(sessionId: string): SessionSummary | undefined {
        return this.sessionHistory.find(s => s.sessionId === sessionId);
    }

    /**
     * Get total conversation time (minutes).
     */
    getTotalConversationTime(): number {
        return this.sessionHistory.reduce((sum, s) => sum + s.durationMinutes, 0);
    }

    // ============================================================================
    // Serialization
    // ============================================================================

    /**
     * Export all data for persistence.
     */
    export(): {
        userId: string;
        storyArcs: StoryArc[];
        topicThreads: TopicThread[];
        sessionHistory: SessionSummary[];
        sharedMemories: SharedMemory[];
        milestones: RelationshipMilestone[];
        totalConversations: number;
        firstConversationDate: number;
    } {
        return {
            userId: this.userId,
            storyArcs: this.storyArcs,
            topicThreads: this.topicThreads,
            sessionHistory: this.sessionHistory,
            sharedMemories: this.sharedMemories,
            milestones: this.milestones,
            totalConversations: this.totalConversations,
            firstConversationDate: this.firstConversationDate,
        };
    }

    /**
     * Import data from persistence.
     */
    import(data: {
        storyArcs?: StoryArc[];
        topicThreads?: TopicThread[];
        sessionHistory?: SessionSummary[];
        sharedMemories?: SharedMemory[];
        milestones?: RelationshipMilestone[];
        totalConversations?: number;
        firstConversationDate?: number;
    }): void {
        if (data.storyArcs) this.storyArcs = data.storyArcs;
        if (data.topicThreads) this.topicThreads = data.topicThreads;
        if (data.sessionHistory) this.sessionHistory = data.sessionHistory;
        if (data.sharedMemories) this.sharedMemories = data.sharedMemories;
        if (data.milestones) this.milestones = data.milestones;
        if (data.totalConversations) this.totalConversations = data.totalConversations;
        if (data.firstConversationDate) this.firstConversationDate = data.firstConversationDate;
    }

    /**
     * Get statistics.
     */
    getStats(): {
        totalConversations: number;
        totalMinutes: number;
        storyArcCount: number;
        sharedMemoryCount: number;
        milestoneCount: number;
        daysSinceFirst: number;
    } {
        return {
            totalConversations: this.totalConversations,
            totalMinutes: this.getTotalConversationTime(),
            storyArcCount: this.storyArcs.length,
            sharedMemoryCount: this.sharedMemories.length,
            milestoneCount: this.milestones.length,
            daysSinceFirst: Math.floor(
                (Date.now() - this.firstConversationDate) / (1000 * 60 * 60 * 24)
            ),
        };
    }
}
