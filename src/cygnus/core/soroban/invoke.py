"""Invoke a Soroban contract function: build, prepare, sign, send (Phase 3.3)."""

import time
from typing import Any

from stellar_sdk import Keypair, Network, TransactionBuilder
from stellar_sdk.exceptions import PrepareTransactionException
from stellar_sdk.soroban_rpc import GetTransactionStatus, SendTransactionStatus

from cygnus.config import get_settings
from cygnus.core.soroban.client import SorobanClient


def invoke_contract(
    contract_id: str,
    function_name: str,
    parameters: list[Any],
    source_secret: str,
    rpc_url: str | None = None,
    timeout_seconds: int = 30,
    poll_interval_seconds: int = 3,
) -> dict:
    """
    Build, prepare, sign, and send a contract invocation. Polls until the
    transaction is confirmed. Parameters must be SCVal-compatible (e.g. from
    stellar_sdk.scval: to_address, to_uint32, etc.).
    Returns dict with hash, status, and result_meta_xdr or error info.
    """
    settings = get_settings()
    network_passphrase = (
        Network.TESTNET_NETWORK_PASSPHRASE
        if settings.stellar_network == "testnet"
        else Network.PUBLIC_NETWORK_PASSPHRASE
    )
    client = SorobanClient(rpc_url)
    server = client.server
    source_kp = Keypair.from_secret(source_secret)

    source_account = server.load_account(source_kp.public_key)
    tx = (
        TransactionBuilder(source_account, network_passphrase, base_fee=100)
        .set_timeout(timeout_seconds)
        .append_invoke_contract_function_op(
            contract_id=contract_id,
            function_name=function_name,
            parameters=parameters,
        )
        .build()
    )

    try:
        tx = server.prepare_transaction(tx)
    except PrepareTransactionException as e:
        return {
            "success": False,
            "error": "prepare_failed",
            "message": str(e),
            "simulate_response": getattr(e, "simulate_transaction_response", None),
        }

    tx.sign(source_kp)
    send_resp = server.send_transaction(tx)

    if send_resp.status != SendTransactionStatus.PENDING:
        return {
            "success": False,
            "error": "send_failed",
            "hash": getattr(send_resp, "hash", None),
            "status": str(send_resp.status),
            "error_result_xdr": getattr(send_resp, "error_result_xdr", None),
        }

    tx_hash = send_resp.hash
    deadline = time.monotonic() + 60
    get_resp = None
    while time.monotonic() < deadline:
        get_resp = server.get_transaction(tx_hash)
        if get_resp.status != GetTransactionStatus.NOT_FOUND:
            break
        time.sleep(poll_interval_seconds)

    if get_resp is None or get_resp.status == GetTransactionStatus.NOT_FOUND:
        return {
            "success": False,
            "hash": tx_hash,
            "status": "timeout",
            "message": "Transaction not found within timeout",
        }
    if get_resp.status == GetTransactionStatus.SUCCESS:
        return {
            "success": True,
            "hash": tx_hash,
            "status": str(get_resp.status),
            "result_meta_xdr": getattr(get_resp, "result_meta_xdr", None),
        }
    return {
        "success": False,
        "hash": tx_hash,
        "status": str(get_resp.status),
        "result_xdr": getattr(get_resp, "result_xdr", None),
    }
