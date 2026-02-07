"""Agent service: key storage, build and submit transactions (Phase 4)."""

from stellar_sdk import Keypair, Network

from cygnus.config import get_settings
from cygnus.core.payments.claimable import create_claimable_balance
from cygnus.core.payments.time_bound import build_time_bound_payment
from cygnus.core.stellar.payments import (
    build_unsigned_payment_xdr,
    submit_native_payment,
    submit_native_payment_with_steps,
)
from cygnus.db.agent_transactions import record_agent_transaction


def get_agent_secret() -> str | None:
    """Return agent secret key from config (env). Prefer vault per agent in production."""
    return get_settings().agent_secret_key


def get_agent_public_key() -> str | None:
    """Return agent public key (G...) derived from AGENT_SECRET_KEY, or None if not set."""
    secret = get_agent_secret()
    if not secret:
        return None
    return Keypair.from_secret(secret).public_key


def build_fund_agent_request(
    source_public_key: str,
    amount_xlm: str,
    memo: str | None = None,
) -> dict:
    """
    Build an unsigned transaction for the user (source) to send XLM to the agent.
    Returns transaction_xdr, network_passphrase, horizon_url, agent_public_key for the client to sign and submit.
    """
    agent_public = get_agent_public_key()
    if not agent_public:
        return {"success": False, "error": "no_agent_secret", "message": "AGENT_SECRET_KEY not set"}
    settings = get_settings()
    network_passphrase = (
        Network.TESTNET_NETWORK_PASSPHRASE
        if settings.stellar_network == "testnet"
        else Network.PUBLIC_NETWORK_PASSPHRASE
    )
    try:
        transaction_xdr = build_unsigned_payment_xdr(
            source_public_key=source_public_key,
            destination_public_key=agent_public,
            amount_xlm=amount_xlm,
            memo=memo,
        )
        return {
            "success": True,
            "transaction_xdr": transaction_xdr,
            "network_passphrase": network_passphrase,
            "horizon_url": settings.horizon_url.rstrip("/"),
            "agent_public_key": agent_public,
        }
    except Exception as e:
        return {"success": False, "error": type(e).__name__, "message": str(e)}


def _tx_hash_from_result(result) -> str | None:
    """Extract transaction hash from Horizon submit result (dict or object)."""
    if result is None:
        return None
    if isinstance(result, dict):
        return result.get("hash")
    return getattr(result, "hash", None)


def agent_native_payment(
    destination_public: str,
    amount_xlm: str,
    memo: str | None = None,
    source_secret: str | None = None,
) -> dict:
    """Agent submits a native XLM payment. Uses AGENT_SECRET_KEY if source_secret not given."""
    secret = source_secret or get_agent_secret()
    source_public = get_agent_public_key() if secret else None
    if not secret:
        return {"success": False, "error": "no_agent_secret", "message": "AGENT_SECRET_KEY not set"}
    try:
        result = submit_native_payment(secret, destination_public, amount_xlm, memo=memo)
        if source_public:
            record_agent_transaction(
                kind="native",
                source_public_key=source_public,
                recipient_public_key=destination_public,
                amount=amount_xlm,
                status="success",
                memo=memo,
                transaction_hash=_tx_hash_from_result(result),
                result_payload=result if isinstance(result, dict) else None,
            )
        return {"success": True, "result": result}
    except Exception as e:
        if source_public:
            record_agent_transaction(
                kind="native",
                source_public_key=source_public,
                recipient_public_key=destination_public,
                amount=amount_xlm,
                status="failed",
                memo=memo,
                error_message=str(e),
            )
        return {"success": False, "error": type(e).__name__, "message": str(e)}


