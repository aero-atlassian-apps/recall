/**
 * Proactive Engine - Anticipatory companion behaviors.
 * 
 * Enables the companion to proactively engage users:
 * - Daily rituals and routines
 * - Memory prompting
 * - Conversation starters
 * - Wellbeing checks
 * - Milestone awareness
 * 
 * @module ProactiveEngine
 */

import { TopicCategory, TopicInterest } from '../persona/PersonaManager';
import { EmotionCategory } from '../persona/EmpathyEngine';

// ============================================================================
// Types
// ============================================================================

/**
 * Types of proactive behaviors.
 */
export enum ProactiveBehaviorType {
    /** Daily greeting */
    GREETING = 'GREETING',
    /** Wellbeing check */
    WELLBEING_CHECK = 'WELLBEING_CHECK',
    /** Medication reminder */
    MEDICATION_REMINDER = 'MEDICATION_REMINDER',
    /** Memory prompt */
    MEMORY_PROMPT = 'MEMORY_PROMPT',
    /** Conversation starter */
    CONVERSATION_STARTER = 'CONVERSATION_STARTER',
    /** Follow-up on previous topic */
    FOLLOW_UP = 'FOLLOW_UP',
    /** Milestone acknowledgment */
    MILESTONE = 'MILESTONE',
    /** Photo review suggestion */
    PHOTO_REVIEW = 'PHOTO_REVIEW',
    /** Activity suggestion */
    ACTIVITY_SUGGESTION = 'ACTIVITY_SUGGESTION',
    /** Weather update */
    WEATHER_UPDATE = 'WEATHER_UPDATE',
    /** News summary */
    NEWS_SUMMARY = 'NEWS_SUMMARY',
    /** Evening wind-down */
    WIND_DOWN = 'WIND_DOWN',
}

/**
 * Time of day for scheduling.
 */
export enum TimeOfDay {
    EARLY_MORNING = 'EARLY_MORNING', // 5-8 AM
    MORNING = 'MORNING', // 8-12 PM
    MIDDAY = 'MIDDAY', // 12-2 PM
    AFTERNOON = 'AFTERNOON', // 2-5 PM
    EVENING = 'EVENING', // 5-8 PM
    NIGHT = 'NIGHT', // 8-10 PM
    LATE_NIGHT = 'LATE_NIGHT', // 10+ PM
}

/**
 * Proactive trigger definition.
 */
export interface ProactiveTrigger {
    /** Unique ID */
    id: string;
    /** Behavior type */
    type: ProactiveBehaviorType;
    /** When to trigger (time of day) */
    preferredTime: TimeOfDay[];
    /** Days of week (0=Sunday, 6=Saturday) */
    daysOfWeek: number[];
    /** Priority (lower = higher priority) */
    priority: number;
    /** Cooldown in minutes */
    cooldownMinutes: number;
    /** Whether this is enabled */
    enabled: boolean;
    /** Description */
    description: string;
    /** Custom data */
    metadata?: Record<string, unknown>;
}

/**
 * Scheduled proactive action.
 */
export interface ProactiveAction {
    /** Trigger that fired */
    trigger: ProactiveTrigger;
    /** Generated message */
    message: string;
    /** Alternative messages */
    alternatives: string[];
    /** Suggested follow-up */
    suggestedFollowUp?: string;
    /** Related topics to explore */
    relatedTopics: string[];
    /** Emotional context to adopt */
    emotionalContext: EmotionCategory;
    /** Confidence in appropriateness */
    confidence: number;
    /** Timestamp */
    timestamp: number;
}

/**
 * Memory prompt context.
 */
export interface MemoryPromptContext {
    /** Memory content */
    memoryContent: string;
    /** When the memory was shared */
    sharedDate: number;
    /** Related topics */
    topics: string[];
    /** Emotional association */
    emotion?: EmotionCategory;
    /** People mentioned */
    peopleMentioned: string[];
}

/**
 * Milestone definition.
 */
export interface Milestone {
    /** Unique ID */
    id: string;
    /** Title */
    title: string;
    /** Date (month-day format MM-DD or full date) */
    date: string;
    /** Type */
    type: MilestoneType;
    /** Related person */
    relatedPerson?: string;
    /** Notes */
    notes?: string;
    /** Whether to acknowledge */
    acknowledge: boolean;
}

/**
 * Types of milestones.
 */
