# Project Cygnus

**Machine Economy: Autonomous Agents and Programmable Payments on the Stellar Blockchain**

This project implements the architecture described in *Architecting the Machine Economy: Engineering Autonomous Agents and Programmable Payments on the Stellar Blockchain* — Stellar basics, programmable payments (claimable balances, time-bound payments), Soroban smart contract integration, an agent service, a scheduler, and a FastAPI + optional PostgreSQL stack.

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

## API overview

| Area | Endpoints |
|------|-----------|
| Health | `GET /health`, `GET /health/version`, `GET /health/stellar` |
| Payments | `POST /api/v1/payments/native`, `POST /api/v1/payments/claimable`, `POST /api/v1/payments/time-bound` |
| Soroban | `GET /api/v1/soroban/health`, `POST /api/v1/soroban/invoke` |

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
