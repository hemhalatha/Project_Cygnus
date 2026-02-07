# ElizaOS + Cygnus (PDF stack — Agent Framework)

This folder is the **ElizaOS** integration point for Project Cygnus.

## Target stack

- **Agent Framework:** ElizaOS (TypeScript multi-agent OS for logic and memory).
- **Settlement:** Cygnus API (Stellar/Soroban) — agents call Cygnus for payments, claimable balances, Soroban.

## Setup

1. Install ElizaOS CLI and create a project (see [ElizaOS docs](https://docs.elizaos.ai/)):

   ```bash
   bun install -g @elizaos/cli
   elizaos create cygnus-agent
   cd cygnus-agent
   ```

2. Point agents at the Cygnus API:

   - Set `CYGNUS_API_URL` (e.g. `http://localhost:8000`) in your agent env.
   - Use a plugin or action that calls Cygnus endpoints:
     - `POST /api/v1/payments/native`
     - `POST /api/v1/payments/claimable`
     - `POST /api/v1/payments/time-bound`
     - `POST /api/v1/soroban/invoke`

3. Optional: implement an **ElizaOS plugin** in this repo that wraps Cygnus API so agents can "pay" and "settle" via Stellar from within ElizaOS.

## Placeholder

This directory holds the scaffold. Full ElizaOS project can live here or in a sibling repo; agents must call the Cygnus API for all Stellar/Soroban actions.
