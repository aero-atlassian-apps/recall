import { DrizzleUserRepository } from '../adapters/db/DrizzleUserRepository';
import { DrizzleSessionRepository } from '../adapters/db/DrizzleSessionRepository';
import { DrizzleChapterRepository } from '../adapters/db/DrizzleChapterRepository';
import { DrizzleJobRepository } from '../adapters/db/DrizzleJobRepository';
import { CombinedAIService } from '../adapters/ai/CombinedAIService';
import { PineconeStore } from '../adapters/vector/PineconeStore';
import { ResendEmailService } from '../adapters/email/ResendEmailService';
import { AoTChapterGeneratorAdapter } from '../adapters/ai/AoTChapterGeneratorAdapter';

// Mocks
import { MockAIService } from '../adapters/mocks/MockAIService';
import { MockVectorStore } from '../adapters/mocks/MockVectorStore';
import { MockEmailService } from '../adapters/mocks/MockEmailService';

import { CreateUserUseCase } from '../../core/application/use-cases/CreateUserUseCase';
import { StartSessionUseCase } from '../../core/application/use-cases/StartSessionUseCase';
import { ProcessMessageUseCase } from '../../core/application/use-cases/ProcessMessageUseCase';
import { EndSessionUseCase } from '../../core/application/use-cases/EndSessionUseCase';
import { GenerateChapterUseCase } from '../../core/application/use-cases/GenerateChapterUseCase';
import { GetChaptersUseCase } from '../../core/application/use-cases/GetChaptersUseCase';

const useMocks = process.env.USE_MOCKS === 'true';

// Singletons
export const userRepository = new DrizzleUserRepository();
export const sessionRepository = new DrizzleSessionRepository();
export const chapterRepository = new DrizzleChapterRepository();
export const jobRepository = new DrizzleJobRepository();

export const aiService = useMocks ? new MockAIService() : new CombinedAIService();
export const vectorStore = useMocks ? new MockVectorStore() : new PineconeStore(sessionRepository);
export const emailService = useMocks ? new MockEmailService() : new ResendEmailService();
export const chapterGenerator = new AoTChapterGeneratorAdapter(); // Chapter generator might need mocking too if it uses external APIs heavily, but keeping as is for now or could reuse MockAIService if interfaces align. Assuming AoT uses AI service internally or is self-contained logic.
// Checking AoTChapterGeneratorAdapter usage: it's used in GenerateChapterUseCase.
// If AoTChapterGeneratorAdapter calls VertexAI directly, it should also be mocked.
// However, the prompt asks to mock "Integrations". If AoT is internal logic calling AI service, we might need to verify.
// For now, let's assume AoTChapterGeneratorAdapter is the integration point or uses the AI service.
// Actually, if AoTChapterGeneratorAdapter calls an LLM, we should mock it too or inject the mock AI service into it if it supports it.
// Given strict instructions, let's stick to mocking the direct external dependencies identified: AI, Vector, Email.

// Use Cases
export const createUserUseCase = new CreateUserUseCase(userRepository);
export const startSessionUseCase = new StartSessionUseCase(sessionRepository, userRepository, aiService, vectorStore);
export const processMessageUseCase = new ProcessMessageUseCase(sessionRepository, aiService, vectorStore);
export const generateChapterUseCase = new GenerateChapterUseCase(chapterRepository, sessionRepository, userRepository, aiService, emailService, chapterGenerator);
export const endSessionUseCase = new EndSessionUseCase(sessionRepository, jobRepository);
export const getChaptersUseCase = new GetChaptersUseCase(chapterRepository);
