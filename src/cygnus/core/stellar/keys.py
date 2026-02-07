"""Stellar keypair generation and encoding (Phase 1.1)."""

from stellar_sdk import Keypair


class KeypairManager:
    """Create and encode Stellar keypairs (StrKey)."""

    @staticmethod
    def generate() -> Keypair:
        """Generate a new random keypair."""
        return Keypair.random()

    @staticmethod
    def from_secret(secret: str) -> Keypair:
        """Load keypair from secret key (StrKey)."""
        return Keypair.from_secret(secret)

    @staticmethod
    def from_public(public: str) -> Keypair:
        """Load keypair from public key only (no signing)."""
        return Keypair.from_public_key(public)

    @staticmethod
    def public_key(keypair: Keypair) -> str:
        """Return public key StrKey."""
        return keypair.public_key

    @staticmethod
    def secret_key(keypair: Keypair) -> str:
        """Return secret key StrKey (use only in secure context)."""
        return keypair.secret
