"""SQLAlchemy models: agents, payment definitions, audit logs, agent transactions (Phase 6)."""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base for all models."""

    type_annotation_map = {
        dict[str, Any]: JSON,
    }


class AgentTransactionModel(Base):
    """Record of every transaction submitted by the agent (native, claimable, time_bound)."""

    __tablename__ = "agent_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kind: Mapped[str] = mapped_column(
        String(32), nullable=False, index=True
    )  # native, claimable, time_bound
    source_public_key: Mapped[str] = mapped_column(String(56), nullable=False, index=True)  # agent
    recipient_public_key: Mapped[str] = mapped_column(
        String(56), nullable=False, index=True
    )  # destination or claimant
    amount: Mapped[str] = mapped_column(String(32), nullable=False)
    memo: Mapped[str | None] = mapped_column(Text, nullable=True)
    transaction_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, index=True)  # success, failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_payload: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # full Horizon response or error detail
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class AgentModel(Base):
    """Stored agent config (e.g. label, key reference). Secret never stored in DB."""

    __tablename__ = "agents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    public_key: Mapped[str] = mapped_column(String(56), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class PaymentDefinitionModel(Base):
    """Programmable payment definition (e.g. recurring or one-off)."""

    __tablename__ = "payment_definitions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)  # native, claimable, time_bound
    destination: Mapped[str] = mapped_column(String(56), nullable=False)
    amount: Mapped[str] = mapped_column(String(32), nullable=False)
    extra: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # predicate, memo, etc.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class AuditLogModel(Base):
    """Audit log for agent actions and API requests."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    result: Mapped[str | None] = mapped_column(Text, nullable=True)  # success/error summary
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
