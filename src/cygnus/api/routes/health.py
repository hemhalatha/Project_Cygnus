"""Health and version endpoints."""

from fastapi import APIRouter

from cygnus import __version__
from cygnus.config import get_settings
from cygnus.core.soroban.client import SorobanClient

router = APIRouter()


@router.get("")
async def health_check() -> dict:
    """Liveness: app is running."""
    return {"status": "ok", "version": __version__}


@router.get("/version")
async def version() -> dict:
    """API version."""
    return {"version": __version__}


@router.get("/stellar")
async def stellar_status() -> dict:
    """Stellar network and Soroban RPC status."""
    settings = get_settings()
    out = {
        "network": settings.stellar_network,
        "horizon_url": settings.horizon_url,
        "soroban_rpc_url": settings.soroban_rpc_url,
    }
    try:
        client = SorobanClient()
        out["soroban_health"] = client.get_health()
        out["soroban_ledger"] = client.get_latest_ledger()
        client.close()
    except Exception as e:
        out["soroban_error"] = str(e)
    return out
