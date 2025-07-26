# Shor Compliance

Ship compliant crypto projects in minutes, not months. Update your compliance rules as regulations evolve with a single config change. 

**⚠️ LEGAL DISCLAIMER: This framework provides compliance guardrails based on common patterns. Users must conduct their own legal research and consult with qualified legal counsel before using these tools for any token sale or blockchain project.**

## Why Shor?

**🚀 Launch Faster**: Generate compliant smart contracts and documentation in seconds instead of waiting weeks for legal reviews. Make the process faster end to end

**🔄 Stay Compliant**: When regulations change, update your YAML config and regenerate - no need to rewrite contracts or hire developers.

**💰 Save Money**: Stop paying $50-100k for basic compliance setup. Use battle-tested templates and customize as needed.

**🛡️ Reduce Risk**: Enforce compliance rules on-chain automatically. No more manual checks or human errors.

## How It Works

The Shor Compliance Framework streamlines compliance through:

- 🏛️ **Pre-built jurisdiction templates** (US SEC, EU MiCA, Singapore MAS)
- 📜 **Smart contract generation** with built-in compliance rules
- 🔍 **KYC/AML integration** with leading providers
- 📄 **Policy document generation** with enforcement indicators
- 🔗 **On-chain verification** through oracle integration

## Packages

This monorepo contains the following packages:

- **[@shor/compliance-sdk](./packages/sdk)** - Core SDK for programmatic access
  - Type-safe compliance specification interfaces
  - KYC/AML provider factory and integrations
  - Jurisdiction loader with template support
  - Configuration schema and validation
- **[@shor/cli](./packages/cli)** - Command-line interface tool
  - Interactive project initialization
  - Multi-blockchain compilation (Ethereum, Solana)
  - Built-in linting and validation
  - Audit bundle export
  - Configuration management
- **[@shor/jurisdictions](./packages/jurisdictions)** - Jurisdiction templates and rules
- **[@shor/generators](./packages/generators)** - Code and document generators

## Quick Start

### Using the CLI

```bash
# Install globally
npm install -g @shor/cli

# Initialize a new compliance project with interactive mode
shor init --interactive

# Or initialize with specific jurisdiction
shor init --jurisdiction us-sec

# List available jurisdictions
shor init --list

# Compile compliance rules
shor compile --blockchain solana --with-oracle --interactive

# Lint compliance configuration
shor lint

# Export audit bundle
shor export-audit --format zip

# Show all available options
shor options

# Configure API settings
shor config set-api-key <your-key>
shor config show

# Verify with KYC integration
shor verify init --address <address>
```

### Using the SDK

```bash
npm install @shor/compliance-sdk
```

```typescript
import { createShorCompliance } from '@shor/compliance-sdk';

const compliance = createShorCompliance({
  jurisdiction: 'us-sec',
  blockchain: 'solana',
  environment: 'production',
  kycProvider: {
    name: 'sumsub',
    config: {
      appToken: 'your-token',
      secretKey: 'your-secret',
      baseURL: 'https://api.sumsub.com'
    }
  }
});

// Load and customize compliance rules
const spec = await compliance.loadJurisdiction('us-sec');
spec.modules.token_sale.max_cap_usd = 50000000;
spec.modules.token_sale.kyc_threshold_usd = 1000;

// Generate contracts and documents
const result = await compliance.compile(spec, {
  blockchain: 'solana',
  generatorOptions: { withOracle: true }
});

// Create KYC verifier
const verifier = compliance.createVerifier();
const verification = await verifier.createVerification('wallet-address');
```

## Key Features

### 🔐 Smart Contract Generation

Generate compliance-enforcing smart contracts for:
- **Multi-blockchain support** - Ethereum (Solidity) and Solana
- Token sale caps and restrictions
- Geographic limitations (blocklist/whitelist)
- Investor verification requirements with KYC thresholds
- Lock-up periods and transfer restrictions
- Oracle integration for on-chain KYC verification

**New CLI Options:**
- `--blockchain` - Target blockchain (ethereum|solana)
- `--with-oracle` - Include Sumsub oracle integration
- `--interactive` - Interactive compilation mode

### 📋 Policy Documentation

