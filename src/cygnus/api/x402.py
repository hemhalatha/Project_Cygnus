"""
x402: HTTP 402 Payment Required (PDF stack — Payment Protocol).

Server returns 402 with payment requirements; client pays on Stellar and
retries with payment proof; server verifies and returns 200.
"""

import base64
import json
import time
from typing import Annotated

from fastapi import Header, HTTPException, Request
from pydantic import BaseModel, Field

from cygnus.config import get_settings
from cygnus.core.stellar.horizon import HorizonClient

# Header names (x402-style)
PAYMENT_REQUIREMENTS_HEADER = "Payment-Requirements"
PAYMENT_SIGNATURE_HEADER = "PAYMENT-SIGNATURE"
PAYMENT_RESPONSE_HEADER = "PAYMENT-RESPONSE"

# Default payment validity window (seconds)
PAYMENT_MAX_AGE_SECONDS = 300


class PaymentRequirements(BaseModel):
    """x402 payment requirements (Stellar)."""

    amount: str = Field(..., description="Amount in XLM (string)")
    asset: str = Field(default="native", description="Asset code or 'native'")
    network: str = Field(..., description="Stellar network (testnet/mainnet)")
    pay_to: str = Field(..., alias="payTo", description="Destination Stellar account (G...)")
    timeout_seconds: int = Field(default=300, alias="timeoutSeconds")
    created_at: int = Field(default_factory=lambda: int(time.time()), alias="createdAt")

    model_config = {"populate_by_name": True}


def get_payment_requirements() -> PaymentRequirements:
    """Build payment requirements from config (pay_to = agent public key or configured)."""
    settings = get_settings()
    # Use agent's public key as pay_to if we have secret (derive public); else placeholder
    pay_to = getattr(settings, "x402_pay_to", None)
    if not pay_to and settings.agent_secret_key:
        from stellar_sdk import Keypair

        pay_to = Keypair.from_secret(settings.agent_secret_key).public_key
    if not pay_to:
        pay_to = "GPLACEHOLDER402PAYTOXXXXXXXXXXXXXX"
    return PaymentRequirements(
        amount=settings.x402_amount_xlm,
        asset="native",
        network=settings.stellar_network,
        payTo=pay_to,
        timeoutSeconds=PAYMENT_MAX_AGE_SECONDS,
        createdAt=int(time.time()),
    )


def verify_payment_proof(
    payment_signature_b64: str,
    requirements: PaymentRequirements,
) -> bool:
    """
    Verify payment proof from client.
    Expects PAYMENT-SIGNATURE to be base64-encoded JSON with at least:
    - transaction_hash: Stellar tx hash (optional if we use signed payload)
    - paid_at: Unix timestamp
    For a minimal implementation we accept a recent tx hash and verify via Horizon.
    """
    try:
        raw = base64.b64decode(payment_signature_b64)
        payload = json.loads(raw.decode("utf-8"))
    except Exception:
        return False
    tx_hash = payload.get("transaction_hash") or payload.get("transactionHash")
    paid_at = payload.get("paid_at") or payload.get("paidAt") or 0
    if not tx_hash or paid_at <= 0:
        return False
    if time.time() - paid_at > PAYMENT_MAX_AGE_SECONDS:
        return False
    # Optional: fetch tx from Horizon and check it exists (and optionally payment to pay_to)
    try:
        client = HorizonClient()
        tx = client.server.transactions().transaction(tx_hash).call()
        return "hash" in tx or "id" in tx
    except Exception:
        return False


async def x402_dependency(
    request: Request,
    x_payment: Annotated[str | None, Header(alias="X-PAYMENT")] = None,
    payment_signature: Annotated[str | None, Header(alias=PAYMENT_SIGNATURE_HEADER)] = None,
) -> None:
    """
    FastAPI dependency: if x402 is enabled and no valid payment proof, raise 402.
    Otherwise do nothing (request proceeds).
    """
    settings = get_settings()
    if not settings.x402_enabled:
        return
    proof = x_payment or payment_signature
    if proof:
        req = get_payment_requirements()
        if verify_payment_proof(proof, req):
            return
    requirements = get_payment_requirements()
    body = requirements.model_dump(by_alias=True)
    raise HTTPException(
        status_code=402,
        detail="Payment Required",
        headers={
            PAYMENT_REQUIREMENTS_HEADER: base64.b64encode(json.dumps(body).encode()).decode(),
        },
    )


def x402_response_headers(receipt: dict) -> dict:
    """Build PAYMENT-RESPONSE headers for 200 OK (settlement confirmation)."""
    payload = json.dumps(receipt).encode()
    b64 = base64.b64encode(payload).decode()
    return {PAYMENT_RESPONSE_HEADER: b64}
