import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    label: Mapped[str] = mapped_column(String(120))

    # MT5 login credentials. Password is stored encrypted (Fernet), never in
    # plaintext. `terminal_path` points at the terminal64.exe of the
    # *dedicated, portable* MT5 terminal installation for this account —
    # each account needs its own terminal instance for true concurrency.
    login: Mapped[str] = mapped_column(String(64))
    password_encrypted: Mapped[str] = mapped_column(String(512))
    server: Mapped[str] = mapped_column(String(120))
    terminal_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Risk settings
    risk_percent: Mapped[float] = mapped_column(Float, default=1.0)
    max_lot: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Whether this account participates when the trader fires a "trade on
    # all accounts" quick order, versus only when explicitly selected.
    include_in_trade_all: Mapped[bool] = mapped_column(Boolean, default=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )


class TradeLog(Base):
    __tablename__ = "trade_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    account_id: Mapped[int] = mapped_column(Integer)
    account_label: Mapped[str] = mapped_column(String(120))
    symbol: Mapped[str] = mapped_column(String(32))
    side: Mapped[str] = mapped_column(String(8))
    volume: Mapped[float] = mapped_column(Float)
    price: Mapped[float | None] = mapped_column(Float, nullable=True)
    sl: Mapped[float | None] = mapped_column(Float, nullable=True)
    tp: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(16))
    detail: Mapped[str | None] = mapped_column(String(512), nullable=True)
    ticket: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
