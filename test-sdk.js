const { createShorCompliance } = require('./packages/sdk/dist');

async function testSDK() {
  console.log('=== Testing Shor Compliance SDK ===\n');
  
  try {
    // 1. Create SDK instance
    console.log('1. Creating SDK instance...');
    const compliance = createShorCompliance({
      blockchain: 'ethereum',
      environment: 'development'
    });
    console.log('✓ SDK instance created\n');
    
    // 2. List jurisdictions
    console.log('2. Listing available jurisdictions...');
    const jurisdictions = await compliance.listJurisdictions();
    console.log('Available jurisdictions:', jurisdictions);
    console.log('✓ Listed jurisdictions\n');
    
    // 3. Load a jurisdiction
    console.log('3. Loading US token sale jurisdiction...');
    const spec = await compliance.loadJurisdiction('us-token-sale');
    console.log('Loaded spec:', spec.metadata.jurisdiction);
    console.log('✓ Loaded jurisdiction\n');
    
    // 4. Modify the spec
    console.log('4. Modifying compliance spec...');
    spec.metadata.project_name = 'Test Token Sale';
    spec.modules.token_sale.max_cap_usd = 10000000;
    console.log('✓ Modified spec\n');
    
    // 5. Save to file
    console.log('5. Saving to test-compliance.yaml...');
    await compliance.saveToFile(spec, './test-compliance.yaml');
    console.log('✓ Saved to file\n');
    
    // 6. Load from file
    console.log('6. Loading from test-compliance.yaml...');
    const loadedSpec = await compliance.loadFromFile('./test-compliance.yaml');
    console.log('Project name:', loadedSpec.metadata.project_name);
    console.log('✓ Loaded from file\n');
    
    // 7. Compile
    console.log('7. Compiling compliance spec...');
    const result = await compliance.compile(spec, {
      blockchain: 'ethereum'
    });
    console.log('Generated files:', Object.keys(result.contracts), Object.keys(result.documents));
    console.log('✓ Compiled successfully\n');
    
    // 8. Show contract preview
    console.log('8. Contract preview:');
    console.log(result.contracts['Guardrail.sol'].substring(0, 500) + '...\n');
    
    console.log('=== All SDK tests passed! ===');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testSDK();