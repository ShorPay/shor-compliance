/**
 * Custom Generator Example
 * Shows how to create custom code generators for the SDK
 */

import {
  CodeGenerator,
  DocumentGenerator,
  ComplianceSpec,
  Blockchain,
  BaseContractGenerator
} from '@shor/compliance-sdk';

// Example 1: Custom Solana Generator with Anchor Framework
class AnchorProgramGenerator extends BaseContractGenerator {
  getBlockchain(): Blockchain {
    return 'solana';
  }

  getFileExtension(): string {
    return 'rs';
  }

  generate(spec: ComplianceSpec): string {
    const tokenSale = spec.modules.token_sale;
    
    return `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Guardrail111111111111111111111111111111111111");

#[program]
pub mod guardrail {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        max_cap_usd: u64,
        kyc_threshold_usd: u64,
        sale_start: i64,
        sale_end: i64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.max_cap_usd = max_cap_usd;
        config.kyc_threshold_usd = kyc_threshold_usd;
        config.sale_start = sale_start;
        config.sale_end = sale_end;
        config.total_raised_usd = 0;
        Ok(())
    }

    pub fn contribute(
        ctx: Context<Contribute>,
        amount_usd: u64,
        proof: VerificationProof,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let clock = Clock::get()?;
        
        // Check sale window
        require!(
            clock.unix_timestamp >= config.sale_start && 
            clock.unix_timestamp <= config.sale_end,
            ComplianceError::SaleNotActive
        );
        
        // Check cap
        require!(
            config.total_raised_usd + amount_usd <= config.max_cap_usd,
            ComplianceError::ExceedsCap
        );
        
        // Verify KYC if required
        let contributor = &mut ctx.accounts.contributor;
        if contributor.total_contribution + amount_usd >= config.kyc_threshold_usd {
            require!(
                verify_proof(&proof, &contributor.key()),
                ComplianceError::KYCRequired
            );
        }
        
        // Update state
        contributor.total_contribution += amount_usd;
        config.total_raised_usd += amount_usd;
        
        emit!(ContributionEvent {
            contributor: contributor.key(),
            amount: amount_usd,
            timestamp: clock.unix_timestamp,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = 8 + ComplianceConfig::LEN)]
    pub config: Account<'info, ComplianceConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub config: Account<'info, ComplianceConfig>,
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + ContributorInfo::LEN,
        seeds = [b"contributor", payer.key().as_ref()],
        bump
    )]
    pub contributor: Account<'info, ContributorInfo>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct ComplianceConfig {
    pub authority: Pubkey,
    pub max_cap_usd: u64,
    pub kyc_threshold_usd: u64,
    pub sale_start: i64,
    pub sale_end: i64,
    pub total_raised_usd: u64,
}

#[account]
pub struct ContributorInfo {
    pub total_contribution: u64,
    pub last_contribution: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct VerificationProof {
    pub address: Pubkey,
    pub timestamp: i64,
    pub signature: [u8; 64],
}

#[event]
pub struct ContributionEvent {
    pub contributor: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ComplianceError {
    #[msg("Sale is not active")]
    SaleNotActive,
    #[msg("Contribution exceeds sale cap")]
    ExceedsCap,
    #[msg("KYC verification required")]
    KYCRequired,
    #[msg("Invalid verification proof")]
    InvalidProof,
}

fn verify_proof(proof: &VerificationProof, contributor: &Pubkey) -> bool {
    // Implement proof verification logic
    proof.address == *contributor
}

impl ComplianceConfig {
    const LEN: usize = 32 + 8 + 8 + 8 + 8 + 8;
}

impl ContributorInfo {
    const LEN: usize = 8 + 8;
}`;
  }
}

// Example 2: Custom Document Generator for Legal Summaries
class LegalSummaryGenerator implements DocumentGenerator {
  getFormat(): 'markdown' | 'pdf' | 'html' {
    return 'markdown';
  }

