/**
 * Testing Compliance Rules Example
 * Shows how to test your compliance configuration
 */

import {
  ShorCompliance,
  ComplianceSpec,
  validateComplianceSpec,
  ValidationResult
} from '@shor/compliance-sdk';

// Example 1: Unit Testing Compliance Rules
describe('Compliance Rules Tests', () => {
  let compliance: ShorCompliance;
  let spec: ComplianceSpec;
  
  beforeEach(async () => {
    compliance = new ShorCompliance({
      blockchain: 'ethereum',
      environment: 'development'
    });
    
    spec = await compliance.loadJurisdiction('us-sec');
  });
  
  test('should enforce minimum investment', () => {
    const minInvestment = spec.modules.token_sale?.min_investment_usd || 0;
    
    // Test below minimum
    expect(() => {
      validateInvestment(10000, minInvestment);
    }).toThrow('Investment below minimum');
    
    // Test at minimum
    expect(() => {
      validateInvestment(minInvestment, minInvestment);
    }).not.toThrow();
  });
  
  test('should enforce maximum cap', () => {
    const maxCap = spec.modules.token_sale?.max_cap_usd || Infinity;
    const currentRaised = 40000000; // $40M already raised
    
    // Test exceeding cap
    expect(() => {
      validateCap(15000000, currentRaised, maxCap);
    }).toThrow('Exceeds sale cap');
    
    // Test within cap
    expect(() => {
      validateCap(5000000, currentRaised, maxCap);
    }).not.toThrow();
  });
  
  test('should enforce geographic restrictions', () => {
    const blocklist = spec.modules.token_sale?.blocklist || [];
    
    // Test blocked country
    if (blocklist.includes('KP')) {
      expect(() => {
        validateCountry('KP', blocklist);
      }).toThrow('Country blocked');
    }
    
    // Test allowed country
    expect(() => {
      validateCountry('US', blocklist);
    }).not.toThrow();
  });
  
  test('should validate date ranges', () => {
    const startDate = '2025-01-01';
    const endDate = '2025-12-31';
    
    // Test before start
    expect(() => {
      validateDateRange('2024-12-31', startDate, endDate);
    }).toThrow('Sale not started');
    
    // Test after end
    expect(() => {
      validateDateRange('2026-01-01', startDate, endDate);
    }).toThrow('Sale ended');
    
    // Test within range
    expect(() => {
      validateDateRange('2025-06-15', startDate, endDate);
    }).not.toThrow();
  });
});

// Example 2: Integration Testing with Mock Contracts
import { ethers } from 'ethers';
import { MockProvider, deployMockContract } from 'ethereum-waffle';

describe('Guardrail Contract Integration', () => {
  let provider: MockProvider;
  let guardrail: ethers.Contract;
  let owner: ethers.Signer;
  let contributor: ethers.Signer;
  
  beforeEach(async () => {
    provider = new MockProvider();
    [owner, contributor] = provider.getWallets();
    
    // Deploy mock Guardrail contract
    const GuardrailArtifact = {
      abi: [
        'function validateContribution(address, uint256, string, bool) view returns (bool, string)',
        'function recordContribution(address, uint256, string, bool)',
        'function updateVerification(address, bool, string, string)'
      ],
      bytecode: '0x...' // Your compiled bytecode
    };
    
    guardrail = await deployMockContract(owner, GuardrailArtifact.abi);
  });
  
  test('should validate contribution correctly', async () => {
    const contributorAddress = await contributor.getAddress();
    
    // Mock the validation response
    await guardrail.mock.validateContribution
      .withArgs(contributorAddress, 100000, 'US', true)
      .returns(true, '');
    
    const [isValid, reason] = await guardrail.validateContribution(
      contributorAddress,
      100000,
      'US',
      true
    );
    
    expect(isValid).toBe(true);
    expect(reason).toBe('');
  });
  
  test('should reject blocked countries', async () => {
    const contributorAddress = await contributor.getAddress();
    
    // Mock rejection for blocked country
    await guardrail.mock.validateContribution
      .withArgs(contributorAddress, 100000, 'KP', true)
      .returns(false, 'Country blocked');
    
    const [isValid, reason] = await guardrail.validateContribution(
      contributorAddress,
      100000,
      'KP',
      true
    );
    
    expect(isValid).toBe(false);
    expect(reason).toBe('Country blocked');
  });
});

// Example 3: Compliance Scenario Testing
class ComplianceScenarioTester {
  private compliance: ShorCompliance;
  private scenarios: Map<string, () => Promise<void>>;
  
  constructor(compliance: ShorCompliance) {
    this.compliance = compliance;
    this.scenarios = new Map();
  }
  
  addScenario(name: string, test: () => Promise<void>): void {
    this.scenarios.set(name, test);
  }
  
  async runAll(): Promise<{ passed: string[]; failed: string[] }> {
    const passed: string[] = [];
    const failed: string[] = [];
    
    for (const [name, test] of this.scenarios) {
      try {
        await test();
        passed.push(name);
        console.log(`✅ ${name}`);
      } catch (error) {
        failed.push(name);
        console.error(`❌ ${name}: ${error.message}`);
      }
    }
    
    return { passed, failed };
  }
}

