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
  LiveFootballPopularLeague,
  LiveFootballCountry,
  LiveFootballLeague,
  LiveFootballMatch,
  LiveFootballStanding,
  LiveFootballPlayerLeader,
  LiveFootballTransfer,
  LiveFootballTransfersResponse,
  LiveFootballNewsItem,
  LiveFootballSearchResultItem,
  FeaturedShowcaseMatch,
  FeaturedShowcaseResponse,
  BallonApiResponse,
} from './types';

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://ball-on.onrender.com'
    : 'http://127.0.0.1:8080')
).replace(/\/+$/, '');

export const API_URL = API_BASE_URL;

async function fetchJSON<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`;

  const url = `${API_BASE_URL}${normalizedEndpoint}`;

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
      throw new Error(
        `API Error [${res.status}]: ${errText || res.statusText}`
      );
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
    fetchJSON<{
      query: string;
      count: number;
      players: PlayerSearchItem[];
    }>(
      `/api/players/search?q=${encodeURIComponent(query)}&limit=${limit}`
    ),

  getPlayersDirectory: (params?: {
    position?: string;
    min_market_value?: number;
    page?: number;
    page_size?: number;
  }) => {
    const q = new URLSearchParams();

    if (params?.position) q.append('position', params.position);
    if (params?.min_market_value !== undefined) {
      q.append('min_market_value', String(params.min_market_value));
    }
    if (params?.page !== undefined) {
      q.append('page', String(params.page));
    }
    if (params?.page_size !== undefined) {
      q.append('page_size', String(params.page_size));
    }

    return fetchJSON<{
      total: number;
      page: number;
      page_size: number;
      players: PlayerSearchItem[];
    }>(`/api/players/directory?${q.toString()}`);
  },

  getPlayerProfile: (playerId: number | string) =>
    fetchJSON<PlayerProfile>(`/api/players/${playerId}`),

  comparePlayers: (playerIds: number[]) =>
    fetchJSON<{ count: number; players: ComparedPlayer[] }>(
      '/api/players/compare',
      {
        method: 'POST',
        body: JSON.stringify({ player_ids: playerIds }),
      }
    ),

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

    if (params.min_fee !== undefined) {
      q.append('min_fee', String(params.min_fee));
    }
    if (params.max_fee !== undefined) {
      q.append('max_fee', String(params.max_fee));
    }
    if (params.club) q.append('club', params.club);
    if (params.position) q.append('position', params.position);
    if (params.season) q.append('season', params.season);
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.page !== undefined) {
      q.append('page', String(params.page));
    }
    if (params.page_size !== undefined) {
      q.append('page_size', String(params.page_size));
    }

    return fetchJSON<TransfersResponse>(`/api/transfers?${q.toString()}`);
  },

  getTopTransfers: (limit = 10, min_fee = 1_000_000) =>
    fetchJSON<{ count: number; transfers: any[] }>(
      `/api/transfers/top?limit=${limit}&min_fee=${min_fee}`
    ),

  // Estimator
  predictScenario: (
    payload: {
      name?: string;
      age: number;
      position: string;
      market_value_before: number;
      prior_minutes: number;
      goals: number;
      assists: number;
      configuration: 'performance_only' | 'market_aware';
    },
    options?: RequestInit
  ) =>
    fetchJSON<EstimatorResponse>('/api/estimator/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    }),

  estimatePlayer: (playerId: number | string) =>
    fetchJSON<EstimatorResponse>(
      `/api/estimator/player/${playerId}`
    ),

  getModelMetadata: () =>
    fetchJSON<ModelMetadata>('/api/estimator/models'),

  // Clubs
  getClubs: (limit = 20) =>
    fetchJSON<ClubsData>(`/api/clubs?limit=${limit}`),

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

    if (params?.league !== undefined) {
      q.append('league', String(params.league));
    }
    if (params?.season !== undefined) {
      q.append('season', String(params.season));
    }
    if (params?.team !== undefined) {
      q.append('team', String(params.team));
    }
    if (params?.player !== undefined) {
      q.append('player', String(params.player));
    }
    if (params?.date) q.append('date', params.date);
    if (params?.limit !== undefined) {
      q.append('limit', String(params.limit));
    }

    return fetchJSON<ApiFootballInjuriesResponse>(
      `/api/live/injuries?${q.toString()}`
    );
  },

  getApiFootballTopScorers: (params?: {
    league?: number;
    season?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();

    if (params?.league !== undefined) {
      q.append('league', String(params.league));
    }
    if (params?.season !== undefined) {
      q.append('season', String(params.season));
    }
    if (params?.limit !== undefined) {
      q.append('limit', String(params.limit));
    }

    return fetchJSON<ApiFootballScorersResponse>(
      `/api/live/topscorers?${q.toString()}`
    );
  },

  getApiFootballTopAssists: (params?: {
    league?: number;
    season?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();

    if (params?.league !== undefined) {
      q.append('league', String(params.league));
    }
    if (params?.season !== undefined) {
      q.append('season', String(params.season));
    }
    if (params?.limit !== undefined) {
      q.append('limit', String(params.limit));
    }

    return fetchJSON<ApiFootballAssistsResponse>(
      `/api/live/topassists?${q.toString()}`
    );
  },

  getApiFootballFixtures: (params?: {
    live?: boolean;
    date?: string;
    league?: number;
    season?: number;
  }) => {
    const q = new URLSearchParams();

    if (params?.live !== undefined) {
      q.append('live', String(params.live));
    }
    if (params?.date) q.append('date', params.date);
    if (params?.league !== undefined) {
      q.append('league', String(params.league));
    }
    if (params?.season !== undefined) {
      q.append('season', String(params.season));
    }

    return fetchJSON<{ count: number; matches: any[] }>(
      `/api/live/apifootball/fixtures?${q.toString()}`
    );
  },

  searchApiFootballPlayers: (
    query: string,
    league?: number,
    season = 2024
  ) => {
    const q = new URLSearchParams();

    q.append('query', query);

    if (league !== undefined) {
      q.append('league', String(league));
    }

    q.append('season', String(season));

    return fetchJSON<{
      query: string;
      count: number;
      players: any[];
    }>(`/api/live/apifootball/search?${q.toString()}`);
  },

  getApiFootballTransfers: (params: {
    player_id?: number;
    team_id?: number;
  }) => {
    const q = new URLSearchParams();

    if (params.player_id !== undefined) {
      q.append('player_id', String(params.player_id));
    }

    if (params.team_id !== undefined) {
      q.append('team_id', String(params.team_id));
    }

    return fetchJSON<{ count: number; transfers: any[] }>(
      `/api/live/apifootball/transfers?${q.toString()}`
    );
  },

  // Live API Status
  getLiveStatus: () =>
    fetchJSON<LiveApiStatusResponse>('/api/live/status'),

  // Football-Data.org Compatibility Endpoints
  getLiveStandings: (code: string) =>
    fetchJSON<{
      competition: any;
      season: any;
      table: StandingRow[];
    }>(`/api/live/standings/${code}`),

  getLiveScorers: (code: string, limit = 15) =>
    fetchJSON<{
      competition: string;
      scorers: ScorerRow[];
    }>(`/api/live/scorers/${code}?limit=${limit}`),

  getLiveMatches: (code: string) =>
    fetchJSON<{
      competition: string;
      count: number;
      matches: MatchRow[];
    }>(`/api/live/matches/${code}`),

  // Live (SportMonks v3)
  getSportMonksLiveScores: (inplay_only = false) =>
    fetchJSON<SportMonksMatchesResponse>(
      `/api/live/livescores?inplay_only=${inplay_only}`
    ),

  getSportMonksFixtures: (params?: {
    days?: number;
    date?: string;
    league_id?: number;
  }) => {
    const q = new URLSearchParams();

    if (params?.days !== undefined) {
      q.append('days', String(params.days));
    }
    if (params?.date) q.append('date', params.date);
    if (params?.league_id !== undefined) {
      q.append('league_id', String(params.league_id));
    }

    return fetchJSON<SportMonksMatchesResponse>(
      `/api/live/fixtures?${q.toString()}`
    );
  },

  getSportMonksFinished: (params?: {
    days?: number;
    date?: string;
    league_id?: number;
  }) => {
    const q = new URLSearchParams();

    if (params?.days !== undefined) {
      q.append('days', String(params.days));
    }
    if (params?.date) q.append('date', params.date);
    if (params?.league_id !== undefined) {
      q.append('league_id', String(params.league_id));
    }

    return fetchJSON<SportMonksMatchesResponse>(
      `/api/live/finished?${q.toString()}`
    );
  },

  getSportMonksMatchDetails: (fixtureId: number | string) =>
    fetchJSON<SportMonksMatch>(
      `/api/live/match/${fixtureId}`
    ),

  getSportMonksLeagues: () =>
    fetchJSON<{ count: number; leagues: any[] }>(
      '/api/live/leagues'
    ),

  // Transfermarkt Live Intelligence (Apify Scraper)
  getPlayerTransfermarktLive: (
    playerId: number | string,
    refresh = false
  ) =>
    fetchJSON<TransfermarktLiveResponse>(
      `/api/players/${playerId}/live-transfermarkt?refresh=${refresh}`
    ),

  searchTransfermarktLive: (
    query: string,
    refresh = false
  ) =>
    fetchJSON<TransfermarktLiveResponse>(
      `/api/players/live-transfermarkt/search?q=${encodeURIComponent(query)}&refresh=${refresh}`
    ),

  // Featured Showcase for Dashboard Carousel
  getFeaturedShowcase: async (limit = 8): Promise<FeaturedShowcaseResponse> => {
    try {
      return await fetchJSON<FeaturedShowcaseResponse>(
        `/api/live/featured-showcase?limit=${limit}`
      );
    } catch (_) {
      return { count: 0, live_count: 0, matches: [] };
    }
  },

  // BigBallsData SDK Match Intelligence
  getBigBallsMatches: async (params?: {
    league?: string;
    status?: string;
    limit?: number;
    date?: string;
  }) => {
    const q = new URLSearchParams();

    if (params?.league && params.league !== 'all') {
      q.append('league', params.league);
    }

    if (params?.status && params.status !== 'all') {
      q.append('status', params.status);
    }

    if (params?.limit !== undefined) {
      q.append('limit', String(params.limit));
    }

    if (params?.date) q.append('date', params.date);

    // If running in browser, query local Next.js route first for instant response
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/matches?${q.toString()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          return (await res.json()) as BigBallsMatchesResponse;
        }
      } catch (_) {}
    }

    try {
      return await fetchJSON<BigBallsMatchesResponse>(
        `/api/live/bigballs/matches?${q.toString()}`
      );
    } catch (err) {
      try {
        const res = await fetch(
          `/api/matches?${q.toString()}`,
          { cache: 'no-store' }
        );

        if (res.ok) {
          return await res.json();
        }
      } catch (_) {}

      return {
        count: 0,
        data: [],
        error: null,
      } as BigBallsMatchesResponse;
    }
  },

  // Real-Time RSS News Aggregator
  getNews: (params?: {
    category?: string;
    query?: string;
    source?: string;
    limit?: number;
    refresh?: boolean;
  }) => {
    const q = new URLSearchParams();

    if (params?.category) {
      q.append('category', params.category);
    }

    if (params?.query) {
      q.append('query', params.query);
    }

    if (params?.source) {
      q.append('source', params.source);
    }

    if (params?.limit !== undefined) {
      q.append('limit', String(params.limit));
    }

    if (params?.refresh) {
      q.append('refresh', 'true');
    }

    return fetchJSON<FootballNewsResponse>(
      `/api/news?${q.toString()}`
    );
  },

  getTransferNews: (params?: {
    query?: string;
    limit?: number;
    refresh?: boolean;
  }) => {
    const q = new URLSearchParams();

    if (params?.query) {
      q.append('query', params.query);
    }

    if (params?.limit !== undefined) {
      q.append('limit', String(params.limit));
    }

    if (params?.refresh) {
      q.append('refresh', 'true');
    }

    return fetchJSON<FootballNewsResponse>(
      `/api/news/transfers?${q.toString()}`
    );
  },

  getInjuryNews: (params?: {
    query?: string;
    limit?: number;
    refresh?: boolean;
  }) => {
    const q = new URLSearchParams();

    if (params?.query) {
      q.append('query', params.query);
    }

    if (params?.limit !== undefined) {
      q.append('limit', String(params.limit));
    }

    if (params?.refresh) {
      q.append('refresh', 'true');
    }

    return fetchJSON<FootballNewsResponse>(
      `/api/news/injuries?${q.toString()}`
    );
  },

  // Verified Live Transfers Feed
  getLiveTransfers: (params?: {
    type?: 'top' | 'market_value' | 'all';
    page?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.type) q.append('type', params.type);
    if (params?.page) q.append('page', String(params.page));
    return fetchJSON<LiveFootballTransfersResponse>(
      `/api/transfers/live?${q.toString()}`
    );
  },

  // ──────────────────────────────────────────────
  // Live Football Data RapidAPI Services
  // ──────────────────────────────────────────────
  football: {
    // Leagues
    getPopularLeagues: () =>
      fetchJSON<{ count: number; popular: LiveFootballPopularLeague[] }>(
        '/api/football/leagues/popular'
      ),

    getCountries: () =>
      fetchJSON<{ count: number; countries: LiveFootballCountry[] }>(
        '/api/football/countries'
      ),

    getAllLeagues: () =>
      fetchJSON<{ count: number; leagues: LiveFootballLeague[] }>(
        '/api/football/leagues/all'
      ),

    getLeaguesWithCountries: () =>
      fetchJSON<{ count: number; data: any[] }>(
        '/api/football/leagues/with-countries'
      ),

    getLeagueDetail: (leagueId: number) =>
      fetchJSON<{ league_id: number; detail: any }>(
        `/api/football/leagues/${leagueId}`
      ),

    getLeagueLogo: (leagueId: number) =>
      fetchJSON<{ league_id: number; logo: any }>(
        `/api/football/leagues/${leagueId}/logo`
      ),

    getSeasons: () =>
      fetchJSON<{ count: number; seasons: any[] }>(
        '/api/football/seasons'
      ),

    getLeagueRounds: (leagueId: number) =>
      fetchJSON<{ league_id: number; count: number; rounds: any[] }>(
        `/api/football/leagues/${leagueId}/rounds`
      ),

    getRoundDetail: (roundId: number) =>
      fetchJSON<{ round_id: number; detail: any }>(
        `/api/football/rounds/${roundId}`
      ),

    getLeagueRoundsPlayers: (leagueId: number) =>
      fetchJSON<{ league_id: number; data: any }>(
        `/api/football/leagues/${leagueId}/rounds-players`
      ),

    getLeagueTrophies: (leagueId: number) =>
      fetchJSON<{ league_id: number; count: number; trophies: any[] }>(
        `/api/football/leagues/${leagueId}/trophies`
      ),

    getLeagueTrophiesDetail: (leagueId: number, season = '2023/2024') =>
      fetchJSON<{ league_id: number; season: string; detail: any }>(
        `/api/football/leagues/${leagueId}/trophies/detail?season=${encodeURIComponent(season)}`
      ),

    // Teams
    getTeams: (leagueId: number, type: 'all' | 'home' | 'away' = 'all') =>
      fetchJSON<{ league_id: number; type: string; count: number; teams: any[] }>(
        `/api/football/leagues/${leagueId}/teams?type=${type}`
      ),

    getTeamDetail: (teamId: number) =>
      fetchJSON<{ team_id: number; team: any }>(
        `/api/football/teams/${teamId}`
      ),

    getTeamLogo: (teamId: number) =>
      fetchJSON<{ team_id: number; logo: any }>(
        `/api/football/teams/${teamId}/logo`
      ),

    getTeamPlayers: (teamId: number) =>
      fetchJSON<{ team_id: number; count: number; players: any[] }>(
        `/api/football/teams/${teamId}/players`
      ),

    // Players
    getPlayerDetail: (playerId: number) =>
      fetchJSON<{ player_id: number; detail: any }>(
        `/api/football/players/${playerId}`
      ),

    getPlayerLogo: (playerId: number) =>
      fetchJSON<{ player_id: number; logo: any }>(
        `/api/football/players/${playerId}/logo`
      ),

    // Matches & Live
    getLiveMatches: () =>
      fetchJSON<{ count: number; live: LiveFootballMatch[] }>(
        '/api/football/matches/live'
      ),

    getMatchesByDate: (date: string, leagueId?: number) => {
      const q = new URLSearchParams({ date });
      if (leagueId !== undefined) q.append('league_id', String(leagueId));
      return fetchJSON<{
        date: string;
        league_id?: number;
        count: number;
        matches: LiveFootballMatch[];
      }>(`/api/football/matches/by-date?${q.toString()}`);
    },

    getLeagueMatches: (leagueId: number) =>
      fetchJSON<{ league_id: number; count: number; matches: LiveFootballMatch[] }>(
        `/api/football/leagues/${leagueId}/matches`
      ),

    getMatchDetail: (eventId: number) =>
      fetchJSON<{ event_id: number; detail: any }>(
        `/api/football/matches/${eventId}`
      ),

    getMatchScore: (eventId: number) =>
      fetchJSON<{ event_id: number; score: any }>(
        `/api/football/matches/${eventId}/score`
      ),

    getMatchStatus: (eventId: number) =>
      fetchJSON<{ event_id: number; status: any }>(
        `/api/football/matches/${eventId}/status`
      ),

    getMatchHighlights: (eventId: number) =>
      fetchJSON<{ event_id: number; highlights: any }>(
        `/api/football/matches/${eventId}/highlights`
      ),

    getMatchLocation: (eventId: number) =>
      fetchJSON<{ event_id: number; location: any }>(
        `/api/football/matches/${eventId}/location`
      ),

    getMatchStats: (eventId: number, period: 'all' | 'firstHalf' | 'secondHalf' = 'all') =>
      fetchJSON<{ event_id: number; period: string; stats: any }>(
        `/api/football/matches/${eventId}/stats?period=${period}`
      ),

    getMatchEvents: (eventId: number, period: 'all' | 'firstHalf' | 'secondHalf' = 'all') =>
      fetchJSON<{ event_id: number; period: string; events: any }>(
        `/api/football/matches/${eventId}/events?period=${period}`
      ),

    getMatchReferee: (eventId: number) =>
      fetchJSON<{ event_id: number; referee: any }>(
        `/api/football/matches/${eventId}/referee`
      ),

    getMatchLineups: (eventId: number) =>
      fetchJSON<{ event_id: number; home: any; away: any }>(
        `/api/football/matches/${eventId}/lineups`
      ),

    getHeadToHead: (eventId: number) =>
      fetchJSON<{ event_id: number; head_to_head: any }>(
        `/api/football/matches/${eventId}/head-to-head`
      ),

    // Standings & Leaders
    getStandings: (leagueId = 47, type: 'all' | 'home' | 'away' = 'all') =>
      fetchJSON<{
        league_id: number;
        type: string;
        count: number;
        standings: LiveFootballStanding[];
      }>(`/api/football/leagues/${leagueId}/standings?type=${type}`),

    getLeaders: (leagueId = 47, category: 'goals' | 'assists' | 'rating' = 'goals') =>
      fetchJSON<{
        league_id: number;
        category: string;
        count: number;
        players: LiveFootballPlayerLeader[];
      }>(`/api/football/leagues/${leagueId}/leaders?category=${category}`),

    // Transfers
    getTransfers: (params?: {
      type?: 'top' | 'market_value' | 'all';
      page?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.type) q.append('type', params.type);
      if (params?.page) q.append('page', String(params.page));
      return fetchJSON<LiveFootballTransfersResponse>(
        `/api/football/transfers?${q.toString()}`
      );
    },

    getLeagueTransfers: (leagueId = 47) =>
      fetchJSON<{ league_id: number; count: number; transfers: LiveFootballTransfer[] }>(
        `/api/football/leagues/${leagueId}/transfers`
      ),

    getTeamTransfers: (teamId: number, type: 'in' | 'out' | 'extensions' = 'in') =>
      fetchJSON<{ team_id: number; type: string; count: number; transfers: any[] }>(
        `/api/football/teams/${teamId}/transfers?type=${type}`
      ),

    // News
    getNews: (params?: {
      type?: 'trending' | 'league' | 'team' | 'player';
      id?: number;
      page?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.type) q.append('type', params.type);
      if (params?.id !== undefined) q.append('id', String(params.id));
      if (params?.page !== undefined) q.append('page', String(params.page));
      return fetchJSON<{
        type: string;
        id?: number;
        page: number;
        count: number;
        news: LiveFootballNewsItem[];
      }>(`/api/football/news?${q.toString()}`);
    },

    // Search
    search: (
      query: string,
      type: 'all' | 'players' | 'teams' | 'leagues' | 'matches' = 'all'
    ) => {
      const q = new URLSearchParams({
        q: query,
        type,
      });
      return fetchJSON<{
        query: string;
        type: string;
        results: LiveFootballSearchResultItem[] | any;
      }>(`/api/football/search?${q.toString()}`);
    },
  },

  // ──────────────────────────────────────────────
  // Canonical BALL-ON Layer (Provider-Agnostic)
  // ──────────────────────────────────────────────
  matches: {
    live: () =>
      fetchJSON<BallonApiResponse<{ matches: any[]; count: number; live_count: number }>>(
        '/api/matches/live'
      ),
    byDate: (date?: string, leagueId?: number) => {
      const q = new URLSearchParams();
      if (date) q.append('date', date);
      if (leagueId !== undefined) q.append('league_id', String(leagueId));
      return fetchJSON<BallonApiResponse<any[]>>(`/api/matches/by-date?${q.toString()}`);
    },
    featured: (limit = 8) =>
      fetchJSON<BallonApiResponse<{ matches: any[]; count: number; live_count: number }>>(
        `/api/matches/featured?limit=${limit}`
      ),
    get: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}`),
    score: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/score`),
    status: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/status`),
    statistics: (matchId: number, period: 'all' | 'firstHalf' | 'secondHalf' = 'all') =>
      fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/statistics?period=${period}`),
    lineups: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/lineups`),
    events: (matchId: number, period: 'all' | 'firstHalf' | 'secondHalf' = 'all') =>
      fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/events?period=${period}`),
    highlights: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/highlights`),
    venue: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/venue`),
    referee: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/referee`),
    h2h: (matchId: number) => fetchJSON<BallonApiResponse<any>>(`/api/matches/${matchId}/head-to-head`),
  },

  leagues: {
    all: () => fetchJSON<BallonApiResponse<any[]>>('/api/leagues'),
    popular: () => fetchJSON<BallonApiResponse<any[]>>('/api/leagues/popular'),
    countries: () => fetchJSON<BallonApiResponse<any[]>>('/api/leagues/countries'),
    seasons: () => fetchJSON<BallonApiResponse<any[]>>('/api/leagues/seasons'),
    get: (leagueId: number) => fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}`),
    standings: (leagueId: number, type: 'all' | 'home' | 'away' = 'all') =>
      fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}/standings?type=${type}`),
    teams: (leagueId: number, type: 'all' | 'home' | 'away' = 'all') =>
      fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}/teams?type=${type}`),
    leaders: (leagueId: number, category: 'goals' | 'assists' | 'rating' = 'goals') =>
      fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}/leaders?category=${category}`),
    transfers: (leagueId: number) => fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}/transfers`),
    rounds: (leagueId: number) => fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}/rounds`),
    trophies: (leagueId: number) => fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}/trophies`),
    news: (leagueId: number, page = 1) => fetchJSON<BallonApiResponse<any>>(`/api/leagues/${leagueId}/news?page=${page}`),
  },

  teams: {
    get: (teamId: number) => fetchJSON<BallonApiResponse<any>>(`/api/teams/${teamId}`),
    squad: (teamId: number) => fetchJSON<BallonApiResponse<any>>(`/api/teams/${teamId}/squad`),
    transfers: (teamId: number, type: 'in' | 'out' | 'extensions' = 'in') =>
      fetchJSON<BallonApiResponse<any>>(`/api/teams/${teamId}/transfers?type=${type}`),
    news: (teamId: number, page = 1) => fetchJSON<BallonApiResponse<any>>(`/api/teams/${teamId}/news?page=${page}`),
  },

  canonSearch: (query: string, type: 'all' | 'players' | 'teams' | 'leagues' | 'matches' = 'all') => {
    const q = new URLSearchParams({ q: query, type });
    return fetchJSON<BallonApiResponse<any>>(`/api/search?${q.toString()}`);
  },
};