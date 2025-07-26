import { ComplianceSpec } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a compliance specification
 */
export function validateComplianceSpec(spec: ComplianceSpec): ValidationResult {
  const errors: string[] = [];
  
  // Basic validation
  if (!spec.version) {
    errors.push('Missing version field');
  }
  
  if (!spec.metadata) {
    errors.push('Missing metadata');
  }
  
  if (!spec.modules || Object.keys(spec.modules).length === 0) {
    errors.push('No compliance modules defined');
  }
  
  // Validate token sale module if present
  if (spec.modules?.token_sale) {
    const tokenSale = spec.modules.token_sale;
    
    if (tokenSale.min_investment_usd && tokenSale.max_cap_usd) {
      if (tokenSale.min_investment_usd > tokenSale.max_cap_usd) {
        errors.push('Minimum investment cannot exceed maximum cap');
      }
    }
    
    if (tokenSale.start_date && tokenSale.end_date) {
      const start = new Date(tokenSale.start_date);
      const end = new Date(tokenSale.end_date);
      if (start >= end) {
        errors.push('Start date must be before end date');
      }
    }
    
    if (tokenSale.blocklist && tokenSale.whitelist) {
      const overlap = tokenSale.blocklist.filter(country => 
        tokenSale.whitelist!.includes(country)
      );
      if (overlap.length > 0) {
        errors.push(`Countries cannot be in both whitelist and blocklist: ${overlap.join(', ')}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}