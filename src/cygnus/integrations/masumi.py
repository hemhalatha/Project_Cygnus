"""
Masumi Network client (PDF stack — Identity & Trust).

DIDs, agent registration, decision logging, agent marketplace (Sokosumi).
API: /start_job, /status, /availability, /input_schema; Registry for listing agents.
"""

import logging
from typing import Any

import httpx

from cygnus.config import get_settings

logger = logging.getLogger(__name__)


class MasumiClient:
    """Client for Masumi Network: registry, payment service, agent registration."""

    def __init__(
        self,
        node_url: str | None = None,
        registry_url: str | None = None,
    ) -> None:
        settings = get_settings()
        self._node_url = (node_url or settings.masumi_node_url or "").rstrip("/")
        self._registry_url = (registry_url or settings.masumi_registry_url or "").rstrip("/")
        self._client: httpx.Client | None = None

    def _get_client(self) -> httpx.Client:
        if self._client is None:
            self._client = httpx.Client(timeout=30.0)
        return self._client

    def close(self) -> None:
        if self._client is not None:
            self._client.close()
            self._client = None

    def availability(self) -> dict[str, Any]:
        """GET /availability — check if our agentic service is operational (for Masumi)."""
        if not self._node_url:
            return {"available": False, "reason": "MASUMI_NODE_URL not set"}
        try:
            r = self._get_client().get(f"{self._node_url}/availability")
            r.raise_for_status()
            return {"available": True, "response": r.json()}
        except Exception as e:
            logger.warning("Masumi availability check failed: %s", e)
            return {"available": False, "reason": str(e)}

    def register_agent(
        self,
        name: str,
        description: str,
        pricing: str,
        payment_contract_address: str,
        example_output_url: str | None = None,
        terms_url: str | None = None,
        privacy_url: str | None = None,
    ) -> dict[str, Any]:
        """
        Register an agentic service with Masumi (Registry Service).
        Requires a Masumi node and Registry API; payment_contract_address is wallet for payments.
        """
        if not self._registry_url:
            return {"success": False, "error": "MASUMI_REGISTRY_URL not set"}
        payload = {
            "name": name,
            "description": description,
            "pricing": pricing,
            "paymentContractAddress": payment_contract_address,
        }
        if example_output_url:
            payload["exampleOutputUrl"] = example_output_url
        if terms_url:
            payload["termsUrl"] = terms_url
        if privacy_url:
            payload["privacyUrl"] = privacy_url
        try:
            r = self._get_client().post(f"{self._registry_url}/register", json=payload)
            r.raise_for_status()
            return {"success": True, "data": r.json()}
        except Exception as e:
            logger.warning("Masumi register_agent failed: %s", e)
            return {"success": False, "error": str(e)}

    def start_job(self, job_input: dict[str, Any]) -> dict[str, Any]:
        """POST /start_job — start a job (agentic service API that we implement; this calls remote)."""
        if not self._node_url:
            return {"success": False, "error": "MASUMI_NODE_URL not set"}
        try:
            r = self._get_client().post(f"{self._node_url}/start_job", json=job_input)
            r.raise_for_status()
            return {"success": True, "data": r.json()}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def status(self, job_id: str) -> dict[str, Any]:
        """GET /status?job_id=... — job status (agentic service API)."""
        if not self._node_url:
            return {"success": False, "error": "MASUMI_NODE_URL not set"}
        try:
            r = self._get_client().get(f"{self._node_url}/status", params={"job_id": job_id})
            r.raise_for_status()
            return {"success": True, "data": r.json()}
        except Exception as e:
            return {"success": False, "error": str(e)}
