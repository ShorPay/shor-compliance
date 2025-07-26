/**
 * Web3 Integration Example
 * Shows how to integrate the SDK with your DApp
 */

import { ethers } from 'ethers';
import { 
  ShorCompliance,
  ComplianceSpec,
  VerificationProof 
} from '@shor/compliance-sdk';

// Example 1: Frontend Integration with MetaMask
async function frontendIntegration() {
  // Initialize provider and signer
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  
  console.log('Connected wallet:', address);
  
  // Initialize Shor SDK
  const compliance = new ShorCompliance({
    blockchain: 'ethereum',
    environment: 'production'
  });
  
  // Check if user is verified
  const isVerified = await checkVerificationStatus(address);
  
  if (!isVerified) {
    // Redirect to KYC flow
    console.log('User needs KYC verification');
    window.location.href = `/kyc?address=${address}`;
    return;
  }
  
  // Get verification proof for on-chain submission
  const proof = await getVerificationProof(address);
  
  // Interact with smart contract
  const guardrailAddress = '0x...'; // Your deployed Guardrail contract
  const guardrailABI = [
    'function validateContribution(address contributor, uint256 amountUSD, string countryCode, bool hasKYC) view returns (bool, string)',
    'function recordContribution(address contributor, uint256 amountUSD, string countryCode, bool hasKYC)',
    'function updateVerification(address user, bool isVerified, string verificationType, string reviewAnswer)'
  ];
  
  const guardrail = new ethers.Contract(guardrailAddress, guardrailABI, signer);
  
  // Validate contribution
  const amountUSD = 100000; // $100k
  const [isValid, reason] = await guardrail.validateContribution(
    address,
    amountUSD,
    proof.proofData.country || 'US',
    true
  );
  
  if (!isValid) {
    console.error('Contribution not allowed:', reason);
    return;
  }
  
  // Make contribution
  const tx = await guardrail.recordContribution(
    address,
    amountUSD,
    proof.proofData.country || 'US',
    true
  );
  
  console.log('Transaction submitted:', tx.hash);
  await tx.wait();
  console.log('Contribution recorded!');
}

// Example 2: Backend Integration for Batch Updates
async function backendBatchUpdate() {
  // Initialize provider with backend wallet
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
  
  // Contract setup
  const guardrailAddress = process.env.GUARDRAIL_ADDRESS!;
  const guardrailABI = [
    'function updateVerification(address user, bool isVerified, string verificationType, string reviewAnswer)',
    'function batchUpdateVerifications(address[] users, bool[] verified, string[] types, string[] answers)'
  ];
  
  const guardrail = new ethers.Contract(guardrailAddress, guardrailABI, wallet);
  
  // Get pending verifications from database
  const pendingVerifications = await getPendingVerifications();
  
  // Prepare batch update
  const users: string[] = [];
  const verified: boolean[] = [];
  const types: string[] = [];
  const answers: string[] = [];
  
  for (const verification of pendingVerifications) {
    users.push(verification.address);
    verified.push(verification.status === 'completed');
    types.push(verification.type);
    answers.push(verification.reviewAnswer || 'RED');
  }
  
  // Execute batch update
  console.log(`Updating ${users.length} verifications...`);
  
  const tx = await guardrail.batchUpdateVerifications(
    users,
    verified,
    types,
    answers,
    {
      gasLimit: 500000 + (users.length * 50000) // Dynamic gas limit
    }
  );
  
  console.log('Batch update tx:', tx.hash);
  const receipt = await tx.wait();
  console.log('Gas used:', receipt.gasUsed.toString());
  
  // Mark as processed in database
  await markVerificationsProcessed(pendingVerifications);
}

