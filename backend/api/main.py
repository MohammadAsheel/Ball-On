"""
FastAPI Central Application for BALLON — Football Transfer Intelligence
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import DATABASE_PATH
from api.routes.overview import router as overview_router
from api.routes.players import router as players_router
from api.routes.transfers import router as transfers_router
from api.routes.estimator import router as estimator_router
from api.routes.clubs import router as clubs_router
from api.routes.live import router as live_router
from api.routes.news import router as news_router

app = FastAPI(
    title="BALLON API",
    description="Football Transfer Intelligence Platform REST API",
    version="2.0.0",
)

# CORS for frontend (Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-ballon-domain.com",
        "https://ball-on.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(overview_router)
app.include_router(players_router)
app.include_router(transfers_router)
app.include_router(estimator_router)
app.include_router(clubs_router)
app.include_router(live_router)
app.include_router(news_router)


@app.get("/")
def root():
    return {
        "message": "BALLON — Football Transfer Intelligence API",
        "version": "2.0.0",
        "docs": "/docs",
        "database_connected": DATABASE_PATH.exists(),
    }


@app.get("/health")
def health():
    return {"status": "ok", "db_exists": DATABASE_PATH.exists()}
