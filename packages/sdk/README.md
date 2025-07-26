# @shor/compliance-sdk

The Shor Compliance SDK provides programmatic access to blockchain compliance tools, enabling developers to integrate regulatory compliance into their applications.

## Installation

```bash
npm install @shor/compliance-sdk
```

## Quick Start

```typescript
import { createShorCompliance } from '@shor/compliance-sdk';

// Initialize the SDK
const compliance = createShorCompliance({
  jurisdiction: 'us-sec',
  blockchain: 'ethereum',
  environment: 'production'
});

// Load a jurisdiction template
const spec = await compliance.loadJurisdiction('us-sec');

// Customize the specification
spec.modules.token_sale = {
  ...spec.modules.token_sale,
  max_cap_usd: 50000000,
  min_investment_usd: 100000
};

// Compile to smart contracts and documents
const result = await compliance.compile(spec, {
  generatorOptions: {
    withOracle: true
  }
});

console.log(result.contracts['Guardrail.sol']);
console.log(result.documents['policy.md']);
```

## KYC/AML Integration

```typescript
import { createShorCompliance, VerificationType } from '@shor/compliance-sdk';

const compliance = createShorCompliance({
  kycProvider: {
    name: 'sumsub',
    config: {
      apiKey: 'your-api-key',
      secretKey: 'your-secret-key'
    }
  }
});

// Create a verifier
const verifier = compliance.createVerifier();

// Start verification
const result = await verifier.createVerification({
  address: '0x1234...',
  type: VerificationType.INDIVIDUAL,
  level: 'enhanced'
});

// Check status
const status = await verifier.checkStatus(result.verificationId);

// Generate proof for on-chain verification
const proof = await verifier.generateProof(result.verificationId);
```

## Custom Generators

```typescript
import { ShorCompliance, CodeGenerator, ComplianceSpec } from '@shor/compliance-sdk';

class CustomGenerator implements CodeGenerator {
  generate(spec: ComplianceSpec): string {
    // Your custom generation logic
    return 'generated code';
  }
  
  getBlockchain() { return 'ethereum' as const; }
  getFileExtension() { return 'sol'; }
}

const compliance = new ShorCompliance();
compliance.registerGenerator('custom', new CustomGenerator());
```

## Available Jurisdictions

- `us-sec` - United States SEC compliance
- `eu-mica` - European Union MiCA compliance
- `singapore-mas` - Singapore MAS compliance

## API Reference

### ShorCompliance

The main SDK class.

#### Methods

- `loadJurisdiction(jurisdiction: string): Promise<ComplianceSpec>`
- `listJurisdictions(): Promise<string[]>`
- `compile(spec: ComplianceSpec, options?: CompileOptions): Promise<CompileResult>`
- `createVerifier(provider?: string, config?: KYCProviderConfig): KYCProvider`
- `registerGenerator(name: string, generator: CodeGenerator | DocumentGenerator): void`

### Types

See the [types documentation](./docs/types.md) for detailed type definitions.

## License

Apache-2.0