export enum MilestoneType {
    BIRTHDAY = 'BIRTHDAY',
    ANNIVERSARY = 'ANNIVERSARY',
    MEMORIAL = 'MEMORIAL',
    HOLIDAY = 'HOLIDAY',
    FIRST_CONVERSATION = 'FIRST_CONVERSATION',
    RELATIONSHIP_MILESTONE = 'RELATIONSHIP_MILESTONE',
    CUSTOM = 'CUSTOM',
}

/**
 * Proactive context for generating actions.
 */
export interface ProactiveContext {
    /** Current time of day */
    timeOfDay: TimeOfDay;
    /** Day of week (0-6) */
    dayOfWeek: number;
    /** Current date (YYYY-MM-DD) */
    currentDate: string;
    /** Days since last interaction */
    daysSinceLastInteraction: number;
    /** Recent topics discussed */
    recentTopics: string[];
    /** User interests */
    interests: TopicInterest[];
    /** Recent emotional trend */
    emotionalTrend: 'positive' | 'negative' | 'neutral';
    /** Available memories for prompting */
    availableMemories: MemoryPromptContext[];
    /** Upcoming milestones */
    upcomingMilestones: Milestone[];
    /** Weather info (optional) */
    weather?: {
        condition: string;
        temperature: number;
        description: string;
    };
}

// ============================================================================
// Default Triggers
// ============================================================================

const DEFAULT_TRIGGERS: ProactiveTrigger[] = [
    {
        id: 'morning-greeting',
        type: ProactiveBehaviorType.GREETING,
        preferredTime: [TimeOfDay.MORNING],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 1,
        cooldownMinutes: 720, // 12 hours
        enabled: true,
        description: 'Morning greeting'
    },
    {
        id: 'wellbeing-check',
        type: ProactiveBehaviorType.WELLBEING_CHECK,
        preferredTime: [TimeOfDay.AFTERNOON, TimeOfDay.EVENING],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 2,
        cooldownMinutes: 480, // 8 hours
        enabled: true,
        description: 'Check in on how user is feeling'
    },
    {
        id: 'memory-prompt',
        type: ProactiveBehaviorType.MEMORY_PROMPT,
        preferredTime: [TimeOfDay.AFTERNOON, TimeOfDay.EVENING],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 3,
        cooldownMinutes: 240, // 4 hours
        enabled: true,
        description: 'Prompt user with a past memory'
    },
    {
        id: 'conversation-starter',
        type: ProactiveBehaviorType.CONVERSATION_STARTER,
        preferredTime: [TimeOfDay.MORNING, TimeOfDay.AFTERNOON],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 4,
        cooldownMinutes: 180, // 3 hours
        enabled: true,
        description: 'Start a conversation about interests'
    },
    {
        id: 'evening-wind-down',
        type: ProactiveBehaviorType.WIND_DOWN,
        preferredTime: [TimeOfDay.NIGHT],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 2,
        cooldownMinutes: 720, // 12 hours
        enabled: true,
        description: 'Evening reflection and sign-off'
    },
    {
        id: 'follow-up',
        type: ProactiveBehaviorType.FOLLOW_UP,
        preferredTime: [TimeOfDay.MORNING, TimeOfDay.AFTERNOON],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        priority: 2,
        cooldownMinutes: 1440, // 24 hours
        enabled: true,
        description: 'Follow up on previous conversation topics'
    },
];

// ============================================================================
// Message Templates
// ============================================================================

