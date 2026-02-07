"""FastAPI app factory and lifecycle (Phase 6)."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cygnus import __version__
from cygnus.api.routes import (
    agents,
    health,
    masumi_routes,
    payments,
    soroban,
    stellar_routes,
    x402_routes,
)
from cygnus.scheduler.jobs import shutdown_scheduler, start_scheduler

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
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router, prefix="/health", tags=["health"])
    app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
    app.include_router(stellar_routes.router, prefix="/api/v1/stellar", tags=["stellar"])
    app.include_router(soroban.router, prefix="/api/v1/soroban", tags=["soroban"])
    app.include_router(x402_routes.router, prefix="/api/v1/x402", tags=["x402"])
    app.include_router(masumi_routes.router, prefix="/api/v1/masumi", tags=["masumi"])
    app.include_router(agents.router, prefix="/api/v1/agents", tags=["agents"])
    return app


app = create_app()
