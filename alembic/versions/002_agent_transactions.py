"""Add agent_transactions table.

Revision ID: 002
Revises: 001
Create Date: 2026-02-07

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: str | None = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "agent_transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("kind", sa.String(32), nullable=False),
        sa.Column("source_public_key", sa.String(56), nullable=False),
        sa.Column("recipient_public_key", sa.String(56), nullable=False),
        sa.Column("amount", sa.String(32), nullable=False),
        sa.Column("memo", sa.Text(), nullable=True),
        sa.Column("transaction_hash", sa.String(64), nullable=True),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("result_payload", sa.JSON(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_transactions_kind", "agent_transactions", ["kind"], unique=False)
    op.create_index(
        "ix_agent_transactions_source_public_key",
        "agent_transactions",
        ["source_public_key"],
        unique=False,
    )
    op.create_index(
        "ix_agent_transactions_recipient_public_key",
        "agent_transactions",
        ["recipient_public_key"],
        unique=False,
    )
    op.create_index(
        "ix_agent_transactions_transaction_hash",
        "agent_transactions",
        ["transaction_hash"],
        unique=False,
    )
    op.create_index(
        "ix_agent_transactions_status", "agent_transactions", ["status"], unique=False
    )
    op.create_index(
        "ix_agent_transactions_created_at",
        "agent_transactions",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_agent_transactions_created_at", table_name="agent_transactions")
    op.drop_index("ix_agent_transactions_status", table_name="agent_transactions")
    op.drop_index("ix_agent_transactions_transaction_hash", table_name="agent_transactions")
    op.drop_index("ix_agent_transactions_recipient_public_key", table_name="agent_transactions")
    op.drop_index("ix_agent_transactions_source_public_key", table_name="agent_transactions")
    op.drop_index("ix_agent_transactions_kind", table_name="agent_transactions")
    op.drop_table("agent_transactions")
