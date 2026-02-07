"""Application configuration via environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Load from env / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    stellar_network: Literal["testnet", "mainnet"] = Field(
        default="testnet",
        alias="STELLAR_NETWORK",
    )
    horizon_url: str = Field(
        default="https://horizon-testnet.stellar.org",
        alias="HORIZON_URL",
    )
    soroban_rpc_url: str = Field(
        default="https://soroban-testnet.stellar.org",
        alias="SOROBAN_RPC_URL",
    )
    database_url: str | None = Field(default=None, alias="DATABASE_URL")
    agent_secret_key: str | None = Field(default=None, alias="AGENT_SECRET_KEY")
    api_secret_key: str = Field(default="change-me", alias="API_SECRET_KEY")
    redis_url: str | None = Field(default=None, alias="REDIS_URL")

    # x402 (HTTP 402 Payment Required)
    x402_enabled: bool = Field(default=True, alias="X402_ENABLED")
    x402_amount_xlm: str = Field(default="0.1", alias="X402_AMOUNT_XLM")
    x402_pay_to: str | None = Field(default=None, alias="X402_PAY_TO")

    # Masumi Network (identity, agent registry)
    masumi_node_url: str | None = Field(default=None, alias="MASUMI_NODE_URL")
    masumi_registry_url: str | None = Field(default=None, alias="MASUMI_REGISTRY_URL")


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
