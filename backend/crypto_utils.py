"""Encrypt / decrypt OAuth token dicts using Fernet symmetric encryption."""

from cryptography.fernet import Fernet
import json, os, base64, hashlib

def _get_key() -> bytes:
    """Derive a Fernet key from SECRET_KEY env var."""
    secret = os.getenv("SECRET_KEY", "change-me")
    # Fernet needs a url-safe base64-encoded 32-byte key
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)

_fernet = None

def _get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(_get_key())
    return _fernet

def encrypt_tokens(token_dict: dict) -> str:
    """Encrypt a credentials dict to a string for DB storage."""
    plaintext = json.dumps(token_dict).encode()
    return _get_fernet().encrypt(plaintext).decode()

def decrypt_tokens(encrypted: str) -> dict:
    """Decrypt a stored token string back to a credentials dict."""
    plaintext = _get_fernet().decrypt(encrypted.encode())
    return json.loads(plaintext)
