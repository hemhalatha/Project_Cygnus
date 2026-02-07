"""Soroban RPC client: network, ledger, simulate, prepare, send (Phase 3)."""

from stellar_sdk import SorobanServer

from cygnus.config import get_settings


class SorobanClient:
    """Connect to Soroban RPC: health, network, ledger, prepare and send transactions."""

    def __init__(self, rpc_url: str | None = None) -> None:
        url = rpc_url or get_settings().soroban_rpc_url
        if not url.startswith("http"):
            url = f"https://{url}"
        self._server = SorobanServer(server_url=url)

    @property
    def server(self) -> SorobanServer:
        return self._server

    def get_network(self) -> str:
        """Return network passphrase from RPC."""
        resp = self._server.get_network()
        return resp.network_passphrase

    def get_latest_ledger(self) -> int:
        """Return latest ledger sequence."""
        resp = self._server.get_latest_ledger()
        return int(resp.sequence)

    def get_health(self) -> dict:
        """Health check; returns status info."""
        resp = self._server.get_health()
        return {"status": getattr(resp, "status", "ok")}

    def close(self) -> None:
        """Close the RPC client."""
        self._server.close()