// Example 3: Smart Contract Event Monitoring
async function monitorComplianceEvents() {
  const provider = new ethers.WebSocketProvider(process.env.WSS_URL!);
  
  const guardrailAddress = process.env.GUARDRAIL_ADDRESS!;
  const guardrailABI = [
    'event ContributionReceived(address indexed contributor, uint256 amountUSD)',
    'event ComplianceCheckFailed(address indexed contributor, string reason)',
    'event VerificationUpdated(address indexed user, bool verified, string reviewAnswer)'
  ];
  
  const guardrail = new ethers.Contract(guardrailAddress, guardrailABI, provider);
  
  // Monitor contribution events
  guardrail.on('ContributionReceived', (contributor, amountUSD) => {
    console.log(`New contribution: ${ethers.formatEther(amountUSD)} from ${contributor}`);
    
    // Update analytics
    updateAnalytics({
      event: 'contribution',
      address: contributor,
      amount: amountUSD.toString(),
      timestamp: Date.now()
    });
  });
  
  // Monitor compliance failures
  guardrail.on('ComplianceCheckFailed', (contributor, reason) => {
    console.warn(`Compliance check failed for ${contributor}: ${reason}`);
    
    // Alert compliance team
    sendComplianceAlert({
      address: contributor,
      reason: reason,
      timestamp: Date.now()
    });
  });
  
  // Monitor verification updates
  guardrail.on('VerificationUpdated', (user, verified, reviewAnswer) => {
    console.log(`Verification updated for ${user}: ${verified ? 'Verified' : 'Not Verified'} (${reviewAnswer})`);
    
    // Update local cache
    updateVerificationCache(user, { verified, reviewAnswer });
  });
  
  console.log('Monitoring compliance events...');
}

// Example 4: Gas-Optimized Contribution Flow
async function optimizedContributionFlow(
  userAddress: string,
  amountUSD: number
) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  // 1. Pre-validate off-chain
  const compliance = new ShorCompliance();
  const spec = await compliance.loadJurisdiction('us-sec');
  
  const validationErrors: string[] = [];
  
  // Check investment limits
  if (spec.modules.token_sale?.min_investment_usd && 
      amountUSD < spec.modules.token_sale.min_investment_usd) {
    validationErrors.push(`Minimum investment is $${spec.modules.token_sale.min_investment_usd}`);
  }
  
  // Check if accredited investor required
  if (spec.modules.token_sale?.accredited_only) {
    const isAccredited = await checkAccreditationStatus(userAddress);
    if (!isAccredited) {
      validationErrors.push('Must be an accredited investor');
    }
  }
  
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }
  
  // 2. Generate proof with minimal data
  const proof = await generateMinimalProof(userAddress);
  
  // 3. Estimate gas before sending
  const guardrail = new ethers.Contract(guardrailAddress, guardrailABI, provider);
  
  const estimatedGas = await guardrail.recordContribution.estimateGas(
    userAddress,
    amountUSD,
    proof.country,
    proof.verified
  );
  
  console.log('Estimated gas:', estimatedGas.toString());
  
  // 4. Use gas-efficient parameters
  const feeData = await provider.getFeeData();
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseGwei('2');
  const maxFeePerGas = feeData.maxFeePerGas || ethers.parseGwei('50');
  
  // 5. Submit transaction
  const signer = provider.getSigner(userAddress);
  const tx = await guardrail.connect(signer).recordContribution(
    userAddress,
    amountUSD,
    proof.country,
    proof.verified,
    {
      gasLimit: estimatedGas * 110n / 100n, // 10% buffer
      maxPriorityFeePerGas,
      maxFeePerGas
    }
  );
  
  return tx;
}

// Helper functions (implement based on your backend)
async function checkVerificationStatus(address: string): Promise<boolean> {
  // Call your backend API
  const response = await fetch(`/api/verification/status/${address}`);
  const data = await response.json();
  return data.verified;
}

async function getVerificationProof(address: string): Promise<VerificationProof> {
  // Call your backend API
  const response = await fetch(`/api/verification/proof/${address}`);
  return response.json();
}

async function getPendingVerifications(): Promise<any[]> {
  // Query your database
  return [];
}

async function markVerificationsProcessed(verifications: any[]): Promise<void> {
  // Update your database
}

async function updateAnalytics(data: any): Promise<void> {
  // Send to analytics service
}

async function sendComplianceAlert(alert: any): Promise<void> {
  // Send to compliance team
}

async function updateVerificationCache(user: string, data: any): Promise<void> {
  // Update cache
}

async function checkAccreditationStatus(address: string): Promise<boolean> {
  // Check accreditation
  return true;
}

async function generateMinimalProof(address: string): Promise<any> {
  // Generate proof
  return {
    country: 'US',
    verified: true
  };
}

// Contract addresses and ABIs
const guardrailAddress = '0x...';
const guardrailABI = [];

// Export functions
export {
  frontendIntegration,
  backendBatchUpdate,
  monitorComplianceEvents,
  optimizedContributionFlow
};

// Declare window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum: any;
  }
}