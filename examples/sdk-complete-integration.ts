/**
 * Complete SDK Integration Example
 * This shows how to use the SDK in a real application
 */

import { 
  ShorCompliance,
  ComplianceSpec,
  VerificationType,
  VerificationStatus,
  KYCProvider
} from '@shor/compliance-sdk';

// Example 1: Basic Compliance Specification
async function createComplianceSpec() {
  const compliance = new ShorCompliance({
    blockchain: 'ethereum',
    environment: 'production'
  });

  // Load a jurisdiction template as base
  const baseSpec = await compliance.loadJurisdiction('us-sec');
  
  // Customize for your needs
  const customSpec: ComplianceSpec = {
    ...baseSpec,
    metadata: {
      ...baseSpec.metadata,
      project_name: 'DeFi Governance Token',
      description: 'Compliance for DGT token sale',
      created_date: new Date().toISOString()
    },
    modules: {
      ...baseSpec.modules,
      token_sale: {
        ...baseSpec.modules.token_sale,
        max_cap_usd: 30000000, // $30M cap
        min_investment_usd: 50000, // $50k minimum
        self_attestation_threshold_usd: 200000, // March 2025 rule
        start_date: '2025-02-01',
        end_date: '2025-03-31'
      }
    }
  };

  return customSpec;
}

