-- PostgreSQL Schema for Ball-On

CREATE TABLE players (
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
    market_value_in_eur REAL,
    highest_market_value_in_eur REAL
);

CREATE TABLE transfers (
    player_id INTEGER,
    transfer_date DATE,
    transfer_season TEXT,
    from_club_id INTEGER,
    to_club_id INTEGER,
    from_club_name TEXT,
    to_club_name TEXT,
    transfer_fee REAL,
    market_value_in_eur REAL,
    player_name TEXT
);

CREATE TABLE appearances (
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

CREATE TABLE player_valuations (
    player_id INTEGER,
    date DATE,
    market_value_in_eur INTEGER,
    current_club_name TEXT,
    current_club_id INTEGER,
    player_club_domestic_competition_id TEXT
);

CREATE TABLE clubs (
    club_id INTEGER PRIMARY KEY,
    club_code TEXT,
    name TEXT,
    domestic_competition_id TEXT,
    total_market_value REAL,
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

CREATE TABLE competitions (
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

CREATE TABLE games (
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

CREATE INDEX idx_appearances_player_date ON appearances(player_id, date);
CREATE INDEX idx_valuations_player_date ON player_valuations(player_id, date);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);

CREATE TABLE model_versions (
    model_version TEXT PRIMARY KEY,
    training_date TIMESTAMP NOT NULL,
    metadata_json JSONB NOT NULL
);

CREATE TABLE model_evaluations (
    model_version TEXT NOT NULL,
    model_name TEXT NOT NULL,
    split_name TEXT NOT NULL,
    metrics_json JSONB NOT NULL,
    PRIMARY KEY (model_version, model_name, split_name)
);

CREATE TABLE feature_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    player_id INTEGER,
    snapshot_date DATE,
    feature_json JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE valuation_predictions (
    prediction_id SERIAL PRIMARY KEY,
    player_id INTEGER,
    snapshot_id INTEGER,
    model_version TEXT NOT NULL,
    configuration TEXT NOT NULL,
    estimated_transfer_value REAL NOT NULL,
    explanation_json JSONB,
    created_at TIMESTAMP NOT NULL
);
