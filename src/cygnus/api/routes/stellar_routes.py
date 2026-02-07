"""Stellar L1 routes: liquidity pools (PDF tech)."""

from fastapi import APIRouter, HTTPException

from cygnus.core.stellar.liquidity import get_liquidity_pool, list_liquidity_pools

router = APIRouter()


@router.get("/liquidity-pools")
async def list_pools(limit: int = 10, cursor: str | None = None) -> dict:
    """List liquidity pools from Horizon (PDF — programmable payment primitives)."""
    try:
        return list_liquidity_pools(limit=limit, cursor=cursor)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/liquidity-pools/{pool_id}")
async def get_pool(pool_id: str) -> dict:
    """Get one liquidity pool by ID (PDF — programmable payment primitives)."""
    try:
        return get_liquidity_pool(pool_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
