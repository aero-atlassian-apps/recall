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
import { MockChapterGeneratorAdapter } from '../adapters/mocks/MockChapterGeneratorAdapter';

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
export const chapterGenerator = useMocks ? new MockChapterGeneratorAdapter() : new AoTChapterGeneratorAdapter();

// Use Cases
export const createUserUseCase = new CreateUserUseCase(userRepository);
export const startSessionUseCase = new StartSessionUseCase(sessionRepository, userRepository, aiService, vectorStore);
export const processMessageUseCase = new ProcessMessageUseCase(sessionRepository, aiService, vectorStore);
export const generateChapterUseCase = new GenerateChapterUseCase(chapterRepository, sessionRepository, userRepository, aiService, emailService, chapterGenerator);
export const endSessionUseCase = new EndSessionUseCase(sessionRepository, jobRepository);
export const getChaptersUseCase = new GetChaptersUseCase(chapterRepository);
