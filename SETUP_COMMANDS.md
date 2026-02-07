# Setup Commands - Run These Step by Step

Copy and paste these commands one at a time in your terminal.

## Step 1: Install System Dependencies (requires sudo)

```bash
sudo pacman -S --needed base-devel git curl wget openssl pkg-config jq make cmake
```

## Step 2: Install Rust (no sudo needed)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain 1.75.0
source $HOME/.cargo/env
rustup target add wasm32-unknown-unknown
```

## Step 3: Install Soroban CLI (no sudo needed)

```bash
cargo install --locked soroban-cli --features opt
```

## Step 4: Install Node.js via Conda (if in conda env)

```bash
conda install -c conda-forge nodejs=20 -y
```

## Step 5: Install Project Dependencies

```bash
npm install
```

## Step 6: Generate Cargo Lock Files

```bash
cd contracts/credit-scoring && cargo generate-lockfile && cd ../..
cd contracts/loan && cargo generate-lockfile && cd ../..
cd contracts/escrow && cargo generate-lockfile && cd ../..
```

## Step 7: Build the Project

```bash
npm run build
```

## Step 8: Run Tests

```bash
npm test
```

## Verification

Check everything is installed:

```bash
node --version
npm --version
rustc --version
cargo --version
soroban --version
```

Done! Your environment is ready.
