import { SessionRepository } from '../../domain/repositories/SessionRepository';
import { JobRepository } from '../../domain/repositories/JobRepository';
import { GenerateChapterUseCase } from './GenerateChapterUseCase';

export class EndSessionUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private jobRepository: JobRepository,
    private generateChapterUseCase?: GenerateChapterUseCase
  ) { }

  async execute(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');

    // Use transaction to update status
    await this.sessionRepository.completeSessionTransaction(sessionId);

    // In development mode, generate chapter immediately (cron jobs don't run in Docker)
    // In production, queue background job for chapter generation
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev && this.generateChapterUseCase) {
      try {
        console.log('[EndSession] Dev mode: generating chapter inline for session', sessionId);
        await this.generateChapterUseCase.execute(sessionId);
        console.log('[EndSession] Chapter generated successfully');
      } catch (err) {
        console.error('[EndSession] Failed to generate chapter inline:', err);
        // Fall back to queuing
        await this.jobRepository.create('generate_chapter', { sessionId });
      }
    } else {
      // Queue background job for chapter generation
      // This decouples the heavy LLM process from the user interaction loop
      await this.jobRepository.create('generate_chapter', { sessionId });
    }
  }
}