Automatically generate comprehensive policy documents with:
- **[ON-CHAIN]** - Rules enforced by smart contracts
- **[OFF-CHAIN]** - Manual compliance requirements  
- **[HYBRID]** - Combined enforcement mechanisms
- **PDF generation** - Professional policy documents via CLI
- **Markdown export** - Developer-friendly documentation
- **Audit manifests** - JSON metadata for compliance tracking

**Export Features:**
- `shor export-audit` - Bundle all compliance artifacts
- Jurisdiction-specific legal references
- Enforcement type indicators throughout documentation

### 🌍 Multi-Jurisdiction Support

Pre-built templates for major jurisdictions:
- **US SEC** - Regulation D (506c), Form D filings, accredited investor rules
- **EU MiCA** - Crypto-asset regulations, whitepaper requirements
- **Singapore MAS** - Payment Services Act, DPT regulations

### 🔍 KYC/AML Integration

Built-in support for verification providers:
- **Sumsub** - Full KYC/AML verification, sanctions screening, PEP checks
- Extensible provider system for custom integrations
- On-chain verification proofs via oracle integration
- Automated compliance workflows with SDK and CLI tools

**New SDK Features:**
- `createVerifier()` - Create KYC provider instances
- `getAvailableKYCProviders()` - List registered providers
- KYC provider factory pattern for easy extension

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

See the [examples](./examples) directory for comprehensive usage patterns:

### 📚 Available Examples
- **[basic-usage.ts](./examples/basic-usage.ts)** - Creating and working with compliance specifications
- **[kyc-integration.ts](./examples/kyc-integration.ts)** - KYC/AML verification workflows
- **[sdk-complete-integration.ts](./examples/sdk-complete-integration.ts)** - Real-world SDK usage patterns
- **[custom-generator.ts](./examples/custom-generator.ts)** - Building custom code and document generators
- **[web3-integration.ts](./examples/web3-integration.ts)** - Ethereum/DApp integration patterns
- **[testing-compliance.ts](./examples/testing-compliance.ts)** - Testing compliance configurations

### 🔧 CLI Command Examples
```bash
# Interactive project setup
shor init --interactive

# Generate with specific options
shor compile --blockchain solana --with-oracle --env production

# Show available configuration options
shor options --sdk --compile --jurisdictions --kyc

# KYC provider integration
shor verify init --address 0x123... --provider sumsub
```


## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Adding a New Jurisdiction

1. Create a template in `packages/jurisdictions/templates/`
2. Add jurisdiction metadata
3. Define compliance modules
4. Submit a pull request

### Adding a KYC Provider

1. Create provider directory in `packages/sdk/src/providers/your-provider/`
2. Implement the `KYCProvider` interface in `your-provider-provider.ts`
3. Add integration documentation as `YOUR_PROVIDER_INTEGRATION.md`
4. Register with the provider factory in `factory.ts`
5. Export from `index.ts`
6. Submit a pull request

**Example structure:**
```
packages/sdk/src/providers/
├── your-provider/
│   ├── your-provider-provider.ts
│   ├── YOUR_PROVIDER_INTEGRATION.md
│   └── index.ts
└── factory.ts  # Register here
```

## Security

- Smart contracts should be audited before mainnet deployment
- Never commit API keys or sensitive data
- Use environment variables for configuration
- Follow security best practices for key management

**📝 Verification Signatures**: 
- Verification proofs can be signed using the `VERIFICATION_SIGNING_KEY` environment variable
- If not provided, signatures will be empty (suitable for oracle-based verification)
- For direct proof verification, provide a signing key for security
- Default implementation uses HMAC-SHA256, but you can extend for other signing methods

## License

Apache License 2.0 - See [LICENSE](./LICENSE) for details


## 🚀 Future Vision

See our full [Future Vision](./FUTURE_VISION.md) for detailed roadmap and architecture.

## Support

- 📖 [Documentation](https://docs.shorpay.com)
- 🐛 [Issue Tracker](https://github.com/shorpay/compliance/issues)
- 📧 [Email Support](mailto:founders@shorpay.com)

## Disclaimer

This software is provided "as is" without warranty of any kind. Users are responsible for ensuring their compliance with applicable laws and regulations. Always consult with qualified legal counsel before conducting any token sale or implementing compliance measures.

---

Built with ❤️ by [Shor](https://shorpay.com) team