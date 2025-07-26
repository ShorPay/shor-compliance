/**
 * Core compliance specification types for the Shor Compliance SDK
 */

export interface ComplianceSpec {
  version: string;
  metadata: ComplianceMetadata;
  modules: ComplianceModules;
}

export interface ComplianceMetadata {
  project_name?: string;
  description?: string;
  created_date?: string;
  jurisdiction?: string;
  regulation_framework?: string;
  last_updated?: string;
  references?: string[];
  generated_from?: string;
  generated_at?: string;
}

export interface ComplianceModules {
  token_sale?: TokenSaleModule;
  investor_verification?: InvestorVerificationModule;
  securities_exemptions?: SecuritiesExemptionsModule;
  reporting_requirements?: ReportingRequirementsModule;
  marketing_restrictions?: MarketingRestrictionsModule;
  resale_restrictions?: ResaleRestrictionsModule;
  licensing_requirements?: LicensingRequirementsModule;
  digital_payment_token_requirements?: DigitalPaymentTokenRequirementsModule;
  aml_cft_requirements?: AmlCftRequirementsModule;
  risk_management?: RiskManagementModule;
  consumer_protection?: ConsumerProtectionModule;
  reporting_obligations?: ReportingObligationsModule;
  market_conduct?: MarketConductModule;
  cross_border_requirements?: CrossBorderRequirementsModule;
  [key: string]: any;
}

export interface TokenSaleModule {
  accredited_only?: boolean;
  kyc_threshold_usd?: number;
  aml_required?: boolean;
  max_cap_usd?: number;
  min_investment_usd?: number;
  max_investment_usd?: number;
  self_attestation_threshold_usd?: number;
  start_date?: string;
  end_date?: string;
  blocklist?: string[];
  whitelist?: string[];
  lockup_days?: number;
  required_disclosures?: string[];
  utility_requirements?: string[];
  token_classification?: {
    likely_not_security_if?: string[];
    likely_security_if?: string[];
  };
}

export interface InvestorVerificationModule {
  accredited_verification_required?: boolean;
  acceptable_verification_methods?: string[];
  bad_actor_check_required?: boolean;
  aml_check_required?: boolean;
}

export interface SecuritiesExemptionsModule {
  primary_exemption?: string;
  alternative_exemptions?: string[];
}

export interface ReportingRequirementsModule {
  form_d_filing?: boolean;
  form_d_deadline_days?: number;
  ongoing_reporting?: boolean;
}

export interface MarketingRestrictionsModule {
  general_solicitation_allowed?: boolean;
  require_disclaimer?: boolean;
  disclaimer_text?: string;
  prohibited_terms?: string[];
}

export interface ResaleRestrictionsModule {
  restricted_period_days?: number;
  legend_required?: boolean;
  transfer_agent_required?: boolean;
}

export interface LicensingRequirementsModule {
  license_type?: string;
  monthly_transaction_threshold_sgd?: number;
  float_threshold_sgd?: number;
  capital_requirement_sgd?: number;
}

export interface DigitalPaymentTokenRequirementsModule {
  dpt_services?: string[];
  technology_requirements?: string[];
}

export interface AmlCftRequirementsModule {
  customer_due_diligence?: string[];
  edd_thresholds?: {
    single_transaction_sgd?: number;
    accumulated_transactions_sgd?: number;
  };
  str_required?: boolean;
  str_threshold?: number;
  record_retention_years?: number;
}

export interface RiskManagementModule {
  required_policies?: string[];
  singapore_resident_director?: boolean;
  compliance_officer_required?: boolean;
  mlro_required?: boolean;
}

export interface ConsumerProtectionModule {
  customer_asset_segregation?: boolean;
  trust_account_required?: boolean;
  required_disclosures?: string[];
  prohibited_practices?: string[];
}

export interface ReportingObligationsModule {
  regulatory_returns?: string[];
  annual_audit_required?: boolean;
  approved_auditor_required?: boolean;
}

export interface MarketConductModule {
  insider_trading_monitoring?: boolean;
  market_manipulation_prevention?: boolean;
  advertising_requirements?: string[];
}

export interface CrossBorderRequirementsModule {
  fintech_bridge_countries?: string[];
  singapore_office_required?: boolean;
  local_representative_required?: boolean;
}

export type Blockchain = 'ethereum' | 'solana';
export type Environment = 'development' | 'production';
export type EnforcementType = 'ON-CHAIN' | 'OFF-CHAIN' | 'HYBRID';