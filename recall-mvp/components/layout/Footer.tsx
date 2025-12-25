import React from 'react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-transparent border-t border-peach-main/10 py-10">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[12px] font-bold text-text-secondary opacity-60">
                        © 2025 LegacyApp. Preserving family stories.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="/help" className="text-[12px] font-bold text-text-secondary hover:text-terracotta transition-colors">Help</Link>
                        <Link href="/privacy" className="text-[12px] font-bold text-text-secondary hover:text-terracotta transition-colors">Privacy</Link>
                        <Link href="/terms" className="text-[12px] font-bold text-text-secondary hover:text-terracotta transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}


