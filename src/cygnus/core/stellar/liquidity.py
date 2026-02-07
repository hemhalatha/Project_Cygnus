"""
Liquidity pools (PDF — programmable payment primitives, optional).

Read LP info from Horizon; optional swap later.
"""

from stellar_sdk import Server

from cygnus.config import get_settings


def get_liquidity_pool(pool_id: str, horizon_url: str | None = None) -> dict:
    """
    Fetch a liquidity pool by ID from Horizon.
    pool_id: hex-encoded liquidity pool ID (e.g. from /liquidity_pools).
    """
    settings = get_settings()
    server = Server(horizon_url or settings.horizon_url)
    return server.liquidity_pools().liquidity_pool(pool_id).call()


def list_liquidity_pools(
    horizon_url: str | None = None,
    limit: int = 10,
    cursor: str | None = None,
) -> dict:
    """List liquidity pools (paginated)."""
    settings = get_settings()
    server = Server(horizon_url or settings.horizon_url)
    req = server.liquidity_pools().limit(limit)
    if cursor:
        req = req.cursor(cursor)
    return req.call()
