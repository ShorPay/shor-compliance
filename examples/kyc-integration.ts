/**
 * KYC/AML integration example for the Shor Compliance SDK
 * 
 * NOTE: This example demonstrates the intended API. The actual implementation
 * requires integration with the Shor API service for KYC provider coordination.
 */

import { 
  ShorCompliance,
  VerificationType,
  VerificationStatus 
} from '@shor/compliance-sdk';

async function main() {
  // Initialize SDK with configuration
  const compliance = new ShorCompliance({
    blockchain: 'ethereum',
    environment: 'production'
  });

  // Example: Using the SDK to integrate KYC into your application
  // In a real implementation, you would:
  
  // 1. Configure your KYC provider through the Shor API
  console.log('Step 1: Configure KYC provider via Shor Dashboard');
  console.log('Visit: https://dashboard.shor.xyz/kyc-providers');
  
  // 2. Initialize verification through your backend
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8b2dc';
  console.log('\nStep 2: Initialize verification for wallet:', walletAddress);
  
  // Example API call (implement in your backend):
  /*
  const response = await fetch('https://api.shor.xyz/v1/verifications', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SHOR_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      address: walletAddress,
      type: VerificationType.INDIVIDUAL,
      level: 'enhanced',
      metadata: {
        source: 'token_sale',
        investmentAmount: 250000
      }
    })
  });
  */
  
  // 3. Generate proof for on-chain verification
  console.log('\nStep 3: Generate proof for smart contract');
  
  // Example proof structure that would be returned:
  const exampleProof = {
    address: walletAddress,
    verificationId: 'ver_123456',
    timestamp: Math.floor(Date.now() / 1000),
    reviewAnswer: 'GREEN' as const,
    verificationType: VerificationType.INDIVIDUAL,
    signature: '0x...',
    proofData: {
      verifiedAt: Math.floor(Date.now() / 1000),
      country: 'US',
      riskScore: 10
    }
  };
  
  console.log('Example proof structure:', exampleProof);
  
  // 4. Submit proof to smart contract
  console.log('\nStep 4: Submit proof to GuardrailWithVerification contract');
  console.log('Use the updateVerification() function with oracle signature');
}

// Alternative: Direct provider integration (if using Sumsub directly)
async function directProviderExample() {
  console.log('\n=== Direct Provider Integration ===');
  console.log('For direct integration without Shor API:');
  
  // This would require implementing the provider interfaces
  console.log('1. Implement KYCProvider interface');
  console.log('2. Register with KYCProviderFactory');
  console.log('3. Use provider directly in your application');
  
  // Example of what the integration would look like:
  /*
  import { KYCProviderFactory, SumsubProvider } from '@shor/compliance-sdk';
  
  // Register provider
  KYCProviderFactory.register('sumsub', SumsubProvider);
  
  // Create provider instance
  const provider = KYCProviderFactory.create('sumsub', {
    apiKey: process.env.SUMSUB_API_KEY,
    secretKey: process.env.SUMSUB_SECRET_KEY
  });
  
  // Use provider
  const result = await provider.createVerification({
    address: walletAddress,
    type: VerificationType.INDIVIDUAL
  });
  */
}

// Usage instructions
console.log('KYC Integration Example');
console.log('=======================');
console.log('Set environment variables:');
console.log('  export SUMSUB_API_KEY=your-api-key');
console.log('  export SUMSUB_SECRET_KEY=your-secret-key');
console.log('');

// Run the example
main().catch(console.error);