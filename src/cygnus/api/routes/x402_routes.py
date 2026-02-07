"""Routes that use x402 Payment Required (PDF stack — Payment Protocol)."""

from fastapi import APIRouter, Depends

from cygnus.api.x402 import get_payment_requirements, x402_dependency

router = APIRouter()


@router.get("/requirements")
async def payment_requirements():
    """Return current payment requirements (amount, payTo, network). No 402; for client display."""
    return get_payment_requirements().model_dump(by_alias=True)


@router.get("/premium", dependencies=[Depends(x402_dependency)])
async def premium_resource():
    """
    Example paywalled resource. Requires x402 payment (X-PAYMENT or PAYMENT-SIGNATURE header)
    with valid proof; otherwise returns 402 with Payment-Requirements.
    """
    return {
        "message": "Premium content (paid via x402)",
        "receipt": {"status": "settled", "protocol": "x402"},
    }
