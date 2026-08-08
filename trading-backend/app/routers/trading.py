from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import get_settings
from ..database import get_db
from ..mt5.manager import manager
from ..risk import calculate_lot

router = APIRouter(tags=["trading"])


async def _size_and_place(account: models.Account, req: schemas.QuickTradeRequest, db: Session) -> schemas.TradeResult:
    settings = get_settings()
    try:
        tick = await manager.call(account.id, "tick", {"symbol": req.symbol})
        entry_price = tick["ask"] if req.side == "buy" else tick["bid"]

        if req.fixed_volume is not None:
            volume = req.fixed_volume
        else:
            if req.stop_loss_price is None:
                raise ValueError("stop_loss_price is required for automatic lot sizing")
            info = await manager.call(account.id, "account_info")
            sym = await manager.call(account.id, "symbol_info", {"symbol": req.symbol})
            risk_percent = req.risk_percent if req.risk_percent is not None else account.risk_percent
            sized = calculate_lot(
                balance=info["balance"],
                risk_percent=risk_percent,
                entry_price=entry_price,
                stop_loss_price=req.stop_loss_price,
                tick_value=sym["trade_tick_value"],
                tick_size=sym["trade_tick_size"],
                volume_min=sym["volume_min"],
                volume_max=sym["volume_max"],
                volume_step=sym["volume_step"],
                account_max_lot=account.max_lot,
                hard_cap=settings.max_lot_hard_cap,
            )
            volume = sized.lot

        result = await manager.call(
            account.id,
            "place_order",
            {
                "symbol": req.symbol,
                "side": req.side,
                "volume": volume,
                "sl": req.stop_loss_price,
                "tp": req.take_profit_price,
                "deviation": settings.default_deviation_points,
                "magic": settings.default_magic,
                "comment": "trading-app quick trade",
            },
        )
        db.add(
            models.TradeLog(
                account_id=account.id,
                account_label=account.label,
                symbol=req.symbol,
                side=req.side,
                volume=result.get("volume", volume),
                price=result.get("price"),
                sl=req.stop_loss_price,
                tp=req.take_profit_price,
                risk_percent=req.risk_percent if req.fixed_volume is None else None,
                status="filled",
                ticket=result.get("ticket"),
            )
        )
        db.commit()
        return schemas.TradeResult(
            account_id=account.id,
            label=account.label,
            status="filled",
            ticket=result.get("ticket"),
            volume=result.get("volume", volume),
            price=result.get("price"),
        )
    except Exception as exc:
        db.add(
            models.TradeLog(
                account_id=account.id,
                account_label=account.label,
                symbol=req.symbol,
                side=req.side,
                volume=req.fixed_volume or 0,
                risk_percent=req.risk_percent,
                status="error",
                detail=str(exc),
            )
        )
        db.commit()
        return schemas.TradeResult(account_id=account.id, label=account.label, status="error", detail=str(exc))


@router.post("/trade", response_model=list[schemas.TradeResult])
async def quick_trade(req: schemas.QuickTradeRequest, db: Session = Depends(get_db)):
    if req.scope == "single":
        if req.account_id is None:
            raise HTTPException(status_code=400, detail="account_id is required when scope is 'single'")
        accounts = db.query(models.Account).filter(models.Account.id == req.account_id).all()
        if not accounts:
            raise HTTPException(status_code=404, detail="account not found")
    else:
        accounts = (
            db.query(models.Account)
            .filter(models.Account.enabled.is_(True), models.Account.include_in_trade_all.is_(True))
            .all()
        )
        if not accounts:
            raise HTTPException(status_code=400, detail="no accounts are enabled for trade-all")

    results = []
    for account in accounts:
        if not manager.is_running(account.id):
            results.append(
                schemas.TradeResult(
                    account_id=account.id, label=account.label, status="error", detail="account not connected"
                )
            )
            continue
        results.append(await _size_and_place(account, req, db))
    return results


@router.get("/positions", response_model=list[schemas.PositionOut])
async def positions(db: Session = Depends(get_db)):
    accounts = db.query(models.Account).filter(models.Account.enabled.is_(True)).all()
    out: list[schemas.PositionOut] = []
    for account in accounts:
        if not manager.is_running(account.id):
            continue
        try:
            rows = await manager.call(account.id, "positions")
        except Exception:
            continue
        for r in rows:
            out.append(
                schemas.PositionOut(
                    account_id=account.id,
                    label=account.label,
                    ticket=r["ticket"],
                    symbol=r["symbol"],
                    side=r["side"],
                    volume=r["volume"],
                    price_open=r["price_open"],
                    price_current=r["price_current"],
                    sl=r["sl"],
                    tp=r["tp"],
                    profit=r["profit"],
                    swap=r["swap"],
                )
            )
    return out


@router.post("/positions/close", response_model=schemas.TradeResult)
async def close_position(req: schemas.ClosePositionRequest, db: Session = Depends(get_db)):
    account = db.get(models.Account, req.account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="account not found")
    try:
        result = await manager.call(
            account.id, "close_position", {"ticket": req.ticket, "volume": req.volume}
        )
        return schemas.TradeResult(account_id=account.id, label=account.label, status="filled", detail=result.get("comment"))
    except Exception as exc:
        return schemas.TradeResult(account_id=account.id, label=account.label, status="error", detail=str(exc))


@router.post("/positions/modify", response_model=schemas.TradeResult)
async def modify_position(req: schemas.ModifyPositionRequest, db: Session = Depends(get_db)):
    account = db.get(models.Account, req.account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="account not found")
    try:
        result = await manager.call(
            account.id, "modify_position", {"ticket": req.ticket, "sl": req.sl, "tp": req.tp}
        )
        return schemas.TradeResult(account_id=account.id, label=account.label, status="filled", detail=result.get("comment"))
    except Exception as exc:
        return schemas.TradeResult(account_id=account.id, label=account.label, status="error", detail=str(exc))
