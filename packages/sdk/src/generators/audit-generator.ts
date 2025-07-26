import { DocumentGenerator } from './base';
import { ComplianceSpec } from '../types';

/**
 * Audit manifest generator
 */
export class AuditDocumentGenerator implements DocumentGenerator {
  getFormat(): 'markdown' | 'pdf' | 'html' {
    return 'markdown';
  }
  
  generate(spec: ComplianceSpec): string {
    const auditManifest = {
      compliance_framework: {
        version: spec.version,
        jurisdiction: spec.metadata.jurisdiction || 'N/A',
        framework: spec.metadata.regulation_framework || 'Custom',
        generated_at: new Date().toISOString()
      },
      enforcement_summary: {
        on_chain_rules: this.countOnChainRules(spec),
        off_chain_rules: this.countOffChainRules(spec),
        hybrid_rules: this.countHybridRules(spec)
      },
      modules_implemented: Object.keys(spec.modules || {}),
      compliance_checks: this.extractComplianceChecks(spec),
      generated_artifacts: [
        'Guardrail.sol or Guardrail.rs',
        'policy.md',
        'audit.json'
      ]
    };
    
    return JSON.stringify(auditManifest, null, 2);
  }
  
  private countOnChainRules(spec: ComplianceSpec): number {
    let count = 0;
    const tokenSale = spec.modules?.token_sale;
    if (tokenSale) {
      if (tokenSale.max_cap_usd) count++;
      if (tokenSale.start_date && tokenSale.end_date) count++;
      if (tokenSale.blocklist) count++;
      if (tokenSale.min_investment_usd) count++;
    }
    return count;
  }
  
  private countOffChainRules(spec: ComplianceSpec): number {
    let count = 0;
    const modules = spec.modules || {};
    if (modules.investor_verification?.bad_actor_check_required) count++;
    if (modules.disclosures) count += Object.keys(modules.disclosures).length;
    if (modules.ongoing_reporting) count += Object.keys(modules.ongoing_reporting).length;
    return count;
  }
  
  private countHybridRules(spec: ComplianceSpec): number {
    let count = 0;
    const tokenSale = spec.modules?.token_sale;
    if (tokenSale?.kyc_threshold_usd !== undefined) count++;
    if (tokenSale?.accredited_only) count++;
    return count;
  }
  
  private extractComplianceChecks(spec: ComplianceSpec): string[] {
    const checks: string[] = [];
    const tokenSale = spec.modules?.token_sale;
    
    if (tokenSale) {
      if (tokenSale.max_cap_usd) checks.push('Maximum cap enforcement');
      if (tokenSale.kyc_threshold_usd !== undefined) checks.push('KYC verification threshold');
      if (tokenSale.accredited_only) checks.push('Accredited investor verification');
      if (tokenSale.blocklist) checks.push('Jurisdiction blocklist');
      if (tokenSale.min_investment_usd) checks.push('Minimum investment amount');
      // max_investment_usd not defined in interface
      if (tokenSale.lockup_days) checks.push('Token lockup period');
    }
    
    const verification = spec.modules?.investor_verification;
    if (verification) {
      if (verification.bad_actor_check_required) checks.push('Bad actor disqualification');
      // aml_check_required not defined in InvestorVerificationModule interface
    }
    
    return checks;
  }
}