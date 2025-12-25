'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { useRouter } from 'next/navigation';

interface UserProfile {
    userId: string;
    role: 'senior' | 'family';
    displayName: string;
    preferences?: {
        topicsLove?: string[];
        topicsAvoid?: string[];
    };
}

export default function EditProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch('/api/users/profile');
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    setDisplayName(data.displayName || '');
                    setTags(data.preferences?.topicsLove || []);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);
        setSaveStatus('idle');

        try {
            const res = await fetch('/api/users/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: profile.role,
                    updates: {
                        topicsLove: tags,
                    }
                }),
            });

            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => {
                    router.push(profile.role === 'family' ? '/family' : '/stories');
                }, 1500);
            } else {
                setSaveStatus('error');
            }
        } catch (err) {
            console.error('Error saving profile:', err);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppShell userType="senior" showNav={true}>
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-10 bg-border-light rounded w-1/2 mx-auto"></div>
                        <div className="flex gap-8">
                            <div className="w-1/3 h-64 bg-border-light rounded-2xl"></div>
                            <div className="w-2/3 h-64 bg-border-light rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell userType={profile?.role || 'senior'} userName={profile?.displayName} showNav={true}>
            <div className="max-w-4xl mx-auto px-4 py-8">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-display font-bold text-text-primary-light flex items-center justify-center gap-3">
                        Update {profile?.displayName || 'Your'} Details <span className="text-3xl">📖</span>
                    </h1>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Avatar Card */}
                    <div className="w-full md:w-1/3 bg-white rounded-[2rem] p-8 shadow-sm border border-surface-light flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-surface-light/30 to-transparent pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="w-40 h-40 rounded-full border-4 border-primary/20 p-1 mb-4 bg-surface-light flex items-center justify-center">
                                <span className="material-symbols-outlined text-6xl text-text-secondary-light">person</span>
                            </div>
                            <h2 className="text-xl font-bold text-text-primary-light mb-6">{profile?.displayName || 'User'}</h2>

                            <button
                                className="bg-surface-light hover:bg-surface-light/80 text-text-secondary-light px-6 py-2.5 rounded-full font-bold shadow-sm transition-colors text-sm cursor-not-allowed opacity-60"
                                title="Photo upload coming soon"
                                disabled
                            >
                                Change Photo
                            </button>
                            <p className="text-xs text-text-secondary-light mt-2">Coming soon</p>
                        </div>
                    </div>

                    {/* Right: Form Card */}
                    <div className="w-full md:w-2/3 bg-white rounded-[2rem] p-8 shadow-sm border border-surface-light relative">

                        <div className="space-y-6">
                            {/* Display Name (read-only for now) */}
                            <div>
                                <label className="block text-sm font-bold text-text-secondary-light mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    readOnly
                                    className="w-full px-5 py-3 rounded-xl border-2 border-border-light bg-surface-light text-text-secondary-light font-medium cursor-default"
                                />
                                <p className="text-xs text-text-secondary-light mt-1">Name changes require account update</p>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-bold text-text-secondary-light mb-2">Role</label>
                                <input
                                    type="text"
                                    value={profile?.role === 'senior' ? 'Storyteller' : 'Family Member'}
                                    readOnly
                                    className="w-full px-5 py-3 rounded-xl border-2 border-border-light bg-surface-light text-text-secondary-light font-medium cursor-default"
                                />
                            </div>

                            {/* Interests / Topics I Love */}
                            <div>
                                <label className="block text-sm font-bold text-text-secondary-light mb-2">Topics I Love</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {tags.length === 0 ? (
                                        <p className="text-text-secondary-light text-sm">No topics added yet</p>
                                    ) : (
                                        tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-surface-light text-text-secondary-light text-sm font-medium rounded-full flex items-center gap-1">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-primary">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </span>
                                        ))
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        placeholder="Add a topic..."
                                        className="flex-1 px-4 py-2 rounded-full border-2 border-border-light bg-white text-text-primary-light focus:outline-none focus:border-primary"
                                    />
                                    <button
                                        onClick={handleAddTag}
                                        className="px-4 py-2 bg-surface-light rounded-full text-text-secondary-light hover:bg-primary hover:text-white transition-colors"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                    </button>
                                </div>
                            </div>

                            {/* Save Status Messages */}
                            {saveStatus === 'success' && (
                                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-3 rounded-xl">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span className="font-medium">Profile saved! Redirecting...</span>
                                </div>
                            )}

                            {saveStatus === 'error' && (
                                <div className="flex items-center justify-center gap-2 text-red-600 bg-red-50 py-3 rounded-xl">
                                    <span className="material-symbols-outlined">error</span>
                                    <span className="font-medium">Failed to save. Please try again.</span>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-3.5 rounded-full font-bold shadow-md transition-colors disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">sync</span>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                                <Link href={profile?.role === 'family' ? '/family' : '/stories'} className="flex-1 bg-surface-light hover:bg-surface-light/80 text-text-secondary-light py-3.5 rounded-full font-bold shadow-sm transition-colors text-center">
                                    Cancel
                                </Link>
                            </div>

                        </div>

                    </div>

                </div>

            </div>
        </AppShell>
    );
}
