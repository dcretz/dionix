# Trading backend (MT5)

FastAPI service that connects to one or more MetaTrader 5 accounts, streams
live prices, and executes trades with automatic risk-based lot sizing.

## Important: where this has to run

The official `MetaTrader5` Python package only ships for **Windows** and
only works when a matching **MetaTrader5 terminal is installed and running
on the same machine** — it talks to the terminal over local IPC, not a
network API. There is no way around this without a third-party bridge.

Consequences for how this service is deployed:

- **For real trading**, run this backend directly on a Windows machine
  (VPS or otherwise), not inside a Linux container.
- **Each account needs its own terminal instance.** True concurrent
  multi-account trading requires one MT5 terminal per account (the
  `MetaTrader5` package keeps a single global connection per process). Use
  the [portable mode](https://www.metatrader5.com/en/terminal/help/start_advanced/start#cmd_portable)
  installer flag to install several independent copies, e.g.:
  `terminal64.exe /portable` into separate folders, then point each
  account's `terminal_path` at its own `terminal64.exe`.
- This backend spawns **one OS process per enabled account**, each attached
  to that account's terminal, so accounts trade fully independently and in
  parallel.

## Mock mode (for development on any OS)

Set `TRADING_MT5_MOCK=1` (or leave the `MetaTrader5` package uninstalled —
it falls back automatically) to run the entire stack — API, live tick
websocket, order placement, positions, P&L — against an in-memory
simulator. This is what the Docker image and local frontend development use.
Nothing about the API contract changes between mock and real mode.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# Only on the Windows host that will do real trading:
pip install -r requirements-windows.txt

cp .env.example .env
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# paste the printed key into TRADING_ENCRYPTION_KEY in .env
# set TRADING_API_TOKEN to a random secret shared with the frontend

uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API docs.

## Adding accounts

`POST /accounts` with the MT5 login, password, server and (on Windows) the
`terminal_path` for that account's dedicated terminal. The password is
encrypted at rest with the `TRADING_ENCRYPTION_KEY`. Each account also has:

- `risk_percent` — default % of balance risked per trade, used to size lots
  automatically when the frontend fires a quick buy/sell.
- `max_lot` — optional hard ceiling on the computed lot size.
- `include_in_trade_all` — whether this account participates when the
  trader fires a trade with `scope: "all"` (trade every account at once)
  instead of `scope: "single"` (one specific account).

## How automatic lot sizing works

`app/risk.py` computes:

```
risk_amount   = balance * risk_percent / 100
loss_per_lot  = (|entry_price - stop_loss_price| / tick_size) * tick_value
lot           = risk_amount / loss_per_lot
```

then rounds down to the symbol's `volume_step` and clamps to
`[volume_min, min(volume_max, account.max_lot, TRADING_MAX_LOT_HARD_CAP)]`.
`POST /lot-preview` exposes this so the frontend can show the computed lot
before the trader confirms a trade; `POST /trade` uses the same formula
server-side when `fixed_volume` isn't supplied.

## API summary

| Endpoint | Purpose |
|---|---|
| `GET/POST/PATCH/DELETE /accounts` | manage MT5 accounts |
| `GET /accounts/{id}/info` | live balance/equity from the terminal |
| `GET /accounts/{id}/symbols` | tradable symbols |
| `GET /accounts/{id}/candles` | OHLC candles for the chart |
| `GET /accounts/{id}/symbol-info` | tick size/value, volume limits, live bid/ask |
| `POST /lot-preview` | preview the auto-computed lot for a risk % + SL |
| `POST /trade` | quick buy/sell, `scope: "single"` or `"all"` accounts |
| `GET /positions` | open positions across all connected accounts |
| `POST /positions/close` | close (or partially close) a position |
| `POST /positions/modify` | update SL/TP on an open position |
| `WS /ws/ticks?token=...` | live bid/ask stream, subscribe per account+symbol |

Every REST endpoint (except `/health`) requires `Authorization: Bearer
<TRADING_API_TOKEN>`. The websocket takes the same token as a `?token=`
query parameter (browsers can't set custom headers on a WS handshake).
