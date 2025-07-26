# Shor Compliance

Generate blockchain-enforced compliance smart contracts from simple YAML specifications.

## Features

- 🌍 **Pre-built jurisdiction templates** (US SEC, EU MiCA, Singapore MAS)
- 📜 **Compliance-as-Code** - Write rules in YAML, get Solidity/Rust contracts
- 🔐 **Sumsub KYC/AML integration** - Real-world identity verification
- 📊 **Multi-chain support** - Ethereum and Solana
- 📄 **Automatic documentation** - Policy docs, PDFs, and audit trails

## Quick Start

```bash
# Install dependencies
npm install

# Build the CLI
npm run build

# Link globally (optional)
npm link

# Initialize with a jurisdiction template
shor init --jurisdiction us-token-sale

# Compile to smart contracts
shor compile --with-oracle
```

## Available Jurisdictions

- `us-token-sale` - SEC Regulation D (506c) for accredited investors
- `eu-mica-token-sale` - EU Markets in Crypto-Assets Regulation
- `singapore-payment-token` - MAS Payment Services Act 2019

## Project Structure

```
shor-compliance/
├── policy-library/
│   ├── jurisdictions/          # Pre-built compliance templates
│   │   ├── us-token-sale.yaml
│   │   ├── eu-mica-token-sale.yaml
│   │   └── singapore-payment-token.yaml
│   ├── compliance.yaml         # YOUR project config (gitignored)
│   ├── schema.json            # Validation schema (gitignored)
│   └── docs/                  # Generated docs (gitignored)
├── build/                     # Generated contracts and documents
└── src/                       # CLI source code
```

## Usage

### 1. Initialize Project

```bash
# List available templates
shor init --list

# Use specific jurisdiction
shor init --jurisdiction us-token-sale

# Generic template
shor init
```

### 2. Customize Compliance

Edit `policy-library/compliance.yaml` to customize:
- Token sale parameters
- KYC thresholds
- Geographic restrictions
- Disclosure requirements

### 3. Generate Contracts

```bash
# Basic compilation
shor compile

# With KYC oracle integration
shor compile --with-oracle

# For Solana
shor compile --blockchain solana
```

### 4. Export for Audit

```bash
shor export-audit
```

## Sumsub Integration

Configure KYC/AML verification:

```bash
# Set API key
shor set-api-key YOUR_KEY

# Initialize verification
shor verify init --address 0x123...

# Check status
shor verify status --address 0x123...
```

## Generated Outputs

- `GuardrailWithVerification.sol` - Smart contract enforcing compliance
- `policy.md` - Human-readable compliance policy
- `policy.pdf` - PDF for legal teams
- `audit.json` - Complete audit trail

## Adding New Jurisdictions

1. Research regulatory requirements
2. Create YAML template in `policy-library/jurisdictions/`
3. Follow existing template structure
4. Submit PR with references

## Important Notes
**⚠️ IMPORTANT LEGAL DISCLAIMER ⚠️**

This repository is currently under legal review. The compliance templates and generated contracts are for reference purposes only and should not be considered legal advice.

**YOU MUST:**
- Conduct your own legal research
- Consult with qualified legal counsel
- Verify all regulatory requirements for your jurisdiction
- Review and validate all generated contracts before deployment

**Use at your own risk and responsibility.**
- `compliance.yaml` is YOUR project configuration (gitignored)
- Jurisdiction templates are read-only references
- Always review generated contracts with legal counsel
- Regulations change - keep templates updated

## License

MIT