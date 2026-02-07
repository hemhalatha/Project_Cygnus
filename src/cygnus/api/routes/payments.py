"""Payment and agent endpoints: native, claimable, time-bound, transactions list (Phase 6)."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from cygnus.config import get_settings
from cygnus.core.agent import (
    agent_create_claimable_balance,
    agent_native_payment,
    agent_native_payment_with_steps,
    agent_time_bound_payment,
    build_fund_agent_request,
    get_agent_public_key,
)
from cygnus.db.agent_transactions import list_agent_transactions

router = APIRouter()


class NativePaymentRequest(BaseModel):
    """Request body for native XLM payment."""

    destination_public: str = Field(..., min_length=56, max_length=56)
    amount_xlm: str = Field(..., pattern=r"^\d+(\.\d+)?$")
    memo: str | None = None


class ClaimableBalanceRequest(BaseModel):
    """Request body for creating a claimable balance."""

    claimant_public: str = Field(..., min_length=56, max_length=56)
    amount: str = Field(..., pattern=r"^\d+(\.\d+)?$")
    predicate_before_relative_seconds: int | None = None


class TimeBoundPaymentRequest(BaseModel):
    """Request body for time-bound payment."""

    destination_public: str = Field(..., min_length=56, max_length=56)
    amount_xlm: str = Field(..., pattern=r"^\d+(\.\d+)?$")
    valid_for_seconds: int = Field(default=300, ge=1, le=86400)


class BuildFundAgentRequest(BaseModel):
    """Request body for building a fund-agent transaction (user -> agent)."""

    source_public_key: str = Field(..., min_length=56, max_length=56)
    amount_xlm: str = Field(..., pattern=r"^\d+(\.\d+)?$")
    memo: str | None = None


@router.get("/transactions")
async def get_transactions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """List agent transactions (newest first). Requires DATABASE_URL."""
    if not get_settings().database_url:
        raise HTTPException(
            status_code=503,
            detail="Database not configured (DATABASE_URL not set). Agent transactions are not persisted.",
        )
    try:
        items = list_agent_transactions(limit=limit, offset=offset)
        return {"transactions": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agent-address")
async def get_agent_address() -> dict:
    """Return the agent's public key (G...) for funding. 404 if AGENT_SECRET_KEY not set."""
    public_key = get_agent_public_key()
    if not public_key:
        raise HTTPException(status_code=404, detail="Agent not configured (AGENT_SECRET_KEY not set)")
    return {"public_key": public_key}


@router.post("/build-fund-agent")
async def post_build_fund_agent(body: BuildFundAgentRequest) -> dict:
    """Build an unsigned transaction for the user to send XLM to the agent. Client signs with Freighter and submits to Horizon."""
    result = build_fund_agent_request(
        source_public_key=body.source_public_key,
        amount_xlm=body.amount_xlm,
        memo=body.memo,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@router.post("/native")
async def post_native_payment(body: NativePaymentRequest) -> dict:
    """Submit a native XLM payment via the agent."""
    result = agent_native_payment(
        destination_public=body.destination_public,
        amount_xlm=body.amount_xlm,
        memo=body.memo,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@router.post("/native/with-steps")
async def post_native_payment_with_steps(body: NativePaymentRequest) -> dict:
    """Submit a native XLM payment via the agent and return step-by-step log."""
    result = agent_native_payment_with_steps(
        destination_public=body.destination_public,
        amount_xlm=body.amount_xlm,
        memo=body.memo,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@router.post("/claimable")
async def post_claimable_balance(body: ClaimableBalanceRequest) -> dict:
    """Create a claimable balance via the agent."""
    result = agent_create_claimable_balance(
        claimant_public=body.claimant_public,
        amount=body.amount,
        predicate_before_relative_seconds=body.predicate_before_relative_seconds,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result


@router.post("/time-bound")
async def post_time_bound_payment(body: TimeBoundPaymentRequest) -> dict:
    """Submit a time-bound native payment via the agent."""
    result = agent_time_bound_payment(
        destination_public=body.destination_public,
        amount_xlm=body.amount_xlm,
        valid_for_seconds=body.valid_for_seconds,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result
