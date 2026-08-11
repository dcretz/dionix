"""MT5 connectivity backends.

`RealMT5Backend` wraps the official `MetaTrader5` Python package, which
Metaquotes only ships for Windows and which only works when a matching MT5
terminal is installed and running locally (it talks to the terminal over a
local IPC channel, not the network). Each traded account needs its own,
separately installed ("portable") terminal instance — that's why account
workers run as separate OS processes (see manager.py / worker.py), each
pointed at a different `terminal_path`.

`MockMT5Backend` is a self-contained in-memory simulator with the same
interface, used automatically when the real package can't be imported (e.g.
during development on Linux/macOS) or when TRADING_MT5_MOCK=1 is set. It
lets the whole stack — API, websocket ticks, order flow, risk sizing — be
exercised end-to-end without Windows or a live broker connection.
"""

from __future__ import annotations

import itertools
import random
import time
from dataclasses import dataclass
from typing import Protocol

TIMEFRAME_SECONDS = {
    "M1": 60,
    "M5": 300,
    "M15": 900,
    "M30": 1800,
    "H1": 3600,
    "H4": 14400,
    "D1": 86400,
    "W1": 604800,
    "MN1": 2592000,
}


@dataclass
class Tick:
    bid: float
    ask: float
    time: int


class MT5Backend(Protocol):
    def initialize(self, *, path: str | None, login: int, password: str, server: str) -> bool: ...
    def last_error(self) -> str: ...
    def shutdown(self) -> None: ...
    def account_info(self) -> dict | None: ...
    def symbol_info(self, symbol: str) -> dict | None: ...
    def symbol_info_tick(self, symbol: str) -> Tick | None: ...
    def symbols_list(self) -> list[str]: ...
    def copy_rates(self, symbol: str, timeframe: str, count: int) -> list[dict]: ...
    def positions_get(self) -> list[dict]: ...
    def place_market_order(self, **kwargs) -> dict: ...
    def close_position(self, **kwargs) -> dict: ...
    def modify_position(self, **kwargs) -> dict: ...


class RealMT5Backend:
    def __init__(self) -> None:
        import MetaTrader5 as mt5  # noqa: N813  (Windows-only package)

        self.mt5 = mt5
        self.TIMEFRAME_MAP = {
            "M1": mt5.TIMEFRAME_M1,
            "M5": mt5.TIMEFRAME_M5,
            "M15": mt5.TIMEFRAME_M15,
            "M30": mt5.TIMEFRAME_M30,
            "H1": mt5.TIMEFRAME_H1,
            "H4": mt5.TIMEFRAME_H4,
            "D1": mt5.TIMEFRAME_D1,
            "W1": mt5.TIMEFRAME_W1,
            "MN1": mt5.TIMEFRAME_MN1,
        }

    def initialize(self, *, path, login, password, server):
        kwargs = {"login": int(login), "password": password, "server": server}
        if path:
            kwargs["path"] = path
        return bool(self.mt5.initialize(**kwargs))

    def last_error(self):
        return str(self.mt5.last_error())

    def shutdown(self):
        self.mt5.shutdown()

    def account_info(self):
        info = self.mt5.account_info()
        return info._asdict() if info else None

    def symbol_info(self, symbol):
        self.mt5.symbol_select(symbol, True)
        info = self.mt5.symbol_info(symbol)
        return info._asdict() if info else None

    def symbol_info_tick(self, symbol):
        self.mt5.symbol_select(symbol, True)
        tick = self.mt5.symbol_info_tick(symbol)
        if tick is None:
            return None
        return Tick(bid=tick.bid, ask=tick.ask, time=int(tick.time))

    def symbols_list(self):
        syms = self.mt5.symbols_get()
        return sorted(s.name for s in (syms or []))

    def copy_rates(self, symbol, timeframe, count):
        tf = self.TIMEFRAME_MAP[timeframe]
        rates = self.mt5.copy_rates_from_pos(symbol, tf, 0, count)
        if rates is None:
            return []
        return [
            {
                "time": int(r["time"]),
                "open": float(r["open"]),
                "high": float(r["high"]),
                "low": float(r["low"]),
                "close": float(r["close"]),
                "volume": float(r["tick_volume"]),
            }
            for r in rates
        ]

    def positions_get(self):
        positions = self.mt5.positions_get()
        return [p._asdict() for p in (positions or [])]

    def place_market_order(self, *, symbol, side, volume, sl, tp, deviation, magic, comment):
        mt5 = self.mt5
        mt5.symbol_select(symbol, True)
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return {"ok": False, "retcode": -1, "comment": "no tick for symbol"}
        order_type = mt5.ORDER_TYPE_BUY if side == "buy" else mt5.ORDER_TYPE_SELL
        price = tick.ask if side == "buy" else tick.bid
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": volume,
            "type": order_type,
            "price": price,
            "deviation": deviation,
            "magic": magic,
            "comment": comment,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        if sl:
            request["sl"] = sl
        if tp:
            request["tp"] = tp
        result = mt5.order_send(request)
        if result is None:
            return {"ok": False, "retcode": -1, "comment": str(mt5.last_error())}
        ok = result.retcode == mt5.TRADE_RETCODE_DONE
        return {
            "ok": ok,
            "retcode": result.retcode,
            "comment": result.comment,
            "ticket": result.order,
            "price": result.price,
            "volume": result.volume,
        }

    def close_position(self, *, ticket, volume=None):
        mt5 = self.mt5
        positions = mt5.positions_get(ticket=ticket)
        if not positions:
            return {"ok": False, "retcode": -1, "comment": "position not found"}
        pos = positions[0]
        close_volume = volume or pos.volume
        side = "sell" if pos.type == mt5.ORDER_TYPE_BUY else "buy"
        mt5.symbol_select(pos.symbol, True)
        tick = mt5.symbol_info_tick(pos.symbol)
        if tick is None:
            return {"ok": False, "retcode": -1, "comment": "no tick for symbol"}
        price = tick.bid if side == "sell" else tick.ask
        order_type = mt5.ORDER_TYPE_SELL if side == "sell" else mt5.ORDER_TYPE_BUY
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": pos.symbol,
            "volume": close_volume,
            "type": order_type,
            "position": ticket,
            "price": price,
            "deviation": 20,
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        result = mt5.order_send(request)
        if result is None:
            return {"ok": False, "retcode": -1, "comment": str(mt5.last_error())}
        ok = result.retcode == mt5.TRADE_RETCODE_DONE
        return {"ok": ok, "retcode": result.retcode, "comment": result.comment}

    def modify_position(self, *, ticket, sl=None, tp=None):
        mt5 = self.mt5
        positions = mt5.positions_get(ticket=ticket)
        if not positions:
            return {"ok": False, "retcode": -1, "comment": "position not found"}
        pos = positions[0]
        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "symbol": pos.symbol,
            "position": ticket,
            "sl": sl if sl is not None else pos.sl,
            "tp": tp if tp is not None else pos.tp,
        }
        result = mt5.order_send(request)
        if result is None:
            return {"ok": False, "retcode": -1, "comment": str(mt5.last_error())}
        ok = result.retcode == mt5.TRADE_RETCODE_DONE
        return {"ok": ok, "retcode": result.retcode, "comment": result.comment}