  generate(spec: ComplianceSpec): string {
    const { metadata, modules } = spec;
    const tokenSale = modules.token_sale;
    
    let summary = `# Legal Compliance Summary\n\n`;
    summary += `**Jurisdiction:** ${metadata.jurisdiction || 'Not specified'}\n`;
    summary += `**Framework:** ${metadata.regulation_framework || 'Not specified'}\n`;
    summary += `**Generated:** ${new Date().toISOString()}\n\n`;
    
    summary += `## Key Compliance Points\n\n`;
    
    // Investment restrictions
    if (tokenSale?.accredited_only) {
      summary += `### ⚖️ Accredited Investors Only\n`;
      summary += `This offering is restricted to accredited investors as defined by the applicable regulations.\n\n`;
    }
    
    // Geographic restrictions
    if (tokenSale?.blocklist && tokenSale.blocklist.length > 0) {
      summary += `### 🌍 Geographic Restrictions\n`;
      summary += `The following jurisdictions are prohibited from participating:\n`;
      tokenSale.blocklist.forEach(country => {
        summary += `- ${country}\n`;
      });
      summary += `\n`;
    }
    
    // KYC/AML requirements
    if (tokenSale?.kyc_threshold_usd !== undefined) {
      summary += `### 🔍 KYC/AML Requirements\n`;
      if (tokenSale.kyc_threshold_usd === 0) {
        summary += `All participants must complete KYC/AML verification regardless of investment amount.\n\n`;
      } else {
        summary += `KYC/AML verification required for investments of $${tokenSale.kyc_threshold_usd.toLocaleString()} or more.\n\n`;
      }
    }
    
    // Investment limits
    if (tokenSale?.min_investment_usd || tokenSale?.max_cap_usd) {
      summary += `### 💰 Investment Parameters\n`;
      if (tokenSale.min_investment_usd) {
        summary += `- Minimum Investment: $${tokenSale.min_investment_usd.toLocaleString()}\n`;
      }
      if (tokenSale.max_cap_usd) {
        summary += `- Maximum Raise: $${tokenSale.max_cap_usd.toLocaleString()}\n`;
      }
      summary += `\n`;
    }
    
    // Lockup periods
    if (tokenSale?.lockup_days) {
      summary += `### 🔒 Token Lockup\n`;
      summary += `Tokens are subject to a ${tokenSale.lockup_days}-day lockup period from the date of purchase.\n\n`;
    }
    
    // Legal disclaimer
    summary += `## Legal Disclaimer\n\n`;
    summary += `This summary is generated automatically based on the compliance configuration and does not constitute legal advice. `;
    summary += `Consult with qualified legal counsel to ensure compliance with all applicable laws and regulations.\n`;
    
    return summary;
  }
}

// Example 3: Custom Smart Contract Analyzer
class ContractAnalyzer implements DocumentGenerator {
  getFormat(): 'markdown' | 'pdf' | 'html' {
    return 'markdown';
  }

