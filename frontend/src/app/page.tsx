'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Activity,
  Star,
  Trophy,
  CheckCircle2,
  Clock,
  Tv,
  Users,
  Coins,
  Shield,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OverviewData, PlayerSearchItem, BigBallsMatch } from '@/lib/types';
import { formatEUR } from '@/lib/format';
import { FaviconSearch } from '@/components/ui/FaviconSearch';
import { LaLigaStreamModal } from '@/components/live/LaLigaStreamModal';
import { useFavorites } from '@/components/favorites/FavoritesDrawer';

// Featured Matches for the center showcase carousel
const FEATURED_SHOWCASE = [
  {
    id: 101,
    league: 'Premier League',
    leagueIcon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    home: { name: 'Ipswich Town', short: 'IPS', logo: 'https://media.api-sports.io/football/teams/64.png' },
    away: { name: 'Liverpool', short: 'LIV', logo: 'https://media.api-sports.io/football/teams/40.png' },
    dateDisplay: '05/09/2026',
    timeDisplay: 'Sat 00:30',
    odds: [
      { bookmaker: '1XBET', home: '5.50', draw: '4.75', away: '1.50', trend: 'up' },
      { bookmaker: 'Stake', home: '5.45', draw: '4.70', away: '1.50', trend: 'down' },
    ],
    initialVotes: { home: 18, draw: 22, away: 60 },
  },
  {
    id: 102,
    league: 'La Liga',
    leagueIcon: '🇪🇸',
    home: { name: 'Real Madrid', short: 'RMA', logo: 'https://media.api-sports.io/football/teams/541.png' },
    away: { name: 'Barcelona', short: 'BAR', logo: 'https://media.api-sports.io/football/teams/529.png' },
    dateDisplay: '06/09/2026',
    timeDisplay: 'Sun 20:00',
    odds: [
      { bookmaker: '1XBET', home: '2.10', draw: '3.60', away: '3.10', trend: 'up' },
      { bookmaker: 'Stake', home: '2.15', draw: '3.55', away: '3.05', trend: 'up' },
    ],
    initialVotes: { home: 52, draw: 18, away: 30 },
  },
  {
    id: 103,
    league: 'Champions League',
    leagueIcon: '🇪🇺',
    home: { name: 'Arsenal', short: 'ARS', logo: 'https://media.api-sports.io/football/teams/42.png' },
    away: { name: 'Bayern Munich', short: 'BAY', logo: 'https://media.api-sports.io/football/teams/157.png' },
    dateDisplay: '08/09/2026',
    timeDisplay: 'Tue 20:00',
    odds: [
      { bookmaker: '1XBET', home: '2.30', draw: '3.40', away: '2.90', trend: 'down' },
      { bookmaker: 'Stake', home: '2.25', draw: '3.45', away: '2.95', trend: 'down' },
    ],
    initialVotes: { home: 44, draw: 24, away: 32 },
  },
];

