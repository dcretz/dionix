# Trading frontend

React + Vite + TypeScript UI for the trading backend in `../trading-backend`.

- Interactive candlestick chart (`lightweight-charts`) — click "alege pe
  grafic" next to Stop Loss / Take Profit, then click a price level on the
  chart to set it; open positions are drawn as price lines automatically.
- Quick trade panel with a live-computed lot size (from the account's risk
  % and the chosen Stop Loss), a scope toggle to fire the trade on a single
  account or every account marked "trade-all", and big Buy/Sell buttons.
- Accounts page to add/edit MT5 accounts, their default risk %, and
  whether they participate in "trade all".
- Live bid/ask prices over the backend's websocket.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to the trading-backend URL
npm run dev
```

On first load you'll be asked for the backend URL and its
`TRADING_API_TOKEN` (stored in the browser's localStorage, not baked into
the build) — see `../trading-backend/README.md` for how to run that.

```bash
npm run build   # production build
npm run lint    # oxlint
```
