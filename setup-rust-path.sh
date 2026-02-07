#!/bin/bash
# Add Rust to PATH for current session

export PATH="$HOME/.cargo/bin:$PATH"

echo "Rust environment loaded!"
echo "Cargo: $(cargo --version)"
echo "Rustc: $(rustc --version)"
echo ""
echo "You can now use cargo commands."
echo "To make this permanent, the path has been added to ~/.bashrc"
