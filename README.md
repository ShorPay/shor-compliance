# Shor Compliance Framework

A comprehensive blockchain compliance framework providing both SDK and CLI tools for implementing regulatory compliance in token sales and DeFi applications.

**⚠️ LEGAL DISCLAIMER: This framework is currently under review by legal professionals. Users must conduct their own legal research and consult with qualified legal counsel before using these tools for any token sale or blockchain project.**

## Overview

The Shor Compliance Framework helps blockchain projects implement regulatory compliance through:

- 🏛️ **Pre-built jurisdiction templates** (US SEC, EU MiCA, Singapore MAS)
- 📜 **Smart contract generation** with built-in compliance rules
- 🔍 **KYC/AML integration** with leading providers
- 📄 **Policy document generation** with enforcement indicators
- 🔗 **On-chain verification** through oracle integration

## Packages

This monorepo contains the following packages:

- **[@shor/compliance-sdk](./packages/sdk)** - Core SDK for programmatic access
- **[@shor/cli](./packages/cli)** - Command-line interface tool
- **[@shor/jurisdictions](./packages/jurisdictions)** - Jurisdiction templates and rules
- **[@shor/generators](./packages/generators)** - Code and document generators

## Quick Start

### Using the CLI

```bash
# Install globally
npm install -g @shor/cli

# Initialize a new compliance project
shor init my-token-sale

# Compile compliance rules
cd my-token-sale
shor compile --blockchain ethereum --with-oracle

# Generate verification
shor verify 0x742d35Cc6634C0532925a3b844Bc9e7595f8b2dc
```

### Using the SDK

```bash
npm install @shor/compliance-sdk
```

```typescript
import { createShorCompliance } from '@shor/compliance-sdk';

const compliance = createShorCompliance({
  jurisdiction: 'us-sec',
  blockchain: 'ethereum'
});

// Load and customize compliance rules
const spec = await compliance.loadJurisdiction('us-sec');
spec.modules.token_sale.max_cap_usd = 50000000;

// Generate contracts and documents
const result = await compliance.compile(spec);
```

## Key Features

### 🔐 Smart Contract Generation

Generate compliance-enforcing smart contracts for:
- Token sale caps and restrictions
- Geographic limitations
- Investor verification requirements
- Lock-up periods
- Transfer restrictions

### 📋 Policy Documentation

Automatically generate comprehensive policy documents with:
- **[ON-CHAIN]** - Rules enforced by smart contracts
- **[OFF-CHAIN]** - Manual compliance requirements
- **[HYBRID]** - Combined enforcement mechanisms

### 🌍 Multi-Jurisdiction Support

Pre-built templates for major jurisdictions:
- **US SEC** - Regulation D (506c), Form D filings, accredited investor rules
- **EU MiCA** - Crypto-asset regulations, whitepaper requirements
- **Singapore MAS** - Payment Services Act, DPT regulations

### 🔍 KYC/AML Integration

Built-in support for verification providers:
- Sumsub integration (included)
- Extensible provider system
- On-chain verification proofs
- Automated compliance workflows

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   CLI Tool      │     │   SDK Library   │
│   (@shor/cli)   │────▶│ (@shor/sdk)     │
└─────────────────┘     └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐     ┌───────▼────────┐
            │  Generators    │     │  Jurisdictions │
            │  - Solidity    │     │  - US SEC      │
            │  - Solana      │     │  - EU MiCA     │
            │  - Policy Docs │     │  - SG MAS      │
            └────────────────┘     └────────────────┘
```

## Development

```bash
# Clone the repository
git clone https://github.com/shor-protocol/compliance-framework.git
cd compliance-framework

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start CLI in development mode
npm run dev
```

## Examples

See the [examples](./examples) directory for:
- Basic SDK usage
- KYC integration
- Custom generator implementation
- Multi-jurisdiction compliance

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Adding a New Jurisdiction

1. Create a template in `packages/jurisdictions/templates/`
2. Add jurisdiction metadata
3. Define compliance modules
4. Submit a pull request

### Adding a KYC Provider

1. Implement the `KYCProvider` interface
2. Register with the provider factory
3. Add documentation and examples
4. Submit a pull request

## Security

- Smart contracts should be audited before mainnet deployment
- Never commit API keys or sensitive data
- Use environment variables for configuration
- Follow security best practices for key management

## License

Apache License 2.0 - See [LICENSE](./LICENSE) for details

## Support

- 📖 [Documentation](https://docs.shor.xyz)
- 💬 [Discord Community](https://discord.gg/shor)
- 🐛 [Issue Tracker](https://github.com/shor-protocol/compliance-framework/issues)
- 📧 [Email Support](mailto:support@shor.xyz)

## Disclaimer

This software is provided "as is" without warranty of any kind. Users are responsible for ensuring their compliance with applicable laws and regulations. Always consult with qualified legal counsel before conducting any token sale or implementing compliance measures.

---

Built with ❤️ by the [Shor Protocol](https://shor.xyz) team