import { redisService } from '../../../../infrastructure/services/RedisService';

export class SessionContinuityManager {
    constructor(private userId: string) { }

    async startSession(sessionId: string): Promise<void> {
        console.log(`[SessionContinuity] Started session ${sessionId} for user ${this.userId}`);
        // Store session start in Redis
        const key = `recall:session:${this.userId}:${sessionId}`;
        await redisService.set(key, JSON.stringify({ startTime: Date.now(), active: true }), 3600 * 24); // 24h TTL

        // Update active session pointer
        await redisService.set(`recall:user:${this.userId}:activeSession`, sessionId, 3600 * 24);
    }

    async trackTopicDiscussion(topic: string): Promise<void> {
        console.log(`[SessionContinuity] Discussed topic: ${topic}`);
        // Add to set of discussed topics via raw client for Set operations
        const client = redisService.getClient();
        if (client) {
            const key = `recall:user:${this.userId}:topics`;
            try {
                await client.sadd(key, topic);
                await client.expire(key, 3600 * 24 * 30); // 30 days retention
            } catch (e) {
                console.error('[SessionContinuity] Failed to track topic', e);
            }
        }
    }
}