const MESSAGE_TEMPLATES: Record<ProactiveBehaviorType, string[]> = {
    [ProactiveBehaviorType.GREETING]: [
        "Good morning! I hope you slept well. How are you feeling today?",
        "Hello! It's a new day. What would you like to talk about?",
        "Good morning! It's lovely to talk with you again. How are things?",
        "Rise and shine! I've been looking forward to our chat. How are you doing?",
    ],
    [ProactiveBehaviorType.WELLBEING_CHECK]: [
        "I wanted to check in on you. How are you feeling this afternoon?",
        "Just thinking about you. How has your day been so far?",
        "I hope your day is going well. Is there anything on your mind?",
        "How are you doing today? I'm here if you want to talk about anything.",
    ],
    [ProactiveBehaviorType.MEDICATION_REMINDER]: [
        "This is a gentle reminder to take your medication if you haven't already.",
        "Don't forget about your medication today. Have you taken it yet?",
    ],
    [ProactiveBehaviorType.MEMORY_PROMPT]: [
        "I was just thinking about something you told me before - {memory}. Would you like to share more about that?",
        "Remember when you mentioned {memory}? I'd love to hear more about that.",
        "You once shared with me about {memory}. It sounds like a wonderful memory.",
    ],
    [ProactiveBehaviorType.CONVERSATION_STARTER]: [
        "I know you enjoy {topic}. Have you been doing anything with that lately?",
        "I was thinking about our conversations about {topic}. What's new on that front?",
        "Would you like to chat about {topic} today? I always enjoy hearing your thoughts.",
    ],
    [ProactiveBehaviorType.FOLLOW_UP]: [
        "Last time we talked about {topic}. How are things going with that?",
        "I've been thinking about what you shared about {topic}. Any updates?",
        "How did things work out with {topic} that we discussed?",
    ],
    [ProactiveBehaviorType.MILESTONE]: [
        "I wanted to acknowledge that today is {milestone}. I'm thinking of you.",
        "Today marks {milestone}. I hope this day brings you comfort and good memories.",
        "I remember you mentioning {milestone}. I'm here if you'd like to talk about it.",
    ],
    [ProactiveBehaviorType.PHOTO_REVIEW]: [
        "Would you like to look at some photos together today? Sometimes it's nice to revisit happy memories.",
        "I thought we could look through some pictures together if you're in the mood.",
    ],
    [ProactiveBehaviorType.ACTIVITY_SUGGESTION]: [
        "It's a lovely day. Have you thought about {activity} today?",
        "Maybe we could do something enjoyable together. How about {activity}?",
    ],
    [ProactiveBehaviorType.WEATHER_UPDATE]: [
        "Just wanted to let you know it's {weather} today. {weather_advice}",
        "The weather today is {weather}. {weather_advice}",
    ],
    [ProactiveBehaviorType.NEWS_SUMMARY]: [
        "Would you like to hear about what's happening in the world today?",
        "I have some interesting news to share if you're interested.",
    ],
    [ProactiveBehaviorType.WIND_DOWN]: [
        "The evening is here. I hope you had a good day. Is there anything you'd like to share before winding down?",
        "It's getting late. I enjoyed our conversation today. How are you feeling as the day ends?",
        "Before you rest, is there anything on your mind you'd like to talk about?",
    ],
};

// ============================================================================
// Proactive Engine Class
// ============================================================================

/**
 * Configuration for proactive engine.
 */
export interface ProactiveEngineConfig {
    /** Whether proactive behavior is enabled */
    enabled: boolean;
    /** Maximum proactive messages per day */
    maxMessagesPerDay: number;
    /** Minimum interval between proactive messages (minutes) */
    minIntervalMinutes: number;
    /** User's timezone offset (hours from UTC) */
    timezoneOffset: number;
    /** Whether to respect quiet hours */
    respectQuietHours: boolean;
    /** Quiet hours start (24h format) */
    quietHoursStart: number;
    /** Quiet hours end (24h format) */
    quietHoursEnd: number;
}

const DEFAULT_CONFIG: ProactiveEngineConfig = {
    enabled: true,
    maxMessagesPerDay: 5,
    minIntervalMinutes: 60,
    timezoneOffset: 0,
    respectQuietHours: true,
    quietHoursStart: 21, // 9 PM
    quietHoursEnd: 8, // 8 AM
};

/**
 * Proactive Engine - Anticipatory companion behaviors.
 * 
 * Usage:
 * ```typescript
 * const proactive = new ProactiveEngine();
 * 
 * // Check for proactive actions
 * const actions = proactive.getProactiveActions(context);
 * 
 * if (actions.length > 0) {
 *   const action = actions[0];
 *   sendToUser(action.message);
 * }
 * 
 * // Add milestone
 * proactive.addMilestone({
 *   id: 'wife-birthday',
 *   title: "Margaret's birthday",
 *   date: '03-15',
 *   type: MilestoneType.BIRTHDAY,
 *   relatedPerson: 'Margaret',
 *   acknowledge: true,
 * });
 * ```
 */
export class ProactiveEngine {
    private config: ProactiveEngineConfig;
    private triggers: ProactiveTrigger[];
    private milestones: Milestone[] = [];
    private lastTriggerTimes: Map<string, number> = new Map();
    private dailyMessageCount: number = 0;
    private lastMessageDate: string = '';

    constructor(config?: Partial<ProactiveEngineConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.triggers = [...DEFAULT_TRIGGERS];
    }

