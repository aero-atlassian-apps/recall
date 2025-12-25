'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { AudioPipeline } from '@/lib/audio/AudioPipeline';
import { AuthGuard } from '@/components/common/AuthGuard';
import { useStreamingChat } from '@/lib/stores/useStreamingChat';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Image from 'next/image';

export default function ActiveConversationPage() {
  const router = useRouter();
  const params = useParams();
  const [sessionId, setSessionId] = useState<string | null>(params?.id as string || null);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<{ text: string, isAI: boolean }[]>([]);

  const [inputValue, setInputValue] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string>('');

  // Streaming Hook
  const {
    agentState,
    sendMessage: sendStreamingMessage,
  } = useStreamingChat({
    onToken: (token, fullText) => {
      setStreamingResponse(fullText);
    },
    onComplete: (response) => {
      if (response.text) {
        setTranscript(prev => [...prev, { text: response.text, isAI: true }]);
      }
      setStreamingResponse('');
    },
    onError: (error) => {
      setToastMessage(error);
      setStreamingResponse('');
    },
  });

  // Audio Pipeline
  const audioPipeline = useRef<AudioPipeline | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, streamingResponse]);

  // Initialize Session
  useEffect(() => {
    const createSession = async () => {
      if (sessionId) return;
      try {
        const res = await fetch('/api/sessions/start', { method: 'POST', body: JSON.stringify({}) });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data.sessionId);
        }
      } catch (err) { console.error("Session init error", err); }
    };
    createSession();
  }, [sessionId]);

  // Initial Greeting & Audio Init
  useEffect(() => {
    if (!sessionId) return;
    if (transcript.length === 0) {
      sendStreamingMessage(sessionId, '__init__').catch(() => {
        setTranscript([{ text: "Welcome back, Sarah! Let's capture a new memory. Can you tell me about a favorite family holiday tradition?", isAI: true }]);
      });
    }
    audioPipeline.current = new AudioPipeline();
    audioPipeline.current.onSpeechStart = () => setIsListening(true);
    audioPipeline.current.onSpeechEnd = async (blob) => {
      setIsListening(false);
      await sendAudio(blob);
    };
    audioPipeline.current.onError = (err) => {
      setIsListening(false);
      setToastMessage("Audio Error");
    };
    return () => { audioPipeline.current?.stop(); };
  }, [sessionId]);

  const sendAudio = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob);
      const res = await fetch('/api/chat/speech-to-text', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setTranscript(prev => [...prev, { text: data.text, isAI: false }]);
          await sendStreamingMessage(sessionId!, data.text);
        }
      }
    } catch (e) { console.error(e); }
  };

  const toggleListening = async () => {
    if (!audioPipeline.current) return;
    if (isListening) {
      audioPipeline.current.stop();
      setIsListening(false);
    } else {
      await audioPipeline.current.initialize();
      await audioPipeline.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;
    const text = inputValue;
    setInputValue('');
    setTranscript(prev => [...prev, { text, isAI: false }]);
    await sendStreamingMessage(sessionId, text);
  };

  const handleEndSession = async () => {
    if (!sessionId) return;

    try {
      // Stop any audio recording
      if (audioPipeline.current && isListening) {
        audioPipeline.current.stop();
        setIsListening(false);
      }

      // End the session via API
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        setToastMessage('Session saved successfully!');
        setTimeout(() => {
          router.push('/stories');
        }, 1500);
      } else {
        setToastMessage('Failed to save session. Please try again.');
      }
    } catch (err) {
      console.error('Error ending session:', err);
      setToastMessage('Error saving session.');
    }
  };

  const formatTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FCF8F3] flex flex-col items-center">
        <Header />

        {/* Main Card */}
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl shadow-peach-warm/20 border border-peach-main/10 flex flex-col overflow-hidden animate-fade-in h-[75vh] mt-28">

          {/* Card Static Header / Status */}
          <div className="h-14 border-b border-peach-main/5 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 transition-all">
            <div className="flex items-center gap-2">
              {(agentState === 'thinking' || streamingResponse) ? (
                <>
                  <div className="flex gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-peach-warm"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta"></span>
                  </div>
                  <span className="text-sm font-bold text-text-secondary">ReCall is thinking...</span>
                </>
              ) : isListening ? (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-terracotta animate-pulse"></span>
                  <span className="text-sm font-bold text-terracotta">Listening...</span>
                </div>
              ) : (
                <span className="text-sm font-bold text-peach-warm/60">Ready to chat</span>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-grow overflow-y-auto p-10 space-y-8 no-scrollbar scroll-smooth">
            {transcript.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.isAI ? 'items-start' : 'items-end'} animate-fade-in-up`}>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">
                  Today, {formatTime()}
                </span>
                <div className="flex items-end gap-3 max-w-[80%]">
                  {msg.isAI && (
                    <div className="w-10 h-10 rounded-full bg-peach-main/30 border border-peach-main/20 flex items-center justify-center flex-shrink-0 text-terracotta mb-2 shadow-sm">
                      <span className="material-symbols-outlined text-lg filled">mic</span>
                    </div>
                  )}
                  <div className={`
                    p-6 rounded-[2rem] text-lg font-medium leading-relaxed font-sans shadow-sm
                    ${msg.isAI
                      ? 'bg-[#F9F4EE] text-text-primary rounded-bl-none border border-[#F0E6D9]'
                      : 'bg-[#FDE2D0] text-text-primary rounded-br-none border border-peach-main/30 shadow-peach-warm/10'
                    }
                  `}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {streamingResponse && (
              <div className="flex flex-col items-start animate-fade-in">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 px-1">
                  Today, {formatTime()}
                </span>
                <div className="flex items-end gap-3 max-w-[80%]">
                  <div className="w-10 h-10 rounded-full bg-peach-main/30 border border-peach-main/20 flex items-center justify-center flex-shrink-0 text-terracotta mb-2 shadow-sm">
                    <span className="material-symbols-outlined text-lg filled">mic</span>
                  </div>
                  <div className="bg-[#F9F4EE] text-text-primary p-6 rounded-[2rem] rounded-bl-none border border-[#F0E6D9] text-lg font-medium leading-relaxed shadow-sm">
                    {streamingResponse}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Centered Controls Overlay */}
        <div className="w-full max-w-5xl mt-10 px-4">
          <div className="flex items-center gap-6">

            {/* Large Mic Button with Label */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className={`absolute inset-0 rounded-full bg-terracotta/20 ${isListening ? 'animate-ripple' : ''}`}></div>
                <button
                  onClick={toggleListening}
                  className={`
                    relative w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-4 border-white
                    ${isListening ? 'bg-terracotta text-white' : 'bg-gradient-to-br from-peach-warm to-terracotta text-white'}
                  `}
                >
                  <span className="material-symbols-outlined text-4xl filled">{isListening ? 'stop' : 'mic'}</span>
                </button>
              </div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em]">{isListening ? 'Stop' : 'Tap to Speak'}</span>
            </div>

            {/* Input Form Pill */}
            <div className="flex-1 flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-peach-main/20 rounded-full p-2 shadow-2xl shadow-peach-warm/20 ring-4 ring-peach-main/5 transition-all focus-within:ring-peach-main/20">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your story..."
                className="flex-1 bg-transparent px-8 py-4 text-lg text-text-primary font-medium placeholder:text-text-muted outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="group flex items-center gap-2 px-8 py-4 bg-terracotta text-white rounded-full font-bold text-sm shadow-lg shadow-terracotta/30 transition-all hover:bg-sienna active:scale-95 disabled:opacity-30"
              >
                <span>Send Message</span>
                <span className="material-symbols-outlined text-lg filled group-hover:translate-x-1 rotate-[-45deg] transition-transform">send</span>
              </button>
            </div>
          </div>

          {/* End Session Button */}
          <button
            onClick={handleEndSession}
            disabled={!sessionId || transcript.length === 0}
            className="flex flex-col items-center gap-2 px-6 py-4 bg-white/80 border border-peach-main/20 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:bg-peach-light disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-2xl text-terracotta">stop_circle</span>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">End & Save</span>
          </button>
        </div>

        <Footer />
      </div>
    </AuthGuard>
  );
}
