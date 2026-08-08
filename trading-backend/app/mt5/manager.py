"""Runs in the main FastAPI process. Spawns/stops one worker process per MT5
account and bridges its queues into asyncio so routers can `await` calls."""

from __future__ import annotations

import asyncio
import multiprocessing as mp
import threading
import uuid
from dataclasses import dataclass, field

from . import worker as worker_mod


@dataclass
class WorkerHandle:
    process: mp.process.BaseProcess
    cmd_queue: mp.Queue
    evt_queue: mp.Queue
    dispatcher_thread: threading.Thread
    connected: bool = False
    connect_error: str | None = None
    pending: dict[str, asyncio.Future] = field(default_factory=dict)


class AccountManager:
    def __init__(self) -> None:
        self._handles: dict[int, WorkerHandle] = {}
        self._loop: asyncio.AbstractEventLoop | None = None
        self._tick_listeners: set[asyncio.Queue] = set()
        self._ctx = mp.get_context("spawn")

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    # -- tick fan-out -----------------------------------------------------

    def add_tick_listener(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=2000)
        self._tick_listeners.add(q)
        return q

    def remove_tick_listener(self, q: asyncio.Queue) -> None:
        self._tick_listeners.discard(q)

    def _broadcast_tick(self, account_id: int, msg: dict) -> None:
        payload = {"account_id": account_id, "symbol": msg["symbol"], "bid": msg["bid"], "ask": msg["ask"], "time": msg["time"]}
        for q in list(self._tick_listeners):
            if not q.full():
                q.put_nowait(payload)

    # -- lifecycle ----------------------------------------------------------

    def start_account(self, account_id: int, config: dict) -> None:
        self.stop_account(account_id)
        cmd_q: mp.Queue = self._ctx.Queue()
        evt_q: mp.Queue = self._ctx.Queue()
        proc = self._ctx.Process(
            target=worker_mod.run_worker,
            args=(account_id, config, cmd_q, evt_q),
            daemon=True,
        )
        proc.start()
        handle = WorkerHandle(process=proc, cmd_queue=cmd_q, evt_queue=evt_q, dispatcher_thread=None)  # type: ignore[arg-type]
        t = threading.Thread(target=self._dispatch_loop, args=(account_id, handle), daemon=True)
        handle.dispatcher_thread = t
        self._handles[account_id] = handle
        t.start()

    def stop_account(self, account_id: int) -> None:
        handle = self._handles.pop(account_id, None)
        if handle is None:
            return
        try:
            handle.cmd_queue.put({"id": "shutdown", "op": "shutdown", "params": {}})
        except Exception:
            pass
        handle.process.join(timeout=5)
        if handle.process.is_alive():
            handle.process.terminate()
        for fut in handle.pending.values():
            if not fut.done():
                fut.set_exception(RuntimeError("account worker stopped"))

    def stop_all(self) -> None:
        for account_id in list(self._handles.keys()):
            self.stop_account(account_id)

    def is_running(self, account_id: int) -> bool:
        h = self._handles.get(account_id)
        return bool(h and h.process.is_alive())

    def is_connected(self, account_id: int) -> bool:
        h = self._handles.get(account_id)
        return bool(h and h.connected)

    def connect_error(self, account_id: int) -> str | None:
        h = self._handles.get(account_id)
        return h.connect_error if h else "worker not started"

    def running_ids(self) -> list[int]:
        return list(self._handles.keys())

    # -- request/response ---------------------------------------------------

    def _dispatch_loop(self, account_id: int, handle: WorkerHandle) -> None:
        while True:
            try:
                msg = handle.evt_queue.get()
            except (EOFError, OSError):
                return
            if msg is None:
                return
            kind = msg.get("kind")
            if kind == "status":
                handle.connected = msg.get("connected", False)
                handle.connect_error = msg.get("error")
            elif kind == "response":
                req_id = msg["id"]
                fut = handle.pending.pop(req_id, None)
                if fut is not None and self._loop is not None:
                    self._loop.call_soon_threadsafe(_resolve, fut, msg)
            elif kind == "tick":
                if self._loop is not None:
                    self._loop.call_soon_threadsafe(self._broadcast_tick, account_id, msg)

    async def call(self, account_id: int, op: str, params: dict | None = None, timeout: float = 15):
        handle = self._handles.get(account_id)
        if handle is None:
            raise RuntimeError(f"account {account_id} has no running worker")
        if self._loop is None:
            raise RuntimeError("manager not bound to an event loop")
        req_id = uuid.uuid4().hex
        fut: asyncio.Future = self._loop.create_future()
        handle.pending[req_id] = fut
        handle.cmd_queue.put({"id": req_id, "op": op, "params": params or {}})
        try:
            msg = await asyncio.wait_for(fut, timeout=timeout)
        except asyncio.TimeoutError:
            handle.pending.pop(req_id, None)
            raise TimeoutError(f"account {account_id} worker timed out on '{op}'") from None
        if not msg.get("ok"):
            raise RuntimeError(msg.get("error") or "unknown worker error")
        return msg.get("result")


def _resolve(fut: asyncio.Future, msg: dict) -> None:
    if not fut.done():
        fut.set_result(msg)


manager = AccountManager()
