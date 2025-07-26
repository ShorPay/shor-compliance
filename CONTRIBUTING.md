# Contributing to Shor Compliance

Thank you for your interest in contributing to Shor Compliance! We're building the future of blockchain compliance together, and every contribution matters.

## 🤝 Ways to Contribute

### 1. **Add Jurisdiction Templates**
The most impactful contribution! Help projects in your jurisdiction stay compliant.

### 2. **Integrate KYC/AML Providers**
Add support for new verification providers to expand our ecosystem.

### 3. **Improve Documentation**
Help others understand and use the framework effectively.

### 4. **Report Bugs**
Found an issue? Let us know so we can fix it.

### 5. **Suggest Features**
Have ideas for improving compliance workflows? We'd love to hear them.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 8+
- Git
- Basic understanding of blockchain compliance concepts
- (Optional) Solidity knowledge for smart contract contributions

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/shor-compliance.git
cd shor-compliance

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start development mode
npm run dev
```

## 📝 Contribution Guidelines

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code changes that neither fix bugs nor add features
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add singapore MAS jurisdiction template
fix: correct KYC threshold calculation in US template
docs: update README with Polygon deployment instructions
```

### Pull Request Process

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/amazing-feature`)
3. **Make** your changes
4. **Test** thoroughly (`npm test`)
5. **Commit** with a descriptive message
6. **Push** to your fork (`git push origin feat/amazing-feature`)
7. **Open** a Pull Request with:
   - Clear description of changes
   - Link to any related issues
   - Screenshots/examples if applicable

## 🏛️ Adding a New Jurisdiction

One of the most valuable contributions! Here's how:

### 1. Create Template File

Create a new YAML file in `packages/jurisdictions/templates/`:

```yaml
# packages/jurisdictions/templates/[country-code]-token-sale.yaml
version: "1.0"
metadata:
  jurisdiction: "Country Name"
  regulatory_body: "Regulatory Authority Name"
  last_updated: "2025-01-26"
  references:
    - name: "Official Regulation"
      url: "https://..."
  
modules:
  token_sale:
    enabled: true
    max_cap_usd: 50000000
    min_investment_usd: 100
    max_investment_usd: 1000000
    kyc_threshold_usd: 1000
    accredited_only: false
    
  investor_verification:
    kyc_required: true
    aml_check_required: true
    accreditation_check_required: false
```

### 2. Add Jurisdiction Metadata

Update `packages/jurisdictions/src/index.ts`:

```typescript
export const JURISDICTIONS = {
  // ... existing jurisdictions
  'country-code': {
    name: 'Country Name',
    code: 'CC',
    templates: ['token-sale'],
    regulatoryBody: 'Regulatory Authority',
    lastUpdated: '2025-01-26'
  }
};
```

### 3. Write Tests

Add tests in `packages/jurisdictions/test/`:

```typescript
describe('Country Name Jurisdiction', () => {
  it('should load country template correctly', async () => {
    const template = await loadJurisdiction('country-code');
    expect(template.metadata.jurisdiction).toBe('Country Name');
  });
  
  it('should enforce correct compliance rules', () => {
    // Test specific rules
  });
});
```

### 4. Document the Jurisdiction

Add documentation in `packages/jurisdictions/docs/COUNTRY_CODE.md`:

```markdown
# Country Name Compliance Guide

## Overview
Brief description of the regulatory landscape

## Key Regulations
- Regulation 1: Description
- Regulation 2: Description

## Compliance Requirements
- KYC thresholds
- Investment limits
- Reporting obligations

