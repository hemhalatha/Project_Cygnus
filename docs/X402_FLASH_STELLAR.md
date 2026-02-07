# x402-Flash Stellar SDK (PDF stack — Micropayment SDK)

**Role:** Off-chain payment channels on Stellar for **&lt;100ms latency** (micropayments without on-chain tx per call).

## Status

Placeholder. When **x402-Flash Stellar SDK** (or equivalent Stellar channel-based x402 implementation) is available:

1. Add the SDK as a dependency (npm/pip per official package).
2. Implement channel open/update/close in Cygnus (or a dedicated service) for:
   - Server: accept channel funding, verify channel state.
   - Client: open channel, make off-chain payments, settle on-chain when needed.
3. Expose endpoints or middleware that:
   - Prefer x402-Flash for high-frequency, low-latency calls.
   - Fall back to on-chain x402 (current implementation) for settlement.

## Current x402 in repo

- **On-chain x402** is implemented: HTTP 402, Payment-Requirements, PAYMENT-SIGNATURE verification, Stellar settlement.
- See `src/cygnus/api/x402.py` and `src/cygnus/api/routes/x402_routes.py`.

## References

- x402: https://x402.org/
- Stellar: https://stellar.org/
- Use official x402 + Stellar docs for the exact "x402-Flash Stellar SDK" package and API when integrating.