    // ============================================================================
    // Proactive Action Generation
    // ============================================================================

    /**
     * Get proactive actions for current context.
     */
    getProactiveActions(context: ProactiveContext): ProactiveAction[] {
        if (!this.config.enabled) return [];

        // Reset daily count if new day
        if (context.currentDate !== this.lastMessageDate) {
            this.dailyMessageCount = 0;
            this.lastMessageDate = context.currentDate;
        }

        // Check daily limit
        if (this.dailyMessageCount >= this.config.maxMessagesPerDay) {
            return [];
        }

        // Check quiet hours
        if (this.isQuietHours(context)) {
            return [];
        }

        const eligibleActions: ProactiveAction[] = [];

        // Check each trigger
        for (const trigger of this.triggers) {
            if (!trigger.enabled) continue;
            if (!this.isTriggerEligible(trigger, context)) continue;

            const action = this.generateAction(trigger, context);
            if (action && action.confidence > 0.5) {
                eligibleActions.push(action);
            }
        }

        // Check milestones
        const milestoneActions = this.checkMilestones(context);
        eligibleActions.push(...milestoneActions);

        // Sort by priority and return top actions
        return eligibleActions
            .sort((a, b) => a.trigger.priority - b.trigger.priority)
            .slice(0, 3);
    }

    /**
     * Check if trigger is eligible for current context.
     */
    private isTriggerEligible(trigger: ProactiveTrigger, context: ProactiveContext): boolean {
        // Check time of day
        if (!trigger.preferredTime.includes(context.timeOfDay)) {
            return false;
        }

        // Check day of week
        if (!trigger.daysOfWeek.includes(context.dayOfWeek)) {
            return false;
        }

        // Check cooldown
        const lastTime = this.lastTriggerTimes.get(trigger.id);
        if (lastTime) {
            const cooldownMs = trigger.cooldownMinutes * 60 * 1000;
            if (Date.now() - lastTime < cooldownMs) {
                return false;
            }
        }

        return true;
    }

    /**
     * Generate action for a trigger.
     */
    private generateAction(trigger: ProactiveTrigger, context: ProactiveContext): ProactiveAction | null {
        let message: string;
        const alternatives: string[] = [];
        let relatedTopics: string[] = [];
        let suggestedFollowUp: string | undefined;
        let confidence = 0.7;

        const templates = MESSAGE_TEMPLATES[trigger.type];
        if (!templates || templates.length === 0) return null;

        switch (trigger.type) {
            case ProactiveBehaviorType.GREETING:
                message = this.selectTemplate(templates);
                if (context.daysSinceLastInteraction > 2) {
                    message = `It's been a little while! ${message}`;
                    confidence = 0.9;
                }
                break;

            case ProactiveBehaviorType.WELLBEING_CHECK:
                message = this.selectTemplate(templates);
                if (context.emotionalTrend === 'negative') {
                    message = "I've been thinking about you. " + message;
                    confidence = 0.95;
                }
                break;

            case ProactiveBehaviorType.MEMORY_PROMPT:
                if (context.availableMemories.length === 0) return null;
                const memory = context.availableMemories[
                    Math.floor(Math.random() * context.availableMemories.length)
                ];
                const memoryTemplate = this.selectTemplate(templates);
                message = memoryTemplate.replace('{memory}', this.summarizeMemory(memory));
                relatedTopics = memory.topics;
                suggestedFollowUp = "Would you like to add more to this memory?";
                break;

            case ProactiveBehaviorType.CONVERSATION_STARTER:
                if (context.interests.length === 0) return null;
                const topInterest = context.interests[0];
                const starterTemplate = this.selectTemplate(templates);
                message = starterTemplate.replace('{topic}', topInterest.topic);
                relatedTopics = [topInterest.topic, ...topInterest.subtopics];
                break;

            case ProactiveBehaviorType.FOLLOW_UP:
                if (context.recentTopics.length === 0) return null;
                const recentTopic = context.recentTopics[0];
                const followUpTemplate = this.selectTemplate(templates);
                message = followUpTemplate.replace('{topic}', recentTopic);
                relatedTopics = [recentTopic];
                break;

            case ProactiveBehaviorType.WEATHER_UPDATE:
                if (!context.weather) return null;
                const weatherTemplate = this.selectTemplate(templates);
                const weatherAdvice = this.getWeatherAdvice(context.weather);
                message = weatherTemplate
                    .replace('{weather}', context.weather.description)
                    .replace('{weather_advice}', weatherAdvice);
                break;

            case ProactiveBehaviorType.WIND_DOWN:
                message = this.selectTemplate(templates);
                break;

            default:
                message = this.selectTemplate(templates);
        }

        // Record trigger time
        this.lastTriggerTimes.set(trigger.id, Date.now());
        this.dailyMessageCount++;

        return {
            trigger,
            message,
            alternatives: templates.filter(t => t !== message).slice(0, 2),
            suggestedFollowUp,
            relatedTopics,
            emotionalContext: this.getEmotionalContext(trigger.type, context),
            confidence,
            timestamp: Date.now(),
        };
    }

