#!/bin/bash

echo "=== Environment Check ===" > /tmp/env_check.txt
echo "" >> /tmp/env_check.txt

echo "Conda env: $CONDA_DEFAULT_ENV" >> /tmp/env_check.txt
echo "" >> /tmp/env_check.txt

echo "Cargo version:" >> /tmp/env_check.txt
cargo --version >> /tmp/env_check.txt 2>&1
echo "" >> /tmp/env_check.txt

echo "Node version:" >> /tmp/env_check.txt
node --version >> /tmp/env_check.txt 2>&1
echo "" >> /tmp/env_check.txt

echo "NPM version:" >> /tmp/env_check.txt
npm --version >> /tmp/env_check.txt 2>&1
echo "" >> /tmp/env_check.txt

echo "Stellar CLI:" >> /tmp/env_check.txt
which stellar >> /tmp/env_check.txt 2>&1
stellar version >> /tmp/env_check.txt 2>&1
echo "" >> /tmp/env_check.txt

echo "=== Contract Files ===" >> /tmp/env_check.txt
echo "" >> /tmp/env_check.txt

if [ -f "contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm" ]; then
    echo "✓ Credit Scoring Contract: $(ls -lh contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm | awk '{print $5}')" >> /tmp/env_check.txt
else
    echo "✗ Credit Scoring Contract: NOT FOUND" >> /tmp/env_check.txt
fi

if [ -f "contracts/loan/target/wasm32-unknown-unknown/release/loan_contract.wasm" ]; then
    echo "✓ Loan Contract: $(ls -lh contracts/loan/target/wasm32-unknown-unknown/release/loan_contract.wasm | awk '{print $5}')" >> /tmp/env_check.txt
else
    echo "✗ Loan Contract: NOT FOUND" >> /tmp/env_check.txt
fi

if [ -f "contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm" ]; then
    echo "✓ Escrow Contract: $(ls -lh contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm | awk '{print $5}')" >> /tmp/env_check.txt
else
    echo "✗ Escrow Contract: NOT FOUND" >> /tmp/env_check.txt
fi

echo "" >> /tmp/env_check.txt
echo "=== Test Build ===" >> /tmp/env_check.txt
echo "" >> /tmp/env_check.txt

cd contracts/credit-scoring
cargo build --target wasm32-unknown-unknown --release >> /tmp/env_check.txt 2>&1
BUILD_STATUS=$?
cd ../..

if [ $BUILD_STATUS -eq 0 ]; then
    echo "✓ Test build successful" >> /tmp/env_check.txt
else
    echo "✗ Test build failed with exit code: $BUILD_STATUS" >> /tmp/env_check.txt
fi

echo "" >> /tmp/env_check.txt
echo "=== Summary ===" >> /tmp/env_check.txt
echo "Check complete. Review results above." >> /tmp/env_check.txt

cat /tmp/env_check.txt
