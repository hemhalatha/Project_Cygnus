#!/bin/bash
set -e

echo "=== Updating Rust ==="
export PATH="$HOME/.cargo/bin:$PATH"
rustup update stable
rustup default stable

echo ""
echo "=== Cargo Version ==="
cargo --version

echo ""
echo "=== Building Contracts ==="
cd contracts/credit-scoring && cargo build --target wasm32-unknown-unknown --release
cd ../..

echo ""
echo "✓ Build complete!"
