export interface TTSChunk {
    text: string;
    index: number;
    isLast: boolean;
}

export class TTSChunker {
    private minLength: number;

    constructor(minLength: number = 20) {
        this.minLength = minLength;
    }

    /**
     * Splits text into semantic chunks suitable for TTS streaming.
     */
    public chunkText(text: string): TTSChunk[] {
        if (!text) return [];

        // Simple splitting by sentence boundaries.
        // A robust implementation would use a proper NLP tokenizer, 
        // but regex is sufficient for MVP.
        // Look for periods, question marks, exclamations followed by space or end of string.
        const rawSentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);

        if (!rawSentences) {
            return [{ text: text, index: 0, isLast: true }];
        }

        const chunks: string[] = [];
        let currentBuffer = '';

        for (const sentence of rawSentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;

            if (currentBuffer.length + trimmed.length < this.minLength) {
                // Determine spacer
                const spacer = currentBuffer ? ' ' : '';
                currentBuffer += spacer + trimmed;
            } else {
                if (currentBuffer) {
                    chunks.push(currentBuffer);
                }
                currentBuffer = trimmed;
            }
        }

        if (currentBuffer) {
            chunks.push(currentBuffer);
        }

        return chunks.map((c, i) => ({
            text: c,
            index: i,
            isLast: i === chunks.length - 1
        }));
    }
}
