# Shor Compliance

Open-source compliance-as-code for crypto projects. Write your token sale rules in YAML, generate Solidity contracts that enforce them on-chain, plus lawyer-friendly PDFs – all in one command.

```yaml
# compliance.yaml → Guardrail.sol + policy.pdf + audit.json
token_sale:
  max_cap_usd: 500000
  kyc_threshold_usd: 1000
  blocklist: ["US", "CN"]
```

**⚠️ LEGAL DISCLAIMER: This framework provides compliance guardrails based on common patterns. Users must conduct their own legal research and consult with qualified legal counsel before using these tools for any token sale or blockchain project.**

## The Problem

Crypto compliance is a nightmare. Regulations change weekly, vary by jurisdiction, and one mistake can kill your project. Most teams either:
- Overpay lawyers ($50-100k for basic setup)
- Risk non-compliance and hope for the best
- Spend months building custom solutions

## Our Solution

Treat compliance like infrastructure – declare once, deploy everywhere.

Write your rules in YAML → Generate smart contracts that enforce them → Deploy with confidence

**What you get:**
- ✅ Smart contracts that automatically reject non-compliant transactions
- ✅ Jurisdiction-specific templates (US SEC, EU MiCA, Singapore MAS)
- ✅ Direct KYC integration (no middleman servers)
- ✅ Immutable on-chain audit trail
- ✅ Update compliance with one config change when regulations shift

## How It Works

### 1. Declare once in `compliance.yaml`
```yaml
modules:
  token_sale:
    start_date: "2025-02-01"
    end_date: "2025-03-01"
    max_cap_usd: 500000
    kyc_threshold_usd: 1000
    
  geographic_restrictions:
    blocklist: ["US", "CN", "IR"]
```

### 2. Compile with one command
```bash
shor compile --blockchain ethereum --with-oracle
```

This generates:
- **Guardrail.sol** – Smart contract that reverts non-compliant transactions
- **policy.pdf** – Lawyer-readable compliance documentation  
- **audit.json** – Manifest with rules, timestamp, and bytecode hash

### 3. Deploy & forget
Your smart contract enforces rules automatically on-chain. When regulations change, update your YAML and redeploy – no code changes needed.

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

### 30-second setup

```bash
# Install
npm install -g @shor/cli

# Initialize (creates compliance.yaml)
shor init

# Compile (generates contracts + docs)
shor compile

# That's it! Check the build/ folder for your contracts
```

### Real-world example

```bash
# Start with US token sale template
shor init --jurisdiction us-token-sale

# Compile for Ethereum with KYC oracle
# Note: Requires SUMSUB_APP_TOKEN and SUMSUB_SECRET_KEY in .env
shor compile --blockchain ethereum --with-oracle

# Export everything for lawyers/auditors
shor export-audit --format zip
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

// Create KYC provider
const provider = compliance.createProvider('sumsub', {
  appToken: process.env.SUMSUB_APP_TOKEN,
  secretKey: process.env.SUMSUB_SECRET_KEY
});
const verification = await provider.initVerification({
  address: 'wallet-address',
  verificationType: 'INDIVIDUAL'
});
```

## Why Now?

- **SEC providing clearer guidance** on token classifications
- **Every L2 needs compliant on/off ramps** for growth
- **DeFi protocols seeking institutional capital** require compliance
- **Stablecoin regulations** emerging globally

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

### 🌍 Multi-Jurisdiction Templates

Community-maintained starting points for common jurisdictions:
- **US** - Templates based on common Reg D patterns
- **EU** - MiCA-aware configurations
- **Singapore** - MAS-focused templates

*Note: These are starting templates, not legal advice. Always verify with local counsel.*

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