import { BaseContractGenerator } from './base';
import { ComplianceSpec, Blockchain } from '../types';
import { generateProviderAgnosticContract } from '@shor/generators';

/**
 * Ethereum smart contract generator
 */
export class EthereumContractGenerator extends BaseContractGenerator {
  getBlockchain(): Blockchain {
    return 'ethereum';
  }
  
  getFileExtension(): string {
    return 'sol';
  }
  
  generate(spec: ComplianceSpec): string {
    // Use the provider-agnostic v3 generator
    return generateProviderAgnosticContract(spec);
  }
}