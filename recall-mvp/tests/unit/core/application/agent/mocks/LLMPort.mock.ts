import { LLMPort } from '../../../../../../lib/core/application/ports/LLMPort';

export class MockLLM implements LLMPort {
    async generateText(prompt: string): Promise<string> {
        return 'Mock LLM Response';
    }

    async generateJson<T>(prompt: string, schema?: any): Promise<T> {
        if (prompt.includes('OUTPUT JSON:')) {
            return {
                dimensions: { empathy: 0.9, safety: 1.0, correctness: 0.8, efficiency: 0.7 },
                overallScore: 0.85,
                feedback: 'Good interaction',
                passed: true
            } as unknown as T;
        }
        return {} as T;
    }

    async analyzeImage(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
        return 'Mock image analysis result';
    }
}
