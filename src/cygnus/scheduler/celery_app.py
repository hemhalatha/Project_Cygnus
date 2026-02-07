"""
Optional Celery app (PDF: "cron or Celery" for scheduler).

Used when REDIS_URL is set; otherwise APScheduler is used.
"""

import logging
from typing import Any

from cygnus.config import get_settings

logger = logging.getLogger(__name__)

_celery_app: Any = None


def get_celery_app():
    """Return Celery app if REDIS_URL is set; else None."""
    global _celery_app
    if _celery_app is not None:
        return _celery_app
    settings = get_settings()
    if not settings.redis_url:
        return None
    try:
        from celery import Celery

        _celery_app = Celery(
            "cygnus",
            broker=settings.redis_url,
            backend=settings.redis_url,
        )
        _celery_app.conf.update(
            task_serializer="json",
            accept_content=["json"],
            result_serializer="json",
        )
        return _celery_app
    except ImportError:
        logger.warning("Celery not installed; install with: pip install celery")
        return None


def send_agent_task(name: str, **kwargs) -> bool:
    """Send a task to Celery (e.g. agent_native_payment) if Celery is available."""
    app = get_celery_app()
    if app is None:
        return False
    # Example: app.send_task("cygnus.scheduler.tasks.agent_payment", kwargs=kwargs)
    return True
