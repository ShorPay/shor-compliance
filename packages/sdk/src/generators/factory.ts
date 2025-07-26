import { CodeGenerator, DocumentGenerator } from './base';
import { EthereumContractGenerator } from './ethereum-generator';
import { SolanaContractGenerator } from './solana-generator';
import { PolicyDocumentGenerator } from './policy-generator';
import { AuditDocumentGenerator } from './audit-generator';
import { Blockchain } from '../types';

/**
 * Factory for creating generators
 */
export class GeneratorFactory {
  private static contractGenerators = new Map<Blockchain, new() => CodeGenerator>([
    ['ethereum', EthereumContractGenerator],
    ['solana', SolanaContractGenerator]
  ]);
  
  private static documentGenerators = new Map<string, new() => DocumentGenerator>([
    ['policy', PolicyDocumentGenerator],
    ['audit', AuditDocumentGenerator]
  ]);
  
  /**
   * Create a contract generator for a specific blockchain
   */
  static createContractGenerator(blockchain: Blockchain): CodeGenerator | undefined {
    const GeneratorClass = this.contractGenerators.get(blockchain);
    return GeneratorClass ? new GeneratorClass() : undefined;
  }
  
  /**
   * Create a document generator by type
   */
  static createDocumentGenerator(type: string): DocumentGenerator | undefined {
    const GeneratorClass = this.documentGenerators.get(type);
    return GeneratorClass ? new GeneratorClass() : undefined;
  }
  
  /**
   * Register a custom contract generator
   */
  static registerContractGenerator(blockchain: Blockchain, generator: new() => CodeGenerator): void {
    this.contractGenerators.set(blockchain, generator);
  }
  
  /**
   * Register a custom document generator
   */
  static registerDocumentGenerator(type: string, generator: new() => DocumentGenerator): void {
    this.documentGenerators.set(type, generator);
  }
}