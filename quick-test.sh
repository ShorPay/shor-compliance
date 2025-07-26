#!/bin/bash

echo "=== Quick Shor Compliance Test ==="
echo

# Build everything
echo "1. Building packages..."
npm run build
echo

# Test CLI init
echo "2. Testing CLI init..."
npx shor init --list
echo

# Initialize a project
echo "3. Initializing US-SEC compliance..."
npx shor init --jurisdiction us-token-sale --force
echo

# Show the generated file
echo "4. Generated compliance.yaml:"
head -20 compliance.yaml
echo

# Compile it
echo "5. Compiling to Ethereum contract..."
npx shor compile --blockchain ethereum
echo

# List generated files
echo "6. Generated files:"
ls -la Guardrail.sol policy.md audit.json 2>/dev/null || echo "Files not found"
echo

# Test SDK
echo "7. Testing SDK..."
node test-sdk.js
echo

echo "=== Tests Complete ==="