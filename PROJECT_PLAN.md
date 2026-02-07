# Project Cygnus — Implementation Plan

**Goal:** Build a Machine Economy on Stellar with autonomous agents and programmable payments, following the architecture from *Architecting the Machine Economy: Engineering Autonomous Agents and Programmable Payments on the Stellar Blockchain*.

---

## 1. Architecture Overview

### 1.1 High-Level Components

| Layer | Responsibility |
|-------|----------------|
| **API** | FastAPI app: auth, rate limiting, request validation, REST endpoints |
| **Core services** | Agent service (keys, tx construction), Payment service (programmable payments), Blockchain service (Horizon + Soroban RPC) |
| **Data** | PostgreSQL: agent configs, payment definitions, audit logs |
| **Scheduler** | Time-based execution (Celery + Redis or APScheduler) |
| **Network** | Stellar testnet (optionally mainnet) |

### 1.2 Technology Stack

- **Python:** 3.11+
- **Stellar:** `stellar-sdk` (keys, Horizon, transactions, Soroban client)
- **API:** FastAPI, Pydantic
- **DB:** PostgreSQL, SQLAlchemy 2 (async optional)
- **Scheduler:** APScheduler (in-process) or Celery + Redis
- **Config:** Pydantic Settings, `.env`
- **Quality:** Ruff (lint + format), mypy (optional)

---

## 2. Step-by-Step Execution Plan

### Phase 1 — Stellar basics
- [ ] **1.1** Key generation and encoding (secret → public key, StrKey).
- [ ] **1.2** Create account (e.g. friendbot on testnet) and fetch account from Horizon.
- [ ] **1.3** Build and submit a native XLM payment transaction.
- **Deliverable:** Library/CLI that can create a keypair, fund it, and send XLM.

### Phase 2 — Programmable payment primitives
- [ ] **2.1** Create a **claimable balance** (e.g. XLM) with optional claim predicate (time, signer).
- [ ] **2.2** Create a **time-bound** payment (valid after/before timestamps).
- [ ] **2.3** (Optional) Interact with **liquidity pools** (read LP info; swap if needed later).
- **Deliverable:** Reusable helpers for claimable balances and time-bounded payments.

### Phase 3 — Soroban
- [ ] **3.1** Connect to Soroban RPC (testnet), get ledger and network passphrase.
- [ ] **3.2** Deploy a simple Soroban contract (e.g. from WASM or use a reference contract).
- [ ] **3.3** Invoke contract (read + write) and parse results.
- **Deliverable:** Soroban client module: deploy and invoke contracts.

### Phase 4 — Agent
- [ ] **4.1** Secure **key storage** (env or encrypted store; no keys in code).
- [ ] **4.2** **Agent service:** load identity, build transaction (payment/claimable/time-bound or Soroban), sign, submit.
- [ ] **4.3** Idempotency and retries (transaction replay, fee bumps).
- **Deliverable:** Agent that can perform predefined actions (e.g. create payment, create claimable balance) on behalf of a Stellar identity.

### Phase 5 — Scheduler
- [ ] **5.1** Define **scheduled jobs** (e.g. “create claimable balance every Friday” or “invoke contract at time T”).
- [ ] **5.2** Use **APScheduler** (or Celery) to trigger agent logic at the right time.
- [ ] **5.3** Log outcomes and handle failures (alert or retry).
- **Deliverable:** Time-driven execution of agent actions.

### Phase 6 — API and persistence
- [ ] **6.1** **FastAPI** app: health, version, and core routes (e.g. create payment, create claimable balance, list agents).
- [ ] **6.2** **PostgreSQL** schema: agents, payment definitions, audit logs; SQLAlchemy models and migrations (Alembic).
- [ ] **6.3** Wire API → services → Stellar; persist audit logs and payment metadata.
- [ ] **6.4** Auth (API key or JWT) and rate limiting.
- **Deliverable:** Production-ready API and DB for the machine economy.

### Phase 7 — Polish and quality
- [ ] **7.1** Ruff (lint + format), fix all reported issues.
- [ ] **7.2** Environment-based config (testnet/mainnet, Horizon URL, RPC URL).
- [ ] **7.3** README with setup (conda env `Project_Cygnus`), env vars, and run instructions.

---

## 3. Repository Layout (Target)

```
Project_Cygnus/
├── README.md
├── PROJECT_PLAN.md
├── environment.yml          # Conda env Project_Cygnus
├── .env.example
├── pyproject.toml           # Ruff, deps (optional)
├── requirements.txt        # Pip fallback
├── src/
│   └── cygnus/
│       ├── __init__.py
│       ├── config.py       # Pydantic settings
│       ├── api/
│       │   ├── __init__.py
│       │   ├── main.py     # FastAPI app
│       │   └── routes/
│       ├── core/
│       │   ├── __init__.py
│       │   ├── stellar/    # Keys, horizon, native payments
│       │   ├── payments/   # Claimable, time-bound
│       │   ├── soroban/    # Deploy, invoke
│       │   └── agent.py    # Agent service
│       ├── db/
│       │   ├── __init__.py
│       │   ├── models.py
│       │   └── session.py
│       └── scheduler/
│           ├── __init__.py
│           └── jobs.py
├── tests/
│   ├── __init__.py
│   └── ...
└── scripts/
    └── run_api.py
```

---

## 4. Environment Variables (Outline)

- `STELLAR_NETWORK` — passphrase (testnet/mainnet)
- `HORIZON_URL` — Horizon server
- `SOROBAN_RPC_URL` — Soroban RPC
- `DATABASE_URL` — PostgreSQL connection string
- `AGENT_SECRET_KEY` — (optional) default agent secret; prefer vault/env per agent
- `API_SECRET_KEY` or `JWT_SECRET` — API auth
- `REDIS_URL` — (if using Celery)

---

## 5. Success Criteria

- Clean code: no syntax or lint errors (Ruff clean).
- All six phases implemented and callable from API or CLI.
- Agent can create native payments, claimable balances, and time-bound payments; optional Soroban invoke.
- Scheduler triggers at least one type of agent action on a schedule.
- API documented (OpenAPI) and configurable via env.

---

*This plan is the single source of truth for implementation order and scope. Implementation will follow phases 1 → 7 in sequence.*
