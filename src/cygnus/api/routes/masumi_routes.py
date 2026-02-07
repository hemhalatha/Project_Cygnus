"""Masumi Network routes (PDF stack — Identity & Trust)."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from cygnus.integrations.masumi import MasumiClient

router = APIRouter()


@router.get("/availability")
async def masumi_availability() -> dict:
    """Check Masumi node availability (for agentic service health)."""
    client = MasumiClient()
    try:
        return client.availability()
    finally:
        client.close()


class RegisterAgentBody(BaseModel):
    """Body for agent registration with Masumi."""

    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    pricing: str = Field(..., min_length=1)
    payment_contract_address: str = Field(..., min_length=1)
    example_output_url: str | None = None
    terms_url: str | None = None
    privacy_url: str | None = None


@router.post("/register")
async def register_agent(body: RegisterAgentBody) -> dict:
    """Register an agentic service with Masumi (DIDs, marketplace). Requires MASUMI_REGISTRY_URL."""
    client = MasumiClient()
    try:
        return client.register_agent(
            name=body.name,
            description=body.description,
            pricing=body.pricing,
            payment_contract_address=body.payment_contract_address,
            example_output_url=body.example_output_url,
            terms_url=body.terms_url,
            privacy_url=body.privacy_url,
        )
    finally:
        client.close()
