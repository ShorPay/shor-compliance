import { DocumentGenerator } from './base';
import { ComplianceSpec } from '../types';
import { generatePolicyDocument } from '@shor/generators/src/policy-generator';

/**
 * Policy document generator
 */
export class PolicyDocumentGenerator implements DocumentGenerator {
  getFormat(): 'markdown' | 'pdf' | 'html' {
    return 'markdown';
  }
  
  generate(spec: ComplianceSpec): string {
    return generatePolicyDocument(spec);
  }
}