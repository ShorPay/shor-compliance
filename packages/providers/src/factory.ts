import { KYCProvider, KYCProviderConfig } from './kyc-provider';
import { SumsubProvider } from './kyc/sumsub';

/**
 * Factory for creating KYC providers
 */
export class KYCProviderFactory {
  private static providers = new Map<string, new () => KYCProvider>();
  
  // Auto-register built-in providers
  static {
    this.register('sumsub', SumsubProvider);
  }
  
  /**
   * Register a provider class
   */
  static register(name: string, providerClass: new () => KYCProvider): void {
    this.providers.set(name.toLowerCase(), providerClass);
  }
  
  /**
   * Create a provider instance
   */
  static create(name: string, config: KYCProviderConfig): KYCProvider {
    const ProviderClass = this.providers.get(name.toLowerCase());
    if (!ProviderClass) {
      throw new Error(`Unknown KYC provider: ${name}`);
    }
    
    const provider = new ProviderClass();
    provider.configure(config);
    
    return provider;
  }
  
  /**
   * List available providers
   */
  static list(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Get available providers (alias for list)
   */
  static getAvailableProviders(): string[] {
    return this.list();
  }
  
  /**
   * Get provider configuration requirements
   */
  static getProviderRequirements(provider: string): string[] {
    switch (provider.toLowerCase()) {
      case 'sumsub':
        return ['appToken', 'secretKey', 'baseURL'];
      default:
        return [];
    }
  }
}