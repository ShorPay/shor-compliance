# Oracle Architecture for KYC Verification

## Overview

The oracle pattern ensures only trusted sources can update KYC verification status on-chain. Here's how it works:

## Complete Verification Flow

### Step 1: User Requests Verification
```typescript
// In your app
const verification = await sumsubProvider.initVerification({
  address: userWalletAddress,
  verificationType: 'INDIVIDUAL'
});

// Send user to Sumsub
window.location.href = verification.verificationUrl;
```

### Step 2: User Completes KYC on Sumsub
- User uploads documents
- Completes liveness check
- Sumsub processes verification

### Step 3: Oracle Service Monitors Status
```typescript
// Oracle service (runs on your backend)
class KYCOracle {
  private provider: SumsubProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    // Initialize with your oracle's private key
    this.wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY);
    
    // Connect to the smart contract
    this.contract = new ethers.Contract(
      GUARDRAIL_ADDRESS,
      GuardrailABI,
      this.wallet
    );
    
    // Initialize Sumsub provider
    this.provider = new SumsubProvider({
      appToken: process.env.SUMSUB_APP_TOKEN,
      secretKey: process.env.SUMSUB_SECRET_KEY
    });
  }

  async updateVerification(userAddress: string) {
    // 1. Check verification status with Sumsub
    const status = await this.provider.getVerificationStatus(userAddress);
    
    // 2. Only update if verification is complete
    if (status.status !== 'PENDING' && status.status !== 'IN_PROGRESS') {
      // 3. Get review answer from provider data
      const reviewAnswer = status.providerData?.review?.reviewResult?.reviewAnswer || 
                          (status.status === 'APPROVED' ? 'GREEN' : 
                           status.status === 'REJECTED' ? 'RED' : 'PENDING');
      
      // 4. Call smart contract (only oracle can do this)
      const tx = await this.contract.updateVerification(
        userAddress,
        status.status === 'APPROVED',     // boolean: verified or not
        status.verificationType,           // 'INDIVIDUAL' or 'BUSINESS'
        reviewAnswer                       // 'GREEN', 'RED', or 'YELLOW'
      );
      
      await tx.wait();
      console.log(`Updated ${userAddress} verification to ${status.status} (${reviewAnswer})`);
    }
  }
}
```

### Step 4: Smart Contract Stores Verification
```solidity
// In the smart contract
mapping(address => Verification) public verifications;

function updateVerification(
    address user,
    bool verified,
    string memory verificationId,
    uint256 timestamp,
    string memory verificationType,
    string memory reviewAnswer
) external onlyOracle {  // Only oracle can call this
    verifications[user] = Verification({
        isVerified: verified,
        verificationId: verificationId,
        timestamp: timestamp,
        verificationType: verificationType,
        reviewAnswer: reviewAnswer
    });
    
    emit VerificationUpdated(user, verified, reviewAnswer);
}
```

### Step 5: Smart Contract Enforces Compliance
```solidity
function contribute() external payable {
    require(verifications[msg.sender].isVerified, "KYC verification required");
    // Process contribution...
}
```

## Security Model

### Why This Is Secure:

1. **Oracle Authentication**
   - Only the oracle address can call `updateVerification`
   - Enforced by `onlyOracle` modifier
   - Oracle address is set at deployment and can only be changed by owner

2. **No API Keys On-Chain**
   - Sumsub API keys stay on your backend
   - Smart contract never sees them
   - Oracle acts as trusted bridge

3. **Transaction Security**
   - Oracle signs transactions with its private key
   - Ethereum network verifies the signature
   - No one else can impersonate the oracle

## Running the Oracle

### Option 1: Webhook-based (Recommended)
```typescript
// Set up webhook endpoint
app.post('/sumsub-webhook', async (req, res) => {
  // Verify webhook signature
  if (!sumsubProvider.validateWebhook(req.body, req.headers['x-signature'])) {
    return res.status(401).send('Invalid signature');
  }
  
  // Update verification when Sumsub notifies us
  const { externalUserId, reviewResult } = req.body;
  await oracle.updateVerification(externalUserId);
  
  res.status(200).send('OK');
});
```

### Option 2: Polling-based
```typescript
// Poll for updates every 5 minutes
setInterval(async () => {
  const pendingUsers = await getPendingVerifications();
  
  for (const user of pendingUsers) {
    await oracle.updateVerification(user.address);
  }
}, 5 * 60 * 1000);
```

### Option 3: On-demand
```typescript
// User triggers check
app.post('/check-verification', async (req, res) => {
  const { address } = req.body;
  await oracle.updateVerification(address);
  res.json({ status: 'checked' });
});
```

## Environment Variables

```bash
# Oracle configuration
ORACLE_PRIVATE_KEY=your_oracle_private_key  # Controls the oracle address
GUARDRAIL_CONTRACT_ADDRESS=0x...            # Your deployed contract

# Sumsub configuration
SUMSUB_APP_TOKEN=your_app_token
SUMSUB_SECRET_KEY=your_secret_key

# Optional webhook secret
SUMSUB_WEBHOOK_SECRET=your_webhook_secret
```

## Alternative: Decentralized Oracle

For production, consider using Chainlink or a similar decentralized oracle network:

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract GuardrailWithChainlink {
    // Multiple oracle nodes for decentralization
    mapping(address => bool) public oracles;
    mapping(address => mapping(address => bool)) public oracleVotes;
    
    function addOracle(address oracle) external onlyOwner {
        oracles[oracle] = true;
    }
    
    function updateVerification(address user, bool verified) external {
        require(oracles[msg.sender], "Not an authorized oracle");
        oracleVotes[user][msg.sender] = verified;
        
        // Require 2 out of 3 oracles to agree
        uint votes = 0;
        // Count votes...
        
        if (votes >= 2) {
            verifications[user].isVerified = verified;
        }
    }
}
```

## Summary

The oracle pattern provides:
- **Security**: Only trusted sources can update verifications
- **Privacy**: KYC data stays off-chain
- **Flexibility**: Can use webhooks, polling, or on-demand updates
- **Scalability**: Can upgrade to decentralized oracles later

The smart contract trusts the oracle address, not API signatures. This keeps the on-chain logic simple while maintaining security through Ethereum's built-in authentication.