"""Agent rankings: highest trades and profits (for frontend demo)."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from cygnus.core.analytics import get_agent_rankings

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


@router.get("/rankings", response_model=list[AgentRanking])
async def get_rankings(limit: int = 10) -> list[AgentRanking]:
    """
    Return agents ranked by trades count and profit (highest first).
    Hybrid: Uses PostgreSQL if available, falls back to demo data.
    """
    rankings_data = get_agent_rankings(limit=limit)
    return [AgentRanking(**ranking) for ranking in rankings_data]
