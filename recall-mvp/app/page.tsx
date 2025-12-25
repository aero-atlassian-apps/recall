'use client';

import React from 'react';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingHero } from '@/components/marketing/MarketingHero';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';

export default function MarketingPage() {
    return (
        <div className="min-h-screen bg-[#FCF8F3] font-sans selection:bg-gold/30">
            <MarketingHeader />

            <main>
                <MarketingHero />
                {/* Additional sections (How it Works, etc.) could be added here in the future */}
            </main>

            <MarketingFooter />
        </div>
    );
}
