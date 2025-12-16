import { VectorStorePort } from '../../../core/application/ports/VectorStorePort';

export class MockVectorStore implements VectorStorePort {
  async storeConversation(sessionId: string, transcript: string, userId: string): Promise<void> {
    console.log(`[MockVectorStore] Stored conversation for session ${sessionId}`);
  }

  async storeMemoryChunk(userId: string, sessionId: string, text: string, metadata: any): Promise<void> {
    console.log(`[MockVectorStore] Stored memory chunk for user ${userId}`);
  }

  async retrieveContext(userId: string, currentTopic?: string): Promise<any[]> {
    return [
      { text: "Mock memory context 1", metadata: { type: "generic" } },
      { text: "Mock memory context 2", metadata: { type: "generic" } },
    ];
  }
}