  generate(spec: ComplianceSpec): string {
    let analysis = `# Smart Contract Compliance Analysis\n\n`;
    
    // Count on-chain vs off-chain rules
    let onChainRules = 0;
    let offChainRules = 0;
    let hybridRules = 0;
    
    // Analyze token sale module
    const tokenSale = spec.modules.token_sale;
    if (tokenSale) {
      // On-chain rules
      if (tokenSale.max_cap_usd) onChainRules++;
      if (tokenSale.min_investment_usd) onChainRules++;
      if (tokenSale.lockup_days) onChainRules++;
      if (tokenSale.start_date || tokenSale.end_date) onChainRules++;
      
      // Off-chain rules
      if (tokenSale.required_disclosures) offChainRules += tokenSale.required_disclosures.length;
      if (tokenSale.accredited_only) offChainRules++;
      
      // Hybrid rules
      if (tokenSale.kyc_threshold_usd !== undefined) hybridRules++;
      if (tokenSale.blocklist || tokenSale.whitelist) hybridRules++;
    }
    
    analysis += `## Enforcement Distribution\n\n`;
    analysis += `- **On-Chain Rules:** ${onChainRules} (automatically enforced)\n`;
    analysis += `- **Off-Chain Rules:** ${offChainRules} (manual processes)\n`;
    analysis += `- **Hybrid Rules:** ${hybridRules} (combination)\n\n`;
    
    // Gas estimation
    analysis += `## Estimated Gas Costs\n\n`;
    analysis += `Based on the complexity of rules:\n\n`;
    
    const baseGas = 21000;
    const storageGas = 20000;
    const computeGas = onChainRules * 5000;
    const totalGas = baseGas + storageGas + computeGas;
    
    analysis += `- Base transaction: ${baseGas.toLocaleString()} gas\n`;
    analysis += `- Storage updates: ${storageGas.toLocaleString()} gas\n`;
    analysis += `- Compliance checks: ${computeGas.toLocaleString()} gas\n`;
    analysis += `- **Total estimated:** ${totalGas.toLocaleString()} gas\n\n`;
    
    // Recommendations
    analysis += `## Optimization Recommendations\n\n`;
    
    if (onChainRules > 10) {
      analysis += `- Consider moving some rules off-chain to reduce gas costs\n`;
    }
    
    if (hybridRules > 0) {
      analysis += `- Use batch updates for KYC verification to save gas\n`;
    }
    
    if (spec.modules.token_sale?.blocklist && spec.modules.token_sale.blocklist.length > 10) {
      analysis += `- Consider using a merkle tree for large blocklists\n`;
    }
    
    return analysis;
  }
}

// Example 4: Using Custom Generators with the SDK
async function useCustomGenerators() {
  const { ShorCompliance } = await import('@shor/compliance-sdk');
  
  // Initialize SDK
  const compliance = new ShorCompliance({
    blockchain: 'solana',
    environment: 'production'
  });
  
  // Register custom generators
  compliance.registerGenerator('anchor-program', new AnchorProgramGenerator());
  compliance.registerGenerator('legal-summary', new LegalSummaryGenerator());
  compliance.registerGenerator('contract-analysis', new ContractAnalyzer());
  
  // Load compliance spec
  const spec = await compliance.loadJurisdiction('us-sec');
  
  // Generate custom outputs
  const anchorCode = new AnchorProgramGenerator().generate(spec);
  console.log('Generated Anchor program:', anchorCode.substring(0, 200) + '...');
  
  const legalSummary = new LegalSummaryGenerator().generate(spec);
  console.log('\nLegal Summary:\n', legalSummary);
  
  const analysis = new ContractAnalyzer().generate(spec);
  console.log('\nContract Analysis:\n', analysis);
}

// Example 5: Plugin Architecture
interface CompliancePlugin {
  name: string;
  version: string;
  generators?: Array<{ name: string; generator: CodeGenerator | DocumentGenerator }>;
  providers?: Array<{ name: string; provider: typeof KYCProvider }>;
  validators?: Array<{ name: string; validator: (spec: ComplianceSpec) => string[] }>;
}

class CompliancePluginManager {
  private plugins: Map<string, CompliancePlugin> = new Map();
  
  register(plugin: CompliancePlugin): void {
    this.plugins.set(plugin.name, plugin);
    console.log(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }
  
  loadIntoSDK(compliance: ShorCompliance): void {
    for (const plugin of this.plugins.values()) {
      // Register generators
      plugin.generators?.forEach(({ name, generator }) => {
        compliance.registerGenerator(name, generator);
      });
      
      // Register providers (would need SDK support)
      plugin.providers?.forEach(({ name, provider }) => {
        // KYCProviderFactory.register(name, provider);
      });
    }
  }
}

// Create a plugin
const solanaPlugin: CompliancePlugin = {
  name: 'solana-compliance',
  version: '1.0.0',
  generators: [
    { name: 'anchor', generator: new AnchorProgramGenerator() },
    { name: 'seahorse', generator: new AnchorProgramGenerator() } // Could be different
  ]
};

// Export for use
export {
  AnchorProgramGenerator,
  LegalSummaryGenerator,
  ContractAnalyzer,
  CompliancePluginManager,
  solanaPlugin,
  useCustomGenerators
};

// Run examples if called directly
if (require.main === module) {
  useCustomGenerators().catch(console.error);
}