"""
Football Transfer Value Predictor & Market Analytics Dashboard
Interactive preview and exploration application for football transfer data.
"""

import os
import sys
import sqlite3
from pathlib import Path
from typing import Optional

# Ensure project root is in python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Setup page configuration
st.set_page_config(
    page_title="BallOn — Football Transfer Intelligence",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for modern styling
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E293B;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #64748B;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
        border-radius: 12px;
        padding: 1.2rem;
        color: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .metric-title {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94A3B8;
        margin-bottom: 0.2rem;
    }
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #38BDF8;
    }
    .badge-pill {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 9999px;
        background-color: #E0F2FE;
        color: #0369A1;
        margin-right: 0.3rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# Database path resolution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "db" / "football_transfers.db"


@st.cache_resource
def get_db_connection():
    """Get database connection."""
    if not DB_PATH.exists():
        st.error(f"Database not found at `{DB_PATH}`. Please run data acquisition first.")
        st.stop()
    return sqlite3.connect(str(DB_PATH), check_same_thread=False)


@st.cache_data(ttl=600)
def run_query(query: str, params: tuple = ()) -> pd.DataFrame:
    """Execute SQL query and return DataFrame."""
    conn = get_db_connection()
    return pd.read_sql_query(query, conn, params=params)


def format_eur(val: Optional[float]) -> str:
    """Format numbers into human-readable currency strings."""
    if val is None or pd.isna(val):
        return "N/A"
    try:
        val = float(val)
        if abs(val) >= 1_000_000_000:
            return f"€{val / 1_000_000_000:.2f}B"
        elif abs(val) >= 1_000_000:
            return f"€{val / 1_000_000:.2f}M"
        elif abs(val) >= 1_000:
            return f"€{val / 1_000:.0f}K"
        return f"€{val:,.0f}"
    except (ValueError, TypeError):
        return str(val)


# Sidebar Navigation
st.sidebar.image("https://img.icons8.com/color/96/football2.png", width=64)
st.sidebar.title("⚽ BallOn Analytics")
st.sidebar.caption("Football Transfer Value Intelligence System")

navigation = st.sidebar.radio(
    "Navigation",
    [
        "📊 Overview & Summary",
        "💰 Transfer Fee Explorer",
        "👤 Player Profile & Valuation",
        "🏟️ Clubs & Competitions",
        "🌐 Live Football Data (API)",
        "🗃️ Database Browser",
    ],
    index=0,
)

st.sidebar.markdown("---")
st.sidebar.info(
    "💡 **Dataset**: Transfermarkt Datasets\n"
    "- 37,000+ Players\n"
    "- 87,000+ Transfers\n"
    "- 1.8M+ Appearances\n"
    "- 500K+ Market Valuations"
)

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 1: OVERVIEW & SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
if navigation == "📊 Overview & Summary":
    st.markdown('<div class="main-header">⚽ Transfer Market Overview</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Executive summary of historical football transfers, valuations, and player records.</div>', unsafe_allow_html=True)

    # Fetch KPI metrics
    counts_df = run_query(
        """
        SELECT 
            (SELECT COUNT(*) FROM players) as total_players,
            (SELECT COUNT(*) FROM transfers) as total_transfers,
            (SELECT COUNT(*) FROM transfers WHERE transfer_fee > 0) as paid_transfers,
            (SELECT MAX(transfer_fee) FROM transfers) as record_fee,
            (SELECT COUNT(*) FROM clubs) as total_clubs,
            (SELECT COUNT(*) FROM competitions) as total_competitions,
            (SELECT COUNT(*) FROM games) as total_games,
            (SELECT COUNT(*) FROM appearances) as total_appearances
        """
    )
    kpis = counts_df.iloc[0]

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Players", f"{kpis['total_players']:,}")
    with col2:
        st.metric("Total Transfers Recorded", f"{kpis['total_transfers']:,}")
    with col3:
        st.metric("Paid Transfers (>€0)", f"{kpis['paid_transfers']:,}")
    with col4:
        st.metric("All-Time Record Fee", format_eur(kpis["record_fee"]))

    st.markdown("<br>", unsafe_allow_html=True)

    # Row 2: Top Transfers & Transfer Spend by Season
    c1, c2 = st.columns([3, 2])

    with c1:
        st.subheader("🏆 All-Time Top 10 Most Expensive Transfers")
        top_transfers = run_query(
            """
            SELECT 
                p.name AS Player,
                t.transfer_fee AS Fee,
                t.transfer_date AS Date,
                t.from_club_name AS `From Club`,
                t.to_club_name AS `To Club`,
                t.market_value_in_eur AS `Market Value At Transfer`
            FROM transfers t
            JOIN players p ON t.player_id = p.player_id
            WHERE t.transfer_fee IS NOT NULL AND t.transfer_fee > 0
            ORDER BY t.transfer_fee DESC
            LIMIT 10
            """
        )
        display_top = top_transfers.copy()
        display_top["Fee"] = display_top["Fee"].apply(format_eur)
        display_top["Market Value At Transfer"] = display_top["Market Value At Transfer"].apply(format_eur)
        st.dataframe(display_top, use_container_width=True, hide_index=True)

    with c2:
        st.subheader("📈 Transfer Spending by Season")
        season_spend = run_query(
            """
            SELECT 
                transfer_season AS Season,
                SUM(transfer_fee) AS TotalSpend,
                COUNT(*) AS TransferCount
            FROM transfers
            WHERE transfer_season IS NOT NULL 
              AND transfer_fee > 0
              AND CAST(SUBSTR(transfer_season, 1, 2) AS INT) >= 10
            GROUP BY transfer_season
            ORDER BY transfer_season ASC
            """
        )
        if not season_spend.empty:
            fig = px.bar(
                season_spend,
                x="Season",
                y="TotalSpend",
                title="Total Recorded Transfer Spending (€)",
                labels={"TotalSpend": "Total Spend (€)", "Season": "Season"},
                color="TotalSpend",
                color_continuous_scale="Blues",
            )
            fig.update_layout(showlegend=False, margin=dict(l=20, r=20, t=40, b=20), height=320)
            st.plotly_chart(fig, use_container_width=True)

    st.markdown("---")

    # Row 3: Position Distribution and League Insights
    c3, c4 = st.columns(2)

    with c3:
        st.subheader("👥 Players by Position")
        pos_df = run_query(
            """
            SELECT 
                position AS Position,
                COUNT(*) AS Count,
                AVG(market_value_in_eur) as AvgMarketValue
            FROM players
            WHERE position IS NOT NULL AND position != ''
            GROUP BY position
            ORDER BY Count DESC
            """
        )
        fig_pos = px.pie(
            pos_df,
            names="Position",
            values="Count",
            hole=0.45,
            color_discrete_sequence=px.colors.qualitative.Pastel,
        )
        fig_pos.update_layout(margin=dict(l=20, r=20, t=30, b=20), height=300)
        st.plotly_chart(fig_pos, use_container_width=True)

    with c4:
        st.subheader("🌍 Top Leagues by Total Player Value")
        league_df = run_query(
            """
            SELECT 
                c.name AS Competition,
                c.country_name AS Country,
                SUM(p.market_value_in_eur) AS TotalValuation
            FROM players p
            JOIN clubs cl ON p.current_club_id = cl.club_id
            JOIN competitions c ON cl.domestic_competition_id = c.competition_id
            WHERE p.market_value_in_eur IS NOT NULL
            GROUP BY c.competition_id, c.name, c.country_name
            ORDER BY TotalValuation DESC
            LIMIT 8
            """
        )
        if not league_df.empty:
            league_df["FormattedVal"] = league_df["TotalValuation"].apply(format_eur)
            fig_league = px.bar(
                league_df,
                x="TotalValuation",
                y="Competition",
                orientation="h",
                text="FormattedVal",
                labels={"TotalValuation": "Combined Player Value (€)", "Competition": "League"},
                color="TotalValuation",
                color_continuous_scale="Teal",
            )
            fig_league.update_layout(
                yaxis={"categoryorder": "total ascending"},
                margin=dict(l=20, r=20, t=30, b=20),
                height=300,
                showlegend=False,
            )
            st.plotly_chart(fig_league, use_container_width=True)

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 2: TRANSFER FEE EXPLORER
# ─────────────────────────────────────────────────────────────────────────────
elif navigation == "💰 Transfer Fee Explorer":
    st.markdown('<div class="main-header">💰 Transfer Fee Explorer</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Analyze transfer deals, filter by fee ranges, clubs, and compare fees with pre-transfer market values.</div>', unsafe_allow_html=True)

    col_f1, col_f2, col_f3 = st.columns([1.5, 1.5, 1])

    with col_f1:
        min_fee_m = st.slider("Minimum Transfer Fee (€ Millions)", min_value=1, max_value=150, value=20, step=5)
    with col_f2:
        search_club = st.text_input("Filter by Club Name (Buying or Selling)", "").strip()
    with col_f3:
        sort_order = st.selectbox("Sort By", ["Fee: High to Low", "Fee: Low to High", "Date: Newest First", "Date: Oldest First"])

    # Build query
    sort_sql = {
        "Fee: High to Low": "t.transfer_fee DESC",
        "Fee: Low to High": "t.transfer_fee ASC",
        "Date: Newest First": "t.transfer_date DESC",
        "Date: Oldest First": "t.transfer_date ASC",
    }[sort_order]

    where_clauses = ["t.transfer_fee >= ?"]
    params = [min_fee_m * 1_000_000]

    if search_club:
        where_clauses.append("(t.from_club_name LIKE ? OR t.to_club_name LIKE ?)")
        params.extend([f"%{search_club}%", f"%{search_club}%"])

    query = f"""
        SELECT 
            p.name AS Player,
            p.position AS Position,
            p.country_of_citizenship AS Nationality,
            t.transfer_fee AS Fee,
            t.market_value_in_eur AS MarketValue,
            t.transfer_date AS Date,
            t.transfer_season AS Season,
            t.from_club_name AS `From Club`,
            t.to_club_name AS `To Club`
        FROM transfers t
        JOIN players p ON t.player_id = p.player_id
        WHERE {" AND ".join(where_clauses)}
        ORDER BY {sort_sql}
        LIMIT 200
    """

    df_filtered = run_query(query, tuple(params))

    st.write(f"Showing **{len(df_filtered)}** transfers matching filters:")

    if not df_filtered.empty:
        # Scatter Plot: Transfer Fee vs Market Value
        fig_scatter = px.scatter(
            df_filtered.dropna(subset=["MarketValue"]),
            x="MarketValue",
            y="Fee",
            hover_name="Player",
            hover_data=["From Club", "To Club", "Season", "Date"],
            color="Position",
            title="Transfer Fee vs. Pre-Transfer Market Value (€)",
            labels={"MarketValue": "Market Value (€)", "Fee": "Actual Transfer Fee (€)"},
            opacity=0.85,
        )
        # Add diagonal reference line y = x
        max_val = max(df_filtered["Fee"].max(), df_filtered["MarketValue"].max())
        fig_scatter.add_trace(
            go.Scatter(
                x=[0, max_val],
                y=[0, max_val],
                mode="lines",
                name="Fair Market Line (Fee = Market Value)",
                line=dict(color="red", dash="dash"),
            )
        )
        fig_scatter.update_layout(height=420)
        st.plotly_chart(fig_scatter, use_container_width=True)

        # Formatted table
        display_df = df_filtered.copy()
        display_df["Fee (€)"] = display_df["Fee"].apply(format_eur)
        display_df["Market Value (€)"] = display_df["MarketValue"].apply(format_eur)
        display_df = display_df.drop(columns=["Fee", "MarketValue"])
        st.dataframe(display_df, use_container_width=True, hide_index=True)
    else:
        st.warning("No transfers found with the selected filters.")

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 3: PLAYER PROFILE & VALUATION
# ─────────────────────────────────────────────────────────────────────────────
elif navigation == "👤 Player Profile & Valuation":
    st.markdown('<div class="main-header">👤 Player Valuation & Career Profile</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Search for any football player to view career statistics, market value trajectory, and transfer history.</div>', unsafe_allow_html=True)

    # Search bar with suggestions
    search_query = st.text_input("🔍 Search Player by Name:", "Kylian Mbappé")

    if search_query:
        matching_players = run_query(
            """
            SELECT player_id, name, current_club_name, position, date_of_birth, country_of_citizenship, market_value_in_eur
            FROM players
            WHERE name LIKE ? OR (first_name || ' ' || last_name) LIKE ?
            ORDER BY market_value_in_eur DESC
            LIMIT 10
            """,
            (f"%{search_query}%", f"%{search_query}%"),
        )

        if matching_players.empty:
            st.warning(f"No players found matching '{search_query}'. Try another name like 'Messi', 'Haaland', 'Bellingham', 'Vinicius'.")
        else:
            player_options = {
                f"{row['name']} ({row['current_club_name'] or 'Free Agent'}, {row['position'] or 'N/A'}) - {format_eur(row['market_value_in_eur'])}": row["player_id"]
                for _, row in matching_players.iterrows()
            }
            selected_label = st.selectbox("Select Player:", list(player_options.keys()))
            selected_player_id = player_options[selected_label]

            # Fetch detailed player info
            player_info = run_query(
                """
                SELECT * FROM players WHERE player_id = ?
                """,
                (selected_player_id,),
            ).iloc[0]

            col_p1, col_p2, col_p3 = st.columns([1, 2, 2])

            with col_p1:
                img_url = player_info.get("image_url")
                if pd.notna(img_url) and img_url:
                    st.image(img_url, width=180, caption=player_info["name"])
                else:
                    st.image("https://img.icons8.com/ios-filled/150/user-male-circle.png", width=140)

            with col_p2:
                st.subheader(player_info["name"])
                st.write(f"**Current Club:** {player_info['current_club_name'] or 'N/A'}")
                st.write(f"**Position:** {player_info['position']} ({player_info['sub_position'] or ''})")
                st.write(f"**Nationality:** {player_info['country_of_citizenship'] or 'N/A'}")
                st.write(f"**Date of Birth:** {player_info['date_of_birth'] or 'N/A'}")

            with col_p3:
                st.metric("Current Market Value", format_eur(player_info["market_value_in_eur"]))
                st.metric("Peak Market Value", format_eur(player_info["highest_market_value_in_eur"]))
                st.write(f"**Foot:** {player_info['foot'] or 'N/A'} | **Height:** {player_info['height_in_cm'] or 'N/A'} cm")

            st.markdown("---")

            # Valuation History Chart
            valuations = run_query(
                """
                SELECT date, market_value_in_eur, current_club_name
                FROM player_valuations
                WHERE player_id = ?
                ORDER BY date ASC
                """,
                (selected_player_id,),
            )

            c_chart, c_trans = st.columns([3, 2])

            with c_chart:
                st.subheader("📈 Historical Market Valuation Curve")
                if not valuations.empty:
                    valuations["date"] = pd.to_datetime(valuations["date"])
                    fig_val = px.line(
                        valuations,
                        x="date",
                        y="market_value_in_eur",
                        markers=True,
                        title=f"{player_info['name']} — Valuation Timeline (€)",
                        labels={"market_value_in_eur": "Market Value (€)", "date": "Date"},
                    )
                    fig_val.update_traces(line_color="#0284C7", marker=dict(size=6, color="#0369A1"))
                    fig_val.update_layout(height=350, margin=dict(l=20, r=20, t=40, b=20))
                    st.plotly_chart(fig_val, use_container_width=True)
                else:
                    st.info("No historical valuations recorded for this player.")

            with c_trans:
                st.subheader("🔄 Career Transfer History")
                player_transfers = run_query(
                    """
                    SELECT transfer_date AS Date, from_club_name AS `From`, to_club_name AS `To`, transfer_fee AS Fee
                    FROM transfers
                    WHERE player_id = ?
                    ORDER BY transfer_date DESC
                    """,
                    (selected_player_id,),
                )
                if not player_transfers.empty:
                    display_pt = player_transfers.copy()
                    display_pt["Fee"] = display_pt["Fee"].apply(format_eur)
                    st.dataframe(display_pt, use_container_width=True, hide_index=True)
                else:
                    st.info("No recorded transfers for this player.")

            # Performance / Appearance Stats
            st.subheader("⚽ Career Match & Performance Statistics")
            app_stats = run_query(
                """
                SELECT 
                    COUNT(*) AS TotalGames,
                    SUM(goals) AS TotalGoals,
                    SUM(assists) AS TotalAssists,
                    SUM(minutes_played) AS TotalMinutes,
                    SUM(yellow_cards) AS YellowCards,
                    SUM(red_cards) AS RedCards
                FROM appearances
                WHERE player_id = ?
                """,
                (selected_player_id,),
            ).iloc[0]

            sc1, sc2, sc3, sc4, sc5, sc6 = st.columns(6)
            sc1.metric("Appearances", f"{app_stats['TotalGames'] or 0:,}")
            sc2.metric("Total Goals", f"{app_stats['TotalGoals'] or 0:,}")
            sc3.metric("Total Assists", f"{app_stats['TotalAssists'] or 0:,}")
            sc4.metric("Minutes Played", f"{app_stats['TotalMinutes'] or 0:,}")
            sc5.metric("Yellow Cards", f"{app_stats['YellowCards'] or 0:,}")
            sc6.metric("Red Cards", f"{app_stats['RedCards'] or 0:,}")

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 4: CLUBS & COMPETITIONS
# ─────────────────────────────────────────────────────────────────────────────
elif navigation == "🏟️ Clubs & Competitions":
    st.markdown('<div class="main-header">🏟️ Clubs & Competitions Intelligence</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Analyze club squad valuations, stadium capacities, and competition hierarchies.</div>', unsafe_allow_html=True)

    col_c1, col_c2 = st.columns(2)

    with col_c1:
        st.subheader("🏰 Most Valuable Club Squads")
        top_clubs = run_query(
            """
            SELECT 
                name AS Club,
                total_market_value AS SquadValuation,
                squad_size AS `Squad Size`,
                stadium_name AS Stadium,
                stadium_seats AS Capacity
            FROM clubs
            WHERE total_market_value IS NOT NULL AND total_market_value > 0
            ORDER BY total_market_value DESC
            LIMIT 10
            """
        )
        if not top_clubs.empty:
            top_clubs_disp = top_clubs.copy()
            top_clubs_disp["SquadValuation"] = top_clubs_disp["SquadValuation"].apply(format_eur)
            st.dataframe(top_clubs_disp, use_container_width=True, hide_index=True)

    with col_c2:
        st.subheader("🏟️ Largest Stadiums by Capacity")
        stadiums = run_query(
            """
            SELECT 
                name AS Club,
                stadium_name AS Stadium,
                stadium_seats AS Capacity
            FROM clubs
            WHERE stadium_seats IS NOT NULL AND stadium_seats > 40000
            ORDER BY stadium_seats DESC
            LIMIT 10
            """
        )
        if not stadiums.empty:
            fig_stad = px.bar(
                stadiums,
                x="Capacity",
                y="Stadium",
                orientation="h",
                text="Capacity",
                color="Capacity",
                color_continuous_scale="Viridis",
                hover_data=["Club"],
            )
            fig_stad.update_layout(yaxis={"categoryorder": "total ascending"}, height=350, margin=dict(l=20, r=20, t=20, b=20))
            st.plotly_chart(fig_stad, use_container_width=True)

    st.markdown("---")
    st.subheader("🏆 Competitions & Leagues Directory")
    competitions = run_query(
        """
        SELECT 
            competition_id AS Code,
            name AS League,
            country_name AS Country,
            type AS Type,
            total_clubs AS `Total Clubs`
        FROM competitions
        ORDER BY country_name ASC, name ASC
        """
    )
    st.dataframe(competitions, use_container_width=True, hide_index=True)

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 5: LIVE FOOTBALL DATA (API)
# ─────────────────────────────────────────────────────────────────────────────
elif navigation == "🌐 Live Football Data (API)":
    from src.data_collection.football_data_org import FootballDataOrgClient
    from src.data_collection.api_football import APIFootballClient
    import os

    st.markdown('<div class="main-header">🌐 Live Football API Hub</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Real-time league standings, live fixtures, and top goalscorers from connected external APIs.</div>', unsafe_allow_html=True)

    fd_client = FootballDataOrgClient()
    api_football = APIFootballClient()

    # API Status Banner
    col_stat1, col_stat2 = st.columns(2)
    with col_stat1:
        if fd_client.is_configured:
            st.success("✅ **Football-Data.org API**: Connected (Active Key)")
        else:
            st.warning("⚠️ **Football-Data.org API**: Key not found in `.env`")

    with col_stat2:
        if api_football.is_configured:
            st.info("ℹ️ **API-Football (RapidAPI)**: Key Configured")
        else:
            st.warning("⚠️ **API-Football**: Key not configured")

    st.markdown("---")

    league_options = {
        "Premier League (England)": "PL",
        "La Liga (Spain)": "PD",
        "Bundesliga (Germany)": "BL1",
        "Serie A (Italy)": "SA",
        "Ligue 1 (France)": "FL1",
        "UEFA Champions League": "CL",
    }

    c_sel1, c_sel2 = st.columns([2, 1])
    with c_sel1:
        selected_league_label = st.selectbox("Select Competition:", list(league_options.keys()))
        selected_code = league_options[selected_league_label]
    with c_sel2:
        view_mode = st.radio("View", ["📊 Standings Table", "⚽ Top Scorers", "📅 Recent / Upcoming Matches"], horizontal=True)

    if fd_client.is_configured:
        with st.spinner("Fetching live data from Football-Data.org..."):
            if view_mode == "📊 Standings Table":
                data = fd_client.get_standings(selected_code)
                if data and "standings" in data and data["standings"]:
                    standings_table = data["standings"][0].get("table", [])
                    if standings_table:
                        rows = []
                        for item in standings_table:
                            rows.append({
                                "Pos": item.get("position"),
                                "Club": item.get("team", {}).get("name"),
                                "Played": item.get("playedGames"),
                                "Won": item.get("won"),
                                "Draw": item.get("draw"),
                                "Lost": item.get("lost"),
                                "GF": item.get("goalsFor"),
                                "GA": item.get("goalsAgainst"),
                                "GD": item.get("goalDifference"),
                                "Points": item.get("points"),
                                "Form": item.get("form", "N/A"),
                            })
                        df_standings = pd.DataFrame(rows)
                        st.dataframe(df_standings, use_container_width=True, hide_index=True)
                    else:
                        st.info("No standings rows available for this competition season.")
                else:
                    st.info("Could not retrieve standings for this competition.")

            elif view_mode == "⚽ Top Scorers":
                scorers = fd_client.get_top_scorers(selected_code, limit=15)
                if scorers:
                    rows = []
                    for item in scorers:
                        player = item.get("player", {})
                        team = item.get("team", {})
                        rows.append({
                            "Player": player.get("name"),
                            "Nationality": player.get("nationality"),
                            "Team": team.get("name"),
                            "Goals": item.get("goals"),
                            "Assists": item.get("assists") or 0,
                            "Penalties": item.get("penalties") or 0,
                            "Played Matches": item.get("playedMatches"),
                        })
                    df_scorers = pd.DataFrame(rows)
                    st.dataframe(df_scorers, use_container_width=True, hide_index=True)
                else:
                    st.info("No top scorers data available for this competition.")

            elif view_mode == "📅 Recent / Upcoming Matches":
                matches = fd_client.get_matches(selected_code)
                if matches:
                    rows = []
                    for m in matches[-15:]:
                        utc_date = m.get("utcDate", "")[:10]
                        home = m.get("homeTeam", {}).get("name")
                        away = m.get("awayTeam", {}).get("name")
                        score = m.get("score", {}).get("fullTime", {})
                        h_score = score.get("home")
                        a_score = score.get("away")
                        result_str = f"{h_score} - {a_score}" if h_score is not None else "Upcoming"
                        status = m.get("status")
                        rows.append({
                            "Date": utc_date,
                            "Matchday": m.get("matchday"),
                            "Home Team": home,
                            "Score": result_str,
                            "Away Team": away,
                            "Status": status,
                        })
                    df_matches = pd.DataFrame(rows)
                    st.dataframe(df_matches, use_container_width=True, hide_index=True)
                else:
                    st.info("No matches retrieved for this league.")
    else:
        st.warning("Football-Data.org API is not configured.")

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 6: DATABASE BROWSER
# ─────────────────────────────────────────────────────────────────────────────
elif navigation == "🗃️ Database Browser":
    st.markdown('<div class="main-header">🗃️ SQLite Database Explorer</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Inspect raw tables, schemas, row counts, missing values, and download sample slices.</div>', unsafe_allow_html=True)

    tables_df = run_query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    table_list = tables_df["name"].tolist()

    selected_table = st.selectbox("Select Database Table:", table_list, index=table_list.index("players") if "players" in table_list else 0)

    col_t1, col_t2 = st.columns([1, 3])

    with col_t1:
        row_count = run_query(f"SELECT COUNT(*) as count FROM {selected_table}").iloc[0]["count"]
        st.metric("Total Records", f"{row_count:,}")

        table_info = run_query(f"PRAGMA table_info({selected_table})")
        st.write(f"**Columns ({len(table_info)}):**")
        st.dataframe(table_info[["name", "type"]], hide_index=True, use_container_width=True)

    with col_t2:
        st.write(f"**Preview Sample Records from `{selected_table}` (Top 50):**")
        sample_df = run_query(f"SELECT * FROM {selected_table} LIMIT 50")
        st.dataframe(sample_df, use_container_width=True)

        # Download button
        csv_data = sample_df.to_csv(index=False).encode("utf-8")
        st.download_button(
            label=f"📥 Download sample `{selected_table}.csv`",
            data=csv_data,
            file_name=f"{selected_table}_sample.csv",
            mime="text/csv",
        )
