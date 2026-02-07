#!/bin/bash

# Project Cygnus - Testnet Deployment Script
# Deploys all Soroban smart contracts to Stellar testnet

set -e

echo "🚀 Deploying Project Cygnus contracts to Stellar testnet"
echo "========================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
NETWORK="testnet"
SOURCE_ACCOUNT="alice"

# Check if contracts are built
if [ ! -f "contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm" ]; then
    echo "Building contracts first..."
    make build-contracts
fi

# Deploy Credit Scoring Contract
echo "Deploying Credit Scoring Contract..."
CREDIT_CONTRACT_ID=$(stellar contract deploy \
    --wasm contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK)
echo -e "${GREEN}✓${NC} Credit Scoring Contract deployed: $CREDIT_CONTRACT_ID"
echo ""

# Deploy Loan Contract
echo "Deploying Loan Contract..."
LOAN_CONTRACT_ID=$(stellar contract deploy \
    --wasm contracts/loan/target/wasm32-unknown-unknown/release/loan_contract.wasm \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK)
echo -e "${GREEN}✓${NC} Loan Contract deployed: $LOAN_CONTRACT_ID"
echo ""

# Deploy Escrow Contract
echo "Deploying Escrow Contract..."
ESCROW_CONTRACT_ID=$(stellar contract deploy \
    --wasm contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm \
    --source $SOURCE_ACCOUNT \
    --network $NETWORK)
echo -e "${GREEN}✓${NC} Escrow Contract deployed: $ESCROW_CONTRACT_ID"
echo ""

# Save contract IDs to .env
echo "Updating .env with contract IDs..."
if [ -f ".env" ]; then
    sed -i "s|CREDIT_SCORING_CONTRACT_ID=.*|CREDIT_SCORING_CONTRACT_ID=$CREDIT_CONTRACT_ID|" .env
    sed -i "s|LOAN_CONTRACT_ID=.*|LOAN_CONTRACT_ID=$LOAN_CONTRACT_ID|" .env
    sed -i "s|ESCROW_CONTRACT_ID=.*|ESCROW_CONTRACT_ID=$ESCROW_CONTRACT_ID|" .env
    echo -e "${GREEN}✓${NC} Contract IDs saved to .env"
else
    echo -e "${YELLOW}⚠${NC} .env file not found, creating from example..."
    cp .env.example .env
    sed -i "s|CREDIT_SCORING_CONTRACT_ID=|CREDIT_SCORING_CONTRACT_ID=$CREDIT_CONTRACT_ID|" .env
    sed -i "s|LOAN_CONTRACT_ID=|LOAN_CONTRACT_ID=$LOAN_CONTRACT_ID|" .env
    sed -i "s|ESCROW_CONTRACT_ID=|ESCROW_CONTRACT_ID=$ESCROW_CONTRACT_ID|" .env
fi

# Create deployment info file
cat > deployment-info.json <<EOF
{
  "network": "$NETWORK",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "creditScoring": {
      "id": "$CREDIT_CONTRACT_ID",
      "wasm": "contracts/credit-scoring/target/wasm32-unknown-unknown/release/credit_scoring.wasm"
    },
    "loan": {
      "id": "$LOAN_CONTRACT_ID",
      "wasm": "contracts/loan/target/wasm32-unknown-unknown/release/loan_contract.wasm"
    },
    "escrow": {
      "id": "$ESCROW_CONTRACT_ID",
      "wasm": "contracts/escrow/target/wasm32-unknown-unknown/release/escrow_contract.wasm"
    }
  }
}
EOF

echo ""
echo "========================================================="
echo "✨ Deployment Complete!"
echo "========================================================="
echo ""
echo "Contract IDs:"
echo "  Credit Scoring: $CREDIT_CONTRACT_ID"
echo "  Loan:           $LOAN_CONTRACT_ID"
echo "  Escrow:         $ESCROW_CONTRACT_ID"
echo ""
echo "Deployment info saved to: deployment-info.json"
echo ""
echo "Next steps:"
echo "1. Test contract invocations"
echo "2. Initialize credit profiles"
echo "3. Configure agents with contract IDs"
echo ""
