#!/bin/bash

echo "Checking contract builds..."
echo ""

if [ -f "contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm" ]; then
    SIZE=$(ls -lh contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm | awk '{print $5}')
    echo "✓ Credit Scoring Contract: $SIZE"
else
    echo "✗ Credit Scoring Contract: NOT FOUND"
fi

if [ -f "contracts/loan/target/wasm32-unknown-unknown/release/loan_contract.wasm" ]; then
    SIZE=$(ls -lh contracts/loan/target/wasm32-unknown-unknown/release/loan_contract.wasm | awk '{print $5}')
    echo "✓ Loan Contract: $SIZE"
else
    echo "✗ Loan Contract: NOT FOUND"
fi

if [ -f "contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm" ]; then
    SIZE=$(ls -lh contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm | awk '{print $5}')
    echo "✓ Escrow Contract: $SIZE"
else
    echo "✗ Escrow Contract: NOT FOUND"
fi

echo ""
echo "Building any missing contracts..."
cd contracts/credit-scoring && cargo build --target wasm32-unknown-unknown --release > /dev/null 2>&1
cd ../loan && cargo build --target wasm32-unknown-unknown --release > /dev/null 2>&1
cd ../escrow && cargo build --target wasm32-unknown-unknown --release > /dev/null 2>&1
cd ../..

echo "Done!"
