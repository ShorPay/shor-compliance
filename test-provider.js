const { KYCProviderFactory } = require('./packages/providers/dist');

async function testProvider() {
  console.log('=== Testing KYC Provider ===\n');
  
  try {
    // 1. List available providers
    console.log('1. Available providers:');
    const providers = KYCProviderFactory.getAvailableProviders();
    console.log(providers);
    console.log('✓ Listed providers\n');
    
    // 2. Get provider requirements
    console.log('2. Sumsub requirements:');
    const requirements = KYCProviderFactory.getProviderRequirements('sumsub');
    console.log(requirements);
    console.log('✓ Got requirements\n');
    
    // 3. Create provider instance (will fail without real credentials)
    console.log('3. Creating Sumsub provider...');
    try {
      const provider = KYCProviderFactory.create('sumsub', {
        appToken: 'test-token',
        secretKey: 'test-secret',
        baseURL: 'https://api.sumsub.com'
      });
      console.log('Provider name:', provider.name);
      console.log('Is configured:', provider.isConfigured());
      console.log('✓ Created provider\n');
    } catch (error) {
      console.log('Expected error (no real credentials):', error.message);
    }
    
    console.log('=== Provider tests completed ===');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProvider();