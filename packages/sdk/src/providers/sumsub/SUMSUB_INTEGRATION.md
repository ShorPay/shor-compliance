# Sumsub KYC/AML Integration

Shor Compliance now integrates with Sumsub for real-world identity verification, enabling on-chain compliance with KYC/AML requirements.

## Architecture

```
User → Shor CLI → Shor Backend → Sumsub API
                       ↓
                  Webhook Endpoint
                       ↓
                  Smart Contract Updates (via Oracle)
```

## Setup

### 1. Configure API Key

```bash
shor config set-api-key YOUR_API_KEY
```

### 2. Verify Configuration

```bash
shor config show
```

## Verification Commands

### Initialize Verification

Start a new KYC/AML verification for an address:

```bash
shor verify init --address 0x123... --type individual
```

Options:
- `--address` (required): Ethereum or Solana address
- `--type`: `individual` or `business` (default: individual)
- `--level`: Verification level (default: basic-kyc)

This returns a verification URL to share with the user.

### Check Status

Check verification status for an address:

```bash
shor verify status --address 0x123...
```

### List Verifications

List all verifications, optionally filtered by contract:

```bash
shor verify list
shor verify list --contract 0xABC...
```

### Get Verification Proof

Get cryptographic proof for on-chain verification:

```bash
shor verify proof --address 0x123...
```

## Smart Contract Integration

### Generate Contract with Oracle Support

```bash
shor compile --with-oracle
```

This generates a `GuardrailWithVerification.sol` contract that includes:
- Oracle integration for verification updates
- Verification status checks
- KYC threshold enforcement

### Contract Features

The enhanced contract includes:

```solidity
// Check if user is verified
function isVerified(address user) public view returns (bool)

// Only verified users can participate
modifier onlyVerified()

// Oracle updates verification status
function updateVerification(address user, bool verified, ...)
```

### Deployment

When deploying the contract, provide the Shor oracle address:

```solidity
GuardrailWithVerification contract = new GuardrailWithVerification(SHOR_ORACLE_ADDRESS);
```

## Verification Flow

1. **User Requests Participation**
   - User wants to participate in token sale or other regulated activity

2. **Initialize Verification**
   ```bash
   shor verify init --address 0x123...
   ```

3. **User Completes Verification**
   - User visits the provided URL
   - Completes Sumsub KYC/AML process

4. **Webhook Updates Backend**
   - Sumsub sends webhook to Shor backend
   - Backend validates and processes result

5. **Oracle Updates Contract**
   - Shor oracle updates on-chain verification status
   - Contract enforces compliance rules

## Environment Variables

Optional configuration via environment:

```bash
SHOR_API_URL=https://api.shor.xyz
SHOR_API_KEY=your_api_key
```

## Security Considerations

- API keys are stored locally in `~/.shor/config.json`
- Oracle addresses are controlled by Shor for security
- Verification proofs are cryptographically signed
- All webhook payloads are HMAC verified

## Compliance Features

The integration enables:
- **KYC Thresholds**: Require verification above certain amounts
- **Geographic Restrictions**: Block users from sanctioned countries
- **AML Screening**: Automated sanctions and PEP checks
- **Audit Trail**: On-chain record of all verifications