// Example 2: Custom KYC Provider Implementation
class CustomKYCProvider extends KYCProvider {
  async createVerification(request: VerificationRequest): Promise<VerificationResult> {
    // Your custom implementation
    console.log('Creating verification for:', request.address);
    
    // Call your KYC API
    const response = await fetch('https://your-kyc-api.com/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: request.address,
        type: request.type,
        level: request.level
      })
    });

    const data = await response.json();
    
    return {
      status: VerificationStatus.IN_PROGRESS,
      verificationId: data.id,
      verifiedAt: new Date(),
      details: {
        country: data.country
      }
    };
  }

  async checkStatus(verificationId: string): Promise<VerificationResult> {
    // Check verification status
    const response = await fetch(`https://your-kyc-api.com/status/${verificationId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    const data = await response.json();
    
    return {
      status: data.status,
      verificationId: verificationId,
      reviewAnswer: data.reviewAnswer,
      verifiedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      details: {
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country
      }
    };
  }

  async generateProof(verificationId: string): Promise<VerificationProof> {
    const status = await this.checkStatus(verificationId);
    
    // Generate cryptographic proof
    const proof = {
      address: status.details?.address || '',
      verificationId: verificationId,
      timestamp: Math.floor(Date.now() / 1000),
      reviewAnswer: status.reviewAnswer || 'RED',
      verificationType: VerificationType.INDIVIDUAL,
      signature: '', // Would implement actual signing
      proofData: {
        verifiedAt: Math.floor(Date.now() / 1000),
        country: status.details?.country
      }
    };

    // Sign the proof with your private key
    proof.signature = await this.signProof(proof);
    
    return proof;
  }

  private async signProof(proof: any): Promise<string> {
    // Implement signing logic
    return '0x' + '0'.repeat(130); // Placeholder
  }

  getName(): string {
    return 'custom-kyc';
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
}

// Example 3: Complete Integration Flow
async function completeIntegrationExample() {
  console.log('=== Shor Compliance SDK Integration ===\n');

  // 1. Initialize SDK with custom provider
  const compliance = new ShorCompliance({
    blockchain: 'arbitrum', // Use L2 for lower costs
    environment: 'production',
    kycProvider: {
      name: 'custom-kyc',
      config: {
        apiKey: process.env.KYC_API_KEY!,
        webhookUrl: 'https://api.yourapp.com/kyc-webhook'
      }
    }
  });

  // Register custom provider
  KYCProviderFactory.register('custom-kyc', CustomKYCProvider);

  // 2. Create compliance specification
  const spec = await createComplianceSpec();
  console.log('Created compliance spec for:', spec.metadata.project_name);

  // 3. Generate contracts and documents
  try {
    const result = await compliance.compile(spec, {
      blockchain: 'arbitrum',
      generatorOptions: {
        withOracle: true,
        oracleAddress: '0x...' // Your oracle address
      }
    });

    console.log('\nGenerated files:');
    Object.entries(result.contracts).forEach(([name, content]) => {
      console.log(`- ${name} (${content.length} bytes)`);
    });
    Object.entries(result.documents).forEach(([name, content]) => {
      console.log(`- ${name} (${content.length} bytes)`);
    });

  } catch (error) {
    console.error('Compilation failed:', error);
  }

  // 4. Verify an investor
  const investor = '0x742d35Cc6634C0532925a3b844Bc9e7595f8b2dc';
  const verifier = compliance.createVerifier();

  console.log('\nVerifying investor:', investor);
  
  const verification = await verifier.createVerification({
    address: investor,
    type: VerificationType.INDIVIDUAL,
    level: 'enhanced',
    metadata: {
      investmentAmount: 250000,
      source: 'website'
    }
  });

  console.log('Verification initiated:', verification.verificationId);

  // 5. Generate proof for smart contract
  if (verification.status === VerificationStatus.COMPLETED) {
    const proof = await verifier.generateProof(verification.verificationId);
    console.log('\nProof generated for on-chain submission:');
    console.log('- Address:', proof.address);
    console.log('- Review:', proof.reviewAnswer);
    console.log('- Signature:', proof.signature.substring(0, 10) + '...');
  }
}

// Example 4: Validation and Error Handling
async function validationExample() {
  const compliance = new ShorCompliance();

  // Create a spec with intentional issues
  const invalidSpec: ComplianceSpec = {
    version: '1.0',
    metadata: {
      jurisdiction: 'United States'
    },
    modules: {
      token_sale: {
        min_investment_usd: 100000,
        max_cap_usd: 50000, // Invalid: min > max
        blocklist: ['US'],
        whitelist: ['US'], // Invalid: country in both lists
        start_date: '2025-12-31',
        end_date: '2025-01-01' // Invalid: end before start
      }
    }
  };

  try {
    await compliance.compile(invalidSpec);
  } catch (error) {
    console.error('Validation failed:', error.message);
    // Output: "Invalid compliance specification: Minimum investment cannot exceed maximum cap, Countries cannot be in both whitelist and blocklist: US, Start date must be before end date"
  }
}

// Example 5: Multi-Jurisdiction Support
async function multiJurisdictionExample() {
  const compliance = new ShorCompliance();

  // List available jurisdictions
  const jurisdictions = await compliance.listJurisdictions();
  console.log('Available jurisdictions:', jurisdictions);

  // Generate for multiple jurisdictions
  for (const jurisdiction of ['us-sec', 'eu-mica', 'singapore-mas']) {
    const spec = await compliance.loadJurisdiction(jurisdiction);
    
    console.log(`\n${jurisdiction.toUpperCase()} Requirements:`);
    console.log('- KYC Required:', spec.modules.token_sale?.kyc_threshold_usd === 0 ? 'Always' : `Above $${spec.modules.token_sale?.kyc_threshold_usd}`);
    console.log('- Accredited Only:', spec.modules.token_sale?.accredited_only || false);
    console.log('- Max Cap:', spec.modules.token_sale?.max_cap_usd ? `$${spec.modules.token_sale.max_cap_usd.toLocaleString()}` : 'No limit');
  }
}

// Run examples
async function main() {
  console.log('SDK Complete Integration Examples\n');
  
  // Run the complete flow
  await completeIntegrationExample();
  
  // Show validation
  console.log('\n=== Validation Example ===');
  await validationExample();
  
  // Show multi-jurisdiction
  console.log('\n=== Multi-Jurisdiction Example ===');
  await multiJurisdictionExample();
}

// Exports for use in other files
export {
  createComplianceSpec,
  CustomKYCProvider,
  completeIntegrationExample
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}