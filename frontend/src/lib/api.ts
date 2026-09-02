import {
  OverviewData,
  TransfersResponse,
  PlayerSearchItem,
  PlayerProfile,
  ClubsData,
  StandingRow,
  ScorerRow,
  MatchRow,
  EstimatorResponse,
  ModelMetadata,
  ComparedPlayer,
  SportMonksMatch,
  SportMonksMatchesResponse,
  TransfermarktLiveResponse,
  BigBallsMatchesResponse,
  ApiFootballInjuriesResponse,
  ApiFootballScorersResponse,
  ApiFootballAssistsResponse,
  LiveApiStatusResponse,
  FootballNewsResponse,
  FootballNewsArticle,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined.');
}

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error [${res.status}]: ${errText || res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error(`Fetch error on ${url}:`, err.message);
    }
    throw err;
  }
}

export const api = {
  // Overview
  getOverview: () => fetchJSON<OverviewData>('/api/overview'),

  // Players
  searchPlayers: (query: string, limit = 15) =>
    fetchJSON<{ query: string; count: number; players: PlayerSearchItem[] }>(
      `/api/players/search?q=${encodeURIComponent(query)}&limit=${limit}`
    ),

  getPlayersDirectory: (params?: { position?: string; min_market_value?: number; page?: number; page_size?: number }) => {
    const q = new URLSearchParams();
    if (params?.position) q.append('position', params.position);
    if (params?.min_market_value) q.append('min_market_value', String(params.min_market_value));
    if (params?.page) q.append('page', String(params.page));
    if (params?.page_size) q.append('page_size', String(params.page_size));
    return fetchJSON<{ total: number; page: number; page_size: number; players: PlayerSearchItem[] }>(
      `/api/players/directory?${q.toString()}`
    );
  },

  getPlayerProfile: (playerId: number | string) =>
    fetchJSON<PlayerProfile>(`/api/players/${playerId}`),

  comparePlayers: (playerIds: number[]) =>
    fetchJSON<{ count: number; players: ComparedPlayer[] }>('/api/players/compare', {
      method: 'POST',
      body: JSON.stringify({ player_ids: playerIds }),
    }),

  // Transfers
  getTransfers: (params: {
    min_fee?: number;
    max_fee?: number;
    club?: string;
    position?: string;
    season?: string;
    sort_by?: string;
    page?: number;
    page_size?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.min_fee !== undefined) q.append('min_fee', String(params.min_fee));
    if (params.max_fee !== undefined) q.append('max_fee', String(params.max_fee));
    if (params.club) q.append('club', params.club);
    if (params.position) q.append('position', params.position);
    if (params.season) q.append('season', params.season);
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.page !== undefined) q.append('page', String(params.page));
    if (params.page_size !== undefined) q.append('page_size', String(params.page_size));
    return fetchJSON<TransfersResponse>(`/api/transfers?${q.toString()}`);
  },

  // Estimator
  predictScenario: (payload: {
    name?: string;
    age: number;
    position: string;
    market_value_before: number;
    prior_minutes: number;
    goals: number;
    assists: number;
    configuration: 'performance_only' | 'market_aware';
  }, options?: RequestInit) =>
    fetchJSON<EstimatorResponse>('/api/estimator/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    }),

  estimatePlayer: (playerId: number | string) =>
    fetchJSON<EstimatorResponse>(`/api/estimator/player/${playerId}`),

  getModelMetadata: () => fetchJSON<ModelMetadata>('/api/estimator/models'),

  // Clubs
  getClubs: (limit = 20) => fetchJSON<ClubsData>(`/api/clubs?limit=${limit}`),

  // API-Football / API-Sports REST Endpoints
  getInjuries: (params?: {
    league?: number;
    season?: number;
    team?: number;
    player?: number;
    date?: string;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.league !== undefined) q.append('league', String(params.league));
    if (params?.season !== undefined) q.append('season', String(params.season));
    if (params?.team !== undefined) q.append('team', String(params.team));
    if (params?.player !== undefined) q.append('player', String(params.player));
    if (params?.date) q.append('date', params.date);
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    return fetchJSON<ApiFootballInjuriesResponse>(`/api/live/injuries?${q.toString()}`);
  },

  getApiFootballTopScorers: (params?: { league?: number; season?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.league !== undefined) q.append('league', String(params.league));
    if (params?.season !== undefined) q.append('season', String(params.season));
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    return fetchJSON<ApiFootballScorersResponse>(`/api/live/topscorers?${q.toString()}`);
  },

  getApiFootballTopAssists: (params?: { league?: number; season?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.league !== undefined) q.append('league', String(params.league));
    if (params?.season !== undefined) q.append('season', String(params.season));
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    return fetchJSON<ApiFootballAssistsResponse>(`/api/live/topassists?${q.toString()}`);
  },

  getApiFootballFixtures: (params?: {
    live?: boolean;
    date?: string;
    league?: number;
    season?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.live !== undefined) q.append('live', String(params.live));
    if (params?.date) q.append('date', params.date);
    if (params?.league !== undefined) q.append('league', String(params.league));
    if (params?.season !== undefined) q.append('season', String(params.season));
    return fetchJSON<{ count: number; matches: any[] }>(`/api/live/apifootball/fixtures?${q.toString()}`);
  },

  searchApiFootballPlayers: (query: string, league?: number, season = 2024) => {
    const q = new URLSearchParams();
    q.append('query', query);
    if (league !== undefined) q.append('league', String(league));
    q.append('season', String(season));
    return fetchJSON<{ query: string; count: number; players: any[] }>(
      `/api/live/apifootball/search?${q.toString()}`
    );
  },

  getApiFootballTransfers: (params: { player_id?: number; team_id?: number }) => {
    const q = new URLSearchParams();
    if (params.player_id !== undefined) q.append('player_id', String(params.player_id));
    if (params.team_id !== undefined) q.append('team_id', String(params.team_id));
    return fetchJSON<{ count: number; transfers: any[] }>(
      `/api/live/apifootball/transfers?${q.toString()}`
    );
  },

  // Live API Status
  getLiveStatus: () => fetchJSON<LiveApiStatusResponse>('/api/live/status'),

  // Football-Data.org Compatibility Endpoints
  getLiveStandings: (code: string) =>
    fetchJSON<{ competition: any; season: any; table: StandingRow[] }>(
      `/api/live/standings/${code}`
    ),

  getLiveScorers: (code: string, limit = 15) =>
    fetchJSON<{ competition: string; scorers: ScorerRow[] }>(
      `/api/live/scorers/${code}?limit=${limit}`
    ),

  getLiveMatches: (code: string) =>
    fetchJSON<{ competition: string; count: number; matches: MatchRow[] }>(
      `/api/live/matches/${code}`
    ),

  // Live (SportMonks v3)
  getSportMonksLiveScores: (inplay_only = false) =>
    fetchJSON<SportMonksMatchesResponse>(
      `/api/live/livescores?inplay_only=${inplay_only}`
    ),

  getSportMonksFixtures: (params?: { days?: number; date?: string; league_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.days !== undefined) q.append('days', String(params.days));
    if (params?.date) q.append('date', params.date);
    if (params?.league_id !== undefined) q.append('league_id', String(params.league_id));
    return fetchJSON<SportMonksMatchesResponse>(`/api/live/fixtures?${q.toString()}`);
  },

  getSportMonksFinished: (params?: { days?: number; date?: string; league_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.days !== undefined) q.append('days', String(params.days));
    if (params?.date) q.append('date', params.date);
    if (params?.league_id !== undefined) q.append('league_id', String(params.league_id));
    return fetchJSON<SportMonksMatchesResponse>(`/api/live/finished?${q.toString()}`);
  },

  getSportMonksMatchDetails: (fixtureId: number | string) =>
    fetchJSON<SportMonksMatch>(`/api/live/match/${fixtureId}`),

  getSportMonksLeagues: () =>
    fetchJSON<{ count: number; leagues: any[] }>('/api/live/leagues'),

  // Transfermarkt Live Intelligence (Apify Scraper)
  getPlayerTransfermarktLive: (playerId: number | string, refresh = false) =>
    fetchJSON<TransfermarktLiveResponse>(
      `/api/players/${playerId}/live-transfermarkt?refresh=${refresh}`
    ),

  searchTransfermarktLive: (query: string, refresh = false) =>
    fetchJSON<TransfermarktLiveResponse>(
      `/api/players/live-transfermarkt/search?q=${encodeURIComponent(query)}&refresh=${refresh}`
    ),

  // BigBallsData SDK Match Intelligence (/api/live/bigballs/matches route)
  getBigBallsMatches: async (params?: { league?: string; status?: string; limit?: number; date?: string }) => {
    const q = new URLSearchParams();
    if (params?.league && params.league !== 'all') q.append('league', params.league);
    if (params?.status && params.status !== 'all') q.append('status', params.status);
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    if (params?.date) q.append('date', params.date);

    try {
      return await fetchJSON<BigBallsMatchesResponse>(`/api/live/bigballs/matches?${q.toString()}`);
    } catch (err) {
      // Fallback to Next.js route handler
      try {
        const res = await fetch(`/api/matches?${q.toString()}`, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch (_) {}
      return { count: 0, data: [], error: null } as BigBallsMatchesResponse;
    }
  },

  // Real-Time RSS News Aggregator (BBC, Sky, Guardian, ESPN)
  getNews: (params?: {
    category?: string;
    query?: string;
    source?: string;
    limit?: number;
    refresh?: boolean;
  }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.query) q.append('query', params.query);
    if (params?.source) q.append('source', params.source);
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    if (params?.refresh) q.append('refresh', 'true');
    return fetchJSON<FootballNewsResponse>(`/api/news?${q.toString()}`);
  },

  getTransferNews: (params?: { query?: string; limit?: number; refresh?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.query) q.append('query', params.query);
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    if (params?.refresh) q.append('refresh', 'true');
    return fetchJSON<FootballNewsResponse>(`/api/news/transfers?${q.toString()}`);
  },

  getInjuryNews: (params?: { query?: string; limit?: number; refresh?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.query) q.append('query', params.query);
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    if (params?.refresh) q.append('refresh', 'true');
    return fetchJSON<FootballNewsResponse>(`/api/news/injuries?${q.toString()}`);
  },
};
