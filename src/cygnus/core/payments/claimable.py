"""Claimable balance: create with optional time/signer predicates (Phase 2.1)."""

from stellar_sdk import (
    Asset,
    Claimant,
    ClaimPredicate,
    Keypair,
    Network,
    Server,
    TransactionBuilder,
)

from cygnus.config import get_settings


def create_claimable_balance(
    source_secret: str,
    claimant_public: str,
    amount: str,
    asset: Asset | None = None,
    predicate_before_relative_seconds: int | None = None,
    predicate_before_absolute_timestamp: int | None = None,
    horizon_url: str | None = None,
) -> dict:
    """
    Create a claimable balance for one claimant.
    Optionally restrict claiming by relative time (e.g. claim within 7 days)
    or absolute time (claim before Unix timestamp).
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
    asset = asset or Asset.native()

    predicate = None
    if predicate_before_relative_seconds is not None:
        predicate = ClaimPredicate.predicate_before_relative_time(
            predicate_before_relative_seconds
        )
    elif predicate_before_absolute_timestamp is not None:
        predicate = ClaimPredicate.predicate_before_absolute_time(
            predicate_before_absolute_timestamp
        )

    claimant = Claimant(destination=claimant_public, predicate=predicate)

    transaction = (
        TransactionBuilder(
            source_account=source_account,
            network_passphrase=network_passphrase,
            base_fee=base_fee,
        )
        .append_create_claimable_balance_op(
            asset=asset,
            amount=amount,
            claimants=[claimant],
            source=source_kp.public_key,
        )
        .set_timeout(60)
        .build()
    )
    transaction.sign(source_kp)
    return server.submit_transaction(transaction)
