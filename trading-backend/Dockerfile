# This image runs the trading API in MOCK mode only (TRADING_MT5_MOCK=1),
# since the real `MetaTrader5` package is Windows-only and talks to a local
# terminal installation that can't live inside a Linux container. Use it for
# frontend development / CI. For real trading, run the backend directly on a
# Windows host with a venv — see README.md.
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV TRADING_MT5_MOCK=1
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
