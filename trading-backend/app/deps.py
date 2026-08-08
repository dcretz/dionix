from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from . import models
from .database import get_db
from .mt5.manager import manager
from .security import decrypt_secret


def get_account_or_404(account_id: int, db: Session = Depends(get_db)) -> models.Account:
    account = db.get(models.Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="account not found")
    return account


def worker_config(account: models.Account) -> dict:
    return {
        "login": account.login,
        "password": decrypt_secret(account.password_encrypted),
        "server": account.server,
        "terminal_path": account.terminal_path,
    }


def ensure_worker_running(account: models.Account) -> None:
    if account.enabled and not manager.is_running(account.id):
        manager.start_account(account.id, worker_config(account))
    elif not account.enabled and manager.is_running(account.id):
        manager.stop_account(account.id)