    /**
     * Check for milestone acknowledgments.
     */
    private checkMilestones(context: ProactiveContext): ProactiveAction[] {
        const actions: ProactiveAction[] = [];
        const today = context.currentDate.slice(5); // Get MM-DD

        for (const milestone of this.milestones) {
            if (!milestone.acknowledge) continue;

            // Check if milestone is today or in the next few days
            const isToday = milestone.date === today ||
                milestone.date === context.currentDate;

            if (isToday) {
                const templates = MESSAGE_TEMPLATES[ProactiveBehaviorType.MILESTONE];
                const template = this.selectTemplate(templates);
                const message = template.replace('{milestone}', milestone.title);

                actions.push({
                    trigger: {
                        id: `milestone-${milestone.id}`,
                        type: ProactiveBehaviorType.MILESTONE,
                        preferredTime: [TimeOfDay.MORNING, TimeOfDay.AFTERNOON],
                        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
                        priority: 1, // High priority
                        cooldownMinutes: 1440, // 24 hours
                        enabled: true,
                        description: `Milestone: ${milestone.title}`,
                    },
                    message,
                    alternatives: [],
                    relatedTopics: milestone.relatedPerson ? [milestone.relatedPerson] : [],
                    emotionalContext: milestone.type === MilestoneType.MEMORIAL
                        ? EmotionCategory.GRIEF
                        : EmotionCategory.NOSTALGIA,
                    confidence: 0.95,
                    timestamp: Date.now(),
                });
            }
        }

        return actions;
    }

