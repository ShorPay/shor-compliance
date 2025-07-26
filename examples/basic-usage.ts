/**
 * Basic usage example for the Shor Compliance SDK
 */

import { createShorCompliance, ComplianceSpec } from '@shor/compliance-sdk';

async function main() {
  // Initialize the SDK
  const compliance = createShorCompliance({
    jurisdiction: 'us-sec',
    blockchain: 'ethereum',
    environment: 'production'
  });

  // Create a custom compliance specification
  const spec: ComplianceSpec = {
    version: '1.0',
    metadata: {
      project_name: 'My DeFi Token',
      description: 'Compliance for our DeFi token sale',
      jurisdiction: 'United States',
      regulation_framework: 'SEC Securities Act',
      created_date: new Date().toISOString().split('T')[0]
    },
    modules: {
      token_sale: {
        accredited_only: true,
        kyc_threshold_usd: 0,
        aml_required: true,
        max_cap_usd: 50000000,
        min_investment_usd: 100000,
        self_attestation_threshold_usd: 200000,
        blocklist: [],
        whitelist: ['US'],
        lockup_days: 365,
        required_disclosures: [
          'risk_factors',
          'use_of_proceeds',
          'management_team',
          'financial_statements'
        ]
      },
      investor_verification: {
        accredited_verification_required: true,
        acceptable_verification_methods: [
          'income_verification',
          'net_worth_verification',
          'self_attestation_with_minimum'
        ],
        bad_actor_check_required: true
      },
      securities_exemptions: {
        primary_exemption: 'Regulation D 506(c)',
        alternative_exemptions: ['regulation_s']
      },
      reporting_requirements: {
        form_d_filing: true,
        form_d_deadline_days: 15,
        ongoing_reporting: false
      }
    }
  };

  try {
    // Compile the specification
    console.log('Compiling compliance specification...');
    const result = await compliance.compile(spec, {
      blockchain: 'ethereum',
      generatorOptions: {
        withOracle: true
      }
    });

    console.log('\nCompilation successful!');
    console.log(`Generated ${Object.keys(result.contracts).length} contracts`);
    console.log(`Generated ${Object.keys(result.documents).length} documents`);
    
    // Display generated files
    console.log('\nGenerated files:');
    Object.keys(result.contracts).forEach(file => {
      console.log(`  - contracts/${file}`);
    });
    Object.keys(result.documents).forEach(file => {
      console.log(`  - documents/${file}`);
    });

  } catch (error) {
    console.error('Compilation failed:', error);
  }
}

// Run the example
main().catch(console.error);