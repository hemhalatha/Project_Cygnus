"""Payment and agent endpoints: native, claimable, time-bound (Phase 6)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from cygnus.core.agent import (
    agent_create_claimable_balance,
    agent_native_payment,
    agent_native_payment_with_steps,
    agent_time_bound_payment,
)

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
