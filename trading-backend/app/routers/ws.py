import asyncio
import contextlib

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..config import get_settings
from ..mt5.manager import manager

router = APIRouter(tags=["ws"])


@router.websocket("/ws/ticks")
async def ws_ticks(websocket: WebSocket):
    """Live tick stream.

    Client sends `{"action": "subscribe"|"unsubscribe", "account_id": 1, "symbol": "EURUSD"}`
    and then receives `{"account_id":1,"symbol":"EURUSD","bid":...,"ask":...,"time":...}`
    for every subscribed (account_id, symbol) pair, until it unsubscribes or disconnects.
    """
    settings = get_settings()
    token = websocket.query_params.get("token")
    if token != settings.api_token:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    subscriptions: set[tuple[int, str]] = set()
    listener = manager.add_tick_listener()

    async def forward_ticks():
        while True:
            payload = await listener.get()
            key = (payload["account_id"], payload["symbol"])
            if key in subscriptions:
                await websocket.send_json(payload)

    forward_task = asyncio.create_task(forward_ticks())
    try:
        while True:
            msg = await websocket.receive_json()
            account_id = msg.get("account_id")
            symbol = msg.get("symbol")
            action = msg.get("action")
            if not account_id or not symbol or action not in ("subscribe", "unsubscribe"):
                continue
            if action == "subscribe":
                subscriptions.add((account_id, symbol))
                if manager.is_running(account_id):
                    try:
                        await manager.call(account_id, "subscribe", {"symbol": symbol})
                    except Exception:
                        pass
            else:
                subscriptions.discard((account_id, symbol))
                if manager.is_running(account_id):
                    try:
                        await manager.call(account_id, "unsubscribe", {"symbol": symbol})
                    except Exception:
                        pass
    except WebSocketDisconnect:
        pass
    finally:
        forward_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await forward_task
        manager.remove_tick_listener(listener)
