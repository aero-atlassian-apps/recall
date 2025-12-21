import { ImagePort, ImageAnalysisRequest, ImageAnalysisResult, ImageGenerationRequest, ImageGenerationResult } from '../ports/ImagePort';
import { WellbeingGuard } from '../agent/safety/WellbeingGuard';
import { RiskSeverity } from '../agent/safety/WellbeingGuard';

export class ImageProcessor {
    constructor(
        private imagePort: ImagePort,
        private wellbeingGuard: WellbeingGuard
    ) { }

    /**
     * Analyzes an image while ensuring safety and senior-specific context.
     */
    async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
        // Simple safety check on the prompt if provided
        if (request.prompt) {
            const safetyAssessment = this.wellbeingGuard.assessWellbeing(request.prompt, {
                primaryEmotion: 'neutral',
                confidence: 1.0,
                intensity: 0.5,
                triggers: []
            });

            if (safetyAssessment.overallRisk === RiskSeverity.HIGH || safetyAssessment.overallRisk === RiskSeverity.CRITICAL) {
                return {
                    description: "Analysis blocked due to safety concerns.",
                    safetyFlag: true,
                    safetyReason: safetyAssessment.riskJustification
                };
            }
        }

        const result = await this.imagePort.analyzeImage(request);

        // Post-analysis safety check on the description
        if (result.description) {
            const descriptionAssessment = this.wellbeingGuard.assessWellbeing(result.description, {
                primaryEmotion: 'neutral',
                confidence: 1.0,
                intensity: 0.5,
                triggers: []
            });

            if (descriptionAssessment.overallRisk === RiskSeverity.HIGH || descriptionAssessment.overallRisk === RiskSeverity.CRITICAL) {
                return {
                    ...result,
                    description: "Content flagged as potentially harmful or distressing.",
                    safetyFlag: true,
                    safetyReason: "Visual content safety violation detected."
                };
            }
        }

        return result;
    }

    /**
     * Generates an image with semantic intent handling and reproducibility.
     */
    async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        // Safety check on generation prompt
        const safetyAssessment = this.wellbeingGuard.assessWellbeing(request.prompt, {
            primaryEmotion: 'neutral',
            confidence: 1.0,
            intensity: 0.5,
            triggers: []
        });

        if (safetyAssessment.overallRisk === RiskSeverity.HIGH || safetyAssessment.overallRisk === RiskSeverity.CRITICAL) {
            throw new Error(`Image generation blocked: ${safetyAssessment.riskJustification}`);
        }

        // Augment prompt with senior-friendly style constraints if not strictly defined
        let augmentedPrompt = request.prompt;
        if (request.style === 'realistic' && !augmentedPrompt.toLowerCase().includes('clear') && !augmentedPrompt.toLowerCase().includes('simple')) {
            augmentedPrompt += ", high contrast, clear focus, simple background, senior-friendly aesthetic";
        }

        const result = await this.imagePort.generateImage({
            ...request,
            prompt: augmentedPrompt
        });

        return {
            ...result,
            promptUsed: augmentedPrompt
        };
    }
}
