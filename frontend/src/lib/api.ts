import {
  OverviewData,
  TransfersResponse,
  PlayerSearchItem,
  PlayerProfile,
  ClubsData,
  StandingRow,
  ScorerRow,
  MatchRow,
  ValuationPrediction,
  PlayerEstimatorResult,
  ModelMetadata,
  ComparedPlayer,
  SportMonksMatch,
  SportMonksMatchesResponse,
  TransfermarktLiveResponse,
  TransfermarktProfile,
  BigBallsMatch,
  BigBallsMatchesResponse,
} from './types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

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
    console.error(`Fetch error on ${url}:`, err.message);
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
    use_market_value: boolean;
  }) =>
    fetchJSON<ValuationPrediction>('/api/estimator/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  estimatePlayer: (playerId: number | string) =>
    fetchJSON<PlayerEstimatorResult>(`/api/estimator/player/${playerId}`),

  getModelMetadata: () => fetchJSON<ModelMetadata>('/api/estimator/models'),

  // Clubs
  getClubs: (limit = 20) => fetchJSON<ClubsData>(`/api/clubs?limit=${limit}`),

  // Live (Football-Data.org)
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
  getLiveStatus: () =>
    fetchJSON<{
      sportmonks_configured: boolean;
      football_data_org_configured: boolean;
      rapidapi_configured: boolean;
    }>('/api/live/status'),

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

  // BigBallsData SDK Match Intelligence (/api/matches route)
  getBigBallsMatches: async (params?: { league?: string; status?: string; limit?: number; date?: string }) => {
    const q = new URLSearchParams();
    if (params?.league) q.append('league', params.league);
    if (params?.status) q.append('status', params.status);
    if (params?.limit !== undefined) q.append('limit', String(params.limit));
    if (params?.date) q.append('date', params.date);

    const url = `/api/matches?${q.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch BigBalls matches: ${res.statusText}`);
    }
    return (await res.json()) as BigBallsMatchesResponse;
  },
};



