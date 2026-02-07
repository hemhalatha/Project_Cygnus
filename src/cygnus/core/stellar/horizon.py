"""Horizon client: fetch account, submit transactions (Phase 1.2)."""

from stellar_sdk import Server
from stellar_sdk.exceptions import BadRequestError

from cygnus.config import get_settings


class HorizonClient:
    """Horizon server client for account and transaction operations."""

    def __init__(self, horizon_url: str | None = None) -> None:
        url = horizon_url or get_settings().horizon_url
        self._server = Server(url)

    @property
    def server(self) -> Server:
        return self._server

    def get_account(self, account_id: str) -> dict:
        """Fetch account details from Horizon. Raises if not found."""
        return self._server.load_account(account_id)

    def submit_transaction(self, transaction) -> dict:
        """Submit a signed transaction. Returns result or raises BadRequestError."""
        return self._server.submit_transaction(transaction)

    def fetch_base_fee(self) -> int:
        """Current base fee (stroops)."""
        return self._server.fetch_base_fee()
