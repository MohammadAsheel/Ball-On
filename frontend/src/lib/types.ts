export interface KPIs {
  total_players: number;
  total_transfers: number;
  paid_transfers: number;
  seasons_covered: number;
  record_fee: number;
  avg_transfer_fee: number;
  total_clubs: number;
  total_competitions: number;
}

export interface TransferIntelligence {
  highest_fee: number;
  highest_fee_player: string;
  average_transfer_fee: number;
  highest_spending_season: string;
  highest_season_spend: number;
  most_transferred_position: string;
  most_transferred_position_count: number;
}

export interface TopTransfer {
  player_id?: number;
  player_name: string;
  position: string;
  transfer_fee: number;
  transfer_date: string;
  transfer_season: string;
  from_club_name: string;
  to_club_name: string;
  market_value_before?: number;
}

export interface SeasonSpend {
  season: string;
  total_spend: number;
  transfer_count: number;
  avg_fee: number;
  start_year?: number;
}

export interface PositionStat {
  position: string;
  count: number;
  avg_market_value: number;
}

export interface LeagueValuation {
  competition_id: string;
  competition_name: string;
  country_name: string;
  total_valuation: number;
  player_count: number;
}

export interface OverviewData {
  kpis: KPIs;
  transfer_intelligence: TransferIntelligence;
  top_transfers: TopTransfer[];
  season_spend: SeasonSpend[];
  positions: PositionStat[];
  top_leagues: LeagueValuation[];
}

export interface TransferDeal {
  player_id: number;
  player_name: string;
  position: string;
  nationality: string;
  transfer_fee: number;
  market_value_before: number | null;
  transfer_date: string;
  transfer_season: string;
  from_club_name: string;
  to_club_name: string;
}

export interface TransfersResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  transfers: TransferDeal[];
}

export interface PlayerSearchItem {
  player_id: number;
  name: string;
  current_club_name: string | null;
  position: string | null;
  sub_position: string | null;
  date_of_birth: string | null;
  country_of_citizenship: string | null;
  market_value_in_eur: number | null;
  image_url: string | null;
  age?: number | null;
}

export interface SeasonPerformance {
  season: number;
  appearances: number;
  goals: number;
  assists: number;
  minutes: number;
  goals_per_90: number;
  assists_per_90: number;
  yellow_cards: number;
  red_cards: number;
}

export interface PlayerProfile {
  player: {
    player_id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    current_club_name: string | null;
    position: string | null;
    sub_position: string | null;
    foot: string | null;
    height_in_cm: number | null;
    date_of_birth: string | null;
    country_of_citizenship: string | null;
    market_value_in_eur: number | null;
    highest_market_value_in_eur: number | null;
    image_url: string | null;
    agent_name?: string | null;
    age?: number | null;
  };
  latest_transfer: {
    transfer_date: string;
    transfer_season: string;
    from_club_name: string;
    to_club_name: string;
    transfer_fee: number;
    market_value_in_eur: number | null;
  } | null;
  season_stats: SeasonPerformance[];
  valuations: Array<{
    date: string;
    market_value_in_eur: number;
    current_club_name: string | null;
  }>;
  transfers: Array<{
    transfer_date: string;
    transfer_season: string;
    from_club_name: string;
    to_club_name: string;
    transfer_fee: number | null;
    market_value_in_eur: number | null;
  }>;
  career_stats: {
    total_matches: number;
    total_goals: number;
    total_assists: number;
    total_minutes: number;
    yellow_cards: number;
    red_cards: number;
  };
}

export interface ModelContribution {
  feature: string;
  contribution_log_fee: number;
  direction: 'positive' | 'negative';
}

export interface EstimatorResponse {
  mode: 'player' | 'scenario' | 'historical';
  label: string;
  snapshot: Record<string, unknown> & {
    player_name?: string;
    age_at_transfer?: number;
    position?: string;
    market_value_before?: number | null;
    prior_minutes?: number;
    prior_goals?: number;
    prior_assists?: number;
  };
  valuation: {
    estimated_transfer_value: number;
    model_version: string;
    model_type: string;
    target_transform: string;
    data_quality: { level: string; note: string };
    model_explanation: { method: string; note: string; contributions: ModelContribution[] };
  };
  actual_transfer_fee: number | null;
  prediction_id?: number;
}

export interface ModelMetadata {
  model_version: string;
  periods: { test_start: string };
  sample_counts: { test: number };
  test_results: Record<
    string,
    {
      mae_eur: number;
      rmse_eur: number;
      r2: number;
    }
  >;
}

