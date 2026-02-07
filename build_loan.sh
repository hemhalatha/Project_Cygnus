#!/bin/bash
cd contracts/loan
cargo build --target wasm32-unknown-unknown --release 2>&1 | tee /tmp/loan_build.log
echo "Exit code: $?"
