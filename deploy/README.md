# Deploying Guardrail Contracts

## Prerequisites

1. Install dependencies:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. Configure your `.env` file:
```env
# Network RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
GOERLI_RPC_URL=https://eth-goerli.alchemyapi.io/v2/YOUR_KEY

# Private key (WITHOUT 0x prefix)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Steps

### 1. Copy Generated Contract
```bash
# Copy the generated contract to contracts folder
mkdir -p contracts
cp build/Guardrail.sol contracts/
```

### 2. Deploy to Testnet (Goerli)
```bash
npx hardhat run deploy/deploy-guardrail.js --network goerli
```

### 3. Deploy to Mainnet
```bash
# CAREFUL! This costs real ETH
npx hardhat run deploy/deploy-guardrail.js --network mainnet
```

## Using Different Deployment Tools

### Option 1: Remix (Easiest for Testing)
1. Go to https://remix.ethereum.org
2. Create new file and paste `Guardrail.sol`
3. Compile with Solidity 0.8.19
4. Deploy using MetaMask

### Option 2: Foundry
```bash
# Install foundry
curl -L https://foundry.paradigm.xyz | bash

# Deploy
forge create --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/Guardrail.sol:Guardrail
```

### Option 3: Using Thirdweb (No-Code)
```bash
npx thirdweb deploy
```

## For Solana Deployment

### Using Anchor
```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet
```

## Integration Example

After deployment, integrate with your token sale frontend:

```javascript
const GUARDRAIL_ADDRESS = "0x..."; // Your deployed address
const guardrail = new ethers.Contract(GUARDRAIL_ADDRESS, GUARDRAIL_ABI, signer);

// Check compliance before accepting investment
async function invest(amount, country) {
  // Check if sale is active
  const isActive = await guardrail.isSaleActive();
  if (!isActive) throw new Error("Sale not active");
  
  // Check country restrictions
  const isBlocked = await guardrail.blockedCountries(country);
  if (isBlocked) throw new Error("Country not allowed");
  
  // Check investment limits
  const minInvestment = await guardrail.minInvestmentUSD();
  if (amount < minInvestment) throw new Error("Below minimum investment");
  
  // Process investment...
}
```

## Multi-Chain Deployment

Deploy the same rules across multiple chains:

```bash
# Ethereum
npx hardhat run deploy/deploy-guardrail.js --network ethereum

# Polygon
npx hardhat run deploy/deploy-guardrail.js --network polygon

# Arbitrum
npx hardhat run deploy/deploy-guardrail.js --network arbitrum

# BSC
npx hardhat run deploy/deploy-guardrail.js --network bsc
```

## Post-Deployment Checklist

- [ ] Verify contract on block explorer
- [ ] Test all compliance functions
- [ ] Set up monitoring for compliance events
- [ ] Document contract address
- [ ] Transfer ownership if needed
- [ ] Set up multisig for admin functions