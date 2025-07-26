import { ComplianceSpec, Blockchain } from '../types';

/**
 * Base interface for all code generators
 */
export interface CodeGenerator {
  /**
   * Generate code from a compliance specification
   * @param spec The compliance specification
   * @returns Generated code as a string
   */
  generate(spec: ComplianceSpec): string;
  
  /**
   * Get the target blockchain for this generator
   */
  getBlockchain(): Blockchain;
  
  /**
   * Get the file extension for generated code
   */
  getFileExtension(): string;
}

/**
 * Base interface for document generators
 */
export interface DocumentGenerator {
  /**
   * Generate a document from a compliance specification
   * @param spec The compliance specification
   * @returns Generated document content
   */
  generate(spec: ComplianceSpec): string;
  
  /**
   * Get the document format
   */
  getFormat(): 'markdown' | 'pdf' | 'html';
}

/**
 * Options for contract generation
 */
export interface GeneratorOptions {
  withOracle?: boolean;
  oracleAddress?: string;
  customTemplate?: string;
}

/**
 * Base abstract class for contract generators
 */
export abstract class BaseContractGenerator implements CodeGenerator {
  protected options: GeneratorOptions;
  
  constructor(options: GeneratorOptions = {}) {
    this.options = options;
  }
  
  abstract generate(spec: ComplianceSpec): string;
  abstract getBlockchain(): Blockchain;
  abstract getFileExtension(): string;
  
  /**
   * Helper method to format dates
   */
  protected formatDate(dateString?: string): string {
    if (!dateString) return new Date().toISOString().split('T')[0];
    return dateString;
  }
  
  /**
   * Helper method to format currency
   */
  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }
}