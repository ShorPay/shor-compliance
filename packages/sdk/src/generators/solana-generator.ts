import { BaseContractGenerator } from './base';
import { ComplianceSpec, Blockchain } from '../types';
import { generateSolanaProgram } from '@shor/generators/src/solana-generator';

/**
 * Solana program generator
 */
export class SolanaContractGenerator extends BaseContractGenerator {
  getBlockchain(): Blockchain {
    return 'solana';
  }
  
  getFileExtension(): string {
    return 'rs';
  }
  
  generate(spec: ComplianceSpec): string {
    return generateSolanaProgram(spec);
  }
}