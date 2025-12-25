import React from 'react';
import { BackgroundBlobs } from '@/components/ui/BackgroundBlobs';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppShellProps {
    children: React.ReactNode;
    userType?: 'senior' | 'family';
    userName?: string;
    showNav?: boolean;
}

export function AppShell({
    children,
    userType = 'senior',
    userName,
    showNav = true
}: AppShellProps) {
    return (
        <div className="min-h-screen flex flex-col" id="root">
            {/* Header */}
            {showNav && <Header />}

            {/* Main Content Area */}
            <main className="flex-grow container mx-auto px-6 py-12">
                {children}
            </main>

            {/* Footer */}
            {showNav && <Footer />}
        </div>
    );
}
