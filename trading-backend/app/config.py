import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in ("1", "true", "yes", "on")


class Settings:
    """Central configuration, read once from environment variables / .env."""

    # API auth: every request must send `Authorization: Bearer <API_TOKEN>`.
    api_token: str = os.getenv("TRADING_API_TOKEN", "change-me-dev-token")

    # Symmetric key used to encrypt MT5 account passwords at rest.
    # Generate one with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    encryption_key: str | None = os.getenv("TRADING_ENCRYPTION_KEY")

    database_url: str = os.getenv(
        "TRADING_DATABASE_URL", "sqlite:///./trading.db"
    )

    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv("TRADING_CORS_ORIGINS", "http://localhost:5173").split(",")
        if o.strip()
    ]

    # When true (default off Windows / when the MetaTrader5 package can't be
    # imported), every account worker uses an in-memory simulator instead of
    # a real terminal connection. This lets the whole stack be developed and
    # tested end-to-end on any OS, and is switched off automatically once the
    # backend actually runs on Windows with real terminals installed.
    mt5_mock: bool = _bool(os.getenv("TRADING_MT5_MOCK"), default=False)

    # How often (seconds) each account worker polls symbol_info_tick() for
    # subscribed symbols and pushes ticks up to connected websocket clients.
    tick_poll_interval: float = float(os.getenv("TRADING_TICK_POLL_INTERVAL", "0.5"))

    # Safety cap: no single order is allowed to exceed this lot size,
    # regardless of what the risk % calculation produces.
    max_lot_hard_cap: float = float(os.getenv("TRADING_MAX_LOT_HARD_CAP", "50"))

    default_deviation_points: int = int(os.getenv("TRADING_DEFAULT_DEVIATION", "20"))
    default_magic: int = int(os.getenv("TRADING_DEFAULT_MAGIC", "990099"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
