import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.blockchain import BlockchainAnchor
from app.models.decision import DecisionRecord

logger = logging.getLogger(__name__)

CONTRACT_ABI_PATH = Path(__file__).parent / "contract_abi.json"


def _load_abi() -> list[dict]:
    if CONTRACT_ABI_PATH.exists():
        with open(CONTRACT_ABI_PATH) as f:
            return json.load(f)
    logger.warning("Contract ABI file not found at %s", CONTRACT_ABI_PATH)
    return []


async def anchor_decision(
    db: AsyncSession,
    decision_id: uuid.UUID,
    project_id: uuid.UUID,
    sequence_number: int,
    record_hash: str,
) -> BlockchainAnchor | None:
    """Anchor a decision hash on Polygon Amoy.

    Submits the transaction and waits for receipt in a thread pool
    to avoid blocking the async event loop.
    """
    if not settings.POLYGON_PRIVATE_KEY or not settings.CONTRACT_ADDRESS:
        logger.info("Blockchain anchoring skipped — missing POLYGON_PRIVATE_KEY or CONTRACT_ADDRESS")
        return None

    try:
        from web3 import Web3
        from web3.middleware import ExtraDataToPOAMiddleware

        w3 = Web3(Web3.HTTPProvider(settings.POLYGON_RPC_URL))
        w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        abi = _load_abi()
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
            abi=abi,
        )

        account = w3.eth.account.from_key(settings.POLYGON_PRIVATE_KEY)

        try:
            project_bytes = bytes.fromhex(str(project_id).replace("-", "")).ljust(32, b"\x00")
            hash_bytes = bytes.fromhex(record_hash)
        except ValueError as e:
            logger.error("Invalid hex conversion for project %s or hash %s: %s", project_id, record_hash[:16], e)
            return None

        # Run ALL blocking web3 calls in a thread pool
        def _submit_and_wait():
            built_tx = contract.functions.anchorDecision(
                project_bytes, sequence_number, hash_bytes,
            ).build_transaction({
                "from": account.address,
                "nonce": w3.eth.get_transaction_count(account.address),
                "gas": 200000,
                "gasPrice": w3.eth.gas_price,
                "chainId": settings.POLYGON_CHAIN_ID,
            })
            signed = account.sign_transaction(built_tx)
            raw_tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
            tx_receipt = w3.eth.wait_for_transaction_receipt(raw_tx_hash, timeout=60)
            return raw_tx_hash.hex(), tx_receipt

        logger.info("Submitting anchor for decision #%d to Polygon...", sequence_number)
        tx_hex, receipt = await asyncio.to_thread(_submit_and_wait)
        tx_hash_full = f"0x{tx_hex}" if not tx_hex.startswith("0x") else tx_hex

        logger.info("Polygon tx confirmed: %s block=%d gas=%d",
                     tx_hash_full, receipt["blockNumber"], receipt["gasUsed"])

        # Save anchor record
        anchor = BlockchainAnchor(
            decision_id=decision_id,
            record_hash=record_hash,
            tx_hash=tx_hash_full,
            block_number=receipt["blockNumber"],
            network="amoy",
            status="confirmed",
            gas_used=receipt["gasUsed"],
            confirmed_at=datetime.now(timezone.utc),
        )
        db.add(anchor)

        # Update the decision record with tx_hash
        decision_result = await db.execute(
            select(DecisionRecord).where(DecisionRecord.id == decision_id)
        )
        decision = decision_result.scalar_one_or_none()
        if decision:
            decision.tx_hash = tx_hash_full
            decision.block_number = receipt["blockNumber"]
            decision.chain_verified = True
            logger.info("Decision #%d updated with tx_hash=%s", sequence_number, tx_hash_full)
        else:
            logger.error("Decision %s not found for tx_hash update", decision_id)

        await db.commit()
        logger.info("Anchor committed to database for decision #%d", sequence_number)

        return anchor

    except Exception as e:
        logger.error("Blockchain anchoring failed for decision %s: %s", decision_id, e, exc_info=True)
        try:
            anchor = BlockchainAnchor(
                decision_id=decision_id,
                record_hash=record_hash,
                tx_hash="0x" + "0" * 64,
                network="amoy",
                status="failed",
            )
            db.add(anchor)
            await db.commit()
        except Exception:
            logger.error("Failed to save failed anchor record")
        return None


async def verify_onchain(
    project_id: uuid.UUID,
    sequence_number: int,
    expected_hash: str,
) -> dict:
    """Verify a decision hash against the on-chain record."""
    if not settings.CONTRACT_ADDRESS:
        return {"verified": False, "reason": "No contract address configured"}

    try:
        from web3 import Web3
        from web3.middleware import ExtraDataToPOAMiddleware

        w3 = Web3(Web3.HTTPProvider(settings.POLYGON_RPC_URL))
        w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        abi = _load_abi()
        contract = w3.eth.contract(
            address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
            abi=abi,
        )

        try:
            project_bytes = bytes.fromhex(str(project_id).replace("-", "")).ljust(32, b"\x00")
            hash_bytes = bytes.fromhex(expected_hash)
        except ValueError as e:
            return {"verified": False, "reason": f"Invalid hex data: {e}"}

        def _verify():
            return contract.functions.verifyDecision(
                project_bytes, sequence_number, hash_bytes,
            ).call()

        result = await asyncio.to_thread(_verify)

        return {"verified": result, "contract": settings.CONTRACT_ADDRESS}

    except Exception as e:
        logger.error("On-chain verification failed: %s", e)
        return {"verified": False, "reason": str(e)}
