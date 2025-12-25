import { SpeechPort, SpeechToTextResult, SpeechOptions } from '../../../core/application/ports/SpeechPort';
import { VoiceAgentPort } from '../../../core/application/ports/VoiceAgentPort';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { OpenAI } from 'openai';
import { Readable } from 'stream';
import { normalizeSpeech } from '../../../core/application/services/SpeechNormalizer';

/**
 * ElevenLabs Adapter - Production speech synthesis and recognition.
 * 
 * Configuration:
 * - ELEVENLABS_API_KEY: Required for TTS
 * - ELEVENLABS_VOICE_ID: Voice ID for TTS
 * - ELEVENLABS_AGENT_ID: Agent ID for conversations
 * - OPENAI_API_KEY: Required for STT (Whisper)
 * 
 * @module ElevenLabsAdapter
 */
export class ElevenLabsAdapter implements SpeechPort, VoiceAgentPort {
    private client: ElevenLabsClient;
    private openai: OpenAI | null = null;
    private sttFallback: SpeechPort | null = null;

    constructor(sttFallback?: SpeechPort) {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) {
            throw new Error('ElevenLabsAdapter: ELEVENLABS_API_KEY is required');
        }

        this.client = new ElevenLabsClient({ apiKey });

        if (sttFallback) {
            this.sttFallback = sttFallback;
        }

        if (process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
                dangerouslyAllowBrowser: process.env.NODE_ENV === 'test'
            });
        }
    }

    async textToSpeech(text: string, options?: SpeechOptions): Promise<Buffer> {
        try {
            const style = options?.style;
            const stability = style === 'emotional' ? 0.35 : 0.7;
            const response = await this.client.textToSpeech.convert(
                process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
                {
                    text,
                    model_id: 'eleven_turbo_v2_5',
                    voice_settings: { stability, similarity_boost: 0.75 }
                } as any
            );
            const chunks: Buffer[] = [];
            for await (const chunk of (response as any)) {
                chunks.push(Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        } catch (error) {
            console.error('ElevenLabs TTS failed', error);
            throw error;
        }
    }

    async speechToText(audioBuffer: Buffer, contentType: string): Promise<SpeechToTextResult> {
        // 1. Try OpenAI Whisper if configured
        if (this.openai) {
            try {
                const file = await this.bufferToFile(audioBuffer, 'audio.webm', contentType);
                const transcription = await this.openai.audio.transcriptions.create({
                    file: file,
                    model: "whisper-1",
                    response_format: "verbose_json"
                }) as any;

                return {
                    text: transcription.text,
                    confidence: 0.95,
                    normalizedText: normalizeSpeech(transcription.text),
                    segments: []
                };
            } catch (e) {
                console.warn('ElevenLabsAdapter: OpenAI Whisper failed, trying fallback.', e);
            }
        }

        // 2. Use injected fallback STT provider
        if (this.sttFallback) {
            try {
                return await this.sttFallback.speechToText(audioBuffer, contentType);
            } catch (e) {
                console.error('ElevenLabsAdapter: STT fallback failed', e);
            }
        }

        throw new Error('Speech to text failed: No working provider available');
    }

    private async bufferToFile(buffer: Buffer, filename: string, _contentType: string): Promise<any> {
        return Object.assign(Readable.from(buffer), {
            path: filename,
            name: filename,
            lastModified: Date.now()
        });
    }

    async startConversation(
        userId: string,
        sessionId: string,
        userName: string,
        context: { goal: string; memories: any[]; imageContext?: string }
    ): Promise<{ agentId: string; conversationId: string; wsUrl?: string }> {
        const agentId = process.env.ELEVENLABS_AGENT_ID;
        if (!agentId) {
            throw new Error('ElevenLabsAdapter: ELEVENLABS_AGENT_ID is required for conversations');
        }

        try {
            const conversation = await (this.client as any).conversationalAi.createConversation({
                agent_id: agentId,
                conversation_config_override: {
                    agent: {
                        prompt: {
                            first_message: `Hi ${userName}, I'm Recall. ${context.goal}`
                        }
                    }
                },
                dynamic_variables: {
                    user_name: userName,
                    session_goal: context.goal
                }
            });
            return {
                agentId: conversation.agent_id,
                conversationId: conversation.conversation_id
            };
        } catch (error) {
            console.error('ElevenLabs startConversation failed', error);
            throw error;
        }
    }
}
