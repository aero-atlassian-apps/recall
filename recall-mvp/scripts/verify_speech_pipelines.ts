import { SpeechProcessor } from '../lib/core/application/services/SpeechProcessor';
import { TTSChunker } from '../lib/core/application/services/TTSChunker';
import { SpeechToTextResult } from '../lib/core/application/ports/SpeechPort';

async function verify() {
    console.log("Verifying SpeechProcessor...");
    const processor = new SpeechProcessor();

    // Test 1: Formatting
    const input1: SpeechToTextResult = {
        text: "Hello.",
        confidence: 0.9,
        segments: [
            { text: "Hello.", confidence: 0.9, speakerId: "spk_0", startTime: 0, endTime: 1 }
        ]
    };
    const res1 = processor.processInput(input1);
    if (res1 === "[spk_0]: Hello.") {
        console.log("  ✅ Test 1 Passed: Formatting");
    } else {
        console.error(`  ❌ Test 1 Failed: Expected '[spk_0]: Hello.', got '${res1}'`);
        process.exit(1);
    }

    // Test 2: Low Confidence
    const input2: SpeechToTextResult = {
        text: "Mumble.",
        confidence: 0.3,
        segments: [
            { text: "Mumble.", confidence: 0.3, speakerId: "spk_0", startTime: 0, endTime: 1 }
        ]
    };
    const res2 = processor.processInput(input2);
    if (res2 === "[spk_0]: [UNINTELLIGIBLE]") {
        console.log("  ✅ Test 2 Passed: Low Confidence");
    } else {
        console.error(`  ❌ Test 2 Failed: Expected '[spk_0]: [UNINTELLIGIBLE]', got '${res2}'`);
        process.exit(1);
    }

    console.log("\nVerifying TTSChunker...");
    const chunker = new TTSChunker(10);

    // Test 3: Chunking
    const text3 = "Hello world. This is a test.";
    const chunks3 = chunker.chunkText(text3);
    if (chunks3.length === 2 && chunks3[0].text === "Hello world.") {
        console.log("  ✅ Test 3 Passed: Simple Chunking");
    } else {
        console.error(`  ❌ Test 3 Failed: Length ${chunks3.length}, First chunk: '${chunks3[0]?.text}'`);
        process.exit(1);
    }

    console.log("\nAll verification tests passed!");
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