## References
- [Official Source](https://...)
```

## 🔌 Adding a KYC Provider

### 1. Create Provider Implementation

Create directory `packages/providers/src/[provider-name]/`:

```typescript
// packages/providers/src/[provider-name]/provider.ts
import { KYCProvider, KYCProviderConfig } from '../types';

export class ProviderNameProvider implements KYCProvider {
  constructor(config: KYCProviderConfig) {
    // Initialize with API credentials
  }
  
  async createVerification(userId: string): Promise<KYCVerification> {
    // Implement verification creation
  }
  
  async getVerificationStatus(verificationId: string): Promise<KYCStatus> {
    // Implement status checking
  }
  
  async getVerificationResult(verificationId: string): Promise<KYCResult> {
    // Implement result retrieval
  }
}
```

### 2. Register Provider

Update `packages/providers/src/factory.ts`:

```typescript
import { ProviderNameProvider } from './provider-name/provider';

export class KYCProviderFactory {
  static create(name: string, config: KYCProviderConfig): KYCProvider {
    switch (name) {
      // ... existing providers
      case 'provider-name':
        return new ProviderNameProvider(config);
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }
}
```

### 3. Add Integration Guide

Create `packages/providers/src/[provider-name]/INTEGRATION.md`:

```markdown
# ProviderName Integration Guide

## Setup
1. Sign up at [provider website]
2. Get API credentials
3. Configure in .env:
   ```
   PROVIDER_NAME_API_KEY=your_key
   PROVIDER_NAME_SECRET=your_secret
   ```

## Usage
```typescript
const provider = KYCProviderFactory.create('provider-name', {
  apiKey: process.env.PROVIDER_NAME_API_KEY,
  apiSecret: process.env.PROVIDER_NAME_SECRET
});
```
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=@shor/sdk

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Writing Tests

Tests should be:
- **Focused**: Test one thing at a time
- **Isolated**: No dependencies on external services
- **Fast**: Mock external calls
- **Descriptive**: Clear test names

Example:
```typescript
describe('ComplianceSpec', () => {
  it('should validate KYC threshold is non-negative', () => {
    const spec = createEmptySpec();
    spec.modules.token_sale.kyc_threshold_usd = -100;
    
    const errors = validateSpec(spec);
    expect(errors).toContain('KYC threshold must be non-negative');
  });
});
```

## 📚 Documentation

### Where to Document

- **Code**: JSDoc comments for all public APIs
- **README**: High-level feature documentation
- **Examples**: Working code examples in `/examples`
- **Guides**: Step-by-step tutorials in `/docs`

### Documentation Style

- Use clear, simple language
- Include code examples
- Explain the "why" not just the "what"
- Keep it up to date with code changes

## 🐛 Reporting Issues

Report issues via:
- **GitHub Issues**: [github.com/shorpay/compliance/issues](https://github.com/shorpay/compliance/issues)
- **Email**: founders@shorpay.com

### Before Submitting

1. **Search** existing issues to avoid duplicates
2. **Try** the latest version
3. **Check** the documentation
4. **Prepare** a minimal reproduction

### Issue Template

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 14.0]
- Node version: [e.g., 18.17.0]
- Package version: [e.g., @shor/sdk@1.0.0]

## Additional Context
Any other relevant information
```

## 🚀 Release Process

We use semantic versioning and automated releases:

1. **Development** happens on feature branches
2. **Pull Requests** are merged to `main`
3. **Releases** are tagged and published automatically
4. **Changelog** is generated from commit messages

## 💬 Community

### Getting Help

- **Discord**: [Join our server](https://discord.gg/shor) (Coming soon)
- **GitHub Discussions**: Ask questions and share ideas
- **Stack Overflow**: Tag questions with `shor-compliance`
- **Email Support**: founders@shorpay.com

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

Key points:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Report unacceptable behavior to founders@shorpay.com

## 🏆 Recognition

We believe in recognizing contributions:

- **Contributors** are listed in the README
- **Significant contributions** are highlighted in release notes
- **Regular contributors** may be invited to join the core team

## 📄 Legal

### Contributor License Agreement

By contributing, you agree that:

1. Your contributions are your original work
2. You grant us a perpetual, worldwide, royalty-free license to use your contributions
3. Your contributions are provided "as-is" without warranties

### License

All contributions are licensed under Apache 2.0. See [LICENSE](./LICENSE) for details.

---

## Quick Contribution Checklist

- [ ] Fork and clone the repository
- [ ] Create a feature branch
- [ ] Make your changes
- [ ] Add/update tests
- [ ] Update documentation
- [ ] Run `npm test` and `npm run lint`
- [ ] Commit with descriptive message
- [ ] Push and create Pull Request
- [ ] Respond to code review feedback

Thank you for contributing to Shor Compliance! Together, we're making blockchain compliance accessible to everyone. 🚀