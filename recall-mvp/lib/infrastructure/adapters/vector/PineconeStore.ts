import { VectorStorePort, VectorMatch } from '../../../core/application/ports/VectorStorePort';
import { Pinecone } from '@pinecone-database/pinecone';
import { EmbeddingPort } from '../../../core/application/ports/EmbeddingPort';

/**
 * Adapter for Pinecone Vector Database.
 */
export class PineconeStore implements VectorStorePort {
    private pinecone: Pinecone;
    private indexName: string = 'recall-memories';
    private isMock: boolean;

    constructor(private embeddingPort: EmbeddingPort) {
        const pineconeKey = process.env.PINECONE_API_KEY;

        if (!pineconeKey) {
            console.warn("PineconeStore: Missing PINECONE_API_KEY. Running in MOCK mode.");
            this.isMock = true;
        } else {
            this.isMock = false;
        }

        this.pinecone = new Pinecone({
            apiKey: pineconeKey || 'mock-key',
        });
    }

    async upsert(id: string, vector: number[], metadata: Record<string, any>): Promise<void> {
        if (this.isMock) return;

        try {
            const index = this.pinecone.index(this.indexName);
            await index.upsert([{
                id,
                values: vector,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString()
                }
            }]);
        } catch (error) {
            console.error('[PineconeStore] Error upserting vector:', error);
            throw error;
        }
    }

    async query(vector: number[], topK: number, filter?: Record<string, any>): Promise<VectorMatch[]> {
        if (this.isMock) {
            console.log('[PineconeStore] Mock query returning empty results');
            return [];
        }

        try {
            const index = this.pinecone.index(this.indexName);
            const queryResponse = await index.query({
                vector,
                topK,
                filter,
                includeMetadata: true
            });

            return queryResponse.matches.map(match => ({
                id: match.id,
                score: match.score || 0,
                metadata: (match.metadata as Record<string, any>) || {}
            }));
        } catch (error) {
            console.error('[PineconeStore] Error querying vector store:', error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        if (this.isMock) return;

        try {
            const index = this.pinecone.index(this.indexName);
            await index.deleteOne(id);
        } catch (error) {
            console.error('[PineconeStore] Error deleting vector:', error);
            throw error;
        }
    }

    async clear(userId: string): Promise<void> {
        if (this.isMock) return;

        try {
            const index = this.pinecone.index(this.indexName);
            // Pinecone supports filtering on delete in newer versions/tiers
            // Otherwise we might need to query and delete by ID
            await index.deleteMany({ userId });
        } catch (error) {
            console.error('[PineconeStore] Error clearing user vectors:', error);
            throw error;
        }
    }
}
