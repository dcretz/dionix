from functools import lru_cache

from cryptography.fernet import Fernet
from fastapi import Header, HTTPException, status

from .config import get_settings


@lru_cache
def _fernet() -> Fernet:
    settings = get_settings()
    key = settings.encryption_key
    if not key:
        raise RuntimeError(
            "TRADING_ENCRYPTION_KEY is not set. Generate one with:\n"
            "  python -c \"from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())\"\n"
            "and put it in trading-backend/.env"
        )
    return Fernet(key.encode())


def encrypt_secret(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_secret(ciphertext: str) -> str:
    return _fernet().decrypt(ciphertext.encode()).decode()


async def require_api_token(authorization: str | None = Header(default=None)) -> None:
    """Simple bearer-token guard shared by every route.

    This is a single-operator tool (one trader, several MT5 accounts), so a
    static shared token is enough — there is no multi-user model here.
    """
    settings = get_settings()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.api_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