// Example 4: Compliance Test Suite
async function runComplianceTestSuite() {
  const compliance = new ShorCompliance();
  const tester = new ComplianceScenarioTester(compliance);
  
  // Load specifications
  const usSpec = await compliance.loadJurisdiction('us-sec');
  const euSpec = await compliance.loadJurisdiction('eu-mica');
  const sgSpec = await compliance.loadJurisdiction('singapore-mas');
  
  // Test US compliance
  tester.addScenario('US: Accredited investor requirement', async () => {
    if (!usSpec.modules.token_sale?.accredited_only) {
      throw new Error('US spec should require accredited investors');
    }
  });
  
  tester.addScenario('US: Minimum investment for self-attestation', async () => {
    const threshold = usSpec.modules.token_sale?.self_attestation_threshold_usd;
    if (!threshold || threshold !== 200000) {
      throw new Error('US spec should have $200k self-attestation threshold');
    }
  });
  
  // Test EU compliance
  tester.addScenario('EU: Whitepaper requirement', async () => {
    if (!euSpec.modules.whitepaper_requirements) {
      throw new Error('EU spec should have whitepaper requirements');
    }
  });
  
  tester.addScenario('EU: Cooling-off period', async () => {
    const coolingOff = euSpec.modules.token_sale?.cooling_off_days;
    if (!coolingOff || coolingOff !== 14) {
      throw new Error('EU spec should have 14-day cooling-off period');
    }
  });
  
  // Test Singapore compliance
  tester.addScenario('SG: DPT license requirement', async () => {
    const licenseType = sgSpec.modules.licensing_requirements?.license_type;
    if (!licenseType || !licenseType.includes('Payment')) {
      throw new Error('SG spec should require payment institution license');
    }
  });
  
  // Run all tests
  const results = await tester.runAll();
  
  console.log('\n=== Compliance Test Results ===');
  console.log(`Passed: ${results.passed.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.error('\nFailed tests:', results.failed);
    process.exit(1);
  }
}

// Example 5: Validation Testing
function testValidationRules() {
  const spec: ComplianceSpec = {
    version: '1.0',
    metadata: {
      jurisdiction: 'Test'
    },
    modules: {
      token_sale: {
        min_investment_usd: 100000,
        max_cap_usd: 50000, // Invalid: min > max
        blocklist: ['US'],
        whitelist: ['US'], // Invalid: same country in both
        start_date: '2025-12-31',
        end_date: '2025-01-01' // Invalid: end before start
      }
    }
  };
  
  const result = validateComplianceSpec(spec);
  
  console.log('Validation result:', result);
  console.log('Expected errors:', [
    'Minimum investment cannot exceed maximum cap',
    'Countries cannot be in both whitelist and blocklist: US',
    'Start date must be before end date'
  ]);
  
  // Verify all expected errors are found
  const expectedErrors = 3;
  if (result.errors.length !== expectedErrors) {
    throw new Error(`Expected ${expectedErrors} errors, found ${result.errors.length}`);
  }
}

// Helper validation functions
function validateInvestment(amount: number, minimum: number): void {
  if (amount < minimum) {
    throw new Error('Investment below minimum');
  }
}

function validateCap(amount: number, raised: number, cap: number): void {
  if (raised + amount > cap) {
    throw new Error('Exceeds sale cap');
  }
}

function validateCountry(country: string, blocklist: string[]): void {
  if (blocklist.includes(country)) {
    throw new Error('Country blocked');
  }
}

function validateDateRange(date: string, start: string, end: string): void {
  const checkDate = new Date(date);
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (checkDate < startDate) {
    throw new Error('Sale not started');
  }
  if (checkDate > endDate) {
    throw new Error('Sale ended');
  }
}

// Export for use in test runners
export {
  ComplianceScenarioTester,
  runComplianceTestSuite,
  testValidationRules
};

// Mock Jest functions if not in test environment
if (typeof describe === 'undefined') {
  (global as any).describe = (name: string, fn: Function) => {
    console.log(`\n=== ${name} ===`);
    fn();
  };
  (global as any).test = (name: string, fn: Function) => {
    try {
      fn();
      console.log(`✅ ${name}`);
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
    }
  };
  (global as any).beforeEach = (fn: Function) => fn();
  (global as any).expect = (value: any) => ({
    toBe: (expected: any) => {
      if (value !== expected) throw new Error(`Expected ${expected}, got ${value}`);
    },
    toThrow: (message?: string) => {
      try {
        value();
        throw new Error(`Expected to throw${message ? `: ${message}` : ''}`);
      } catch (error) {
        if (message && !error.message.includes(message)) {
          throw new Error(`Expected error containing "${message}", got "${error.message}"`);
        }
      }
    },
    not: {
      toThrow: () => {
        try {
          value();
        } catch (error) {
          throw new Error(`Unexpected error: ${error.message}`);
        }
      }
    }
  });
}

// Run examples if called directly
if (require.main === module) {
  (async () => {
    console.log('Running compliance tests...\n');
    testValidationRules();
    await runComplianceTestSuite();
  })().catch(console.error);
}