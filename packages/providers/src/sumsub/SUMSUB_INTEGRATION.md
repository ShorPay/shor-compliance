# Sumsub KYC/AML Integration

Direct integration with Sumsub for identity verification, enabling on-chain compliance with KYC/AML requirements.

## Architecture

```
User → CLI/SDK → Sumsub API (Direct)
         ↓
    Smart Contract
    (via Oracle)
```

## Setup

### 1. Get Sumsub Credentials

Sign up at https://sumsub.com and obtain:
- App Token
- Secret Key  
- Webhook Secret (optional)

### 2. Configure Provider

Using CLI:
```bash
shor verify configure --provider sumsub
```

Or using SDK:
```typescript
const compliance = createShorCompliance({
  kycProvider: {
    name: 'sumsub',
    config: {
      appToken: 'YOUR_APP_TOKEN',
      secretKey: 'YOUR_SECRET_KEY',
      baseURL: 'https://api.sumsub.com'
    }
  }
});
```

Or via environment variables:
```bash
SUMSUB_APP_TOKEN=your_app_token
SUMSUB_SECRET_KEY=your_secret_key
SUMSUB_BASE_URL=https://api.sumsub.com
```

## Direct API Usage

### Initialize Verification

```typescript
import { SumsubProvider } from '@shor/providers';

const provider = new SumsubProvider({
  appToken: process.env.SUMSUB_APP_TOKEN,
  secretKey: process.env.SUMSUB_SECRET_KEY,
  baseURL: 'https://api.sumsub.com'
});

// Create applicant
const result = await provider.createApplicant({
  externalUserId: userAddress,
  levelName: 'basic-kyc'
});

// Get verification URL
const verificationUrl = await provider.getVerificationUrl(result.applicantId);
```

### Check Status

```typescript
const status = await provider.getApplicantStatus(applicantId);
console.log('Verification status:', status);
```

## Smart Contract Integration

### Generate Contract with Oracle Support

```bash
shor compile --with-oracle
```

This generates a contract that includes:
- Oracle integration for verification updates
- Verification status checks  
- KYC threshold enforcement

### Contract Features

```solidity
// Check if user is verified
function isVerified(address user) public view returns (bool)

// Only verified users can participate
modifier onlyVerified()

// Oracle updates verification status
function updateVerification(address user, bool verified, uint256 riskScore)
```

## Verification Flow

1. **User Requests Participation**
   - User wants to participate in token sale

2. **Initialize Verification**
   ```typescript
   const url = await provider.createVerificationSession(userAddress);
   ```

3. **User Completes Verification**
   - User visits the provided URL
   - Completes Sumsub KYC process

4. **Check Status** 
   ```typescript
   const status = await provider.getVerificationStatus(userAddress);
   ```

5. **Update Contract** (if using oracle)
   - Oracle monitors verification status
   - Updates on-chain state

## Security Considerations

- **Direct Integration**: No middleman servers
- **API Keys**: Store securely, never commit to code
- **HMAC Verification**: Validate all webhooks
- **User Privacy**: Data flows directly to Sumsub

## Compliance Features

- **KYC Thresholds**: Require verification above certain amounts
- **Geographic Restrictions**: Block users from sanctioned countries  
- **AML Screening**: Automated sanctions and PEP checks
- **Risk Scoring**: Configurable risk thresholds

## Provider Comparison

| Feature | Sumsub | Future Providers |
|---------|--------|------------------|
| KYC | ✓ | ✓ |
| AML | ✓ | ✓ |
| Document Verification | ✓ | ✓ |
| Liveness Check | ✓ | ✓ |
| Blockchain Analytics | Limited | Chainalysis, Elliptic |
| Travel Rule | ✗ | Notabene |

## Example: Complete Integration

```typescript
// 1. Initialize provider
const kycProvider = new SumsubProvider(config);

// 2. Create verification
const session = await kycProvider.createVerificationSession(address);

// 3. User completes KYC
console.log('Send user to:', session.url);

// 4. Check status
const status = await kycProvider.getVerificationStatus(address);

// 5. Use in smart contract
if (status === VerificationStatus.APPROVED) {
  // Allow participation
}
```