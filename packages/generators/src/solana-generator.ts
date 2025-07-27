export function generateSolanaProgram(complianceData: any): string {
  const tokenSale = complianceData.modules?.token_sale;
  
  if (!tokenSale) {
    throw new Error('No token_sale module found in compliance data');
  }

  // Convert dates to timestamps
  const startTimestamp = Math.floor(new Date(tokenSale.start_date).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(tokenSale.end_date).getTime() / 1000);
  
  // Generate blocklist array
  const blocklistArray = tokenSale.blocklist
    .map((country: string) => `b"${country}"`)
    .join(', ');

  return `use anchor_lang::prelude::*;
use anchor_lang::solana_program::clock::Clock;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

/// Auto-generated from compliance.yaml specification
#[program]
pub mod guardrail {
    use super::*;

    /// Initialize the guardrail with compliance parameters
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let guardrail = &mut ctx.accounts.guardrail;
        
        // Initialize sale parameters from compliance spec
        guardrail.sale_start_time = ${startTimestamp};
        guardrail.sale_end_time = ${endTimestamp};
        guardrail.max_cap_usd = ${tokenSale.max_cap_usd};
        guardrail.kyc_threshold_usd = ${tokenSale.kyc_threshold_usd};
        guardrail.total_raised_usd = 0;
        guardrail.authority = ctx.accounts.authority.key();
        
        // Initialize blocked countries
        guardrail.blocked_countries = vec![${blocklistArray}];
        
        Ok(())
    }

    /// Validate a contribution against compliance rules
    pub fn validate_contribution(
        ctx: Context<ValidateContribution>,
        amount_usd: u64,
        country_code: String,
        has_kyc: bool,
    ) -> Result<()> {
        let guardrail = &ctx.accounts.guardrail;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp as u64;
        
        // Check sale window
        require!(
            current_time >= guardrail.sale_start_time && 
            current_time <= guardrail.sale_end_time,
            ErrorCode::SaleNotActive
        );
        
        // Check country restrictions
        require!(
            !guardrail.blocked_countries.iter().any(|c| c == country_code.as_bytes()),
            ErrorCode::CountryBlocked
        );
        
        // Check cap
        require!(
            guardrail.total_raised_usd + amount_usd <= guardrail.max_cap_usd,
            ErrorCode::ExceedsCap
        );
        
        // Check KYC requirement
        let contributor = &ctx.accounts.contributor;
        let total_contribution = contributor.total_contribution + amount_usd;
        require!(
            total_contribution < guardrail.kyc_threshold_usd || has_kyc,
            ErrorCode::KycRequired
        );
        
        Ok(())
    }

    /// Record a contribution (for demonstration)
    pub fn record_contribution(
        ctx: Context<RecordContribution>,
        amount_usd: u64,
        country_code: String,
        has_kyc: bool,
    ) -> Result<()> {
        // First validate
        guardrail::validate_contribution(
            Context::new(
                ctx.program_id,
                &mut ValidateContribution {
                    guardrail: ctx.accounts.guardrail.clone(),
                    contributor: ctx.accounts.contributor.clone(),
                },
                &[],
                BTreeMap::new(),
            ),
            amount_usd,
            country_code,
            has_kyc,
        )?;
        
        // Then record
        let guardrail = &mut ctx.accounts.guardrail;
        let contributor = &mut ctx.accounts.contributor;
        
        contributor.total_contribution += amount_usd;
        guardrail.total_raised_usd += amount_usd;
        
        emit!(ContributionReceived {
            contributor: ctx.accounts.contributor_wallet.key(),
            amount_usd,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Guardrail::LEN,
        seeds = [b"guardrail"],
        bump
    )]
    pub guardrail: Account<'info, Guardrail>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ValidateContribution<'info> {
    #[account(seeds = [b"guardrail"], bump)]
    pub guardrail: Account<'info, Guardrail>,
    #[account(
        seeds = [b"contributor", contributor.key().as_ref()],
        bump
    )]
    pub contributor: Account<'info, Contributor>,
}

#[derive(Accounts)]
pub struct RecordContribution<'info> {
    #[account(mut, seeds = [b"guardrail"], bump)]
    pub guardrail: Account<'info, Guardrail>,
    #[account(
        init_if_needed,
        payer = contributor_wallet,
        space = 8 + Contributor::LEN,
        seeds = [b"contributor", contributor_wallet.key().as_ref()],
        bump
    )]
    pub contributor: Account<'info, Contributor>,
    #[account(mut)]
    pub contributor_wallet: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Guardrail {
    pub sale_start_time: u64,
    pub sale_end_time: u64,
    pub max_cap_usd: u64,
    pub kyc_threshold_usd: u64,
    pub total_raised_usd: u64,
    pub authority: Pubkey,
    pub blocked_countries: Vec<Vec<u8>>,
}

impl Guardrail {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 8 + 32 + 4 + (10 * 2); // Assuming max 10 countries
}

#[account]
pub struct Contributor {
    pub total_contribution: u64,
}

impl Contributor {
    pub const LEN: usize = 8;
}

#[event]
pub struct ContributionReceived {
    pub contributor: Pubkey,
    pub amount_usd: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Sale is not active")]
    SaleNotActive,
    #[msg("Country is blocked")]
    CountryBlocked,
    #[msg("Contribution exceeds sale cap")]
    ExceedsCap,
    #[msg("KYC verification required")]
    KycRequired,
}`;
}