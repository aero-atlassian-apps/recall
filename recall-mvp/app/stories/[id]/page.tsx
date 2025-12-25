'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';

interface ChapterData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  audioUrl?: string;
}

export default function StoryImmersionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [story, setStory] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  // Share Story Handler
  const handleShare = async () => {
    if (!story) return;

    const shareUrl = window.location.href;
    const shareText = `${story.title || 'A Family Memory'} - ReCall`;

    // Try native share first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          text: story.content?.substring(0, 100) + '...' || 'A cherished memory',
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch (err) {
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 2000);
    }
  };

  useEffect(() => {
    async function fetchChapter() {
      try {
        // Fetch chapter by ID
        const res = await fetch(`/api/chapters/${resolvedParams.id}`);
        if (!res.ok) {
          throw new Error('Chapter not found');
        }
        const data = await res.json();
        setStory(data);
      } catch (err: any) {
        console.error('Error fetching chapter:', err);
        setError(err.message || 'Failed to load story');
      } finally {
        setLoading(false);
      }
    }
    fetchChapter();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <AppShell userType="family" userName="User" showNav={true}>
        <div className="max-w-6xl mx-auto animate-pulse">
          <div className="h-6 bg-border-light rounded w-40 mb-8"></div>
          <div className="h-12 bg-border-light rounded w-3/4 mb-4"></div>
          <div className="h-6 bg-border-light rounded w-1/2 mb-10"></div>
          <div className="h-16 bg-surface-light rounded-2xl mb-10"></div>
          <div className="space-y-4">
            <div className="h-4 bg-border-light rounded w-full"></div>
            <div className="h-4 bg-border-light rounded w-full"></div>
            <div className="h-4 bg-border-light rounded w-5/6"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !story) {
    return (
      <AppShell userType="family" userName="User" showNav={true}>
        <div className="max-w-6xl mx-auto text-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">error</span>
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary-light mb-2">Story Not Found</h2>
          <p className="text-text-secondary-light mb-6">{error || 'This story could not be found.'}</p>
          <Link href="/stories" className="inline-block bg-primary text-white px-6 py-2 rounded-full font-medium">
            Back to Stories
          </Link>
        </div>
      </AppShell>
    );
  }

  const formattedDate = new Date(story.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#FCF8F3] font-sans text-text-primary overflow-x-hidden">

      {/* Minimalist Header */}
      <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-peach-main/10 flex items-center px-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-peach-warm to-terracotta rounded-lg flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-xl filled">mic</span>
            </div>
            <span className="text-xl font-serif font-black text-terracotta tracking-tight">ReCall</span>
            <span className="h-6 w-px bg-peach-main/20 mx-2"></span>
            <span className="text-sm font-bold text-text-primary opacity-60">Story Immersion View</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-16 px-6 max-w-6xl">

        {/* Navigation */}
        <div className="mb-12 animate-fade-in">
          <Link href="/stories" className="inline-flex items-center text-brown-main/60 hover:text-terracotta transition-colors group font-bold">
            <span className="material-symbols-outlined text-2xl mr-2 group-hover:-translate-x-1 transition-transform">arrow_back</span>
            Back to Stories Archive
          </Link>
        </div>

        {/* Story Header */}
        <div className="mb-16 animate-fade-in [animation-delay:0.1s]">
          <h1 className="text-5xl md:text-7xl font-serif font-extrabold text-text-primary mb-6 leading-tight">
            {story.title || 'Untitled Memory'}
          </h1>
          <p className="text-2xl text-text-secondary font-serif opacity-70">
            Grandpa Joe, <span className="italic">narrated by Sarah</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-16 items-start">

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12 animate-fade-in [animation-delay:0.2s]">

            {/* Elegant Audio Player */}
            <div className="bg-[#FFF5ED] rounded-[2rem] p-8 md:p-10 border border-peach-main/20 shadow-xl shadow-peach-warm/10">
              <div className="flex items-center gap-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-[#FDE2D0] rounded-full flex items-center justify-center text-terracotta shadow-lg transition-all"
                >
                  <span className="material-symbols-outlined text-4xl filled">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </motion.button>

                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-sm font-bold text-terracotta">0:00</span>
                    <span className="text-sm font-bold text-text-muted opacity-60">14:32</span>
                  </div>
                  <div className="relative h-2 bg-[#FDE2D0]/40 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-peach-warm to-terracotta rounded-full w-[45%]"></div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-terracotta opacity-60">
                  <span className="material-symbols-outlined text-2xl">volume_up</span>
                  <div className="w-16 h-1.5 bg-[#FDE2D0]/40 rounded-full overflow-hidden">
                    <div className="h-full bg-terracotta w-2/3 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transcript Card */}
            <div className="bg-white rounded-[2.5rem] p-12 md:p-20 shadow-2xl shadow-peach-warm/20 border border-peach-main/10 relative overflow-hidden group">
              <div className="relative z-10 font-serif text-xl md:text-2xl text-text-primary leading-[1.8] tracking-tight opacity-90">
                {story.content?.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-8">
                    {paragraph}
                  </p>
                )) || <p className="text-text-muted italic">No content available for this memory.</p>}

                {/* Fade out effect at the bottom if long */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none opacity-60"></div>
              </div>
            </div>

          </div>

          {/* Sidebar / Actions */}
          <aside className="lg:col-span-4 space-y-12 animate-fade-in [animation-delay:0.3s]">

            {/* Action Pills */}
            <div className="space-y-4">
              <button
                onClick={handleShare}
                className="w-full py-4 bg-white border-2 border-peach-main/10 rounded-2xl font-bold text-text-primary hover:bg-peach-main/5 transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <span className="material-symbols-outlined text-xl">share</span>
                Share Story
              </button>
              <button className="w-full py-4 bg-[#FDE2D0]/40 border-2 border-[#FDE2D0]/60 rounded-2xl font-bold text-brown-main hover:bg-[#FDE2D0]/60 transition-all flex items-center justify-center gap-3 shadow-sm">
                <span className="material-symbols-outlined text-xl">book_2</span>
                Generate Book Page
              </button>
              <button className="w-full py-4 bg-gradient-to-r from-peach-warm/60 to-terracotta/40 border-b-4 border-terracotta/20 rounded-2xl font-bold text-text-primary hover:from-peach-warm hover:to-terracotta hover:text-white transition-all flex items-center justify-center gap-3 shadow-md">
                <span className="material-symbols-outlined text-xl">favorite</span>
                Add to Favorites
              </button>
            </div>

            {/* Story Details */}
            <div className="space-y-8">
              <h4 className="text-lg font-serif font-black text-text-primary border-b border-peach-main/10 pb-4">Story Details</h4>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Recorded</p>
                  <p className="text-lg font-sans font-bold text-text-secondary">July 24, 2023</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Duration</p>
                  <p className="text-lg font-sans font-bold text-text-secondary">14 minutes</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-5 py-2 bg-white border border-peach-main/10 rounded-full text-xs font-bold text-brown-main opacity-80">Family</span>
                    <span className="px-5 py-2 bg-white border border-peach-main/10 rounded-full text-xs font-bold text-brown-main opacity-80">Adventure</span>
                    <span className="px-5 py-2 bg-white border border-peach-main/10 rounded-full text-xs font-bold text-brown-main opacity-80">Childhood</span>
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 bg-white/40 border-t border-peach-main/10 mt-32">
        <div className="container mx-auto px-10 max-w-6xl flex flex-col md:flex-row justify-between items-center gap-10">
          <p className="text-sm font-bold text-text-muted opacity-60">© 2024 ReCall. Immortalizing Stories.</p>
          <div className="flex gap-10 text-sm font-bold text-text-muted opacity-60">
            <Link href="#" className="hover:text-terracotta transition-colors">About</Link>
            <Link href="#" className="hover:text-terracotta transition-colors">Help</Link>
            <Link href="#" className="hover:text-terracotta transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
