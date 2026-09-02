-- PostgreSQL Schema for BALLON — Football Transfer Intelligence Platform

-- 1. Core Reference & Entity Tables
CREATE TABLE IF NOT EXISTS players (
    player_id INTEGER PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    name TEXT,
    last_season INTEGER,
    current_club_id INTEGER,
    player_code TEXT,
    country_of_birth TEXT,
    city_of_birth TEXT,
    country_of_citizenship TEXT,
    date_of_birth DATE,
    sub_position TEXT,
    position TEXT,
    foot TEXT,
    height_in_cm REAL,
    contract_expiration_date DATE,
    agent_name TEXT,
    image_url TEXT,
    international_caps REAL,
    international_goals REAL,
    current_national_team_id REAL,
    url TEXT,
    current_club_domestic_competition_id TEXT,
    current_club_name TEXT,
    market_value_in_eur NUMERIC(15, 2),
    highest_market_value_in_eur NUMERIC(15, 2)
);

CREATE TABLE IF NOT EXISTS clubs (
    club_id INTEGER PRIMARY KEY,
    club_code TEXT,
    name TEXT,
    domestic_competition_id TEXT,
    total_market_value NUMERIC(18, 2),
    squad_size INTEGER,
    average_age REAL,
    foreigners_number INTEGER,
    foreigners_percentage REAL,
    national_team_players INTEGER,
    stadium_name TEXT,
    stadium_seats INTEGER,
    net_transfer_record TEXT,
    coach_name TEXT,
    last_season INTEGER,
    filename TEXT,
    url TEXT
);

CREATE TABLE IF NOT EXISTS competitions (
    competition_id TEXT PRIMARY KEY,
    competition_code TEXT,
    name TEXT,
    sub_type TEXT,
    type TEXT,
    country_id INTEGER,
    country_name TEXT,
    domestic_league_code TEXT,
    confederation TEXT,
    total_clubs REAL,
    url TEXT
);

CREATE TABLE IF NOT EXISTS games (
    game_id INTEGER PRIMARY KEY,
    competition_id TEXT,
    season INTEGER,
    round TEXT,
    date DATE,
    home_club_id INTEGER,
    away_club_id INTEGER,
    home_club_goals INTEGER,
    away_club_goals INTEGER,
    home_club_position REAL,
    away_club_position REAL,
    home_club_manager_name TEXT,
    away_club_manager_name TEXT,
    stadium TEXT,
    attendance REAL,
    referee TEXT,
    url TEXT,
    home_club_formation TEXT,
    away_club_formation TEXT,
    home_club_name TEXT,
    away_club_name TEXT,
    aggregate TEXT,
    competition_type TEXT
);

CREATE TABLE IF NOT EXISTS appearances (
    appearance_id TEXT PRIMARY KEY,
    game_id INTEGER,
    player_id INTEGER,
    player_club_id INTEGER,
    player_current_club_id INTEGER,
    date DATE,
    player_name TEXT,
    competition_id TEXT,
    yellow_cards INTEGER,
    red_cards INTEGER,
    goals INTEGER,
    assists INTEGER,
    minutes_played INTEGER
);

CREATE TABLE IF NOT EXISTS transfers (
    transfer_id SERIAL PRIMARY KEY,
    player_id INTEGER,
    transfer_date DATE,
    transfer_season TEXT,
    from_club_id INTEGER,
    to_club_id INTEGER,
    from_club_name TEXT,
    to_club_name TEXT,
    transfer_fee NUMERIC(15, 2),
    market_value_in_eur NUMERIC(15, 2),
    player_name TEXT
);

CREATE TABLE IF NOT EXISTS player_valuations (
    valuation_id SERIAL PRIMARY KEY,
    player_id INTEGER,
    date DATE,
    market_value_in_eur NUMERIC(15, 2),
    current_club_name TEXT,
    current_club_id INTEGER,
    player_club_domestic_competition_id TEXT
);

-- Indexes for Fast Lookups and Analytics
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_current_club_id ON players(current_club_id);
CREATE INDEX IF NOT EXISTS idx_appearances_player_date ON appearances(player_id, date);
CREATE INDEX IF NOT EXISTS idx_appearances_game_id ON appearances(game_id);
CREATE INDEX IF NOT EXISTS idx_valuations_player_date ON player_valuations(player_id, date);
CREATE INDEX IF NOT EXISTS idx_transfers_player_date ON transfers(player_id, transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfers_fee ON transfers(transfer_fee);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);

-- 2. Valuation Registry & MLOps Tables
CREATE TABLE IF NOT EXISTS model_versions (
    model_version TEXT PRIMARY KEY,
    training_date TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS model_evaluations (
    model_version TEXT NOT NULL,
    model_name TEXT NOT NULL,
    split_name TEXT NOT NULL,
    metrics_json JSONB NOT NULL,
    PRIMARY KEY (model_version, model_name, split_name)
);

CREATE TABLE IF NOT EXISTS feature_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    player_id INTEGER,
    snapshot_date DATE,
    feature_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS valuation_predictions (
    prediction_id SERIAL PRIMARY KEY,
    player_id INTEGER,
    snapshot_id INTEGER,
    model_version TEXT NOT NULL,
    configuration TEXT NOT NULL,
    estimated_transfer_value NUMERIC(15, 2) NOT NULL,
    explanation_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
