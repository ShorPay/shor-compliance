# Shor Compliance Framework Examples

This directory contains examples demonstrating how to use the Shor Compliance Framework.

## Examples

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates how to create and work with compliance specifications programmatically using the SDK.

**Key concepts:**
- Creating compliance specifications
- Setting token sale parameters
- Defining investor verification requirements
- Understanding the compilation output structure

### 2. KYC Integration (`kyc-integration.ts`)

Shows how KYC/AML verification integrates with the compliance framework.

**Key concepts:**
- Understanding the verification flow
- Working with verification proofs
- Integrating with smart contracts
- Direct provider integration options

### 3. Complete SDK Integration (`sdk-complete-integration.ts`)

Comprehensive example showing real-world SDK usage patterns.

**Key concepts:**
- Loading and customizing jurisdiction templates
- Implementing custom KYC providers
- Complete integration workflow
- Validation and error handling
- Multi-jurisdiction support

### 4. Custom Generators (`custom-generator.ts`)

Shows how to create custom code and document generators.

**Key concepts:**
- Building Solana/Anchor generators
- Creating legal summary documents
- Smart contract analysis tools
- Plugin architecture
- Extending the SDK

### 5. Web3 Integration (`web3-integration.ts`)

Demonstrates integration with Ethereum and web3 applications.

**Key concepts:**
- Frontend DApp integration
- Backend batch updates
- Event monitoring
- Gas optimization strategies
- MetaMask integration

### 6. Testing Compliance (`testing-compliance.ts`)

Shows how to test your compliance configurations.

**Key concepts:**
- Unit testing compliance rules
- Integration testing with mock contracts
- Scenario-based testing
- Validation testing
- Test automation

## Running the Examples

These examples demonstrate the intended API and structure. To run them in a real environment:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the packages:**
   ```bash
   npm run build
   ```

3. **Run an example:**
   ```bash
   npx ts-node examples/basic-usage.ts
   npx ts-node examples/kyc-integration.ts
   ```

## Important Notes

### Current Implementation Status

The SDK is structured to provide:
- **Type definitions** for compliance specifications
- **Interfaces** for generators and providers
- **Base classes** for extensibility

The actual implementation of generators and compilation is currently in the CLI tool. Future versions will migrate this functionality to the SDK for programmatic access.

### Architecture Overview

```
Your Application
       ↓
 Shor SDK/CLI
       ↓
 ┌─────────────┬─────────────┬─────────────┐
 │ Generators  │ Providers   │Jurisdictions│
 │ - Solidity  │ - Sumsub    │ - US SEC    │
 │ - Solana    │ - Custom    │ - EU MiCA   │
 │ - Policy    │             │ - SG MAS    │
 └─────────────┴─────────────┴─────────────┘
```

### Using the CLI vs SDK

**Use the CLI when:**
- You want a quick way to generate contracts and documents
- You're working with standard compliance templates
- You prefer command-line workflows

**Use the SDK when:**
- You need programmatic access to compliance tools
- You want to integrate compliance into your application
- You need custom generators or providers
- You're building automation workflows

## Next Steps

1. **For CLI usage:** See the main README for CLI commands
2. **For SDK integration:** Refer to the SDK package documentation
3. **For custom implementations:** Check the interface definitions in `@shor/compliance-sdk`