# Project Cygnus

**Machine Economy: Autonomous Agents and Programmable Payments on the Stellar Blockchain**

This project implements the architecture from *Architecting the Machine Economy* using the **target five-layer stack**:

| Layer | Technology | Role |
|-------|------------|------|
| **Settlement (L1)** | Stellar / Soroban | Distributed ledger for final payment settlement and escrow. |
| **Agent Framework** | **ElizaOS** | TypeScript-based multi-agent OS for logic and memory. |
| **Payment Protocol** | **x402** | HTTP-native "Payment Required" (402) response cycles. |
| **Micropayment SDK** | **x402-Flash Stellar SDK** | Off-chain payment channels for <100ms latency on Stellar. |
| **Identity & Trust** | **Masumi Network** | DIDs, decision logging, and agent marketplace. |

All tech from the PDF are represented: **Stellar, Horizon, Soroban, stellar-sdk**, native/claimable/time-bound payments, **liquidity pools**, agent service, **APScheduler**, **FastAPI**, **PostgreSQL**, **Alembic**, **x402** (402 + verification), **Masumi** client + routes, optional **Celery**; **ElizaOS** and **x402-Flash** have scaffolds/placeholders (see [docs/TECHNOLOGY_INVENTORY.md](docs/TECHNOLOGY_INVENTORY.md)).

---

## Plan and execution

See **[PROJECT_PLAN.md](PROJECT_PLAN.md)** for:

- Architecture overview and technology stack  
- Step-by-step execution plan (Phases 1–7)  
- Repository layout and environment variables  

Implementation follows the plan: Phase 1 (Stellar basics) through Phase 6 (API + persistence), with clean code and no syntax/lint errors (Ruff).

---

## Setup (Miniconda env `Project_Cygnus`)

You already created the conda env `Project_Cygnus`. From the project root:

```bash
conda activate Project_Cygnus
pip install -e .
pip install -r requirements.txt
```

Optional: copy env example and set variables (Stellar testnet is used by default):

```bash
cp .env.example .env
# Edit .env: DATABASE_URL, AGENT_SECRET_KEY, etc.
```

---

## Run the API

```bash
conda activate Project_Cygnus
python scripts/run_api.py
# Or: uvicorn cygnus.api.main:app --reload --host 0.0.0.0 --port 8000
```

- **Health:** [http://localhost:8000/health](http://localhost:8000/health)  
- **Stellar status:** [http://localhost:8000/health/stellar](http://localhost:8000/health/stellar)  
- **OpenAPI:** [http://localhost:8000/docs](http://localhost:8000/docs)  

---

## Frontend (Freighter + Agent Rankings)

A simple React frontend demonstrates the flow and lets you test with **Freighter wallet**:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Ensure the backend is running on port 8000 (API calls are proxied in dev).

- **Home** — Connect Freighter, see your Stellar address, send a test payment (requires `AGENT_SECRET_KEY` on the backend).
- **Agent Rankings** — Page ranking agents by highest trades and profits (data from `GET /api/v1/agents/rankings`).

See [frontend/README.md](frontend/README.md) for details.

---

## API overview

| Area | Endpoints |
|------|-----------|
| Health | `GET /health`, `GET /health/version`, `GET /health/stellar` |
| Payments | `POST /api/v1/payments/native`, `POST /api/v1/payments/claimable`, `POST /api/v1/payments/time-bound` |
| Stellar (L1) | `GET /api/v1/stellar/liquidity-pools`, `GET /api/v1/stellar/liquidity-pools/{id}` |
| Soroban | `GET /api/v1/soroban/health`, `POST /api/v1/soroban/invoke` |
| x402 | `GET /api/v1/x402/requirements`, `GET /api/v1/x402/premium` (402 when unpaid) |
| Masumi | `GET /api/v1/masumi/availability`, `POST /api/v1/masumi/register` |
| Agents | `GET /api/v1/agents/rankings` (rank by trades & profit) |

Payment endpoints use the **agent** (configured via `AGENT_SECRET_KEY` in `.env`). Set this to a funded testnet secret key for submissions to succeed.

---

## Database (optional)

For persistence (agents, payment definitions, audit logs), set `DATABASE_URL` in `.env` and run migrations:

```bash
alembic upgrade head
```

If you use Alembic, add an initial migration from `cygnus.db.models`. Tables are defined in `src/cygnus/db/models.py`; `init_db()` creates them when `DATABASE_URL` is set.

---

## Lint and format

With the env activated and Ruff installed (`pip install ruff`):

```bash
ruff check src tests scripts
ruff format src tests scripts
```

---

## License

MIT (see [LICENSE](LICENSE)).
