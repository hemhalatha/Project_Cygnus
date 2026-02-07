"""Record and list agent transactions (Phase 6)."""

import logging
from typing import Any

from cygnus.config import get_settings
from cygnus.db.models import AgentTransactionModel

logger = logging.getLogger(__name__)


def record_agent_transaction(
    kind: str,
    source_public_key: str,
    recipient_public_key: str,
    amount: str,
    status: str,
    *,
    memo: str | None = None,
    transaction_hash: str | None = None,
    error_message: str | None = None,
    result_payload: dict[str, Any] | None = None,
) -> None:
    """
    Persist an agent transaction to the database.
    Never raises: if DATABASE_URL is unset or DB fails, we log and skip so payment flow is unaffected.
    """
    try:
        settings = get_settings()
        if not settings.database_url:
            return
        from cygnus.db.session import get_session_factory

        factory = get_session_factory()
        with factory() as session:
            row = AgentTransactionModel(
                kind=kind,
                source_public_key=source_public_key,
                recipient_public_key=recipient_public_key,
                amount=amount,
                memo=memo,
                transaction_hash=transaction_hash,
                status=status,
                error_message=error_message,
                result_payload=result_payload,
            )
            session.add(row)
            session.commit()
    except Exception as e:
        logger.warning("Failed to record agent transaction: %s", e)


def list_agent_transactions(limit: int = 50, offset: int = 0) -> list[dict[str, Any]]:
    """Return recent agent transactions (newest first). Requires DATABASE_URL."""
    from cygnus.db.session import get_session_factory

    factory = get_session_factory()
    with factory() as session:
        rows = (
            session.query(AgentTransactionModel)
            .order_by(AgentTransactionModel.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        return [
            {
                "id": r.id,
                "kind": r.kind,
                "source_public_key": r.source_public_key,
                "recipient_public_key": r.recipient_public_key,
                "amount": r.amount,
                "memo": r.memo,
                "transaction_hash": r.transaction_hash,
                "status": r.status,
                "error_message": r.error_message,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