export interface ComparedPlayer {
  player_id: number;
  name: string;
  current_club_name: string | null;
  position: string | null;
  country_of_citizenship: string | null;
  market_value_in_eur: number | null;
  highest_market_value_in_eur: number | null;
  image_url: string | null;
  age: number | null;
  stats: {
    total_matches: number;
    total_goals: number;
    total_assists: number;
    total_minutes: number;
    goals_per_90: number;
    assists_per_90: number;
  };
}

export interface ClubSquad {
  club_id: number;
  name: string;
  total_market_value: number;
  squad_size: number;
  average_age: number;
  stadium_name: string;
  stadium_seats: number;
  coach_name: string;
}

export interface StadiumInfo {
  club_name: string;
  stadium_name: string;
  stadium_seats: number;
}

export interface ClubsData {
  top_squads: ClubSquad[];
  stadiums: StadiumInfo[];
}

export interface StandingRow {
  position: number;
  team: {
    id: number;
    name: string;
    crest?: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface ScorerRow {
  player: {
    id: number;
    name: string;
    nationality?: string;
  };
  team: {
    id: number;
    name: string;
  };
  goals: number;
  assists?: number | null;
  penalties?: number | null;
  playedMatches?: number;
}

export interface MatchRow {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

// ──────────────────────────────────────────────
// SportMonks v3 Types
// ──────────────────────────────────────────────

export interface SportMonksTeam {
  id: number;
  name: string;
  short_code?: string;
  image_path?: string;
  is_winner?: boolean;
}

export interface SportMonksLeague {
  id: number;
  name: string;
  short_code?: string;
  image_path?: string;
  sub_type?: string;
}

export interface SportMonksScore {
  home: number | null;
  away: number | null;
  display: string;
  ht_home?: number | null;
  ht_away?: number | null;
  ft_home?: number | null;
  ft_away?: number | null;
  et_home?: number | null;
  et_away?: number | null;
  pen_home?: number | null;
  pen_away?: number | null;
}

export interface SportMonksVenue {
  id?: number;
  name?: string;
  city_name?: string;
  capacity?: number;
  image_path?: string;
}

export interface SportMonksEvent {
  id: number;
  minute: number;
  extra_minute?: number | null;
  type: string;
  player_name?: string;
  related_player_name?: string;
  participant_id?: number;
  is_home: boolean;
  result?: string;
  addition?: string;
  info?: string;
}

export interface SportMonksStat {
  name: string;
  code: string;
  home_value: number;
  away_value: number;
}

export interface SportMonksLineupPlayer {
  id?: number;
  name: string;
  jersey_number?: number;
  formation_position?: number;
  position?: string;
  image_path?: string;
}

export interface SportMonksLineups {
  home: {
    starting_xi: SportMonksLineupPlayer[];
    bench: SportMonksLineupPlayer[];
  };
  away: {
    starting_xi: SportMonksLineupPlayer[];
    bench: SportMonksLineupPlayer[];
  };
}

export interface SportMonksMatch {
  id: number;
  name: string;
  starting_at: string;
  starting_at_timestamp?: number;
  result_info?: string | null;
  length: number;
  state_code: string;
  state_name: string;
  is_live: boolean;
  is_finished: boolean;
  is_upcoming: boolean;
  league: SportMonksLeague;
  home_team: SportMonksTeam;
  away_team: SportMonksTeam;
  score: SportMonksScore;
  venue: SportMonksVenue;
  events: SportMonksEvent[];
  statistics?: SportMonksStat[];
  lineups?: SportMonksLineups;
}

export interface SportMonksMatchesResponse {
  count: number;
  inplay_only?: boolean;
  filter?: {
    days?: number;
    date?: string;
    league_id?: number;
  };
  matches: SportMonksMatch[];
}

// ──────────────────────────────────────────────
// Transfermarkt Live Intelligence Types
// ──────────────────────────────────────────────

export interface TransfermarktTrophy {
  trophy: string;
  count: number;
}

export interface TransfermarktSocialMedia {
  type: string;
  url: string;
}

export interface TransfermarktTransfer {
  season?: string;
  date?: string;
  left?: string;
  joined?: string;
  market_value?: string;
  fee?: string;
}

export interface TransfermarktCompStat {
  competition: string;
  appearances: number;
  goals: number;
  assists: number;
  minutes_played: number;
  yellow_cards: number;
  red_cards: number;
  penalty_goals?: number;
}

export interface TransfermarktSeasonStat {
  season: string;
  competitions: TransfermarktCompStat[];
}

export interface TransfermarktProfile {
  player_id?: string;
  player_name: string;
  profile_url?: string;
  jersey_number?: string;
  current_club?: string;
  league?: {
    name?: string;
    country?: string;
    division?: string;
    tablePosition?: string;
  };
  arrival_date?: string;
  contract_end?: string;
  market_value?: string;
  full_name?: string;
  age?: string;
  place_of_birth?: string;
  citizenship?: string;
  height?: string;
  position?: string;
  foot?: string;
  agent?: string;
  outfitter?: string;
  last_contract_extension?: string;
  social_media: TransfermarktSocialMedia[];
  trophies: TransfermarktTrophy[];
  transfer_history: TransfermarktTransfer[];
  season_stats: TransfermarktSeasonStat[];
  last_updated?: string;
}

export interface TransfermarktLiveResponse {
  player_id?: number;
  player_name?: string;
  query?: string;
  configured: boolean;
  cached: boolean;
  data: TransfermarktProfile | null;
}

// ──────────────────────────────────────────────
// BigBallsData SDK Match Intelligence Types
// ──────────────────────────────────────────────

export interface BigBallsTeam {
  name: string;
  short_name?: string | null;
  logo_url?: string | null;
}

export interface BigBallsScore {
  home: number | null;
  away: number | null;
}

export interface BigBallsLinescore {
  home: number[];
  away: number[];
}

export interface BigBallsMatch {
  id: string;
  sport: string;
  league: string;
  home: BigBallsTeam;
  away: BigBallsTeam;
  kickoff_utc: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' | string;
  score?: BigBallsScore;
  linescore?: BigBallsLinescore;
  attendance?: number | null;
  broadcast?: string | null;
  has_odds?: boolean;
}

export interface BigBallsMatchesResponse {
  count: number;
  filter?: {
    league?: string;
    status?: string;
    limit?: number;
    date?: string;
  };
  data: BigBallsMatch[];
  meta?: any;
  error?: string | null;
}

// ──────────────────────────────────────────────
// API-Football / API-Sports Types
// ──────────────────────────────────────────────

export interface ApiFootballInjuryPlayer {
  id: number;
  name: string;
  photo: string;
  type: string;
  reason: string;
}

export interface ApiFootballInjuryTeam {
  id: number;
  name: string;
  logo: string;
}

export interface ApiFootballInjuryFixture {
  id: number;
  timezone: string;
  date: string;
  timestamp: number;
}

export interface ApiFootballInjuryLeague {
  id: number;
  season: number;
  name: string;
  country: string;
  logo: string;
  flag: string;
}

export interface ApiFootballInjury {
  player: ApiFootballInjuryPlayer;
  team: ApiFootballInjuryTeam;
  fixture: ApiFootballInjuryFixture;
  league: ApiFootballInjuryLeague;
}

export interface ApiFootballInjuriesResponse {
  count: number;
  total_available: number;
  league_id: number;
  season: number;
  injuries: ApiFootballInjury[];
}

export interface ApiFootballPlayerStat {
  player: {
    id: number;
    name: string;
    firstname?: string;
    lastname?: string;
    age?: number;
    birth?: { date: string; place: string; country: string };
    nationality?: string;
    height?: string;
    weight?: string;
    injured?: boolean;
    photo?: string;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; flag: string; season: number };
    games: { appearences: number; lineups: number; minutes: number; position: string; rating?: string };
    goals: { total: number; assists?: number; conceded?: number; saves?: number };
    passes?: { total: number; key: number; accuracy: number };
    cards?: { yellow: number; yellowred: number; red: number };
  }>;
}

export interface ApiFootballScorersResponse {
  league_id: number;
  season: number;
  count: number;
  scorers: ApiFootballPlayerStat[];
}

export interface ApiFootballAssistsResponse {
  league_id: number;
  season: number;
  count: number;
  assists: ApiFootballPlayerStat[];
}

export interface LiveApiStatusResponse {
  sportmonks_configured: boolean;
  football_data_org_configured: boolean;
  api_football_configured: boolean;
  api_football_status?: {
    account?: { firstname: string; lastname: string; email: string };
    subscription?: { plan: string; end: string; active: boolean };
    requests?: { current: number; limit_day: number };
  } | null;
}

// ──────────────────────────────────────────────
// Real-Time RSS News Aggregator Types
// ──────────────────────────────────────────────

export interface FootballNewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  published_at: string;
  timestamp: number;
  source: string;
  source_badge: string;
  source_color: string;
  category: 'transfers' | 'injuries' | 'matches' | 'general' | string;
  category_label: string;
  image_url?: string | null;
}

export interface FootballNewsResponse {
  count: number;
  total_available: number;
  categories: {
    all: number;
    transfers: number;
    injuries: number;
    matches: number;
    general: number;
  };
  cached: boolean;
  last_updated?: string | null;
  articles: FootballNewsArticle[];
}
