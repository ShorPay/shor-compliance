import { ComplianceSpec, Blockchain, Environment, KYCProvider, KYCProviderConfig } from './types';
import { CodeGenerator, DocumentGenerator, GeneratorOptions } from './generators/base';
import { JurisdictionLoader } from './jurisdictions/loader';
import { KYCProviderFactory } from '@shor/providers';
import { validateComplianceSpec } from './utils/validation';
import { GeneratorFactory } from './generators/factory';

export * from './types';
export * from './generators/base';
export { KYCProvider, KYCProviderConfig } from '@shor/providers';

/**
 * Main SDK configuration
 */
export interface ShorComplianceConfig {
  jurisdiction?: string;
  blockchain?: Blockchain;
  environment?: Environment;
  kycProvider?: {
    name: string;
    config: KYCProviderConfig;
  };
}

/**
 * Main Shor Compliance SDK class
 */
export class ShorCompliance {
  private config: ShorComplianceConfig;
  private jurisdictionLoader: JurisdictionLoader;
  private generators: Map<string, CodeGenerator | DocumentGenerator>;
  private kycProvider?: KYCProvider;
  
  constructor(config: ShorComplianceConfig = {}) {
    this.config = {
      blockchain: 'solana',
      environment: 'development',
      ...config
    };
    
    this.jurisdictionLoader = new JurisdictionLoader();
    this.generators = new Map();
    
    // Initialize KYC provider if configured
    if (config.kycProvider) {
      this.kycProvider = KYCProviderFactory.create(
        config.kycProvider.name,
        config.kycProvider.config
      );
    }
  }
  
  /**
   * Load a jurisdiction template
   */
  async loadJurisdiction(jurisdiction: string): Promise<ComplianceSpec> {
    return this.jurisdictionLoader.load(jurisdiction);
  }
  
  /**
   * Load compliance spec from a YAML file
   */
  async loadFromFile(filePath: string): Promise<ComplianceSpec> {
    return this.jurisdictionLoader.loadFromFile(filePath);
  }
  
  /**
   * Create an empty compliance specification
   */
  createEmptySpec(): ComplianceSpec {
    return {
      version: '1.0',
      metadata: {
        created_date: new Date().toISOString().split('T')[0]
      },
      modules: {}
    };
  }
  
  /**
   * Save compliance spec to a YAML file
   */
  async saveToFile(spec: ComplianceSpec, filePath: string): Promise<void> {
    return this.jurisdictionLoader.saveToFile(spec, filePath);
  }
  
  /**
   * List available jurisdictions
   */
  async listJurisdictions(): Promise<string[]> {
    return this.jurisdictionLoader.list();
  }
  
  /**
   * Compile a compliance specification into contracts and documents
   */
  async compile(spec: ComplianceSpec, options: CompileOptions = {}): Promise<CompileResult> {
    // Validate the specification
    const validation = validateComplianceSpec(spec);
    if (!validation.valid) {
      throw new Error(`Invalid compliance specification: ${validation.errors.join(', ')}`);
    }
    
    const results: CompileResult = {
      contracts: {},
      documents: {},
      metadata: {
        jurisdiction: spec.metadata.jurisdiction,
        blockchain: options.blockchain || this.config.blockchain!,
        timestamp: new Date().toISOString()
      }
    };
    
    // Generate contract for specified blockchain
    const contractGenerator = this.getContractGenerator(
      options.blockchain || this.config.blockchain!,
      options.generatorOptions
    );
    
    if (contractGenerator) {
      const contractCode = contractGenerator.generate(spec);
      const extension = contractGenerator.getFileExtension();
      results.contracts[`Guardrail.${extension}`] = contractCode;
    }
    
    // Generate policy document
    const policyGenerator = this.getDocumentGenerator('policy');
    if (policyGenerator) {
      results.documents['policy.md'] = policyGenerator.generate(spec);
    }
    
    // Generate audit manifest
    const auditGenerator = this.getDocumentGenerator('audit');
    if (auditGenerator) {
      results.documents['audit.json'] = auditGenerator.generate(spec);
    }
    
    return results;
  }
  
