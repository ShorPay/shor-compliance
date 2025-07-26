import { KYCProvider, KYCProviderConfig } from '../types';

/**
 * Factory for creating KYC providers
 */
export class KYCProviderFactory {
  private static providers = new Map<string, new (config: KYCProviderConfig) => KYCProvider>();
  
  /**
   * Register a provider class
   */
  static register(name: string, providerClass: new (config: KYCProviderConfig) => KYCProvider): void {
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
    
    return new ProviderClass(config);
  }
  
  /**
   * List available providers
   */
  static list(): string[] {
    return Array.from(this.providers.keys());
  }
}