import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    label: str
    login: str
    password: str
    server: str
    terminal_path: str | None = None
    risk_percent: float = Field(default=1.0, ge=0.01, le=100)
    max_lot: float | None = Field(default=None, ge=0)
    include_in_trade_all: bool = True
    enabled: bool = True


class AccountUpdate(BaseModel):
    label: str | None = None
    password: str | None = None
    server: str | None = None
    terminal_path: str | None = None
    risk_percent: float | None = Field(default=None, ge=0.01, le=100)
    max_lot: float | None = Field(default=None, ge=0)
    include_in_trade_all: bool | None = None
    enabled: bool | None = None


class AccountOut(BaseModel):
    id: int
    label: str
    login: str
    server: str
    terminal_path: str | None
    risk_percent: float
    max_lot: float | None
    include_in_trade_all: bool
    enabled: bool
    connected: bool
    created_at: datetime.datetime

    model_config = {"from_attributes": True}


class AccountInfoOut(BaseModel):
    account_id: int
    label: str
    login: str
    balance: float
    equity: float
    margin: float
    margin_free: float
    currency: str
    leverage: int
    server: str
    connected: bool
    error: str | None = None


class SymbolInfoOut(BaseModel):
    symbol: str
    bid: float
    ask: float
    point: float
    digits: int
    volume_min: float
    volume_max: float
    volume_step: float
    contract_size: float
    tick_value: float
    tick_size: float


class Candle(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float


class LotPreviewRequest(BaseModel):
    account_id: int
    symbol: str
    stop_loss_price: float
    entry_price: float | None = None  # defaults to current bid/ask
    risk_percent: float | None = None  # defaults to account.risk_percent


class LotPreviewOut(BaseModel):
    account_id: int
    label: str
    symbol: str
    risk_percent: float
    balance: float
    risk_amount: float
    sl_distance: float
    lot: float
    capped: bool
    error: str | None = None


class QuickTradeRequest(BaseModel):
    symbol: str
    side: Literal["buy", "sell"]
    scope: Literal["single", "all"] = "single"
    account_id: int | None = None  # required when scope == "single"
    stop_loss_price: float | None = None
    take_profit_price: float | None = None
    risk_percent: float | None = None  # override the account's default
    fixed_volume: float | None = None  # bypass risk sizing entirely


class TradeResult(BaseModel):
    account_id: int
    label: str
    status: Literal["filled", "error"]
    ticket: int | None = None
    volume: float | None = None
    price: float | None = None
    detail: str | None = None


class PositionOut(BaseModel):
    account_id: int
    label: str
    ticket: int
    symbol: str
    side: Literal["buy", "sell"]
    volume: float
    price_open: float
    price_current: float
    sl: float
    tp: float
    profit: float
    swap: float


class ClosePositionRequest(BaseModel):
    account_id: int
    ticket: int
    volume: float | None = None  # partial close; defaults to full volume


class ModifyPositionRequest(BaseModel):
    account_id: int
    ticket: int
    sl: float | None = None
    tp: float | None = None
