'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Trophy,
  Newspaper,
  Shield,
  Star,
} from 'lucide-react';
import { FavoritesDrawer, useFavorites } from '@/components/favorites/FavoritesDrawer';

function BottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const { favorites } = useFavorites();

  const isScoresActive = pathname === '/' || pathname === '/estimator';
  const isNewsActive = pathname === '/live' && searchParams?.get('tab') === 'news';
  const isLeaguesActive = (pathname === '/live' && searchParams?.get('tab') !== 'news') || pathname === '/clubs';

  const navItems = [
    {
      id: 'scores',
      label: 'Scores',
      icon: Trophy,
      href: '/',
      active: isScoresActive,
      badge: 'LIVE',
    },
    {
      id: 'news',
      label: 'News',
      icon: Newspaper,
      href: '/live?tab=news',
      active: isNewsActive,
    },
    {
      id: 'leagues',
      label: 'Leagues',
      icon: Shield,
      href: '/live',
      active: isLeaguesActive,
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: Star,
      onClick: () => setFavoritesOpen(true),
      active: favoritesOpen,
      count: favorites.length,
    },
  ];

  return (
    <>
      <nav
        aria-label="Bottom Navigation Bar"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-color)] bg-[var(--bg-main)]/95 backdrop-blur-2xl transition-all shadow-md"
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-3 sm:px-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            const content = (
              <div className="relative flex flex-col items-center justify-center gap-1 py-1 px-3 select-none">
                {/* Active Indicator Top Light */}
                {isActive && (
                  <span className="absolute -top-2 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-[var(--primary)]" />
                )}

                <div className="relative">
                  <Icon
                    size={20}
                    className={`transition-all duration-200 ${
                      isActive
                        ? 'text-[var(--primary)] scale-110'
                        : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                    }`}
                  />

                  {/* Badge for LIVE on Scores */}
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-3.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]" />
                    </span>
                  )}

                  {/* Favorites Count Badge */}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="mono-font absolute -top-1.5 -right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ffd600] px-1 text-[9px] font-black text-[#080b11] shadow-[0_0_8px_rgba(255,214,0,0.6)]">
                      {item.count}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors ${
                    isActive ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex flex-1 items-center justify-center transition-transform active:scale-95"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className="group flex flex-1 items-center justify-center transition-transform active:scale-95 focus:outline-none"
              >
                {content}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Favorites Slide-over Modal */}
      <FavoritesDrawer
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
      />
    </>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={null}>
      <BottomNavContent />
    </Suspense>
  );
}
