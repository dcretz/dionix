from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import get_settings
from ..database import get_db
from ..deps import get_account_or_404
from ..mt5.backend import TIMEFRAME_SECONDS
from ..mt5.manager import manager
from ..risk import calculate_lot

router = APIRouter(tags=["market"])

VALID_TIMEFRAMES = sorted(TIMEFRAME_SECONDS.keys())


@router.get("/accounts/{account_id}/symbols", response_model=list[str])
async def list_symbols(account: models.Account = Depends(get_account_or_404)):
    return await manager.call(account.id, "symbols_list")


@router.get("/accounts/{account_id}/symbol-info", response_model=schemas.SymbolInfoOut)
async def symbol_info(
    symbol: str,
    account: models.Account = Depends(get_account_or_404),
):
    info = await manager.call(account.id, "symbol_info", {"symbol": symbol})
    tick = await manager.call(account.id, "tick", {"symbol": symbol})
    return schemas.SymbolInfoOut(
        symbol=info["name"],
        bid=tick["bid"],
        ask=tick["ask"],
        point=info["point"],
        digits=info["digits"],
        volume_min=info["volume_min"],
        volume_max=info["volume_max"],
        volume_step=info["volume_step"],
        contract_size=info["trade_contract_size"],
        tick_value=info["trade_tick_value"],
        tick_size=info["trade_tick_size"],
    )


@router.get("/accounts/{account_id}/candles", response_model=list[schemas.Candle])
async def candles(
    symbol: str,
    timeframe: str = Query(default="M15"),
    count: int = Query(default=300, ge=10, le=5000),
    account: models.Account = Depends(get_account_or_404),
):
    if timeframe not in VALID_TIMEFRAMES:
        raise HTTPException(status_code=400, detail=f"timeframe must be one of {VALID_TIMEFRAMES}")
    rows = await manager.call(account.id, "candles", {"symbol": symbol, "timeframe": timeframe, "count": count})
    return [schemas.Candle(**r) for r in rows]


@router.post("/lot-preview", response_model=schemas.LotPreviewOut)
async def lot_preview(payload: schemas.LotPreviewRequest, db: Session = Depends(get_db)):
    account = db.get(models.Account, payload.account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="account not found")

    settings = get_settings()
    try:
        info = await manager.call(account.id, "account_info")
        sym = await manager.call(account.id, "symbol_info", {"symbol": payload.symbol})
    except Exception as exc:
        return schemas.LotPreviewOut(
            account_id=account.id,
            label=account.label,
            symbol=payload.symbol,
            risk_percent=payload.risk_percent or account.risk_percent,
            balance=0,
            risk_amount=0,
            sl_distance=0,
            lot=0,
            capped=False,
            error=str(exc),
        )

    entry_price = payload.entry_price
    if entry_price is None:
        tick = await manager.call(account.id, "tick", {"symbol": payload.symbol})
        entry_price = tick["ask"] if payload.stop_loss_price < tick["bid"] else tick["bid"]

    risk_percent = payload.risk_percent if payload.risk_percent is not None else account.risk_percent

    try:
        result = calculate_lot(
            balance=info["balance"],
            risk_percent=risk_percent,
            entry_price=entry_price,
            stop_loss_price=payload.stop_loss_price,
            tick_value=sym["trade_tick_value"],
            tick_size=sym["trade_tick_size"],
            volume_min=sym["volume_min"],
            volume_max=sym["volume_max"],
            volume_step=sym["volume_step"],
            account_max_lot=account.max_lot,
            hard_cap=settings.max_lot_hard_cap,
        )
    except ValueError as exc:
        return schemas.LotPreviewOut(
            account_id=account.id,
            label=account.label,
            symbol=payload.symbol,
            risk_percent=risk_percent,
            balance=info["balance"],
            risk_amount=0,
            sl_distance=0,
            lot=0,
            capped=False,
            error=str(exc),
        )

    return schemas.LotPreviewOut(
        account_id=account.id,
        label=account.label,
        symbol=payload.symbol,
        risk_percent=risk_percent,
        balance=info["balance"],
        risk_amount=result.risk_amount,
        sl_distance=result.sl_distance,
        lot=result.lot,
        capped=result.capped,
    )