export default function OverviewPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [players, setPlayers] = useState<PlayerSearchItem[]>([]);
  const [matches, setMatches] = useState<BigBallsMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  // Left column states
  const [subTab, setSubTab] = useState<'all' | 'favourites' | 'competitions'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'finished' | 'upcoming'>('all');
  const [showOdds, setShowOdds] = useState(true);

  // Center column showcase states
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [userVote, setUserVote] = useState<'home' | 'draw' | 'away' | null>(null);

  // AI valuation scenario tuner
  const [age, setAge] = useState(24);
  const [goals, setGoals] = useState(18);
  const [assists, setAssists] = useState(8);
  const [minutes, setMinutes] = useState(2500);
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  // Favorites hook
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  // Stream modal
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [streamMatchInfo, setStreamMatchInfo] = useState<{ title?: string; home?: string; away?: string; score?: string }>({});

  const handleOpenStream = (info: {
    home?: string;
    away?: string;
    score?: string;
    title?: string;
  }) => {
    setStreamMatchInfo(info);
    setStreamModalOpen(true);
  };

  useEffect(() => {
    Promise.all([
      api.getOverview().catch(() => null),
      api.getPlayersDirectory({ page_size: 10 }).catch(() => null),
      api.getBigBallsMatches({ date: new Date().toISOString().split('T')[0], limit: 40 }).catch(() => null),
    ]).then(([ov, pl, mt]) => {
      if (ov) setOverview(ov);
      if (pl?.players?.length) setPlayers(pl.players);
      if (mt?.data?.length) {
        setMatches(mt.data);
      } else {
        // High-density demo match data matching inspired design
        setMatches([
          { id: 'demo-1', league: 'Brasileirão Betano', home: { name: 'Flamengo', short_name: 'FLA' }, away: { name: 'Mirassol', short_name: 'MIR' }, score: { home: 2, away: 0 }, status: 'finished', kickoff_utc: '2026-09-03T04:00:00Z' },
          { id: 'demo-2', league: 'Pro League', home: { name: 'St. Truidense', short_name: 'STT' }, away: { name: 'USG', short_name: 'USG' }, score: { home: 0, away: 3 }, status: 'finished', kickoff_utc: '2026-09-03T00:00:00Z' },
          { id: 'demo-3', league: 'Scottish Premiership', home: { name: 'Celtic', short_name: 'CEL' }, away: { name: 'Aberdeen', short_name: 'ABE' }, score: { home: 3, away: 0 }, status: 'finished', kickoff_utc: '2026-09-03T00:15:00Z' },
          { id: 'demo-4', league: 'Scottish Premiership', home: { name: 'Dundee', short_name: 'DUN' }, away: { name: 'St. Johnstone', short_name: 'STJ' }, score: { home: 1, away: 1 }, status: 'finished', kickoff_utc: '2026-09-03T00:15:00Z' },
          { id: 'demo-5', league: 'Scottish Premiership', home: { name: 'Kilmarnock', short_name: 'KIL' }, away: { name: 'St Mirren', short_name: 'STM' }, score: { home: 0, away: 1 }, status: 'finished', kickoff_utc: '2026-09-03T00:15:00Z' },
          { id: 'demo-6', league: 'Premier League', home: { name: 'Arsenal', short_name: 'ARS' }, away: { name: 'Chelsea', short_name: 'CHE' }, score: { home: 2, away: 1 }, status: 'live' },
          { id: 'demo-7', league: 'La Liga', home: { name: 'Ipswich', short_name: 'IPS' }, away: { name: 'Liverpool', short_name: 'LIV' }, status: 'scheduled', kickoff_utc: '2026-09-03T20:30:00Z' },
        ]);
      }
      setLoadingMatches(false);
    });
  }, []);

  // AI scenario calculation
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsEstimating(true);
      try {
        const res = await api.predictScenario({
          name: 'Custom Player',
          age,
          position: 'Attack',
          market_value_before: 25000000,
          prior_minutes: minutes,
          goals,
          assists,
          configuration: 'market_aware'
        }, { signal: controller.signal });
        setEstimatedValue(res.valuation.estimated_transfer_value);
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      } finally {
        setIsEstimating(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [age, goals, assists, minutes]);

  // Group matches by league
  const groupedMatches = useMemo(() => {
    const filtered = matches.filter((m) => {
      if (statusFilter === 'live') return m.status === 'live' || m.status === 'in_progress';
      if (statusFilter === 'finished') return m.status === 'finished';
      if (statusFilter === 'upcoming') return m.status === 'scheduled';
      if (subTab === 'favourites') return isFavorite(m.home?.name || '') || isFavorite(m.away?.name || '');
      return true;
    });

    const groups: Record<string, BigBallsMatch[]> = {};
    filtered.forEach((m) => {
      const key = m.league || 'Other Competitions';
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [matches, statusFilter, subTab, favorites]);

  const liveCount = useMemo(() => {
    return matches.filter((m) => m.status === 'live' || m.status === 'in_progress').length;
  }, [matches]);

  const currentShowcase = FEATURED_SHOWCASE[showcaseIndex];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner Notice */}
      <div className="flex items-center justify-between text-xs text-[#929293] py-1">
        <p className="font-medium">
          Football today — livescore, match schedule and AI valuation signals for Premier League, Champions League, La Liga.
        </p>
      </div>

      {/* Main 3-Column High-Density Layout */}
      <div className="grid gap-4 xl:grid-cols-[380px_1fr_360px] lg:grid-cols-[360px_1fr] items-start">
        
        {/* ══════════════════════════════════════════════════════════
            LEFT COLUMN: League Fixture List & Livescore Feeds
            ══════════════════════════════════════════════════════════ */}
        <div className="sofa-card p-3.5 space-y-3">
          
          {/* Sub-Tabs: All | Favourites | Competitions + Date */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center gap-1 text-xs font-semibold">
              {(['all', 'favourites', 'competitions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSubTab(tab)}
                  className={`px-3 py-1 rounded-[32px] capitalize transition ${
                    subTab === tab
                      ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {tab === 'favourites' ? 'Favourites' : tab === 'competitions' ? 'Competitions' : 'All'}
                </button>
              ))}
            </div>

            {/* Date Indicator */}
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <button className="p-0.5 hover:text-[var(--text-main)] transition">
                <ChevronLeft size={14} />
              </button>
              <span className="font-semibold text-[var(--text-main)]">Today</span>
              <button className="p-0.5 hover:text-[var(--text-main)] transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Filter Pills & Odds Toggle */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusFilter(statusFilter === 'live' ? 'all' : 'live')}
                className={`flex items-center gap-1 rounded-[32px] px-2.5 py-1 text-[11px] font-bold transition ${
                  statusFilter === 'live'
                    ? 'bg-[#E73B3B] text-white'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[#E73B3B] hover:border-[#E73B3B]/40'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#E73B3B] animate-ping" />
                Live ({liveCount})
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'finished' ? 'all' : 'finished')}
                className={`rounded-[32px] px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === 'finished'
                    ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-bold'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Finished
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'upcoming' ? 'all' : 'upcoming')}
                className={`rounded-[32px] px-2.5 py-1 text-[11px] font-semibold transition ${
                  statusFilter === 'upcoming'
                    ? 'bg-[var(--text-main)] text-[var(--bg-main)] font-bold'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Upcoming
              </button>
            </div>

            {/* Odds Switch */}
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span>Odds</span>
              <button
                onClick={() => setShowOdds(!showOdds)}
                className={`h-4 w-7 rounded-full transition-colors relative ${showOdds ? 'bg-[var(--primary)]' : 'bg-black/15 dark:bg-white/20'}`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${
                    showOdds ? 'left-3.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Grouped Match List */}
          <div className="space-y-3 pt-1">
            {Object.keys(groupedMatches).length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                No matches found in this filter.
              </div>
            ) : (
              Object.entries(groupedMatches).map(([leagueName, leagueMatches]) => (
                <div key={leagueName} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                  
                  {/* League Header */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-card-hover)] text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚽</span>
                      <span className="font-bold text-[var(--text-main)]">{leagueName}</span>
                    </div>
                    <span className="mono-font text-[10px] text-[var(--text-muted)]">{leagueMatches.length}</span>
                  </div>

                  {/* League Match Rows */}
                  <div className="divide-y divide-[var(--border-color)]">
                    {leagueMatches.map((m, idx) => {
                      const isLive = m.status === 'live' || m.status === 'in_progress';
                      const isFinished = m.status === 'finished';
                      const homeFav = isFavorite(m.home?.name || '');
                      const awayFav = isFavorite(m.away?.name || '');

                      return (
                        <div
                          key={m.id || idx}
                          className="flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-card-hover)] transition text-xs group"
                        >
                          {/* Match Time / Status */}
                          <div className="w-12 shrink-0">
                            {isLive ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#E73B3B]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#E73B3B] animate-ping" />
                                LIVE
                              </span>
                            ) : isFinished ? (
                              <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                FT
                              </span>
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                {m.kickoff_utc ? new Date(m.kickoff_utc).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '20:30'}
                              </span>
                            )}
                          </div>

                          {/* Teams */}
                          <div className="flex-1 min-w-0 pr-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="truncate font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition">
                                {m.home?.name || 'Home Team'}
                              </span>
                              {(isFinished || isLive) && (
                                <span className="score-numeral font-bold text-[var(--text-main)] ml-2">
                                  {m.score?.home ?? 0}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="truncate font-semibold text-[var(--text-main)] group-hover:text-[var(--primary)] transition">
                                {m.away?.name || 'Away Team'}
                              </span>
                              {(isFinished || isLive) && (
                                <span className="score-numeral font-bold text-[var(--text-main)] ml-2">
                                  {m.score?.away ?? 0}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Star Favorite Action */}
                          <button
                            onClick={() => {
                              const name = m.home?.name || 'Match';
                              if (homeFav) removeFavorite(name);
                              else addFavorite({ id: name, name, type: 'club', league: leagueName });
                            }}
                            className="p-1 text-[var(--text-muted)] hover:text-[#ffd600] transition shrink-0"
                            title="Add to favourites"
                          >
                            <Star
                              size={14}
                              className={homeFav || awayFav ? 'fill-[#ffd600] text-[#ffd600]' : ''}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════
            CENTER COLUMN: Featured Match Showcase, Voting & Odds
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          
          {/* Featured Match Hero Card */}
          <div className="sofa-card p-5">
            
            {/* Header: Competition & Navigation */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentShowcase.leagueIcon}</span>
                <span className="font-bold text-[var(--text-main)]">{currentShowcase.league}</span>
              </div>

              {/* Carousel Next / Prev */}
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <button
                  onClick={() => setShowcaseIndex((prev) => (prev > 0 ? prev - 1 : FEATURED_SHOWCASE.length - 1))}
                  className="p-1 hover:text-[var(--text-main)] transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {FEATURED_SHOWCASE.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        showcaseIndex === i ? 'w-4 bg-[var(--primary)]' : 'w-1.5 bg-black/15 dark:bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setShowcaseIndex((prev) => (prev < FEATURED_SHOWCASE.length - 1 ? prev + 1 : 0))}
                  className="p-1 hover:text-[var(--text-main)] transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Matchup Crests & Time */}
            <div className="py-6 flex items-center justify-between text-center px-4">
              {/* Home Team */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <img
                  src={currentShowcase.home.logo}
                  alt={currentShowcase.home.name}
                  className="h-14 w-14 object-contain mb-2 drop-shadow-md"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <h3 className="font-bold text-sm text-[var(--text-main)] truncate max-w-[130px]">
                  {currentShowcase.home.name}
                </h3>
              </div>

              {/* Kickoff Date & Time */}
              <div className="flex flex-col items-center px-4 shrink-0">
                <span className="score-numeral text-xl font-extrabold text-[var(--text-main)] tracking-tight">
                  {currentShowcase.dateDisplay}
                </span>
                <span className="timer-display text-xs text-[var(--text-muted)] mt-1 font-semibold">
                  {currentShowcase.timeDisplay}
                </span>
                <button
                  onClick={() => {
                    handleOpenStream({
                      title: `${currentShowcase.home.name} vs ${currentShowcase.away.name}`,
                      home: currentShowcase.home.name,
                      away: currentShowcase.away.name,
                      score: '0 - 0',
                    });
                  }}
                  className="mt-2.5 sofa-pill bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 text-[11px] py-1 px-3 hover:bg-[var(--primary)] hover:text-white transition"
                >
                  <Tv size={11} /> Watch Stream
                </button>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                <img
                  src={currentShowcase.away.logo}
                  alt={currentShowcase.away.name}
                  className="h-14 w-14 object-contain mb-2 drop-shadow-md"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <h3 className="font-bold text-sm text-[var(--text-main)] truncate max-w-[130px]">
                  {currentShowcase.away.name}
                </h3>
              </div>
            </div>

            {/* Interactive "Who will win? Cast your vote!" Widget */}
            <div className="border-t border-[var(--border-color)] pt-4 mt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">Who will win?</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Cast your vote!</p>
                </div>
                <Trophy size={16} className="text-[var(--primary)]" />
              </div>

              {/* 3 Vote Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setUserVote('home')}
                  className={`sofa-vote-btn ${userVote === 'home' ? 'active' : ''}`}
                >
                  <img src={currentShowcase.home.logo} alt="" className="h-4 w-4 object-contain" />
                  <span>1 ({currentShowcase.home.short})</span>
                </button>

                <button
                  onClick={() => setUserVote('draw')}
                  className={`sofa-vote-btn ${userVote === 'draw' ? 'active' : ''}`}
                >
                  <span>X (Draw)</span>
                </button>

                <button
                  onClick={() => setUserVote('away')}
                  className={`sofa-vote-btn ${userVote === 'away' ? 'active' : ''}`}
                >
                  <img src={currentShowcase.away.logo} alt="" className="h-4 w-4 object-contain" />
                  <span>2 ({currentShowcase.away.short})</span>
                </button>
              </div>

              {/* Vote Distribution Bar (shown after vote or always) */}
              <div className="mt-3 space-y-1">
                <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex">
                  <div
                    style={{ width: `${currentShowcase.initialVotes.home}%` }}
                    className="h-full bg-[var(--primary)] transition-all duration-500"
                  />
                  <div
                    style={{ width: `${currentShowcase.initialVotes.draw}%` }}
                    className="h-full bg-black/20 dark:bg-white/30 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${currentShowcase.initialVotes.away}%` }}
                    className="h-full bg-[#E73B3B] transition-all duration-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono px-0.5">
                  <span>{currentShowcase.initialVotes.home}%</span>
                  <span>{currentShowcase.initialVotes.draw}%</span>
                  <span>{currentShowcase.initialVotes.away}%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Highlighted Transfers & Market Movers Card */}
          <div className="sofa-card p-5">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[var(--text-main)]">Highlighted Transfers</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Live transfer market fee signals</p>
              </div>
              <Link href="/transfers" className="text-xs font-semibold text-[var(--primary)] hover:underline">
                View all transfers
              </Link>
            </div>

            {/* Transfer Items */}
            <div className="divide-y divide-[var(--border-color)] mt-1">
              {[
                { name: 'Enzo Fernández', from: 'Chelsea', to: 'Real Madrid', fee: '145M €', pos: 'Midfield', img: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?w=100&auto=format&fit=crop&q=80' },
                { name: 'Erling Haaland', from: 'Man City', to: 'Contract Extension', fee: '200M €', pos: 'Attack', img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=80' },
                { name: 'Kylian Mbappé', from: 'Real Madrid', to: 'Franchise Star', fee: '180M €', pos: 'Attack', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80' },
              ].map((t) => (
                <div key={t.name} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img src={t.img} alt="" className="h-9 w-9 rounded-full object-cover border border-[var(--border-color)]" />
                    <div>
                      <h4 className="font-bold text-[var(--text-main)]">{t.name}</h4>
                      <p className="text-[11px] text-[var(--text-muted)]">{t.from} · {t.pos}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="score-numeral text-sm font-black text-[var(--text-main)] block">{t.fee}</span>
                    <span className="mono-font text-[10px] text-[var(--neon-green)] font-bold">VERIFIED FEE</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick AI Valuation Scenario Simulator */}
            <div className="mt-4 border-t border-[var(--border-color)] pt-4 bg-[var(--bg-surface)] p-3.5 rounded-xl border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[var(--text-main)]">AI Valuation Scenario Engine</span>
                <span className="score-numeral text-sm font-black text-[var(--primary)]">
                  {estimatedValue !== null ? formatEUR(estimatedValue) : 'Calculating...'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                    <span>Age</span>
                    <span className="font-bold text-[var(--text-main)]">{age}</span>
                  </div>
                  <input
                    type="range"
                    min={17}
                    max={38}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-[var(--primary)] h-1.5 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                    <span>Season Goals</span>
                    <span className="font-bold text-[var(--text-main)]">{goals}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={goals}
                    onChange={(e) => setGoals(Number(e.target.value))}
                    className="w-full accent-[var(--primary)] h-1.5 bg-black/10 dark:bg-white/10 rounded-full cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════
            RIGHT COLUMN: BALLON PRO Intelligence & Stats Hub
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          
          {/* BALLON PRO Feature Card (Matching the right promo card) */}
          <div className="sofa-card p-5 bg-[var(--bg-card)]">
            <span className="editorial-kicker text-[var(--primary)] font-bold">
              EXCLUSIVELY IN BALLON PRO
            </span>
            <h3 className="display-font text-lg font-bold text-[var(--text-main)] mt-1 leading-snug">
              Share match stats with one tap
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              Be the one who has the receipts—drop them straight in the group chat and let the numbers do the talking.
            </p>

            {/* Visual Stats Card Preview Graphic */}
            <div className="my-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] border-b border-[var(--border-color)] pb-2">
                <span className="text-[var(--text-muted)]">Match Momentum Radar</span>
                <span className="score-numeral text-[var(--primary)] font-bold">7.55 ⚡</span>
              </div>
              <div className="h-12 w-full flex items-end gap-1 pt-2">
                {[30, 50, 45, 80, 65, 90, 70, 40, 85, 95, 60, 75].map((val, i) => (
                  <div
                    key={i}
                    style={{ height: `${val}%` }}
                    className={`flex-1 rounded-t ${i % 2 === 0 ? 'bg-[var(--primary)]' : 'bg-black/10 dark:bg-white/20'}`}
                  />
                ))}
              </div>
            </div>

            {/* Bullet List */}
            <ul className="space-y-2 text-xs text-[var(--text-main)] mb-5">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />
                <span>See the story behind the scoreline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />
                <span>Show off stats with striking graphics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />
                <span>Real-time transfer fee valuation algorithms</span>
              </li>
            </ul>

            <Link
              href="/estimator"
              className="sofa-pill sofa-pill-accent w-full py-2.5 text-center font-bold text-xs"
            >
              Open Valuation Engine
            </Link>
          </div>

          {/* Top Valuation Leaderboard */}
          <div className="sofa-card p-4">
            <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5 mb-2">
              <span className="text-xs font-bold text-[var(--text-main)]">Market Valuations</span>
              <span className="editorial-kicker text-[var(--text-muted)]">EUR</span>
            </div>

            <div className="space-y-2">
              {players.slice(0, 5).map((p, idx) => (
                <Link
                  key={p.player_id || idx}
                  href={`/players/${p.player_id}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition group text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="mono-font text-[var(--text-muted)] font-bold w-4 text-[11px]">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{p.current_club_name || 'Free Agent'}</p>
                    </div>
                  </div>
                  <span className="score-numeral font-black text-[var(--text-main)] shrink-0 ml-2">
                    {formatEUR(p.market_value_in_eur || 0)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stream Modal */}
      <LaLigaStreamModal
        isOpen={streamModalOpen}
        onClose={() => setStreamModalOpen(false)}
        matchTitle={streamMatchInfo.title}
        homeTeam={streamMatchInfo.home}
        awayTeam={streamMatchInfo.away}
        scoreDisplay={streamMatchInfo.score}
      />
    </div>
  );
}
