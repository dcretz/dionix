import { wsUrl } from "./api";
import type { Tick } from "./types";

type Listener = (tick: Tick) => void;

const key = (accountId: number, symbol: string) => `${accountId}:${symbol}`;

class TickStreamManager {
  private ws: WebSocket | null = null;
  private connecting = false;
  private listeners = new Map<string, Set<Listener>>();
  private queue: object[] = [];

  private ensureConnected() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (this.connecting) return;
    this.connecting = true;
    const socket = new WebSocket(wsUrl("/ws/ticks"));
    this.ws = socket;

    socket.onopen = () => {
      this.connecting = false;
      // re-subscribe everything (covers reconnects)
      for (const k of this.listeners.keys()) {
        const [accountId, symbol] = k.split(":");
        this.send({ action: "subscribe", account_id: Number(accountId), symbol });
      }
      while (this.queue.length) {
        socket.send(JSON.stringify(this.queue.shift()));
      }
    };

    socket.onmessage = (event) => {
      const tick = JSON.parse(event.data) as Tick;
      const set = this.listeners.get(key(tick.account_id, tick.symbol));
      set?.forEach((fn) => fn(tick));
    };

    socket.onclose = () => {
      this.connecting = false;
      this.ws = null;
      if (this.listeners.size > 0) {
        setTimeout(() => this.ensureConnected(), 1500);
      }
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  private send(msg: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.queue.push(msg);
    }
  }

  subscribe(accountId: number, symbol: string, listener: Listener): () => void {
    if (!accountId || !symbol) return () => {};
    const k = key(accountId, symbol);
    let set = this.listeners.get(k);
    const isNew = !set;
    if (!set) {
      set = new Set();
      this.listeners.set(k, set);
    }
    set.add(listener);

    this.ensureConnected();
    if (isNew) {
      this.send({ action: "subscribe", account_id: accountId, symbol });
    }

    return () => {
      const s = this.listeners.get(k);
      if (!s) return;
      s.delete(listener);
      if (s.size === 0) {
        this.listeners.delete(k);
        this.send({ action: "unsubscribe", account_id: accountId, symbol });
      }
    };
  }
}

export const tickStream = new TickStreamManager();
