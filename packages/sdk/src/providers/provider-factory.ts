import { KYCProvider } from './kyc-provider';
import { SumsubProvider } from './sumsub-provider';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type SupportedProvider = 'sumsub';

interface ProviderConfig {
  provider: SupportedProvider;
  config: Record<string, any>;
}

export class KYCProviderFactory {
  private static instance: KYCProviderFactory;
  private providers: Map<SupportedProvider, () => KYCProvider> = new Map();
  private activeProvider?: KYCProvider;
  private config?: ProviderConfig;

  private constructor() {
    // Register available providers
    this.providers.set('sumsub', () => new SumsubProvider());
  }

  static getInstance(): KYCProviderFactory {
    if (!this.instance) {
      this.instance = new KYCProviderFactory();
    }
    return this.instance;
  }

  /**
   * Initialize provider from configuration
   */
  async initialize(): Promise<KYCProvider> {
    if (this.activeProvider) {
      return this.activeProvider;
    }

    this.config = this.loadConfig();
    
    if (!this.config) {
      throw new Error('No KYC provider configured. Run "shor config set-provider <provider>"');
    }

    const providerFactory = this.providers.get(this.config.provider);
    if (!providerFactory) {
      throw new Error(`Unsupported KYC provider: ${this.config.provider}`);
    }

    this.activeProvider = providerFactory();
    this.activeProvider.configure(this.config.config);

    if (!this.activeProvider.isConfigured()) {
      throw new Error(`Provider ${this.config.provider} is not properly configured`);
    }

    return this.activeProvider;
  }

  /**
   * Get current active provider
   */
  getProvider(): KYCProvider | undefined {
    return this.activeProvider;
  }

  /**
   * List available providers
   */
  getAvailableProviders(): SupportedProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Configure a specific provider
   */
  configureProvider(provider: SupportedProvider, config: Record<string, any>): void {
    const configData: ProviderConfig = { provider, config };
    this.saveConfig(configData);
    this.config = configData;
    this.activeProvider = undefined; // Reset active provider
  }

  /**
   * Get provider configuration requirements
   */
  getProviderRequirements(provider: SupportedProvider): string[] {
    switch (provider) {
      case 'sumsub':
        return ['apiKey', 'appToken', 'secretKey'];
      default:
        return [];
    }
  }

  private loadConfig(): ProviderConfig | undefined {
    try {
      const configPath = path.join(os.homedir(), '.shor', 'kyc-config.json');
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } catch (error) {
      // Config file doesn't exist or is invalid
    }
    return undefined;
  }

  private saveConfig(config: ProviderConfig): void {
    const configDir = path.join(os.homedir(), '.shor');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const configPath = path.join(configDir, 'kyc-config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
}

// Singleton instance
export const kycProviderFactory = KYCProviderFactory.getInstance();