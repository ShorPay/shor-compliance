/**
 * KYC/AML integration example for the Shor Compliance SDK
 */

import { 
  createShorCompliance, 
  VerificationType,
  VerificationStatus 
} from '@shor/compliance-sdk';

async function main() {
  // Initialize SDK with KYC provider
  const compliance = createShorCompliance({
    kycProvider: {
      name: 'sumsub',
      config: {
        apiKey: process.env.SUMSUB_API_KEY || 'your-api-key',
        secretKey: process.env.SUMSUB_SECRET_KEY || 'your-secret-key',
        environment: 'sandbox'
      }
    }
  });

  // Create a verifier instance
  const verifier = compliance.createVerifier();

  // Example wallet address
  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8b2dc';

  try {
    // Step 1: Create a new verification
    console.log('Creating verification for wallet:', walletAddress);
    const verification = await verifier.createVerification({
      address: walletAddress,
      type: VerificationType.INDIVIDUAL,
      level: 'enhanced',
      metadata: {
        source: 'token_sale',
        investmentAmount: 250000
      }
    });

    console.log('Verification created:', {
      id: verification.verificationId,
      status: verification.status
    });

    // Step 2: Check verification status
    console.log('\nChecking verification status...');
    let status = await verifier.checkStatus(verification.verificationId);
    
    // In a real application, you would poll or use webhooks
    while (status.status === VerificationStatus.IN_PROGRESS) {
      console.log('Verification in progress...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      status = await verifier.checkStatus(verification.verificationId);
    }

    console.log('Verification completed:', {
      status: status.status,
      reviewAnswer: status.reviewAnswer,
      country: status.details?.country
    });

    // Step 3: Generate proof for on-chain verification
    if (status.status === VerificationStatus.COMPLETED && 
        status.reviewAnswer === 'GREEN') {
      console.log('\nGenerating verification proof...');
      const proof = await verifier.generateProof(verification.verificationId);
      
      console.log('Proof generated:', {
        address: proof.address,
        timestamp: new Date(proof.timestamp * 1000).toISOString(),
        reviewAnswer: proof.reviewAnswer,
        signature: proof.signature
      });

      // This proof can now be submitted to the smart contract
      console.log('\nProof ready for on-chain submission');
    } else {
      console.log('\nVerification failed or requires manual review');
    }

  } catch (error) {
    console.error('KYC verification error:', error);
  }
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