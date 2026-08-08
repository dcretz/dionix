from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import ensure_worker_running, get_account_or_404, worker_config
from ..mt5.manager import manager
from ..security import encrypt_secret

router = APIRouter(prefix="/accounts", tags=["accounts"])


def _to_out(account: models.Account) -> schemas.AccountOut:
    return schemas.AccountOut(
        id=account.id,
        label=account.label,
        login=account.login,
        server=account.server,
        terminal_path=account.terminal_path,
        risk_percent=account.risk_percent,
        max_lot=account.max_lot,
        include_in_trade_all=account.include_in_trade_all,
        enabled=account.enabled,
        connected=manager.is_connected(account.id),
        created_at=account.created_at,
    )


@router.get("", response_model=list[schemas.AccountOut])
def list_accounts(db: Session = Depends(get_db)):
    accounts = db.query(models.Account).order_by(models.Account.id).all()
    return [_to_out(a) for a in accounts]


@router.post("", response_model=schemas.AccountOut, status_code=201)
def create_account(payload: schemas.AccountCreate, db: Session = Depends(get_db)):
    account = models.Account(
        label=payload.label,
        login=payload.login,
        password_encrypted=encrypt_secret(payload.password),
        server=payload.server,
        terminal_path=payload.terminal_path,
        risk_percent=payload.risk_percent,
        max_lot=payload.max_lot,
        include_in_trade_all=payload.include_in_trade_all,
        enabled=payload.enabled,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    ensure_worker_running(account)
    return _to_out(account)


@router.get("/{account_id}", response_model=schemas.AccountOut)
def get_account(account: models.Account = Depends(get_account_or_404)):
    return _to_out(account)


@router.patch("/{account_id}", response_model=schemas.AccountOut)
def update_account(
    payload: schemas.AccountUpdate,
    account: models.Account = Depends(get_account_or_404),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    password = data.pop("password", None)
    for field, value in data.items():
        setattr(account, field, value)
    if password:
        account.password_encrypted = encrypt_secret(password)
    db.commit()
    db.refresh(account)
    # credentials or enabled-state may have changed: restart the worker
    manager.stop_account(account.id)
    ensure_worker_running(account)
    return _to_out(account)


@router.delete("/{account_id}", status_code=204)
def delete_account(account: models.Account = Depends(get_account_or_404), db: Session = Depends(get_db)):
    manager.stop_account(account.id)
    db.delete(account)
    db.commit()
    return None


@router.post("/{account_id}/reconnect", response_model=schemas.AccountOut)
def reconnect_account(account: models.Account = Depends(get_account_or_404)):
    manager.stop_account(account.id)
    ensure_worker_running(account)
    return _to_out(account)


@router.get("/{account_id}/info", response_model=schemas.AccountInfoOut)
async def account_info(account: models.Account = Depends(get_account_or_404)):
    if not manager.is_running(account.id):
        return schemas.AccountInfoOut(
            account_id=account.id,
            label=account.label,
            login=account.login,
            balance=0,
            equity=0,
            margin=0,
            margin_free=0,
            currency="",
            leverage=0,
            server=account.server,
            connected=False,
            error="worker not started",
        )
    try:
        info = await manager.call(account.id, "account_info")
    except Exception as exc:
        return schemas.AccountInfoOut(
            account_id=account.id,
            label=account.label,
            login=account.login,
            balance=0,
            equity=0,
            margin=0,
            margin_free=0,
            currency="",
            leverage=0,
            server=account.server,
            connected=False,
            error=str(exc),
        )
    return schemas.AccountInfoOut(
        account_id=account.id,
        label=account.label,
        login=account.login,
        balance=info["balance"],
        equity=info["equity"],
        margin=info["margin"],
        margin_free=info["margin_free"],
        currency=info["currency"],
        leverage=info["leverage"],
        server=account.server,
        connected=True,
    )
