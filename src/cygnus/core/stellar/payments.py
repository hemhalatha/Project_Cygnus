"""Native XLM payment: build and submit (Phase 1.3)."""

from stellar_sdk import (
    Asset,
    Keypair,
    Network,
    TransactionBuilder,
)

from cygnus.config import get_settings
from cygnus.core.stellar.horizon import HorizonClient


def submit_native_payment(
    source_secret: str,
    destination_public: str,
    amount_xlm: str,
    memo: str | None = None,
    horizon_url: str | None = None,
) -> dict:
    """
    Build, sign, and submit a native XLM payment.
    Returns Horizon submit result or raises BadRequestError.
    """
    settings = get_settings()
    network_passphrase = (
        Network.TESTNET_NETWORK_PASSPHRASE
        if settings.stellar_network == "testnet"
        else Network.PUBLIC_NETWORK_PASSPHRASE
    )
    source_kp = Keypair.from_secret(source_secret)
    client = HorizonClient(horizon_url)
    server = client.server

    source_account = server.load_account(source_kp.public_key)
    base_fee = server.fetch_base_fee()

    builder = TransactionBuilder(
        source_account=source_account,
        network_passphrase=network_passphrase,
        base_fee=base_fee,
    ).append_payment_op(
        destination=destination_public,
        asset=Asset.native(),
        amount=amount_xlm,
    )
    if memo:
        builder.add_text_memo(memo)

    transaction = builder.build()
    transaction.sign(source_kp)
    return client.submit_transaction(transaction)
