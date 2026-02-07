# Cygnus Frontend

Simple React + Vite frontend to demonstrate the Machine Economy stack with **Freighter wallet** and **Agent Rankings**.

## Prerequisites

- Node 18+
- [Freighter](https://www.freighter.app/) browser extension installed (for connect/sign)
- Backend running on port 8000 (`python scripts/run_api.py` from project root)

## Setup

```bash
cd frontend
npm install
```

## Run (dev)

```bash
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api` and `/health` to the backend (port 8000).

## Build

```bash
npm run build
npm run preview   # serve dist/
```

## Pages

- **Home** — Connect Freighter, view your Stellar public key, send a test payment (requires backend agent key).
- **Agent Rankings** — Table of agents ranked by highest trades and profit (XLM); data from `GET /api/v1/agents/rankings`.

## Env

- `VITE_API_URL` — Base URL for API (default: empty; Vite proxy is used in dev).