class MockMT5Backend:
    """In-memory MT5 simulator with a random-walk price feed."""

    _BASE_PRICES = {
        "EURUSD": 1.0850,
        "GBPUSD": 1.2650,
        "USDJPY": 155.20,
        "XAUUSD": 2350.0,
        "BTCUSD": 64000.0,
        "US30": 39000.0,
        "NAS100": 18500.0,
    }

    # symbol -> (digits, point, volume_min, volume_max, volume_step, contract_size, tick_value, tick_size)
    _SPECS = {
        "EURUSD": (5, 0.00001, 0.01, 100.0, 0.01, 100000, 1.0, 0.00001),
        "GBPUSD": (5, 0.00001, 0.01, 100.0, 0.01, 100000, 1.0, 0.00001),
        "USDJPY": (3, 0.001, 0.01, 100.0, 0.01, 100000, 0.66, 0.001),
        "XAUUSD": (2, 0.01, 0.01, 50.0, 0.01, 100, 1.0, 0.01),
        "BTCUSD": (1, 0.1, 0.01, 10.0, 0.01, 1, 0.1, 0.1),
        "US30": (1, 0.1, 0.01, 20.0, 0.01, 1, 0.1, 0.1),
        "NAS100": (1, 0.1, 0.01, 20.0, 0.01, 1, 0.1, 0.1),
    }

    def __init__(self) -> None:
        self._prices: dict[str, float] = dict(self._BASE_PRICES)
        self._positions: dict[int, dict] = {}
        self._ticket_seq = itertools.count(100000)
        self._balance = 10000.0
        self._rng = random.Random()

    def initialize(self, *, path, login, password, server):
        return True

    def last_error(self):
        return "mock backend: no error"

    def shutdown(self):
        pass

    def _walk(self, symbol: str) -> float:
        spec = self._SPECS.get(symbol, self._SPECS["EURUSD"])
        point = spec[1]
        price = self._prices.get(symbol, self._BASE_PRICES.get(symbol, 1.0))
        drift = self._rng.uniform(-1, 1) * point * 3
        price = max(price + drift, point)
        self._prices[symbol] = price
        return price

    def account_info(self):
        self._mark_to_market()
        equity = self._balance + sum(p["profit"] for p in self._positions.values())
        return {
            "login": 0,
            "balance": round(self._balance, 2),
            "equity": round(equity, 2),
            "margin": 0.0,
            "margin_free": round(equity, 2),
            "currency": "USD",
            "leverage": 100,
            "server": "Mock-Demo",
            "name": "Mock Account",
        }

    def symbol_info(self, symbol):
        spec = self._SPECS.get(symbol)
        if spec is None:
            return None
        digits, point, vmin, vmax, vstep, contract_size, tick_value, tick_size = spec
        return {
            "name": symbol,
            "digits": digits,
            "point": point,
            "volume_min": vmin,
            "volume_max": vmax,
            "volume_step": vstep,
            "trade_contract_size": contract_size,
            "trade_tick_value": tick_value,
            "trade_tick_size": tick_size,
        }

    def symbol_info_tick(self, symbol):
        if symbol not in self._SPECS:
            return None
        price = self._walk(symbol)
        spec = self._SPECS[symbol]
        spread = spec[1] * 10
        return Tick(bid=round(price, 6), ask=round(price + spread, 6), time=int(time.time()))

    def symbols_list(self):
        return sorted(self._SPECS.keys())

    def copy_rates(self, symbol, timeframe, count):
        step = TIMEFRAME_SECONDS[timeframe]
        now = int(time.time()) // step * step
        price = self._prices.get(symbol, self._BASE_PRICES.get(symbol, 1.0))
        spec = self._SPECS.get(symbol, self._SPECS["EURUSD"])
        point = spec[1]
        rng = random.Random(hash((symbol, timeframe, now // step // 500)) & 0xFFFFFFFF)
        candles = []
        for i in range(count):
            t = now - (count - 1 - i) * step
            o = price
            move = rng.uniform(-1, 1) * point * 40
            c = max(o + move, point)
            h = max(o, c) + abs(rng.uniform(0, point * 20))
            low = min(o, c) - abs(rng.uniform(0, point * 20))
            candles.append(
                {
                    "time": t,
                    "open": round(o, 6),
                    "high": round(h, 6),
                    "low": round(max(low, point), 6),
                    "close": round(c, 6),
                    "volume": round(rng.uniform(10, 500), 2),
                }
            )
            price = c
        self._prices[symbol] = price
        return candles

    def _mark_to_market(self):
        for pos in self._positions.values():
            spec = self._SPECS.get(pos["symbol"], self._SPECS["EURUSD"])
            contract_size = spec[5]
            tick = self.symbol_info_tick(pos["symbol"])
            if tick is None:
                continue
            current = tick.bid if pos["type"] == 0 else tick.ask
            direction = 1 if pos["type"] == 0 else -1
            pos["price_current"] = current
            pos["profit"] = round(
                (current - pos["price_open"]) * direction * pos["volume"] * contract_size, 2
            )

    def positions_get(self):
        self._mark_to_market()
        return [dict(p) for p in self._positions.values()]

    def place_market_order(self, *, symbol, side, volume, sl, tp, deviation, magic, comment):
        tick = self.symbol_info_tick(symbol)
        if tick is None:
            return {"ok": False, "retcode": -1, "comment": "unknown symbol"}
        price = tick.ask if side == "buy" else tick.bid
        ticket = next(self._ticket_seq)
        self._positions[ticket] = {
            "ticket": ticket,
            "symbol": symbol,
            "type": 0 if side == "buy" else 1,
            "volume": volume,
            "price_open": price,
            "price_current": price,
            "sl": sl or 0.0,
            "tp": tp or 0.0,
            "profit": 0.0,
            "swap": 0.0,
            "magic": magic,
            "comment": comment,
        }
        return {
            "ok": True,
            "retcode": 10009,
            "comment": "mock done",
            "ticket": ticket,
            "price": price,
            "volume": volume,
        }

    def close_position(self, *, ticket, volume=None):
        pos = self._positions.get(ticket)
        if not pos:
            return {"ok": False, "retcode": -1, "comment": "position not found"}
        self._mark_to_market()
        close_volume = volume or pos["volume"]
        self._balance += pos["profit"] * (close_volume / pos["volume"])
        if close_volume >= pos["volume"] - 1e-9:
            del self._positions[ticket]
        else:
            pos["volume"] = round(pos["volume"] - close_volume, 8)
        return {"ok": True, "retcode": 10009, "comment": "mock closed"}

    def modify_position(self, *, ticket, sl=None, tp=None):
        pos = self._positions.get(ticket)
        if not pos:
            return {"ok": False, "retcode": -1, "comment": "position not found"}
        if sl is not None:
            pos["sl"] = sl
        if tp is not None:
            pos["tp"] = tp
        return {"ok": True, "retcode": 10009, "comment": "mock modified"}


def get_backend(*, mock: bool) -> MT5Backend:
    if mock:
        return MockMT5Backend()
    try:
        return RealMT5Backend()
    except ImportError as exc:
        raise RuntimeError(
            "The 'MetaTrader5' package could not be imported. It is only "
            "available on Windows and requires a MetaTrader5 terminal to be "
            "installed. Install it with `pip install MetaTrader5` on a "
            "Windows host, or set TRADING_MT5_MOCK=1 to develop against the "
            "built-in simulator."
        ) from exc
