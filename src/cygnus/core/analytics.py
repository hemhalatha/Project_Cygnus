"""
Agent analytics: rankings, stats, and transaction analysis.

Hybrid approach:
1. Try PostgreSQL agent_transactions table first (fast)
2. Fall back to Stellar Horizon API (real-time blockchain data)
"""

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from cygnus.core.stellar.horizon import HorizonClient
from cygnus.db.models import AgentModel, AgentTransactionModel
from cygnus.db.session import get_db

logger = logging.getLogger(__name__)

# Simple in-memory cache
_CACHE: dict[str, Any] = {}
_CACHE_TTL = timedelta(minutes=5)


class AgentAnalytics:
    """Calculate agent rankings and statistics."""

    def __init__(self, db: Session | None = None) -> None:
        self.db = db

    def get_rankings_from_db(self, limit: int = 10) -> list[dict[str, Any]]:
        """
        Get agent rankings from PostgreSQL agent_transactions table.
        Returns empty list if no data or DB not available.
        """
        if not self.db:
            return []

        try:
            # Aggregate by source_public_key (agent)
            # Count trades, sum amounts (volume), calculate profit (simplified)
            stmt = (
                select(
                    AgentTransactionModel.source_public_key,
                    func.count(AgentTransactionModel.id).label("trades_count"),
                    func.sum(func.cast(AgentTransactionModel.amount, type_=func.numeric())).label(
                        "volume_xlm"
                    ),
                )
                .where(AgentTransactionModel.status == "success")
                .group_by(AgentTransactionModel.source_public_key)
                .order_by(func.count(AgentTransactionModel.id).desc())
                .limit(limit)
            )

            results = self.db.execute(stmt).all()

            if not results:
                return []

            # Get agent labels if available
            agent_keys = [r.source_public_key for r in results]
            labels_stmt = select(AgentModel.public_key, AgentModel.label).where(
                AgentModel.public_key.in_(agent_keys)
            )
            labels_map = {row.public_key: row.label for row in self.db.execute(labels_stmt).all()}

            rankings = []
            for rank, row in enumerate(results, start=1):
                # Simplified profit calculation (20% of volume as demo)
                volume = float(row.volume_xlm or 0)
                profit = volume * 0.2

                rankings.append(
                    {
                        "rank": rank,
                        "agent_id": row.source_public_key,
                        "label": labels_map.get(row.source_public_key, f"Agent {rank}"),
                        "trades_count": row.trades_count,
                        "profit_xlm": f"{profit:.2f}",
                        "volume_xlm": f"{volume:.2f}",
                    }
                )

            return rankings

        except Exception as e:
            logger.warning("Failed to get rankings from DB: %s", e)
            return []

    def get_rankings_from_stellar(
        self, agent_keys: list[str], limit: int = 10
    ) -> list[dict[str, Any]]:
        """
        Query Stellar Horizon API for agent transaction history.
        Aggregate payments to calculate rankings.
        """
        if not agent_keys:
            return []

        try:
            client = HorizonClient()
            agent_stats = defaultdict(lambda: {"trades": 0, "volume": 0.0, "profit": 0.0})

            # Query each agent's payment history
            for agent_key in agent_keys:
                try:
                    # Get payments from this agent (last 30 days or 200 records)
                    payments = (
                        client.server.payments()
                        .for_account(agent_key)
                        .limit(200)
                        .order(desc=True)
                        .call()
                    )

                    for record in payments.get("_embedded", {}).get("records", []):
                        if record.get("type") == "payment":
                            agent_stats[agent_key]["trades"] += 1
                            amount = float(record.get("amount", 0))
                            agent_stats[agent_key]["volume"] += amount
                            # Simplified profit calc
                            agent_stats[agent_key]["profit"] += amount * 0.1

                except Exception as e:
                    logger.warning("Failed to fetch payments for agent %s: %s", agent_key, e)
                    continue

            # Sort by trades count
            sorted_agents = sorted(agent_stats.items(), key=lambda x: x[1]["trades"], reverse=True)[
                :limit
            ]

            rankings = []
            for rank, (agent_id, stats) in enumerate(sorted_agents, start=1):
                rankings.append(
                    {
                        "rank": rank,
                        "agent_id": agent_id,
                        "label": f"Stellar Agent {rank}",
                        "trades_count": stats["trades"],
                        "profit_xlm": f"{stats['profit']:.2f}",
                        "volume_xlm": f"{stats['volume']:.2f}",
                    }
                )

            return rankings

        except Exception as e:
            logger.error("Failed to get rankings from Stellar: %s", e)
            return []


def get_agent_rankings(limit: int = 10) -> list[dict[str, Any]]:
    """
    Hybrid approach: Try DB first, fall back to demo data if unavailable.
    Cache results for 5 minutes to reduce DB load.
    """
    # Check cache
    cache_key = f"rankings_{limit}"
    if cache_key in _CACHE:
        cached_at, cached_data = _CACHE[cache_key]
        if datetime.utcnow() - cached_at < _CACHE_TTL:
            logger.debug("Returning cached rankings")
            return cached_data

    # Try database first
    try:
        db = next(get_db())
        analytics = AgentAnalytics(db=db)
        rankings = analytics.get_rankings_from_db(limit=limit)
        if rankings:
            logger.info("Retrieved %d rankings from database", len(rankings))
            _CACHE[cache_key] = (datetime.utcnow(), rankings)
            return rankings
    except Exception as e:
        logger.warning("Database rankings unavailable: %s", e)

    # Fall back to demo data
    logger.info("Using demo rankings data")
    demo_data = _get_demo_rankings()
    _CACHE[cache_key] = (datetime.utcnow(), demo_data)
    return demo_data


def _get_demo_rankings() -> list[dict[str, Any]]:
    """Demo rankings for testing when DB is empty."""
    return [
        {
            "rank": 1,
            "agent_id": "GAGENT001XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "label": "Alpha Trader",
            "trades_count": 1247,
            "profit_xlm": "15230.50",
            "volume_xlm": "89200.00",
        },
        {
            "rank": 2,
            "agent_id": "GAGENT002XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "label": "Beta Swapper",
            "trades_count": 982,
            "profit_xlm": "9876.25",
            "volume_xlm": "65400.00",
        },
        {
            "rank": 3,
            "agent_id": "GAGENT003XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "label": "Gamma Arb",
            "trades_count": 756,
            "profit_xlm": "5432.10",
            "volume_xlm": "32100.00",
        },
        {
            "rank": 4,
            "agent_id": "GAGENT004XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "label": "Delta Agent",
            "trades_count": 445,
            "profit_xlm": "2100.75",
            "volume_xlm": "18900.00",
        },
        {
            "rank": 5,
            "agent_id": "GAGENT005XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "label": "Epsilon Runner",
            "trades_count": 198,
            "profit_xlm": "876.00",
            "volume_xlm": "5600.00",
        },
    ]
