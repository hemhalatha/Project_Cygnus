"""Soroban endpoints: health, invoke (Phase 6)."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from cygnus.core.soroban.client import SorobanClient
from cygnus.core.soroban.invoke import invoke_contract

router = APIRouter()


@router.get("/health")
async def soroban_health() -> dict:
    """Soroban RPC health and latest ledger."""
    client = SorobanClient()
    try:
        return {
            "health": client.get_health(),
            "latest_ledger": client.get_latest_ledger(),
            "network": client.get_network(),
        }
    finally:
        client.close()


class InvokeContractRequest(BaseModel):
    """Request body for contract invocation."""

    contract_id: str = Field(..., min_length=56)
    function_name: str = Field(..., min_length=1)
    parameters: list[dict] = Field(default_factory=list)
    source_secret: str = Field(..., min_length=56)


@router.post("/invoke")
async def post_invoke_contract(body: InvokeContractRequest) -> dict:
    """
    Invoke a Soroban contract function. Parameters must be SCVal-compatible;
    pass a list of objects that stellar_sdk.scval can convert (e.g. address, u32).
    For advanced use, call the core invoke_contract with scval list directly.
    """
    # Simple pass-through; in production you'd map body.parameters to scval list
    result = invoke_contract(
        contract_id=body.contract_id,
        function_name=body.function_name,
        parameters=body.parameters,
        source_secret=body.source_secret,
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result)
    return result
