"""Agent service: key storage, build and submit transactions (Phase 4)."""

from cygnus.config import get_settings
from cygnus.core.payments.claimable import create_claimable_balance
from cygnus.core.payments.time_bound import build_time_bound_payment
from cygnus.core.stellar.payments import submit_native_payment


def get_agent_secret() -> str | None:
    """Return agent secret key from config (env). Prefer vault per agent in production."""
    return get_settings().agent_secret_key


def agent_native_payment(
    destination_public: str,
    amount_xlm: str,
    memo: str | None = None,
    source_secret: str | None = None,
) -> dict:
    """Agent submits a native XLM payment. Uses AGENT_SECRET_KEY if source_secret not given."""
    secret = source_secret or get_agent_secret()
    if not secret:
        return {"success": False, "error": "no_agent_secret", "message": "AGENT_SECRET_KEY not set"}
    try:
        result = submit_native_payment(secret, destination_public, amount_xlm, memo=memo)
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": type(e).__name__, "message": str(e)}


def agent_create_claimable_balance(
    claimant_public: str,
    amount: str,
    predicate_before_relative_seconds: int | None = None,
    source_secret: str | None = None,
) -> dict:
    """Agent creates a claimable balance. Uses AGENT_SECRET_KEY if source_secret not given."""
    secret = source_secret or get_agent_secret()
    if not secret:
        return {"success": False, "error": "no_agent_secret", "message": "AGENT_SECRET_KEY not set"}
    try:
        result = create_claimable_balance(
            secret,
            claimant_public,
            amount,
            predicate_before_relative_seconds=predicate_before_relative_seconds,
        )
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": type(e).__name__, "message": str(e)}


def agent_time_bound_payment(
    destination_public: str,
    amount_xlm: str,
    valid_for_seconds: int = 300,
    source_secret: str | None = None,
) -> dict:
    """Agent submits a time-bound native payment. Uses AGENT_SECRET_KEY if source_secret not given."""
    secret = source_secret or get_agent_secret()
    if not secret:
        return {"success": False, "error": "no_agent_secret", "message": "AGENT_SECRET_KEY not set"}
    try:
        result = build_time_bound_payment(
            secret, destination_public, amount_xlm, valid_for_seconds=valid_for_seconds
        )
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": type(e).__name__, "message": str(e)}
