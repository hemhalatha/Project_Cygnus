"""APScheduler: trigger agent logic on a schedule (Phase 5)."""

import logging
from typing import Callable

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from cygnus.core.agent import agent_native_payment

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def get_scheduler() -> BackgroundScheduler | None:
    return _scheduler


def start_scheduler() -> BackgroundScheduler:
    """Start the background scheduler. Idempotent."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.start()
    logger.info("Scheduler started")
    return _scheduler


def shutdown_scheduler() -> None:
    """Shut down the scheduler. Idempotent."""
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=True)
    _scheduler = None
    logger.info("Scheduler stopped")


def add_interval_job(
    func: Callable[[], None],
    seconds: int,
    job_id: str | None = None,
) -> str:
    """Schedule a function to run every `seconds` seconds. Returns job_id."""
    sched = get_scheduler()
    if sched is None:
        start_scheduler()
        sched = get_scheduler()
    assert sched is not None
    jid = job_id or f"interval_{func.__name__}_{seconds}s"
    sched.add_job(func, trigger=IntervalTrigger(seconds=seconds), id=jid, replace_existing=True)
    return jid


def demo_scheduled_payment_job() -> None:
    """Example job: could call agent_native_payment with fixed params. No-op if no secret."""
    # In production, load destination/amount from DB or config
    result = agent_native_payment(
        destination_public="GDEMOEXAMPLE1234567890EXAMPLE",  # placeholder
        amount_xlm="1",
        memo="scheduled_demo",
    )
    if not result.get("success"):
        logger.warning("Scheduled payment job failed: %s", result)