def agent_native_payment_with_steps(
    destination_public: str,
    amount_xlm: str,
    memo: str | None = None,
    source_secret: str | None = None,
) -> dict:
    """Agent submits a native XLM payment and returns step-by-step log for UI."""
    secret = source_secret or get_agent_secret()
    if not secret:
        return {
            "success": False,
            "error": "no_agent_secret",
            "message": "AGENT_SECRET_KEY not set",
            "steps": [
                {"id": "config", "label": "Agent config", "status": "error", "detail": "AGENT_SECRET_KEY not set"},
            ],
        }
    steps, result = submit_native_payment_with_steps(
        secret, destination_public, amount_xlm, memo=memo
    )
    source_public = get_agent_public_key()
    if result is not None:
        if source_public:
            record_agent_transaction(
                kind="native",
                source_public_key=source_public,
                recipient_public_key=destination_public,
                amount=amount_xlm,
                status="success",
                memo=memo,
                transaction_hash=_tx_hash_from_result(result),
                result_payload=result if isinstance(result, dict) else None,
            )
        return {"success": True, "steps": steps, "result": result}
    last_detail = steps[-1].get("detail", "") if steps else ""
    if source_public:
        record_agent_transaction(
            kind="native",
            source_public_key=source_public,
            recipient_public_key=destination_public,
            amount=amount_xlm,
            status="failed",
            memo=memo,
            error_message=last_detail,
        )
    return {
        "success": False,
        "error": "payment_failed",
        "message": last_detail,
        "steps": steps,
    }


def agent_create_claimable_balance(
    claimant_public: str,
    amount: str,
    predicate_before_relative_seconds: int | None = None,
    source_secret: str | None = None,
) -> dict:
    """Agent creates a claimable balance. Uses AGENT_SECRET_KEY if source_secret not given."""
    secret = source_secret or get_agent_secret()
    source_public = get_agent_public_key() if secret else None
    if not secret:
        return {"success": False, "error": "no_agent_secret", "message": "AGENT_SECRET_KEY not set"}
    try:
        result = create_claimable_balance(
            secret,
            claimant_public,
            amount,
            predicate_before_relative_seconds=predicate_before_relative_seconds,
        )
        if source_public:
            record_agent_transaction(
                kind="claimable",
                source_public_key=source_public,
                recipient_public_key=claimant_public,
                amount=amount,
                status="success",
                transaction_hash=_tx_hash_from_result(result),
                result_payload=result if isinstance(result, dict) else None,
            )
        return {"success": True, "result": result}
    except Exception as e:
        if source_public:
            record_agent_transaction(
                kind="claimable",
                source_public_key=source_public,
                recipient_public_key=claimant_public,
                amount=amount,
                status="failed",
                error_message=str(e),
            )
        return {"success": False, "error": type(e).__name__, "message": str(e)}


def agent_time_bound_payment(
    destination_public: str,
    amount_xlm: str,
    valid_for_seconds: int = 300,
    source_secret: str | None = None,
) -> dict:
    """Agent submits a time-bound native payment. Uses AGENT_SECRET_KEY if source_secret not given."""
    secret = source_secret or get_agent_secret()
    source_public = get_agent_public_key() if secret else None
    if not secret:
        return {"success": False, "error": "no_agent_secret", "message": "AGENT_SECRET_KEY not set"}
    try:
        result = build_time_bound_payment(
            secret, destination_public, amount_xlm, valid_for_seconds=valid_for_seconds
        )
        if source_public:
            record_agent_transaction(
                kind="time_bound",
                source_public_key=source_public,
                recipient_public_key=destination_public,
                amount=amount_xlm,
                status="success",
                transaction_hash=_tx_hash_from_result(result),
                result_payload=result if isinstance(result, dict) else None,
            )
        return {"success": True, "result": result}
    except Exception as e:
        if source_public:
            record_agent_transaction(
                kind="time_bound",
                source_public_key=source_public,
                recipient_public_key=destination_public,
                amount=amount_xlm,
                status="failed",
                error_message=str(e),
            )
        return {"success": False, "error": type(e).__name__, "message": str(e)}
