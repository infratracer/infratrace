"""
Deploy InfraTrace smart contract to Polygon Amoy testnet.

Usage:
    python contracts/deploy.py

Requires:
    - POLYGON_PRIVATE_KEY in backend/.env
    - POLYGON_RPC_URL in backend/.env (defaults to Amoy)
    - pip install web3 py-solc-x
"""

import json
import os
import sys
from pathlib import Path

# Load env from backend/.env
env_path = Path(__file__).parent.parent / "backend" / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())

RPC_URL = os.environ.get("POLYGON_RPC_URL", "https://rpc-amoy.polygon.technology")
PRIVATE_KEY = os.environ.get("POLYGON_PRIVATE_KEY", "")
CHAIN_ID = int(os.environ.get("POLYGON_CHAIN_ID", "80002"))

if not PRIVATE_KEY:
    print("ERROR: POLYGON_PRIVATE_KEY not set")
    sys.exit(1)


def compile_contract():
    """Compile the Solidity contract using py-solc-x."""
    try:
        import solcx
    except ImportError:
        print("Installing py-solc-x...")
        os.system(f"{sys.executable} -m pip install py-solc-x")
        import solcx

    solcx.install_solc("0.8.20")

    sol_path = Path(__file__).parent / "InfraTrace.sol"
    source = sol_path.read_text()

    compiled = solcx.compile_source(
        source,
        output_values=["abi", "bin"],
        solc_version="0.8.20",
    )

    contract_key = "<stdin>:InfraTrace"
    return compiled[contract_key]["abi"], compiled[contract_key]["bin"]


def deploy():
    from web3 import Web3
    from web3.middleware import ExtraDataToPOAMiddleware

    print(f"Connecting to {RPC_URL}...")
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

    if not w3.is_connected():
        print("ERROR: Cannot connect to RPC")
        sys.exit(1)

    account = w3.eth.account.from_key(PRIVATE_KEY)
    balance = w3.eth.get_balance(account.address)
    print(f"Deployer: {account.address}")
    print(f"Balance: {w3.from_wei(balance, 'ether')} MATIC")

    if balance == 0:
        print("ERROR: No MATIC balance. Get testnet MATIC from https://faucet.polygon.technology/")
        sys.exit(1)

    print("Compiling contract...")
    abi, bytecode = compile_contract()

    contract = w3.eth.contract(abi=abi, bytecode=bytecode)

    print("Deploying InfraTrace contract...")
    tx = contract.constructor().build_transaction({
        "from": account.address,
        "nonce": w3.eth.get_transaction_count(account.address),
        "gas": 1000000,
        "gasPrice": w3.eth.gas_price,
        "chainId": CHAIN_ID,
    })

    signed = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"TX Hash: {tx_hash.hex()}")

    print("Waiting for confirmation...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

    contract_address = receipt["contractAddress"]
    print(f"\nCONTRACT DEPLOYED!")
    print(f"Address: {contract_address}")
    print(f"Block: {receipt['blockNumber']}")
    print(f"Gas Used: {receipt['gasUsed']}")
    print(f"\nPolygonscan: https://amoy.polygonscan.com/address/{contract_address}")

    # Save ABI to backend
    abi_path = Path(__file__).parent.parent / "backend" / "app" / "services" / "contract_abi.json"
    abi_path.write_text(json.dumps(abi, indent=2))
    print(f"\nABI saved to {abi_path}")

    print(f"\n{'='*60}")
    print(f"Add to Railway environment variables:")
    print(f"  CONTRACT_ADDRESS={contract_address}")
    print(f"{'='*60}")

    return contract_address


if __name__ == "__main__":
    deploy()
