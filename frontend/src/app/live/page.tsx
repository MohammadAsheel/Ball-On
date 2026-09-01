'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Globe,
  Trophy,
  Shield,
  Calendar,
  RefreshCw,
  Activity,
  Flame,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  ChevronRight,
  Search,
  Filter,
  BarChart2,
  Users,
  Zap,
  Tv,
  Coins,
  Stethoscope,
  Newspaper,
  Radio,
  Play,
  Video,
} from 'lucide-react';
import { api } from '@/lib/api';
import { InjuriesTicker } from '@/components/live/InjuriesTicker';
import { NewsFeed } from '@/components/news/NewsFeed';
import { LaLigaStreamModal, LALIGA_STREAM_URL } from '@/components/live/LaLigaStreamModal';
import {
  StandingRow,
  ScorerRow,
  MatchRow,
  SportMonksMatch,
  SportMonksEvent,
  SportMonksStat,
  SportMonksLineupPlayer,
  BigBallsMatch,
} from '@/lib/types';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/format';

const FD_LEAGUES = [
  { code: 'PL', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'PD', name: 'La Liga', flag: '🇪🇸' },
  { code: 'BL1', name: 'Bundesliga', flag: '🇩🇪' },
  { code: 'SA', name: 'Serie A', flag: '🇮🇹' },
  { code: 'FL1', name: 'Ligue 1', flag: '🇫🇷' },
  { code: 'CL', name: 'Champions League', flag: '🇪🇺' },
];

const BBS_LEAGUES = [
  { code: 'all', name: 'All Leagues', flag: '🌐' },
  { code: 'epl', name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'laliga', name: 'La Liga', flag: '🇪🇸' },
  { code: 'seriea', name: 'Serie A', flag: '🇮🇹' },
  { code: 'bundesliga', name: 'Bundesliga', flag: '🇩🇪' },
  { code: 'ligue1', name: 'Ligue 1', flag: '🇫🇷' },
  { code: 'ucl', name: 'Champions League', flag: '🇪🇺' },
];

type MainTab = 'bigballs' | 'news' | 'injuries' | 'livescores' | 'fixtures' | 'finished' | 'standings';

