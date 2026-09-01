# Backend API

FastAPI backend for Ball-On.

## Local Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Running the API

```bash
uvicorn api.main:app --reload
```

## Running Tests

```bash
python -m pytest
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your secrets. `.env` is ignored by git.