  /**
   * Create a verifier instance for KYC/AML operations
   */
  createVerifier(providerName?: string, config?: KYCProviderConfig): KYCProvider {
    if (providerName && config) {
      return KYCProviderFactory.create(providerName, config);
    }
    
    if (!this.kycProvider) {
      throw new Error('No KYC provider configured');
    }
    
    return this.kycProvider;
  }
  
  /**
   * Get available blockchain options
   */
  getAvailableBlockchains(): Blockchain[] {
    return ['ethereum', 'solana'];
  }
  
  /**
   * Get supported environments
   */
  getSupportedEnvironments(): Environment[] {
    return ['development', 'production'];
  }
  
  /**
   * Get available KYC providers
   */
  getAvailableKYCProviders(): string[] {
    return KYCProviderFactory.getAvailableProviders();
  }
  
  /**
   * Get compile options schema with descriptions
   */
  getCompileOptionsSchema(): {
    blockchain: { type: string; options: Blockchain[]; default: Blockchain; description: string };
    generatorOptions: { type: string; description: string };
  } {
    return {
      blockchain: {
        type: 'string',
        options: this.getAvailableBlockchains(),
        default: this.config.blockchain!,
        description: 'Target blockchain for smart contract generation'
      },
      generatorOptions: {
        type: 'object',
        description: 'Additional options passed to the code generator'
      }
    };
  }
  
  /**
   * Get SDK configuration schema with descriptions
   */
  getConfigSchema(): {
    jurisdiction: { type: string; description: string };
    blockchain: { type: string; options: Blockchain[]; default: Blockchain; description: string };
    environment: { type: string; options: Environment[]; default: Environment; description: string };
    kycProvider: { type: string; description: string };
  } {
    return {
      jurisdiction: {
        type: 'string',
        description: 'Jurisdiction template to load (e.g., "us-sec", "eu-mica")'
      },
      blockchain: {
        type: 'string',
        options: this.getAvailableBlockchains(),
        default: this.config.blockchain!,
        description: 'Default blockchain for compilation'
      },
      environment: {
        type: 'string',
        options: this.getSupportedEnvironments(),
        default: this.config.environment!,
        description: 'Target environment for generation'
      },
      kycProvider: {
        type: 'object',
        description: 'KYC provider configuration with name and config properties'
      }
    };
  }

  /**
   * Register a custom generator
   */
  registerGenerator(name: string, generator: CodeGenerator | DocumentGenerator): void {
    this.generators.set(name, generator);
  }
  
  /**
   * Get a contract generator for a specific blockchain
   */
  private getContractGenerator(blockchain: Blockchain, options?: GeneratorOptions): CodeGenerator | undefined {
    // First check if a custom generator was registered
    const customGenerator = this.generators.get(`contract-${blockchain}`) as CodeGenerator;
    if (customGenerator) return customGenerator;
    
    // Otherwise use the factory
    return GeneratorFactory.createContractGenerator(blockchain);
  }
  
  /**
   * Get a document generator by type
   */
  private getDocumentGenerator(type: 'policy' | 'audit'): DocumentGenerator | undefined {
    // First check if a custom generator was registered
    const customGenerator = this.generators.get(`document-${type}`) as DocumentGenerator;
    if (customGenerator) return customGenerator;
    
    // Otherwise use the factory
    return GeneratorFactory.createDocumentGenerator(type);
  }
}

/**
 * Options for compilation
 */
export interface CompileOptions {
  blockchain?: Blockchain;
  generatorOptions?: GeneratorOptions;
}

/**
 * Result of compilation
 */
export interface CompileResult {
  contracts: Record<string, string>;
  documents: Record<string, string>;
  metadata: {
    jurisdiction?: string;
    blockchain: Blockchain;
    timestamp: string;
  };
}

/**
 * Convenience function to create an SDK instance
 */
export function createShorCompliance(config?: ShorComplianceConfig): ShorCompliance {
  return new ShorCompliance(config);
}