"""Agent rankings: highest trades and profits (for frontend demo)."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class AgentRanking(BaseModel):
    """Single agent in the rankings."""

    rank: int = Field(..., description="Rank position (1-based)")
    agent_id: str = Field(..., alias="agentId", description="Agent public key or ID")
    label: str = Field(..., description="Display name")
    trades_count: int = Field(..., alias="tradesCount", ge=0)
    profit_xlm: str = Field(..., alias="profitXlm", description="Total profit in XLM (string)")
    volume_xlm: str = Field(default="0", alias="volumeXlm", description="Total volume in XLM")

    model_config = {"populate_by_name": True, "serialize_by_alias": True}


def _get_demo_rankings() -> list[AgentRanking]:
    """Demo rankings for testing without DB. Replace with DB query when persistence is ready."""
    return [
        AgentRanking(
            rank=1,
            agentId="GAGENT001XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            label="Alpha Trader",
            tradesCount=1247,
            profitXlm="15230.50",
            volumeXlm="89200.00",
        ),
        AgentRanking(
            rank=2,
            agentId="GAGENT002XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            label="Beta Swapper",
            tradesCount=982,
            profitXlm="9876.25",
            volumeXlm="65400.00",
        ),
        AgentRanking(
            rank=3,
            agentId="GAGENT003XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            label="Gamma Arb",
            tradesCount=756,
            profitXlm="5432.10",
            volumeXlm="32100.00",
        ),
        AgentRanking(
            rank=4,
            agentId="GAGENT004XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            label="Delta Agent",
            tradesCount=445,
            profitXlm="2100.75",
            volumeXlm="18900.00",
        ),
        AgentRanking(
            rank=5,
            agentId="GAGENT005XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            label="Epsilon Runner",
            tradesCount=198,
            profitXlm="876.00",
            volumeXlm="5600.00",
        ),
    ]


@router.get("/rankings", response_model=list[AgentRanking])
async def get_agent_rankings() -> list[AgentRanking]:
    """
    Return agents ranked by trades count and profit (highest first).
    Demo: returns seed data; replace with DB once agent stats are persisted.
    """
    return _get_demo_rankings()
