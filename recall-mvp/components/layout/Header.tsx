'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

interface UserProfile {
    userId: string;
    role: 'senior' | 'family';
    displayName: string;
}

export function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/users/profile');
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        userId: data.userId,
                        role: data.role || 'senior',
                        displayName: data.displayName || 'User',
                    });
                }
            } catch (err) {
                console.error('Failed to fetch profile for header:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        try {
            document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            router.push('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const isFamily = profile?.role === 'family';

    const navLinks = isFamily ? [
        { name: 'Home', href: '/family', icon: 'home' },
        { name: 'Stories', href: '/stories', icon: 'menu_book' },
        { name: 'Photos', href: '/photos', icon: 'image' },
        { name: 'Settings', href: '/settings', icon: 'settings' },
    ] : [
        { name: 'Home', href: '/dashboard', icon: 'home' },
        { name: 'My Stories', href: '/stories', icon: 'menu_book' },
        { name: 'Profile', href: '/profile', icon: 'person' },
        { name: 'Settings', href: '/settings', icon: 'settings' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#FCF8F3]/60 backdrop-blur-xl h-20 border-b border-peach-main/10 transition-all">
            <div className="container mx-auto px-6 h-full">
                <div className="flex justify-between items-center h-full">

                    {/* Brand Section */}
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
                            <div className="w-10 h-10 bg-gradient-to-br from-peach-warm to-terracotta rounded-xl flex items-center justify-center shadow-sm transform group-hover:rotate-6 transition-transform">
                                <span className="material-symbols-outlined text-white text-2xl filled">mic</span>
                            </div>
                            <div className="flex flex-col -gap-1">
                                <span className="text-2xl font-serif font-extrabold text-terracotta tracking-tight">ReCall</span>
                                {isFamily && (
                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter opacity-50 -mt-1">Family Portal Harmonized</span>
                                )}
                            </div>
                        </Link>

                        {/* Centered Navigation */}
                        <nav className="hidden lg:flex items-center gap-2">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href || (link.href === '/dashboard' && pathname === '/conversation');
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive
                                            ? 'bg-peach-main text-text-primary shadow-sm ring-1 ring-peach-main/20'
                                            : 'text-text-secondary hover:bg-peach-main/20'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>{link.icon}</span>
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* User Profile Area */}
                    <div className="flex items-center gap-4">
                        {!loading && profile && (
                            <Link href="/profile" className="flex items-center gap-3 bg-white/40 border border-peach-main/20 pl-2 pr-4 py-1.5 rounded-full group hover:bg-white/60 transition-all shadow-sm">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-peach-main/20 shadow-inner">
                                    <Image
                                        src={`https://i.pravatar.cc/100?u=${profile.userId}`}
                                        alt={profile.displayName}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-sm font-extrabold text-text-primary group-hover:text-terracotta transition-colors flex items-center gap-1">
                                    {profile.displayName}
                                    <span className="material-symbols-outlined text-sm opacity-50">expand_more</span>
                                </span>
                            </Link>
                        )}

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="bg-white/50 w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:text-terracotta border border-peach-main/10 transition-all active:scale-90"
                            title="Log Out"
                        >
                            <span className="material-symbols-outlined text-xl">logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