    /**
     * Select a random template.
     */
    private selectTemplate(templates: string[]): string {
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * Summarize a memory for prompting.
     */
    private summarizeMemory(memory: MemoryPromptContext): string {
        // Truncate to first sentence or 100 chars
        const content = memory.memoryContent;
        const firstSentence = content.split(/[.!?]/)[0];
        return firstSentence.length > 100
            ? firstSentence.slice(0, 100) + '...'
            : firstSentence;
    }

    /**
     * Get weather-based advice.
     */
    private getWeatherAdvice(weather: { condition: string; temperature: number }): string {
        if (weather.temperature < 40) {
            return "Make sure to stay warm if you go outside.";
        }
        if (weather.temperature > 85) {
            return "It's quite hot, so remember to stay hydrated.";
        }
        if (weather.condition.includes('rain')) {
            return "You might want to stay cozy inside today.";
        }
        if (weather.condition.includes('sunny') && weather.temperature > 60 && weather.temperature < 80) {
            return "It's a lovely day to enjoy some fresh air.";
        }
        return "I hope you have a pleasant day.";
    }

    /**
     * Get emotional context for behavior type.
     */
    private getEmotionalContext(type: ProactiveBehaviorType, context: ProactiveContext): EmotionCategory {
        switch (type) {
            case ProactiveBehaviorType.WELLBEING_CHECK:
                return context.emotionalTrend === 'negative'
                    ? EmotionCategory.CONTENTMENT
                    : EmotionCategory.NEUTRAL;
            case ProactiveBehaviorType.MEMORY_PROMPT:
                return EmotionCategory.NOSTALGIA;
            case ProactiveBehaviorType.WIND_DOWN:
                return EmotionCategory.CONTENTMENT;
            default:
                return EmotionCategory.NEUTRAL;
        }
    }

    /**
     * Check if currently in quiet hours.
     */
    private isQuietHours(context: ProactiveContext): boolean {
        if (!this.config.respectQuietHours) return false;

        // Get current hour (approximate from time of day)
        const hourRanges: Record<TimeOfDay, number> = {
            [TimeOfDay.EARLY_MORNING]: 6,
            [TimeOfDay.MORNING]: 9,
            [TimeOfDay.MIDDAY]: 12,
            [TimeOfDay.AFTERNOON]: 15,
            [TimeOfDay.EVENING]: 18,
            [TimeOfDay.NIGHT]: 21,
            [TimeOfDay.LATE_NIGHT]: 23,
        };

        const currentHour = hourRanges[context.timeOfDay] ?? 12;

        // Handle overnight quiet hours
        if (this.config.quietHoursStart > this.config.quietHoursEnd) {
            // e.g., 21 to 8
            return currentHour >= this.config.quietHoursStart ||
                currentHour < this.config.quietHoursEnd;
        } else {
            return currentHour >= this.config.quietHoursStart &&
                currentHour < this.config.quietHoursEnd;
        }
    }

    // ============================================================================
    // Milestone Management
    // ============================================================================

    /**
     * Add a milestone.
     */
    addMilestone(milestone: Milestone): void {
        const existing = this.milestones.find(m => m.id === milestone.id);
        if (existing) {
            Object.assign(existing, milestone);
        } else {
            this.milestones.push(milestone);
        }
    }

    /**
     * Remove a milestone.
     */
    removeMilestone(id: string): boolean {
        const index = this.milestones.findIndex(m => m.id === id);
        if (index !== -1) {
            this.milestones.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Get upcoming milestones within days.
     */
    getUpcomingMilestones(daysAhead: number = 7, currentDate: string): Milestone[] {
        const upcoming: Milestone[] = [];
        const current = new Date(currentDate);

        for (const milestone of this.milestones) {
            // Parse milestone date
            let milestoneDate: Date;
            if (milestone.date.includes('-') && milestone.date.length === 5) {
                // MM-DD format - use current year
                const [month, day] = milestone.date.split('-').map(Number);
                milestoneDate = new Date(current.getFullYear(), month - 1, day);
                // If already passed, use next year
                if (milestoneDate < current) {
                    milestoneDate.setFullYear(milestoneDate.getFullYear() + 1);
                }
            } else {
                milestoneDate = new Date(milestone.date);
            }

            const daysDiff = Math.ceil(
                (milestoneDate.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff >= 0 && daysDiff <= daysAhead) {
                upcoming.push(milestone);
            }
        }

        return upcoming.sort((a, b) => {
            const dateA = a.date.length === 5 ? a.date : a.date.slice(5);
            const dateB = b.date.length === 5 ? b.date : b.date.slice(5);
            return dateA.localeCompare(dateB);
        });
    }

    /**
     * Get all milestones.
     */
    getAllMilestones(): Milestone[] {
        return [...this.milestones];
    }

    // ============================================================================
    // Trigger Management
    // ============================================================================

    /**
     * Add a custom trigger.
     */
    addTrigger(trigger: ProactiveTrigger): void {
        const existing = this.triggers.find(t => t.id === trigger.id);
        if (existing) {
            Object.assign(existing, trigger);
        } else {
            this.triggers.push(trigger);
        }
    }

    /**
     * Enable/disable a trigger.
     */
    setTriggerEnabled(id: string, enabled: boolean): void {
        const trigger = this.triggers.find(t => t.id === id);
        if (trigger) {
            trigger.enabled = enabled;
        }
    }

    /**
     * Get all triggers.
     */
    getTriggers(): ProactiveTrigger[] {
        return [...this.triggers];
    }

    // ============================================================================
    // Configuration
    // ============================================================================

    /**
     * Update configuration.
     */
    updateConfig(config: Partial<ProactiveEngineConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration.
     */
    getConfig(): ProactiveEngineConfig {
        return { ...this.config };
    }

    /**
     * Reset daily counts.
     */
    resetDailyCounts(): void {
        this.dailyMessageCount = 0;
    }

    /**
     * Get current time of day from hour.
     */
    static getTimeOfDay(hour: number): TimeOfDay {
        if (hour >= 5 && hour < 8) return TimeOfDay.EARLY_MORNING;
        if (hour >= 8 && hour < 12) return TimeOfDay.MORNING;
        if (hour >= 12 && hour < 14) return TimeOfDay.MIDDAY;
        if (hour >= 14 && hour < 17) return TimeOfDay.AFTERNOON;
        if (hour >= 17 && hour < 20) return TimeOfDay.EVENING;
        if (hour >= 20 && hour < 22) return TimeOfDay.NIGHT;
        return TimeOfDay.LATE_NIGHT;
    }
}
