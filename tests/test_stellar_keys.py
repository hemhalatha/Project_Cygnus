"""Tests for Stellar keypair handling (Phase 1)."""

import pytest

from cygnus.core.stellar.keys import KeypairManager
from stellar_sdk import Keypair


def test_keypair_manager_generate() -> None:
    kp = KeypairManager.generate()
    assert isinstance(kp, Keypair)
    assert kp.public_key.startswith("G")
    assert kp.secret.startswith("S")


def test_keypair_manager_from_secret() -> None:
    kp = KeypairManager.generate()
    kp2 = KeypairManager.from_secret(kp.secret)
    assert kp2.public_key == kp.public_key


def test_keypair_manager_public_from_public() -> None:
    kp = KeypairManager.generate()
    kp_public_only = KeypairManager.from_public(kp.public_key)
    assert KeypairManager.public_key(kp_public_only) == kp.public_key
