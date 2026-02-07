"""FastAPI app factory and lifecycle (Phase 6)."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from cygnus import __version__
from cygnus.api.routes import health, payments, soroban
from cygnus.scheduler.jobs import start_scheduler, shutdown_scheduler

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start scheduler on startup; shut down on shutdown."""
    start_scheduler()
    yield
    shutdown_scheduler()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Cygnus",
        description="Machine Economy: Autonomous Agents and Programmable Payments on Stellar",
        version=__version__,
        lifespan=lifespan,
    )
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
    app.include_router(soroban.router, prefix="/api/v1/soroban", tags=["soroban"])
    return app


app = create_app()