export default function LiveDataPage() {
  const [activeTab, setActiveTab] = useState<MainTab>('bigballs');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // BigBallsData SDK States
  const [bbsMatches, setBbsMatches] = useState<BigBallsMatch[]>([]);
  const [bbsLeague, setBbsLeague] = useState<string>('all');
  const [bbsStatus, setBbsStatus] = useState<string>('all');
  const [bbsLoading, setBbsLoading] = useState(false);

  // SportMonks Data States
  const [liveScores, setLiveScores] = useState<SportMonksMatch[]>([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState<SportMonksMatch[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<SportMonksMatch[]>([]);
  const [fixtureDays, setFixtureDays] = useState(7);
  const [finishedDays, setFinishedDays] = useState(7);

  // Selected Match for Match Center Modal
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [matchDetails, setMatchDetails] = useState<SportMonksMatch | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalTab, setModalTab] = useState<'timeline' | 'stats' | 'lineups' | 'stream' | 'info'>('timeline');

  // La Liga Live Stream Modal State
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [streamMatchInfo, setStreamMatchInfo] = useState<{
    title?: string;
    home?: string;
    away?: string;
    score?: string;
  }>({});

  const openLaLigaStream = (info?: { home?: string; away?: string; score?: string; title?: string }) => {
    setStreamMatchInfo({
      home: info?.home,
      away: info?.away,
      score: info?.score,
      title: info?.title || 'La Liga Santander Live Broadcast',
    });
    setStreamModalOpen(true);
  };

  // Football-Data.org Standings States
  const [selectedFdLeague, setSelectedFdLeague] = useState('PL');
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [scorers, setScorers] = useState<ScorerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load BigBallsData SDK matches
  const loadBbsMatches = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setBbsLoading(true);

    try {
      const res = await api.getBigBallsMatches({
        league: bbsLeague === 'all' ? undefined : bbsLeague,
        status: bbsStatus === 'all' ? undefined : bbsStatus,
        limit: bbsLeague === 'all' ? 36 : 24,
      });
      setBbsMatches(res.data || []);
    } catch (err: any) {
      console.error('Failed to load BigBalls matches:', err);
    } finally {
      setBbsLoading(false);
      setRefreshing(false);
    }
  };

  // Load SportMonks Live & Fixture Data
  const loadSportMonksData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [liveRes, fixRes, finRes] = await Promise.all([
        api.getSportMonksLiveScores(false).catch(() => ({ matches: [] })),
        api.getSportMonksFixtures({ days: fixtureDays }).catch(() => ({ matches: [] })),
        api.getSportMonksFinished({ days: finishedDays }).catch(() => ({ matches: [] })),
      ]);

      setLiveScores(liveRes.matches || []);
      setUpcomingFixtures(fixRes.matches || []);
      setFinishedMatches(finRes.matches || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch SportMonks data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load Standings
  const loadStandingsData = async (code: string) => {
    try {
      const [stdRes, scRes] = await Promise.all([
        api.getLiveStandings(code).catch(() => null),
        api.getLiveScorers(code).catch(() => null),
      ]);
      setStandings(stdRes?.table || []);
      setScorers(scRes?.scorers || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadBbsMatches();
  }, [bbsLeague, bbsStatus]);

  useEffect(() => {
    loadSportMonksData();
  }, [fixtureDays, finishedDays]);

  useEffect(() => {
    if (activeTab === 'standings') {
      loadStandingsData(selectedFdLeague);
    }
  }, [activeTab, selectedFdLeague]);

  // Load Match Details when modal opens
  const openMatchCenter = async (match: SportMonksMatch) => {
    setSelectedMatchId(match.id);
    setMatchDetails(match);
    setLoadingDetails(true);
    setModalTab('timeline');

    try {
      const detailed = await api.getSportMonksMatchDetails(match.id);
      if (detailed) {
        setMatchDetails(detailed);
      }
    } catch (err) {
      console.error('Failed to load match details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeMatchCenter = () => {
    setSelectedMatchId(null);
    setMatchDetails(null);
  };

  // Filtering SportMonks matches
  const filterMatches = (matches: SportMonksMatch[]) => {
    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    return matches.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.home_team.name.toLowerCase().includes(q) ||
        m.away_team.name.toLowerCase().includes(q) ||
        m.league.name.toLowerCase().includes(q)
    );
  };

  // Filtering BigBallsData matches
  const filteredBbsMatches = useMemo(() => {
    if (!searchQuery.trim()) return bbsMatches;
    const q = searchQuery.toLowerCase();
    return bbsMatches.filter(
      (m) =>
        (m.home?.name && m.home.name.toLowerCase().includes(q)) ||
        (m.away?.name && m.away.name.toLowerCase().includes(q)) ||
        (m.league && m.league.toLowerCase().includes(q))
    );
  }, [bbsMatches, searchQuery]);

  const filteredLive = useMemo(() => filterMatches(liveScores), [liveScores, searchQuery]);
  const filteredFixtures = useMemo(() => filterMatches(upcomingFixtures), [upcomingFixtures, searchQuery]);
  const filteredFinished = useMemo(() => filterMatches(finishedMatches), [finishedMatches, searchQuery]);

  const handleGlobalRefresh = () => {
    if (activeTab === 'bigballs') {
      loadBbsMatches(true);
    } else {
      loadSportMonksData(true);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#292929] pb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mono-font border border-[#10b981]/40 bg-[#10b981]/10 px-2 py-0.5 text-[10px] tracking-wider text-[#10b981]">
              BIGBALLSDATA SDK + SPORTMONKS v3
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-[#10b981] font-mono">
              <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" /> MULTI-FEED ENGINE CONNECTED
            </span>
          </div>
          <h1 className="display-font text-3xl sm:text-4xl text-[#f0f0f0] mt-2">
            Live Matches & Fixtures Intelligence
          </h1>
          <p className="text-xs text-[#888] mt-1">
            Real-time live scores, multi-league fixtures via BigBallSports SDK, API-Football squad injury wire, match statistics, and standings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGlobalRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 border border-[#333] bg-[#141414] px-3.5 py-2 text-xs text-[#ddd] hover:border-[#555] hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#00f2fe]' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync Live Feeds'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Controls & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* BigBallsData Tab */}
          <button
            onClick={() => setActiveTab('bigballs')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide border transition ${
              activeTab === 'bigballs'
                ? 'border-[#00f2fe] bg-[#00f2fe]/15 text-[#00f2fe]'
                : 'border-[#333] bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            <Zap size={14} className="text-[#00f2fe]" />
            <span>BigBallSports Fixtures</span>
            <span className="mono-font ml-1 rounded bg-[#222] px-1.5 py-0.2 text-[10px] text-white">
              {bbsMatches.length}
            </span>
          </button>

          {/* Breaking Football News Stream (RSS Aggregator) */}
          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide border transition ${
              activeTab === 'news'
                ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300'
                : 'border-[#333] bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            <Newspaper size={14} className="text-cyan-400" />
            <span>News & Transfer Wire</span>
          </button>

          {/* Squad Availability & Injuries Wire (API-Football) */}
          <button
            onClick={() => setActiveTab('injuries')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide border transition ${
              activeTab === 'injuries'
                ? 'border-rose-500 bg-rose-500/15 text-rose-300'
                : 'border-[#333] bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            <Stethoscope size={14} className="text-rose-400" />
            <span>Injury & Medical Wire</span>
          </button>

          {/* SportMonks Live Scores */}
          <button
            onClick={() => setActiveTab('livescores')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide border transition ${
              activeTab === 'livescores'
                ? 'border-[#ff3366] bg-[#ff3366]/15 text-[#ff3366]'
                : 'border-[#333] bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3366] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3366]"></span>
            </span>
            <span>Live Scores</span>
            <span className="mono-font ml-1 rounded bg-[#222] px-1.5 py-0.2 text-[10px] text-white">
              {liveScores.length}
            </span>
          </button>

          {/* SportMonks Upcoming Fixtures */}
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide border transition ${
              activeTab === 'fixtures'
                ? 'border-[#00f2fe] bg-[#00f2fe]/15 text-[#00f2fe]'
                : 'border-[#333] bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            <Calendar size={14} />
            <span>SportMonks Fixtures</span>
            <span className="mono-font ml-1 rounded bg-[#222] px-1.5 py-0.2 text-[10px] text-white">
              {upcomingFixtures.length}
            </span>
          </button>

          {/* SportMonks Finished */}
          <button
            onClick={() => setActiveTab('finished')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide border transition ${
              activeTab === 'finished'
                ? 'border-[#10b981] bg-[#10b981]/15 text-[#10b981]'
                : 'border-[#333] bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>Finished Results</span>
            <span className="mono-font ml-1 rounded bg-[#222] px-1.5 py-0.2 text-[10px] text-white">
              {finishedMatches.length}
            </span>
          </button>

          {/* League Standings */}
          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-wide border transition ${
              activeTab === 'standings'
                ? 'border-[#f59e0b] bg-[#f59e0b]/15 text-[#f59e0b]'
                : 'border-[#333] bg-[#111] text-[#888] hover:text-white'
            }`}
          >
            <Trophy size={14} />
            <span>Standings & Scorers</span>
          </button>
        </div>

        {/* Search Bar */}
        {activeTab !== 'standings' && (
          <div className="relative w-full lg:w-72">
            <Search size={14} className="absolute left-3 top-3 text-[#888]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or league..."
              className="w-full border border-[#333] bg-[#111] py-2 pl-9 pr-3 text-xs text-white placeholder-[#666] focus:border-[#00f2fe] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading && activeTab !== 'bigballs' ? (
        <div className="space-y-4">
          <TableSkeleton rows={8} />
        </div>
      ) : error && activeTab !== 'bigballs' ? (
        <div className="terminal-card p-12 text-center text-rose-400 border border-rose-900/40">
          <p className="font-semibold">Live Feeds Connection Error</p>
          <p className="text-xs text-[#888] mt-1">{error}</p>
        </div>
      ) : (
        <>
          {/* TAB 0: BIGBALLSDATA SDK FIXTURES HUB */}
          {activeTab === 'bigballs' && (
            <div className="space-y-6">
              {/* League & Status Filter Bar */}
              <div className="terminal-card p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* League Switcher */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-mono text-[#888] uppercase tracking-wider">
                      Select League (BigBallSports SDK)
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {BBS_LEAGUES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => setBbsLeague(l.code)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium transition ${
                            bbsLeague === l.code
                              ? 'border-[#00f2fe] bg-[#00f2fe]/15 text-[#00f2fe]'
                              : 'border-[#333] text-[#888] hover:text-white hover:border-[#555]'
                          }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Status Switcher */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-mono text-[#888] uppercase tracking-wider">
                      Match Status
                    </p>
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'scheduled', label: 'Upcoming' },
                        { id: 'live', label: 'Live' },
                        { id: 'finished', label: 'Finished' },
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setBbsStatus(st.id)}
                          className={`px-3 py-1.5 border text-xs font-medium transition ${
                            bbsStatus === st.id
                              ? 'border-[#10b981] bg-[#10b981]/15 text-[#10b981]'
                              : 'border-[#333] text-[#888] hover:text-white'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* LIVE BROADCAST TV HUB BANNER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-[#101522] to-black p-4 shadow-[0_0_25px_rgba(244,63,94,0.15)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/50 bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    <Tv size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="mono-font rounded border border-rose-500/50 bg-rose-500/25 px-2 py-0.5 text-[9px] font-bold text-rose-300 uppercase tracking-widest flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                        LIVE TV HUB
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Channel: LaLiga TV HD (1080p 60FPS)</span>
                    </div>
                    <h4 className="display-font text-sm sm:text-base font-bold text-white">
                      Live Television Broadcast Channels
                    </h4>
                  </div>
                </div>
                <Link
                  href="/streams"
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/60 bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:bg-rose-600 transition hover:scale-105 active:scale-95 shrink-0"
                >
                  <Play size={13} fill="currentColor" />
                  <span>Open Live TV Streams</span>
                </Link>
              </div>

              {/* Match Cards Grid */}
              {bbsLoading ? (
                <div className="space-y-4">
                  <TableSkeleton rows={6} />
                </div>
              ) : filteredBbsMatches.length === 0 ? (
                <div className="terminal-card p-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a] text-[#888]">
                    <Calendar size={20} />
                  </div>
                  <h3 className="display-font text-lg text-[#ddd]">No Matches Found</h3>
                  <p className="text-xs text-[#888] max-w-md mx-auto">
                    No matches found for the selected league ({bbsLeague.toUpperCase()}) and status ({bbsStatus}). Try switching leagues or filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="editorial-kicker text-[#00f2fe]">
                      BigBallSports Fixtures & Scores ({filteredBbsMatches.length} Matches)
                    </p>
                    <span className="mono-font text-[10px] text-[#666]">
                      PROVIDER: @bigballsdata/sdk
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredBbsMatches.map((match, idx) => (
                      <BigBallsMatchCard
                        key={`${match.id || 'bbs'}-${idx}`}
                        match={match}
                        onOpenStream={openLaLigaStream}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: GLOBAL FOOTBALL NEWS & TRANSFER WIRE (RSS Aggregator) */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <NewsFeed />
            </div>
          )}

          {/* TAB: SQUAD AVAILABILITY & INJURIES WIRE (API-Football) */}
          {activeTab === 'injuries' && (
            <div className="space-y-6">
              <InjuriesTicker />
            </div>
          )}

          {/* TAB 1: LIVE SCORES (SportMonks) */}
          {activeTab === 'livescores' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="editorial-kicker text-[#ff3366]">
                  Active In-Play Matches ({filteredLive.length})
                </p>
              </div>

              {filteredLive.length === 0 ? (
                <div className="terminal-card p-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#333] bg-[#1a1a1a] text-[#888]">
                    <Clock size={20} />
                  </div>
                  <h3 className="display-font text-lg text-[#ddd]">No Live Matches In-Play Right Now</h3>
                  <p className="text-xs text-[#888] max-w-md mx-auto">
                    There are currently no active live matches broadcasting on SportMonks. Check{' '}
                    <button
                      onClick={() => setActiveTab('bigballs')}
                      className="text-[#00f2fe] underline font-semibold"
                    >
                      BigBallSports Fixtures
                    </button>{' '}
                    or view{' '}
                    <button
                      onClick={() => setActiveTab('finished')}
                      className="text-[#10b981] underline font-semibold"
                    >
                      Finished Match Results
                    </button>
                    .
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredLive.map((m, idx) => (
                    <MatchCard
                      key={`${m.id || 'live'}-${idx}`}
                      match={m}
                      onOpen={openMatchCenter}
                      onOpenStream={openLaLigaStream}
                      type="live"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPCOMING FIXTURES (SportMonks) */}
          {activeTab === 'fixtures' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="editorial-kicker text-[#00f2fe]">
                  Upcoming Fixtures ({filteredFixtures.length} matches scheduled)
                </p>

                {/* Day Range Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#888] mr-1">Window:</span>
                  {[3, 7, 14, 21].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFixtureDays(d)}
                      className={`px-2.5 py-1 border text-[11px] font-mono transition ${
                        fixtureDays === d
                          ? 'border-[#00f2fe] bg-[#00f2fe]/20 text-[#00f2fe]'
                          : 'border-[#333] text-[#888] hover:text-white'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {filteredFixtures.length === 0 ? (
                <div className="terminal-card p-12 text-center">
                  <p className="text-xs text-[#888]">No upcoming fixtures found for this filter.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredFixtures.map((m, idx) => (
                    <MatchCard
                      key={`${m.id || 'fix'}-${idx}`}
                      match={m}
                      onOpen={openMatchCenter}
                      onOpenStream={openLaLigaStream}
                      type="fixture"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINISHED MATCHES (SportMonks) */}
          {activeTab === 'finished' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="editorial-kicker text-[#10b981]">
                  Completed Match Results ({filteredFinished.length} matches)
                </p>

                {/* Day Range Filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#888] mr-1">Past Window:</span>
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFinishedDays(d)}
                      className={`px-2.5 py-1 border text-[11px] font-mono transition ${
                        finishedDays === d
                          ? 'border-[#10b981] bg-[#10b981]/20 text-[#10b981]'
                          : 'border-[#333] text-[#888] hover:text-white'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {filteredFinished.length === 0 ? (
                <div className="terminal-card p-12 text-center">
                  <p className="text-xs text-[#888]">No finished matches found for this period.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredFinished.map((m, idx) => (
                    <MatchCard
                      key={`${m.id || 'fin'}-${idx}`}
                      match={m}
                      onOpen={openMatchCenter}
                      onOpenStream={openLaLigaStream}
                      type="finished"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEAGUE STANDINGS & SCORERS (Football-Data.org) */}
          {activeTab === 'standings' && (
            <div className="space-y-6">
              {/* League Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {FD_LEAGUES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setSelectedFdLeague(l.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium transition ${
                      selectedFdLeague === l.code
                        ? 'border-[#f59e0b] bg-[#f59e0b]/15 text-[#f59e0b]'
                        : 'border-[#333] text-[#888] hover:text-white'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Standings Table (8 cols) */}
                <div className="lg:col-span-8 terminal-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="text-[#f59e0b]" size={18} />
                    <h3 className="display-font text-lg text-white">League Standings Table</h3>
                  </div>

                  {standings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#292929] text-left text-[#888]">
                            <th className="pb-3 pl-2">Pos</th>
                            <th className="pb-3">Club</th>
                            <th className="pb-3 text-center">P</th>
                            <th className="pb-3 text-center">W</th>
                            <th className="pb-3 text-center">D</th>
                            <th className="pb-3 text-center">L</th>
                            <th className="pb-3 text-center">GD</th>
                            <th className="pb-3 text-center font-bold text-white">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e1e1e]">
                          {standings.map((row, idx) => (
                            <tr
                              key={`${row.team?.id ?? 't'}-${row.position ?? 'p'}-${idx}`}
                              className="hover:bg-[#181818] transition-colors"
                            >
                              <td className="py-2.5 pl-2 mono-font font-bold text-[#888]">
                                {row.position}
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2.5">
                                  {row.team?.crest && (
                                    <img
                                      src={row.team.crest}
                                      alt={row.team.name}
                                      className="w-5 h-5 object-contain shrink-0"
                                    />
                                  )}
                                  <span className="font-semibold text-white truncate">
                                    {row.team?.name ?? 'Team'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 text-center mono-font text-[#aaa]">
                                {row.playedGames}
                              </td>
                              <td className="py-2.5 text-center mono-font text-[#aaa]">
                                {row.won}
                              </td>
                              <td className="py-2.5 text-center mono-font text-[#aaa]">
                                {row.draw}
                              </td>
                              <td className="py-2.5 text-center mono-font text-[#aaa]">
                                {row.lost}
                              </td>
                              <td className="py-2.5 text-center mono-font text-[#aaa]">
                                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                              </td>
                              <td className="py-2.5 text-center mono-font font-bold text-[#f59e0b]">
                                {row.points}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-[#888] py-8 text-center">
                      No standings table available for this league currently.
                    </p>
                  )}
                </div>

                {/* Top Scorers (4 cols) */}
                <div className="lg:col-span-4 terminal-card p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Flame className="text-[#ff3366]" size={18} />
                    <h3 className="display-font text-lg text-white">Golden Boot Race</h3>
                  </div>

                  {scorers.length > 0 ? (
                    <div className="space-y-3">
                      {scorers.map((s, idx) => (
                        <div
                          key={`${s.player?.id ?? 'p'}-${s.team?.id ?? 't'}-${idx}`}
                          className="flex items-center justify-between p-3 border border-[#292929] bg-[#141414] hover:border-[#444] transition"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <span className="mono-font flex h-6 w-6 items-center justify-center border border-[#333] bg-[#202020] text-xs font-bold text-[#ff3366]">
                              {idx + 1}
                            </span>
                            <div className="truncate">
                              <p className="text-xs font-bold text-white truncate">{s.player?.name ?? 'Player'}</p>
                              <p className="text-[10px] text-[#888] truncate">{s.team?.name ?? 'Club'}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="mono-font text-sm font-bold text-[#ff3366]">
                              {s.goals} ⚽
                            </p>
                            {(s.assists ?? 0) > 0 && (
                              <p className="text-[10px] text-[#888] font-mono">{s.assists} Ast</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#888] py-8 text-center">
                      No top scorers loaded for this league.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MATCH CENTER MODAL */}
      {selectedMatchId && matchDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={closeMatchCenter}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#333] bg-[#111] shadow-2xl space-y-6 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#292929] pb-4">
              <div className="flex items-center gap-2">
                <span className="mono-font border border-[#00f2fe]/40 bg-[#00f2fe]/10 px-2 py-0.5 text-[10px] tracking-wider text-[#00f2fe]">
                  {matchDetails.league.name}
                </span>
                {matchDetails.is_live && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#ff3366]">
                    <span className="h-2 w-2 rounded-full bg-[#ff3366] animate-pulse" /> LIVE
                  </span>
                )}
                {matchDetails.is_finished && (
                  <span className="text-[11px] font-bold text-[#10b981]">FULL TIME</span>
                )}
              </div>

              <button
                onClick={closeMatchCenter}
                className="flex h-8 w-8 items-center justify-center border border-[#333] bg-[#181818] text-[#888] hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Teams & Scoreboard Big Banner */}
            <div className="border border-[#292929] bg-[#161616] p-6 text-center space-y-4">
              <div className="grid grid-cols-3 items-center">
                {/* Home */}
                <div className="flex flex-col items-center gap-2">
                  {matchDetails.home_team.image_path ? (
                    <img
                      src={matchDetails.home_team.image_path}
                      alt={matchDetails.home_team.name}
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#252525] flex items-center justify-center text-xl font-bold">
                      {matchDetails.home_team.short_code || 'H'}
                    </div>
                  )}
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {matchDetails.home_team.name}
                  </h3>
                </div>

                {/* Score / State */}
                <div className="space-y-1">
                  <div className="display-font text-3xl sm:text-5xl font-black text-[#00f2fe] tracking-wider">
                    {matchDetails.score.home !== null ? matchDetails.score.home : '—'} :{' '}
                    {matchDetails.score.away !== null ? matchDetails.score.away : '—'}
                  </div>
                  <p className="mono-font text-xs text-[#888]">
                    {matchDetails.is_live
                      ? `${matchDetails.length}' IN PLAY`
                      : matchDetails.is_finished
                      ? 'MATCH FINISHED'
                      : formatDate(matchDetails.starting_at)}
                  </p>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-2">
                  {matchDetails.away_team.image_path ? (
                    <img
                      src={matchDetails.away_team.image_path}
                      alt={matchDetails.away_team.name}
                      className="w-16 h-16 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#252525] flex items-center justify-center text-xl font-bold">
                      {matchDetails.away_team.short_code || 'A'}
                    </div>
                  )}
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {matchDetails.away_team.name}
                  </h3>
                </div>
              </div>

              {matchDetails.venue.name && (
                <div className="flex items-center justify-center gap-1 text-[11px] text-[#888] pt-2 border-t border-[#252525]">
                  <MapPin size={12} className="text-[#00f2fe]" />
                  <span>
                    {matchDetails.venue.name} ({matchDetails.venue.city_name || 'Stadium'})
                  </span>
                </div>
              )}
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 border-b border-[#292929] pb-1">
              {[
                { id: 'timeline', label: 'Match Events', icon: Activity },
                { id: 'stats', label: 'Head-to-Head Stats', icon: BarChart2 },
                { id: 'lineups', label: 'Squad Lineups', icon: Users },
                ...(isLaLigaMatch(matchDetails.league?.name, matchDetails.name)
                  ? [{ id: 'stream', label: '🔴 Live Stream', icon: Video }]
                  : []),
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setModalTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold transition ${
                      modalTab === tab.id
                        ? tab.id === 'stream'
                          ? 'border-rose-500 bg-rose-500/15 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                          : 'border-[#00f2fe] bg-[#00f2fe]/15 text-[#00f2fe]'
                        : 'border-[#333] text-[#888] hover:text-white'
                    }`}
                  >
                    <Icon size={13} className={tab.id === 'stream' ? 'text-rose-400 animate-pulse' : ''} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Tab Contents */}
            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-[#888]">
                <RefreshCw size={18} className="animate-spin text-[#00f2fe] mx-auto mb-2" />
                Loading detailed match events & lineups...
              </div>
            ) : (
              <div className="space-y-4">
                {/* 0. LIVE STREAM TAB (La Liga) */}
                {modalTab === 'stream' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                        <Radio size={14} className="animate-pulse" /> Official La Liga HD Broadcast Stream
                      </span>
                      <button
                        onClick={() =>
                          openLaLigaStream({
                            home: matchDetails.home_team.name,
                            away: matchDetails.away_team.name,
                            score:
                              matchDetails.score.home !== null
                                ? `${matchDetails.score.home} - ${matchDetails.score.away}`
                                : undefined,
                            title: `${matchDetails.home_team.name} vs ${matchDetails.away_team.name} (La Liga Live Stream)`,
                          })
                        }
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                      >
                        <span>Theater Mode</span>
                        <Play size={11} fill="currentColor" />
                      </button>
                    </div>

                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-rose-500/40 bg-black shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                      <iframe
                        src={LALIGA_STREAM_URL}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}

                {/* 1. TIMELINE */}
                {modalTab === 'timeline' && (
                  <div className="space-y-2">
                    {matchDetails.events && matchDetails.events.length > 0 ? (
                      matchDetails.events.map((ev, idx) => (
                        <div
                          key={ev.id || idx}
                          className={`flex items-center gap-3 p-2.5 border border-[#252525] bg-[#161616] text-xs ${
                            ev.is_home ? 'border-l-2 border-l-[#00f2fe]' : 'border-r-2 border-r-[#f59e0b]'
                          }`}
                        >
                          <span className="mono-font font-bold text-[#00f2fe] shrink-0 w-8">
                            {ev.minute}'
                          </span>
                          <span className="shrink-0">{getEventIcon(ev.type)}</span>
                          <div className="truncate">
                            <span className="font-semibold text-white">{ev.player_name}</span>
                            {ev.related_player_name && (
                              <span className="text-[#888] ml-1">(assist: {ev.related_player_name})</span>
                            )}
                          </div>
                          {ev.result && (
                            <span className="mono-font font-bold text-[#f59e0b] ml-auto">
                              {ev.result}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-[#888] py-8 text-center">
                        No match events recorded yet for this fixture.
                      </p>
                    )}
                  </div>
                )}

                {/* 2. STATS */}
                {modalTab === 'stats' && (
                  <div className="space-y-3">
                    {matchDetails.statistics && matchDetails.statistics.length > 0 ? (
                      matchDetails.statistics.map((st, idx) => {
                        const total = (st.home_value || 0) + (st.away_value || 0);
                        const homePct = total > 0 ? Math.round((st.home_value / total) * 100) : 50;
                        return (
                          <div key={idx} className="space-y-1 p-2 border border-[#222] bg-[#141414]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="mono-font font-bold text-[#00f2fe]">
                                {st.home_value}
                              </span>
                              <span className="text-[#888] font-medium">{st.name}</span>
                              <span className="mono-font font-bold text-[#f59e0b]">
                                {st.away_value}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-[#252525] rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${homePct}%` }}
                                className="bg-[#00f2fe] h-full"
                              />
                              <div
                                style={{ width: `${100 - homePct}%` }}
                                className="bg-[#f59e0b] h-full"
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-[#888] py-8 text-center">
                        Detailed statistics not available for this match.
                      </p>
                    )}
                  </div>
                )}

                {/* 3. LINEUPS */}
                {modalTab === 'lineups' && matchDetails.lineups && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Starting XI */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#00f2fe] uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={13} /> {matchDetails.home_team.name} Starting XI
                      </h4>
                      <div className="space-y-1">
                        {matchDetails.lineups.home.starting_xi.map((p, idx) => (
                          <LineupPlayerRow key={p.id || idx} player={p} />
                        ))}
                      </div>

                      {matchDetails.lineups.home.bench.length > 0 && (
                        <>
                          <h5 className="text-[11px] font-semibold text-[#888] pt-2 uppercase">
                            Substitutes
                          </h5>
                          <div className="space-y-1">
                            {matchDetails.lineups.home.bench.map((p, idx) => (
                              <LineupPlayerRow key={p.id || idx} player={p} isBench />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Away Starting XI */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider flex items-center gap-1.5">
                        <Users size={13} /> {matchDetails.away_team.name} Starting XI
                      </h4>
                      <div className="space-y-1">
                        {matchDetails.lineups.away.starting_xi.map((p, idx) => (
                          <LineupPlayerRow key={p.id || idx} player={p} />
                        ))}
                      </div>

                      {matchDetails.lineups.away.bench.length > 0 && (
                        <>
                          <h5 className="text-[11px] font-semibold text-[#888] pt-2 uppercase">
                            Substitutes
                          </h5>
                          <div className="space-y-1">
                            {matchDetails.lineups.away.bench.map((p, idx) => (
                              <LineupPlayerRow key={p.id || idx} player={p} isBench />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LA LIGA LIVE STREAM BROADCAST THEATER MODAL */}
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

// ──────────────────────────────────────────────
// Helper Functions & Components
// ──────────────────────────────────────────────

function isLaLigaMatch(leagueName?: string, matchName?: string): boolean {
  const text = `${leagueName || ''} ${matchName || ''}`.toLowerCase();
  return (
    text.includes('laliga') ||
    text.includes('la liga') ||
    text.includes('primera') ||
    text.includes('esp-') ||
    text.includes('spain') ||
    text.includes('españa') ||
    text.includes('santander')
  );
}

function BigBallsMatchCard({
  match,
  onOpenStream,
}: {
  match: BigBallsMatch;
  onOpenStream?: (info: { home?: string; away?: string; score?: string; title?: string }) => void;
}) {
  const isLive = match.status === 'live' || match.status === 'in_progress';
  const isFinished = match.status === 'finished';
  const isScheduled = match.status === 'scheduled';

  const leagueLabel = (match.league || 'FOOTBALL').toUpperCase();
  const homeName = match.home?.name || 'Home Team';
  const awayName = match.away?.name || 'Away Team';
  const homeShort = match.home?.short_name || (match.home?.name ? match.home.name.slice(0, 3).toUpperCase() : 'H');
  const awayShort = match.away?.short_name || (match.away?.name ? match.away.name.slice(0, 3).toUpperCase() : 'A');
  const isLaLiga = isLaLigaMatch(match.league, `${homeName} ${awayName}`);

  const kickoffFormatted = match.kickoff_utc
    ? new Date(match.kickoff_utc).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Scheduled';

  return (
    <div
      className={`terminal-card p-4 space-y-4 hover:border-[#444] transition group ${
        isLaLiga ? 'border-rose-900/40 bg-gradient-to-b from-[#11141e] to-[#0c1018]' : ''
      }`}
    >
      {/* Header with League & Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`mono-font border px-2 py-0.5 text-[10px] font-semibold ${
              isLaLiga
                ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                : 'border-[#00f2fe]/40 bg-[#00f2fe]/10 text-[#00f2fe]'
            }`}
          >
            {leagueLabel}
          </span>
          {match.broadcast && (
            <span className="flex items-center gap-1 text-[10px] text-[#888] border border-[#292929] bg-[#1a1a1a] px-1.5 py-0.5 rounded">
              <Tv size={10} className="text-[#00f2fe]" /> {match.broadcast}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="flex items-center gap-1 mono-font border border-[#ff3366]/40 bg-[#ff3366]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff3366]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff3366] animate-pulse" /> LIVE
            </span>
          ) : isFinished ? (
            <span className="mono-font border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-bold text-[#10b981]">
              FT
            </span>
          ) : (
            <span className="mono-font border border-[#333] bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#888]">
              {kickoffFormatted}
            </span>
          )}
        </div>
      </div>

      {/* Teams & Scoreline */}
      <div className="space-y-3">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            {match.home?.logo_url ? (
              <img
                src={match.home.logo_url}
                alt={homeName}
                className="w-6 h-6 object-contain shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-[#252525] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {homeShort}
              </div>
            )}
            <span className="text-sm font-semibold text-[#f0f0f0] truncate">
              {homeName}
            </span>
          </div>

          <span className="mono-font text-base font-bold text-white">
            {match.score?.home !== null && match.score?.home !== undefined ? match.score.home : '—'}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            {match.away?.logo_url ? (
              <img
                src={match.away.logo_url}
                alt={awayName}
                className="w-6 h-6 object-contain shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded bg-[#252525] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {awayShort}
              </div>
            )}
            <span className="text-sm font-semibold text-[#f0f0f0] truncate">
              {awayName}
            </span>
          </div>

          <span className="mono-font text-base font-bold text-white">
            {match.score?.away !== null && match.score?.away !== undefined ? match.score.away : '—'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#222] pt-3 text-[11px] text-[#888]">
        <span className="flex items-center gap-1">
          <Calendar size={11} className="text-[#888]" />
          <span>{kickoffFormatted}</span>
        </span>

        {isLaLiga ? (
          <Link
            href="/streams"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/60 bg-rose-500/20 px-2.5 py-1 text-[11px] font-bold text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:bg-rose-500 hover:text-white transition"
          >
            <Tv size={12} className="text-rose-400 animate-pulse" />
            <span>Live TV</span>
          </Link>
        ) : match.has_odds ? (
          <span className="flex items-center gap-1 text-[10px] text-[#f59e0b] border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-1.5 py-0.2 rounded">
            <Coins size={10} /> Odds Active
          </span>
        ) : null}
      </div>
    </div>
  );
}

function MatchCard({
  match,
  onOpen,
  onOpenStream,
  type,
}: {
  match: SportMonksMatch;
  onOpen: (match: SportMonksMatch) => void;
  onOpenStream?: (info: { home?: string; away?: string; score?: string; title?: string }) => void;
  type: 'live' | 'fixture' | 'finished';
}) {
  const isLaLiga = isLaLigaMatch(match.league?.name, match.name);

  return (
    <div
      onClick={() => onOpen(match)}
      className={`terminal-card p-4 space-y-4 hover:border-[#444] cursor-pointer transition group ${
        isLaLiga ? 'border-rose-900/30 bg-gradient-to-b from-[#11141e] to-[#0c1018]' : ''
      }`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`mono-font border px-2 py-0.5 text-[10px] tracking-wider ${
            isLaLiga
              ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
              : 'border-[#00f2fe]/40 bg-[#00f2fe]/10 text-[#00f2fe]'
          }`}
        >
          {match.league.name}
        </span>

        {type === 'live' && (
          <span className="flex items-center gap-1 mono-font border border-[#ff3366]/40 bg-[#ff3366]/15 px-2 py-0.5 text-[10px] font-bold text-[#ff3366]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff3366] animate-pulse" />
            {match.length}'
          </span>
        )}

        {type === 'fixture' && (
          <span className="mono-font border border-[#333] bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#888]">
            {match.starting_at ? formatDate(match.starting_at) : 'Upcoming'}
          </span>
        )}

        {type === 'finished' && (
          <span className="mono-font border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-[10px] font-bold text-[#10b981]">
            FT
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="mt-4 space-y-3">
        {/* Home */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            {match.home_team.image_path ? (
              <img
                src={match.home_team.image_path}
                alt={match.home_team.name}
                className="w-6 h-6 object-contain shrink-0"
              />
            ) : (
              <div className="w-6 h-6 flex items-center justify-center bg-[#252525] text-[10px] font-bold">
                {match.home_team.short_code || 'H'}
              </div>
            )}
            <span
              className={`text-sm truncate ${
                match.home_team.is_winner ? 'font-bold text-white' : 'text-[#ddd]'
              }`}
            >
              {match.home_team.name}
            </span>
          </div>

          <span className="mono-font text-base font-bold text-[#f0f0f0]">
            {match.score.home !== null ? match.score.home : '—'}
          </span>
        </div>

        {/* Away */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            {match.away_team.image_path ? (
              <img
                src={match.away_team.image_path}
                alt={match.away_team.name}
                className="w-6 h-6 object-contain shrink-0"
              />
            ) : (
              <div className="w-6 h-6 flex items-center justify-center bg-[#252525] text-[10px] font-bold">
                {match.away_team.short_code || 'A'}
              </div>
            )}
            <span
              className={`text-sm truncate ${
                match.away_team.is_winner ? 'font-bold text-white' : 'text-[#ddd]'
              }`}
            >
              {match.away_team.name}
            </span>
          </div>

          <span className="mono-font text-base font-bold text-[#f0f0f0]">
            {match.score.away !== null ? match.score.away : '—'}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#222] pt-3 text-[11px] text-[#888]">
        <div className="flex items-center gap-1.5 truncate">
          {type === 'fixture' ? (
            <span>📅 {match.starting_at ? formatDate(match.starting_at) : 'Scheduled'}</span>
          ) : match.result_info ? (
            <span className="truncate text-[#aaa]">{match.result_info}</span>
          ) : (
            <span>{match.venue.name || 'Stadium'}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLaLiga && (
            <Link
              href="/streams"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-md border border-rose-500/60 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition"
            >
              <Tv size={10} className="text-rose-400 animate-pulse" />
              <span>Live TV</span>
            </Link>
          )}

          <span className="text-[#00f2fe] flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
            Match Center <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  );
}

function LineupPlayerRow({
  player,
  isBench = false,
}: {
  player: SportMonksLineupPlayer;
  isBench?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-2 border border-[#222] bg-[#161616] text-xs ${
        isBench ? 'opacity-80' : ''
      }`}
    >
      <div className="flex items-center gap-2.5 truncate">
        {player.jersey_number !== undefined && player.jersey_number !== null ? (
          <span className="mono-font flex h-5 w-5 items-center justify-center border border-[#333] bg-[#222] text-[10px] font-bold text-[#f59e0b]">
            {player.jersey_number}
          </span>
        ) : (
          <span className="w-5 text-center text-[#666]">-</span>
        )}

        <span className="font-medium text-white truncate">{player.name}</span>
      </div>

      {player.position && (
        <span className="mono-font text-[10px] text-[#888] shrink-0">{player.position}</span>
      )}
    </div>
  );
}

function getEventIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'goal':
    case 'penalty_goal':
      return '⚽';
    case 'yellowcard':
      return '🟨';
    case 'redcard':
      return '🟥';
    case 'substitution':
      return '🔄';
    default:
      return '⏱️';
  }
}
