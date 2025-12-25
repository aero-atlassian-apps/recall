'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
    text: string;
    isAI: boolean;
    timestamp?: string;
}

export function MessageBubble({ text, isAI, timestamp = 'Today, 10:30 AM' }: MessageBubbleProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}
        >
            <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${isAI ? 'items-start' : 'items-end'}`}>

                <div className="flex items-start gap-4">
                    {isAI && (
                        <div className="w-10 h-10 rounded-full bg-[#EAE0D5] flex items-center justify-center shrink-0 mt-1">
                            <span className="material-symbols-outlined text-[#E07A5F]">mic</span>
                        </div>
                    )}

                    <div
                        className={`p-5 rounded-2xl text-lg leading-relaxed shadow-sm font-medium
              ${isAI
                                ? 'bg-[#EAE0D5]/50 text-[#3D3430] rounded-tl-sm'
                                : 'bg-[#E3D5C3] text-[#3D3430] rounded-tr-sm'
                            }`}
                    >
                        {text}
                    </div>
                </div>

                {/* Timestamp */}
                <span className="text-xs text-[#756A63]/60 mt-2 px-1">
                    {timestamp}
                </span>
            </div>
        </motion.div>
    );
}
