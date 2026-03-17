import json
import logging
import os
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
    """Anchor a decision hash on Polygon Amoy. Non-blocking background task."""
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

        tx = contract.functions.anchorDecision(
            project_bytes,
            sequence_number,
            hash_bytes,
        ).build_transaction({
            "from": account.address,
            "nonce": w3.eth.get_transaction_count(account.address),
            "gas": 200000,
            "gasPrice": w3.eth.gas_price,
            "chainId": settings.POLYGON_CHAIN_ID,
        })

        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hex = tx_hash.hex()

        anchor = BlockchainAnchor(
            decision_id=decision_id,
            record_hash=record_hash,
            tx_hash=f"0x{tx_hex}" if not tx_hex.startswith("0x") else tx_hex,
            network="amoy",
            status="pending",
        )
        db.add(anchor)
        await db.flush()

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        anchor.block_number = receipt["blockNumber"]
        anchor.gas_used = receipt["gasUsed"]
        anchor.status = "confirmed"
        anchor.confirmed_at = datetime.now(timezone.utc)

        decision_result = await db.execute(
            select(DecisionRecord).where(DecisionRecord.id == decision_id)
        )
        decision = decision_result.scalar_one_or_none()
        if decision:
            decision.tx_hash = anchor.tx_hash
            decision.block_number = anchor.block_number
            decision.chain_verified = True

        await db.commit()

        logger.info(
            "Decision #%d anchored on-chain: tx=%s block=%d",
            sequence_number,
            anchor.tx_hash,
            anchor.block_number,
        )
        return anchor

    except Exception as e:
        logger.error("Blockchain anchoring failed for decision %s: %s", decision_id, e)
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

        result = contract.functions.verifyDecision(
            project_bytes,
            sequence_number,
            hash_bytes,
        ).call()

        return {"verified": result, "contract": settings.CONTRACT_ADDRESS}

    except Exception as e:
        logger.error("On-chain verification failed: %s", e)
        return {"verified": False, "reason": str(e)}
