import { ComplianceSpec, Blockchain, Environment, KYCProvider, KYCProviderConfig } from './types';
import { CodeGenerator, DocumentGenerator, GeneratorOptions } from './generators/base';
import { JurisdictionLoader } from './jurisdictions/loader';
import { KYCProviderFactory } from './providers/factory';
import { validateComplianceSpec } from './utils/validation';

export * from './types';
export * from './generators/base';
export * from './providers/base';

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
      blockchain: 'ethereum',
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
   * Register a custom generator
   */
  registerGenerator(name: string, generator: CodeGenerator | DocumentGenerator): void {
    this.generators.set(name, generator);
  }
  
  /**
   * Get a contract generator for a specific blockchain
   */
  private getContractGenerator(blockchain: Blockchain, options?: GeneratorOptions): CodeGenerator | undefined {
    // This will be implemented when we move the actual generators
    // For now, return undefined
    return this.generators.get(`contract-${blockchain}`) as CodeGenerator;
  }
  
  /**
   * Get a document generator by type
   */
  private getDocumentGenerator(type: 'policy' | 'audit'): DocumentGenerator | undefined {
    // This will be implemented when we move the actual generators
    // For now, return undefined
    return this.generators.get(`document-${type}`) as DocumentGenerator;
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