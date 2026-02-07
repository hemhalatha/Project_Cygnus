"""Native XLM payment: build and submit (Phase 1.3)."""

from stellar_sdk import (
    Asset,
    Keypair,
    Network,
    TransactionBuilder,
)

from cygnus.config import get_settings
from cygnus.core.stellar.horizon import HorizonClient


def _step(step_id: str, label: str, status: str, detail: str | None = None) -> dict:
    return {"id": step_id, "label": label, "status": status, "detail": detail}


def submit_native_payment_with_steps(
    source_secret: str,
    destination_public: str,
    amount_xlm: str,
    memo: str | None = None,
    horizon_url: str | None = None,
) -> tuple[list[dict], dict]:
    """
    Build, sign, and submit a native XLM payment, returning a list of steps and the Horizon result.
    Steps are updated in order; on exception the failing step gets status "error" and detail set.
    """
    steps: list[dict] = []
    settings = get_settings()
    network_passphrase = (
        Network.TESTNET_NETWORK_PASSPHRASE
        if settings.stellar_network == "testnet"
        else Network.PUBLIC_NETWORK_PASSPHRASE
    )
    network_name = "testnet" if settings.stellar_network == "testnet" else "public"

    try:
        steps.append(_step("key", "Load agent key", "running", f"Network: {network_name}"))
        source_kp = Keypair.from_secret(source_secret)
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = f"Source: {source_kp.public_key[:8]}...{source_kp.public_key[-4:]}"

        steps.append(_step("horizon", "Connect to Horizon", "running"))
        client = HorizonClient(horizon_url)
        server = client.server
        base_fee = server.fetch_base_fee()
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = f"Base fee: {base_fee} stroops"

        steps.append(_step("account", "Load source account", "running"))
        source_account = server.load_account(source_kp.public_key)
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = "Account loaded"

        steps.append(
            _step(
                "build",
                "Build transaction",
                "running",
                f"Pay {amount_xlm} XLM to {destination_public[:8]}...",
            )
        )
        builder = (
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
        )
        if memo:
            builder.add_text_memo(memo)
        transaction = builder.build()
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = "Payment op + memo (if any) added"

        steps.append(_step("sign", "Sign transaction", "running"))
        transaction.sign(source_kp)
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = "Signed with agent key"

        steps.append(_step("submit", "Submit to network", "running"))
        result = client.submit_transaction(transaction)
        tx_hash = result.get("hash") if isinstance(result, dict) else getattr(result, "hash", None) or "—"
        steps[-1]["status"] = "done"
        steps[-1]["detail"] = f"Success. Hash: {tx_hash}"
        return steps, result
    except Exception as e:
        if steps:
            steps[-1]["status"] = "error"
            steps[-1]["detail"] = str(e)
        else:
            steps.append(_step("error", "Error", "error", str(e)))
        return steps, None


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
