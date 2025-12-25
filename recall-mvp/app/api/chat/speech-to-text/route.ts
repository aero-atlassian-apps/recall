import { NextRequest, NextResponse } from 'next/server';
import { speechProvider } from '@/lib/infrastructure/di/container';
import { getAudioConverter } from '@/lib/infrastructure/services/AudioConverter';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);
        let contentType = file.type || 'audio/wav';

        // Convert WebM/Opus to WAV for universal STT compatibility
        // Most STT APIs work best with WAV format at 16kHz mono
        if (contentType.includes('webm') || contentType.includes('opus')) {
            try {
                const audioConverter = getAudioConverter();
                const isAvailable = await audioConverter.isAvailable();

                if (isAvailable) {
                    const converted = await audioConverter.convert(buffer, contentType, {
                        targetFormat: 'wav',
                        sampleRate: 16000,
                        channels: 1
                    });
                    // Copy to a new Buffer to avoid type issues with ArrayBufferLike
                    const convertedData = new Uint8Array(converted.buffer);
                    buffer = Buffer.from(convertedData);
                    contentType = converted.format;
                    console.log('[STT] Audio converted to WAV for STT compatibility');
                } else {
                    console.warn('[STT] FFmpeg not available, sending original format');
                }
            } catch (conversionError: any) {
                console.warn('[STT] Audio conversion failed, trying original format:', conversionError.message);
                // Continue with original format - some APIs might still accept it
            }
        }

        const result = await speechProvider.speechToText(buffer, contentType);
        // Return only the text string, not the full SpeechToTextResult object
        // This prevents "Objects are not valid as React child" errors
        return NextResponse.json({ text: result.text });

    } catch (error: any) {
        console.error("STT failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
