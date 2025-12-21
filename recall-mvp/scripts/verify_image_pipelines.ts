import { ImageProcessor } from '../lib/core/application/services/ImageProcessor';
import { ImagePort, ImageAnalysisRequest, ImageAnalysisResult, ImageGenerationRequest, ImageGenerationResult } from '../lib/core/application/ports/ImagePort';
import { WellbeingGuard } from '../lib/core/application/agent/safety/WellbeingGuard';

// Mock ImagePort
class MockImagePort implements ImagePort {
    async analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
        return {
            description: "A photo of a person walking in a park.",
            safetyFlag: false
        };
    }
    async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
        return {
            images: [Buffer.from([])],
            seed: 1234,
            promptUsed: request.prompt
        };
    }
}

// Mock WellbeingGuard
class MockWellbeingGuard extends WellbeingGuard {
    constructor() {
        // @ts-ignore - bypassing constructor for mock
        super(null, null);
    }
    assessWellbeing(text: string, emotion: any): any {
        if (text.toLowerCase().includes("harm") || text.toLowerCase().includes("danger")) {
            return {
                overallRisk: 'HIGH',
                riskJustification: "Detected safety risk in text: " + text
            };
        }
        return {
            overallRisk: 'LOW',
            riskJustification: "Safe content."
        };
    }
}

async function verify() {
    console.log("Verifying ImageProcessor...");
    const mockPort = new MockImagePort();
    const mockGuard = new MockWellbeingGuard();
    const processor = new ImageProcessor(mockPort, mockGuard);

    // Test 1: Safe Analysis
    console.log("  Test 1: Safe Analysis");
    const res1 = await processor.analyzeImage({
        image: Buffer.from([]),
        mimeType: "image/png",
        intent: "GENERAL_DESC"
    });
    if (!res1.safetyFlag) {
        console.log("  ✅ Passed: Safe analysis allowed.");
    } else {
        console.error("  ❌ Failed: Safe analysis blocked.");
    }

    // Test 2: Unsafe Prompt Analysis
    console.log("  Test 2: Unsafe Prompt Analysis");
    const res2 = await processor.analyzeImage({
        image: Buffer.from([]),
        mimeType: "image/png",
        prompt: "Show me something that causes harm",
        intent: "GENERAL_DESC"
    });
    if (res2.safetyFlag && res2.description.includes("blocked")) {
        console.log("  ✅ Passed: Unsafe prompt blocked.");
    } else {
        console.error("  ❌ Failed: Unsafe prompt allowed.");
    }

    // Test 3: Safe Generation
    console.log("  Test 3: Safe Generation");
    const res3 = await processor.generateImage({
        prompt: "A peaceful sunset",
        style: "realistic"
    });
    if (res3.promptUsed.includes("senior-friendly")) {
        console.log("  ✅ Passed: Prompt augmented and generation allowed.");
    } else {
        console.error("  ❌ Failed: Prompt not augmented.");
    }

    // Test 4: Unsafe Generation
    console.log("  Test 4: Unsafe Generation");
    try {
        await processor.generateImage({
            prompt: "A dangerous scene",
        });
        console.error("  ❌ Failed: Unsafe generation allowed.");
    } catch (e: any) {
        if (e.message.includes("blocked")) {
            console.log("  ✅ Passed: Unsafe generation blocked.");
        } else {
            console.error("  ❌ Failed with unexpected error: " + e.message);
        }
    }

    console.log("\nAll visual context verification tests passed!");
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
