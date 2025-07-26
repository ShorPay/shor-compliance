# KYC/AML Providers

This directory contains KYC/AML provider implementations for the Shor Compliance SDK.

## Structure

Each provider should have its own subfolder containing:
- Implementation file (`{provider}-provider.ts`)
- Documentation file (`{PROVIDER}_INTEGRATION.md`) 
- Export file (`index.ts`)

```
providers/
├── base.ts                    # Base provider interfaces
├── factory.ts                 # Provider factory
├── kyc-provider.ts           # Core KYC provider types
├── provider-factory.ts       # Legacy factory (deprecated)
├── sumsub/
│   ├── sumsub-provider.ts    # Sumsub implementation
│   ├── SUMSUB_INTEGRATION.md # Sumsub documentation
│   └── index.ts              # Exports
└── [future-provider]/
    ├── [provider]-provider.ts
    ├── [PROVIDER]_INTEGRATION.md  
    └── index.ts
```

## Available Providers

### Sumsub
- **Folder**: `./sumsub/`
- **Implementation**: `sumsub-provider.ts`
- **Documentation**: `SUMSUB_INTEGRATION.md`
- **Features**: Full KYC/AML verification, sanctions screening, PEP checks

## Adding a New Provider

1. **Create provider folder**:
   ```bash
   mkdir packages/sdk/src/providers/your-provider
   ```

2. **Implement provider class**:
   ```typescript
   // your-provider/your-provider-provider.ts
   import { KYCProvider } from '../kyc-provider';
   
   export class YourProviderProvider implements KYCProvider {
     // Implementation
   }
   ```

3. **Add documentation**:
   Create `YOUR_PROVIDER_INTEGRATION.md` with setup and usage instructions.

4. **Create index file**:
   ```typescript
   // your-provider/index.ts
   export * from './your-provider-provider';
   ```

5. **Register with factory**:
   Update `factory.ts` to include your provider.

## Usage

```typescript
import { KYCProviderFactory } from './factory';

// Create provider instance
const provider = KYCProviderFactory.create('sumsub', config);

// Use provider
const verification = await provider.createVerification(address);
```