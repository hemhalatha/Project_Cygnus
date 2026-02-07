"""Time-bound payment: transaction valid only within a time window (Phase 2.2)."""

from stellar_sdk import Asset, Keypair, Network, Server, TransactionBuilder

from cygnus.config import get_settings


def build_time_bound_payment(
    source_secret: str,
    destination_public: str,
    amount_xlm: str,
    valid_for_seconds: int = 300,
    horizon_url: str | None = None,
) -> dict:
    """
    Build, sign, and submit a native payment that is only valid for the next
    `valid_for_seconds` seconds (time-bound at the transaction level).
    Returns Horizon submit result.
    """
    settings = get_settings()
    network_passphrase = (
        Network.TESTNET_NETWORK_PASSPHRASE
        if settings.stellar_network == "testnet"
        else Network.PUBLIC_NETWORK_PASSPHRASE
    )
    source_kp = Keypair.from_secret(source_secret)
    server = Server(horizon_url or settings.horizon_url)
    source_account = server.load_account(source_kp.public_key)
    base_fee = server.fetch_base_fee()

    transaction = (
        TransactionBuilder(
            source_account=source_account,
            network_passphrase=network_passphrase,
            base_fee=base_fee,
        )
        .append_payment_op(
            destination=destination_public,
            asset=Asset.native(),
            amount=amount_xlm,
        )
        .set_timeout(valid_for_seconds)
        .build()
    )
    transaction.sign(source_kp)
    return server.submit_transaction(transaction)
