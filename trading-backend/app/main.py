import asyncio
import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .config import get_settings
from .database import SessionLocal, init_db
from .deps import ensure_worker_running
from .mt5.manager import manager
from .routers import accounts, market, trading, ws
from .security import require_api_token

logger = logging.getLogger("trading")

settings = get_settings()

app = FastAPI(title="Trading App API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(accounts.router, dependencies=[Depends(require_api_token)])
app.include_router(market.router, dependencies=[Depends(require_api_token)])
app.include_router(trading.router, dependencies=[Depends(require_api_token)])
app.include_router(ws.router)  # websocket auth handled via ?token= query param


@app.on_event("startup")
async def on_startup():
    init_db()
    manager.bind_loop(asyncio.get_running_loop())

    db = SessionLocal()
    try:
        for account in db.query(models.Account).filter(models.Account.enabled.is_(True)).all():
            try:
                ensure_worker_running(account)
            except Exception:
                logger.exception("failed to start worker for account %s", account.id)
    finally:
        db.close()


@app.on_event("shutdown")
async def on_shutdown():
    manager.stop_all()


@app.get("/health")
async def health():
    return {"status": "ok", "mock_mode": settings.mt5_mock, "accounts_running": manager.running_ids()}
