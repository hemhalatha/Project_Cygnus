# Target Technology Stack — Machine Economy

This document defines the **five-layer architecture** we are building toward. Each layer has a designated technology and role.

---

## Stack Overview

| Layer | Technology | Role |
|-------|------------|------|
| **Settlement (L1)** | Stellar / Soroban | Distributed ledger for final payment settlement and escrow. |
| **Agent Framework** | **ElizaOS** | TypeScript-based multi-agent operating system for logic and memory. |
| **Payment Protocol** | **x402** | HTTP-native standard for "Payment Required" (402) response cycles. |
| **Micropayment SDK** | **x402-Flash Stellar SDK** | Off-chain payment channels for &lt;100ms latency on Stellar. |
| **Identity & Trust** | **Masumi Network** | Registry for DIDs, decision logging, and agent marketplace. |

---

## 1. Settlement (L1) — Stellar / Soroban

- **Role:** Final settlement, escrow, on-chain programmable payments.
- **In this repo:** Implemented in `src/cygnus/core/stellar/` and `src/cygnus/core/soroban/` (Horizon, native payments, claimable balances, time-bound payments, Soroban invoke).
- **Status:** ✅ In place.

---

## 2. Agent Framework — ElizaOS

- **Role:** Multi-agent logic, memory, and orchestration (TypeScript).
- **What it is:** [ElizaOS](https://github.com/elizaos/eliza) — open-source multi-agent AI framework (Node/bun, plugins, web UI).
- **Integration approach:**
  - Run ElizaOS as the **agent runtime** (one or more agents with memory and plugins).
  - Use our **Python API** (or a small Node service) as the “Stellar bridge”: ElizaOS agents call out to Cygnus for Stellar/Soroban actions (payments, claimable balances, contract invokes).
  - Optionally implement an **ElizaOS plugin** that talks to Cygnus API so agents can “pay” and “settle” via Stellar without leaving the framework.
- **Status:** 🔲 To integrate (see [Integration Plan](#integration-plan) below).

---

## 3. Payment Protocol — x402

- **Role:** HTTP-native “Payment Required” flow: server returns 402 with payment details; client pays; server confirms and returns resource.
- **What it is:** [x402](https://x402.org/) — protocol that uses HTTP 402 + payment headers (e.g. payment requirements, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE`) for API monetization and machine-to-machine payments.
- **Integration approach:**
  - Add **x402 support to Cygnus API**: selected endpoints return 402 with Stellar payment requirements when payment is required; accept payment proof and return 200 + optional receipt.
  - Use **Stellar** as the settlement layer for x402 (amount, asset, payTo, network).
- **Status:** 🔲 To integrate.

---

## 4. Micropayment SDK — x402-Flash Stellar SDK

- **Role:** Off-chain payment channels on Stellar for &lt;100ms latency (micropayments without on-chain tx per call).
- **What it is:** Stellar-oriented x402 implementation for fast, channel-based flows (exact package name may be “x402-flash” or Stellar SDK extension; align with official x402 + Stellar docs when implementing).
- **Integration approach:**
  - Use **x402-Flash Stellar SDK** (or equivalent) on the client and/or server for channel open/update/close.
  - Cygnus API can support both: (1) direct on-chain x402 (L1 settlement), (2) x402-Flash channels for high-frequency, low-latency micropayments that settle on Stellar when needed.
- **Status:** 🔲 To integrate (depends on x402-Flash Stellar SDK availability and API).

---

## 5. Identity & Trust — Masumi Network

- **Role:** DIDs for agents, decision logging, and agent marketplace/discovery.
- **What it is:** [Masumi Network](https://www.masumi.network/) — protocol for agent identity (DIDs), transactions, and marketplace (e.g. Sokosumi); framework-agnostic.
- **Integration approach:**
  - Register **ElizaOS agents** (or Cygnus-backed agents) with Masumi for DID and discovery.
  - Use Masumi for **decision logging** and, if desired, listing agents in the marketplace.
  - Keep **Stellar** as the settlement layer; Masumi as identity and trust layer.
- **Status:** 🔲 To integrate.

---

## Integration Plan (High Level)

1. **Keep and extend L1 (Stellar/Soroban)** — Already implemented; add any x402 settlement fields (e.g. payTo, asset, amount) to API where needed.
2. **Add x402 to Cygnus API** — Implement 402 responses and payment verification for chosen endpoints; document payment requirements format (Stellar).
3. **Introduce ElizaOS** — Deploy ElizaOS (CLI or monorepo); have agents call Cygnus API for Stellar actions; optionally build an ElizaOS plugin wrapping Cygnus.
4. **Add x402-Flash Stellar SDK** — When available, integrate channel-based micropayments for low-latency paths; keep on-chain x402 for final settlement.
5. **Connect Masumi** — Integrate DID registration and decision logging; optionally list agents on Masumi marketplace.

---

## Current Repo vs Target Stack

| Stack layer | Current implementation | Next steps |
|------------|------------------------|------------|
| Settlement (L1) | `cygnus.core.stellar`, `cygnus.core.soroban` | Expose x402-compatible payment params; optional Soroban escrow. |
| Agent framework | Python “agent” (key storage, tx submit) | Add ElizaOS as primary agent runtime; Cygnus as Stellar backend. |
| Payment protocol | None | Implement x402 (402 + payment headers) on API. |
| Micropayment SDK | None | Integrate x402-Flash Stellar SDK for channels. |
| Identity & trust | None | Integrate Masumi (DIDs, logging, marketplace). |

This file is the single reference for the **target stack**; implementation tasks are tracked in **PROJECT_PLAN.md** and README.
