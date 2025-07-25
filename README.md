# Compliance-as-Code MVP

A minimal open-source tool that transforms compliance specifications into smart contracts, human-readable documentation, and audit bundles for both Ethereum and Solana blockchains.

## Overview

This CLI tool (`ccac`) implements a "Compliance-as-Code" approach where:
- **One spec** → Multiple outputs (smart contract + documentation + audit trail)
- Compliance rules are defined in YAML
- Automated generation of Solidity contracts (Ethereum) or Rust programs (Solana)
- Human-readable policy documents
- Complete audit bundles for regulatory review
- Multi-chain support: Ethereum and Solana

## Installation

```bash
npm install
npm run build
npm link  # Makes 'ccac' command available globally
```

## Commands

### `ccac init`
Bootstraps a new compliance project by creating:
- `policy-library/compliance.yaml` - Your compliance specification
- `policy-library/schema.json` - JSON schema for validation

### `ccac lint`
Validates your `compliance.yaml` against the schema, ensuring:
- All required fields are present
- Data types are correct
- Logical validations (e.g., end date after start date)

### `ccac compile --env=<environment> --blockchain=<ethereum|solana>`
Generates compliance artifacts from your specification:
- **For Ethereum (default):**
  - `build/Guardrail.sol` - Solidity smart contract with rules enforced on-chain
- **For Solana:**
  - `build/guardrail.rs` - Rust/Anchor program with rules enforced on-chain
- **For both:**
  - `build/policy.pdf` - Human-readable policy document
  - `build/policy.md` - Markdown version of the policy
  - `build/audit.json` - Machine-readable audit manifest

### `ccac export-audit --format=zip`
Creates `audit-bundle.zip` containing all generated artifacts plus:
- Test results (if available)
- Original compliance specification
- Timestamp and metadata

## Project Structure

```
compliance-project/
├── policy-library/
│   ├── compliance.yaml    # Your compliance specification
│   └── schema.json        # Validation schema
├── build/                 # Generated artifacts
│   ├── Guardrail.sol
│   ├── policy.pdf
│   ├── policy.md
│   └── audit.json
├── scripts/
│   └── test-guardrail.js  # Hardhat test script
└── audit-bundle.zip       # Export bundle
```

## Compliance Specification Format

The `compliance.yaml` file defines your compliance rules:

```yaml
version: "1.0"
metadata:
  project_name: "Token Sale Compliance"
  description: "Compliance rules for token sale"
  created_date: "2024-01-15"

modules:
  token_sale:
    start_date: "2024-03-01"      # Sale start date
    end_date: "2024-06-01"        # Sale end date
    max_cap_usd: 5000000          # Maximum funding cap in USD
    kyc_threshold_usd: 1000       # KYC required above this amount
    blocklist: ["US", "CN", "IR"] # Blocked country codes (ISO 3166-1 alpha-2)
```

## Testing the Generated Contract

### Ethereum Testing

After running `ccac compile`, test the generated Ethereum smart contract:

```bash
npx hardhat run scripts/test-guardrail.js
```

This script:
1. Deploys the generated `Guardrail.sol` to a local Hardhat network
2. Tests multiple scenarios including sale window, cap limits, and country restrictions
3. Logs results to `test-results.log`

### Solana Testing

After running `ccac compile --blockchain=solana`, test the generated Solana program:

```bash
node scripts/test-solana-guardrail.js
```

This provides a test guide and simulated results. For actual Solana testing:
1. Install Anchor CLI: `npm i -g @project-serum/anchor-cli`
2. Set up an Anchor project
3. Deploy and test the program on a local validator

## Example Workflow

```bash
# 1. Initialize a new compliance project
ccac init

# 2. Edit policy-library/compliance.yaml with your rules

# 3. Validate your configuration
ccac lint

# 4. Generate contracts and documentation for Ethereum (default)
ccac compile --env=production

# 4b. Or generate for Solana
ccac compile --env=production --blockchain=solana

# 5. Test the generated contract
# For Ethereum:
npx hardhat run scripts/test-guardrail.js
# For Solana:
node scripts/test-solana-guardrail.js

# 6. Create audit bundle for regulatory review
ccac export-audit --format=zip
```

## Key Features

- **Multi-Chain Support**: Generate contracts for both Ethereum and Solana from one spec
- **Type-Safe Configuration**: JSON schema validation ensures configuration correctness
- **Automated Contract Generation**: Compliance rules automatically translated to Solidity or Rust
- **Human-Readable Documentation**: Auto-generated policy documents for non-technical stakeholders
- **Complete Audit Trail**: All artifacts bundled with metadata for regulatory compliance
- **On-Chain Enforcement**: Rules are immutably enforced by smart contracts/programs

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npx ts-node src/cli.ts <command>
```

## License

ISC