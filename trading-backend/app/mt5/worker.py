"""Entry point that runs inside a dedicated OS process, one per MT5 account.

The official MetaTrader5 package keeps a single global connection per
process, so real concurrent multi-account trading requires one process per
account, each attached to its own terminal instance. This function is the
`multiprocessing.Process` target; all communication with the main FastAPI
process happens over two queues:

  cmd_queue: main -> worker, one request at a time, {"id", "op", "params"}
  evt_queue: worker -> main, command responses AND unsolicited tick pushes,
             distinguished by "kind" ("status" | "response" | "tick")
"""

from __future__ import annotations

import queue
import time

from ..config import get_settings
from .backend import get_backend

_SIDE_FROM_TYPE = {0: "buy", 1: "sell"}


def run_worker(account_id: int, config: dict, cmd_queue, evt_queue) -> None:
    settings = get_settings()
    try:
        backend = get_backend(mock=config.get("mock", settings.mt5_mock))
    except RuntimeError as exc:
        evt_queue.put({"kind": "status", "connected": False, "error": str(exc)})
        return

    connected = False
    error = None
    try:
        connected = backend.initialize(
            path=config.get("terminal_path"),
            login=int(config["login"]),
            password=config["password"],
            server=config["server"],
        )
        if not connected:
            error = backend.last_error()
    except Exception as exc:  # defensive: never let the worker die silently
        error = str(exc)

    evt_queue.put({"kind": "status", "connected": connected, "error": error})

    subscribed_symbols: set[str] = set()
    last_poll = 0.0

    while True:
        poll_interval = settings.tick_poll_interval
        try:
            msg = cmd_queue.get(timeout=poll_interval)
        except queue.Empty:
            msg = None
        except (EOFError, OSError):
            break

        if msg is not None:
            if msg.get("op") == "shutdown":
                break
            _handle_command(backend, msg, evt_queue, subscribed_symbols)

        now = time.time()
        if subscribed_symbols and now - last_poll >= poll_interval:
            last_poll = now
            for symbol in list(subscribed_symbols):
                try:
                    tick = backend.symbol_info_tick(symbol)
                except Exception:
                    tick = None
                if tick is not None:
                    evt_queue.put(
                        {
                            "kind": "tick",
                            "symbol": symbol,
                            "bid": tick.bid,
                            "ask": tick.ask,
                            "time": tick.time,
                        }
                    )

    try:
        backend.shutdown()
    except Exception:
        pass


def _handle_command(backend, msg: dict, evt_queue, subscribed_symbols: set[str]) -> None:
    req_id = msg["id"]
    op = msg["op"]
    params = msg.get("params") or {}
    try:
        result = _dispatch(backend, op, params, subscribed_symbols)
        evt_queue.put({"kind": "response", "id": req_id, "ok": True, "result": result})
    except Exception as exc:
        evt_queue.put(
            {
                "kind": "response",
                "id": req_id,
                "ok": False,
                "error": f"{exc.__class__.__name__}: {exc}",
            }
        )


def _dispatch(backend, op: str, params: dict, subscribed_symbols: set[str]):
    if op == "account_info":
        info = backend.account_info()
        if info is None:
            raise RuntimeError(backend.last_error())
        return info

    if op == "symbol_info":
        info = backend.symbol_info(params["symbol"])
        if info is None:
            raise RuntimeError(f"unknown symbol {params['symbol']!r}")
        return info

    if op == "symbols_list":
        return backend.symbols_list()

    if op == "tick":
        tick = backend.symbol_info_tick(params["symbol"])
        if tick is None:
            raise RuntimeError(f"no tick available for {params['symbol']!r}")
        return {"bid": tick.bid, "ask": tick.ask, "time": tick.time}

    if op == "candles":
        return backend.copy_rates(params["symbol"], params["timeframe"], int(params["count"]))

    if op == "subscribe":
        subscribed_symbols.add(params["symbol"])
        return {"subscribed": sorted(subscribed_symbols)}

    if op == "unsubscribe":
        subscribed_symbols.discard(params["symbol"])
        return {"subscribed": sorted(subscribed_symbols)}

    if op == "positions":
        positions = backend.positions_get()
        return [_normalise_position(p) for p in positions]

    if op == "place_order":
        result = backend.place_market_order(
            symbol=params["symbol"],
            side=params["side"],
            volume=params["volume"],
            sl=params.get("sl"),
            tp=params.get("tp"),
            deviation=params.get("deviation", 20),
            magic=params.get("magic", 0),
            comment=params.get("comment", "trading-app"),
        )
        if not result.get("ok"):
            raise RuntimeError(result.get("comment") or f"retcode={result.get('retcode')}")
        return result

    if op == "close_position":
        result = backend.close_position(ticket=params["ticket"], volume=params.get("volume"))
        if not result.get("ok"):
            raise RuntimeError(result.get("comment") or f"retcode={result.get('retcode')}")
        return result

    if op == "modify_position":
        result = backend.modify_position(
            ticket=params["ticket"], sl=params.get("sl"), tp=params.get("tp")
        )
        if not result.get("ok"):
            raise RuntimeError(result.get("comment") or f"retcode={result.get('retcode')}")
        return result

    raise ValueError(f"unknown op {op!r}")


def _normalise_position(p: dict) -> dict:
    return {
        "ticket": p["ticket"],
        "symbol": p["symbol"],
        "side": _SIDE_FROM_TYPE.get(p["type"], "buy"),
        "volume": p["volume"],
        "price_open": p["price_open"],
        "price_current": p["price_current"],
        "sl": p.get("sl") or 0.0,
        "tp": p.get("tp") or 0.0,
        "profit": p.get("profit", 0.0),
        "swap": p.get("swap", 0.0),
    }
