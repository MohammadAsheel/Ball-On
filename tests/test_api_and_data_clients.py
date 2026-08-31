"""
Comprehensive Backend Test Suite for BALLON REST Routers
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app

@pytest.fixture
def client():
    return TestClient(app)


def test_api_root(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["database_connected"] is True


def test_overview_router(client):
    response = client.get("/api/overview")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert "transfer_intelligence" in data
    assert data["kpis"]["total_players"] > 0
    assert len(data["season_spend"]) > 0


def test_players_search_and_profile(client):
    # Dynamic search test (no hardcoded IDs)
    res_search = client.get("/api/players/search?q=Mbapp")
    assert res_search.status_code == 200
    data_search = res_search.json()
    assert data_search["count"] > 0
    player_id = data_search["players"][0]["player_id"]

    # Profile lookup
    res_profile = client.get(f"/api/players/{player_id}")
    assert res_profile.status_code == 200
    data_profile = res_profile.json()
    assert "player" in data_profile
    assert "season_stats" in data_profile
    assert "career_stats" in data_profile


def test_players_compare(client):
    res_search = client.get("/api/players/search?q=Messi")
    p1 = res_search.json()["players"][0]["player_id"]
    res_compare = client.post("/api/players/compare", json={"player_ids": [p1]})
    assert res_compare.status_code == 200
    data = res_compare.json()
    assert data["count"] == 1
    assert "stats" in data["players"][0]


def test_transfers_router(client):
    res = client.get("/api/transfers?page=1&page_size=10&min_fee=5000000")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert len(data["transfers"]) <= 10


def test_estimator_predict_and_player_mode(client):
    # Scenario mode predict
    payload = {
        "name": "Target Forward",
        "age": 23.0,
        "position": "Attack",
        "market_value_before": 40000000,
        "prior_minutes": 2500,
        "goals": 16,
        "assists": 9,
        "use_market_value": True,
    }
    res_predict = client.post("/api/estimator/predict", json=payload)
    assert res_predict.status_code == 200
    data_pred = res_predict.json()
    assert "estimated_transfer_value" in data_pred
    assert data_pred["estimated_transfer_value"] > 0
    assert len(data_pred["feature_impacts"]) > 0

    # Models benchmark info
    res_models = client.get("/api/estimator/models")
    assert res_models.status_code == 200
    data_models = res_models.json()
    assert "models_benchmark" in data_models


def test_sportmonks_live_endpoints(client):
    # Live status
    res_status = client.get("/api/live/status")
    assert res_status.status_code == 200
    assert res_status.json()["sportmonks_configured"] is True

    # Live scores
    res_live = client.get("/api/live/livescores")
    assert res_live.status_code == 200
    assert "matches" in res_live.json()

    # Upcoming fixtures
    res_fix = client.get("/api/live/fixtures?days=7")
    assert res_fix.status_code == 200
    assert "matches" in res_fix.json()
    assert res_fix.json()["count"] > 0

    # Finished matches
    res_fin = client.get("/api/live/finished?days=7")
    assert res_fin.status_code == 200
    assert "matches" in res_fin.json()
    assert res_fin.json()["count"] > 0

    # Match details
    first_match = res_fin.json()["matches"][0]
    res_det = client.get(f"/api/live/match/{first_match['id']}")
    assert res_det.status_code == 200
    det_data = res_det.json()
    assert "home_team" in det_data
    assert "away_team" in det_data
    assert "score" in det_data
    assert "statistics" in det_data
    assert "lineups" in det_data


def test_transfermarkt_live_endpoints(client):
    # Search player in db
    res_search = client.get("/api/players/search?q=Messi")
    assert res_search.status_code == 200
    p_id = res_search.json()["players"][0]["player_id"]

    # Player live Transfermarkt intelligence
    res_tm = client.get(f"/api/players/{p_id}/live-transfermarkt")
    assert res_tm.status_code == 200
    tm_data = res_tm.json()
    assert tm_data["configured"] is True
    assert "data" in tm_data
    if tm_data["data"]:
        assert "trophies" in tm_data["data"]
        assert "social_media" in tm_data["data"]
        assert "transfer_history" in tm_data["data"]


