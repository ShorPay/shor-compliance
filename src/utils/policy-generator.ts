export function generatePolicyDocument(complianceData: any): string {
  const metadata = complianceData.metadata;
  const tokenSale = complianceData.modules?.token_sale;
  
  if (!tokenSale) {
    throw new Error('No token_sale module found in compliance data');
  }

  const blocklistFormatted = tokenSale.blocklist.join(', ');
  const maxCapFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(tokenSale.max_cap_usd);
  
  const kycThresholdFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(tokenSale.kyc_threshold_usd);

  return `# ${metadata.project_name}

## ${metadata.description}

**Document Version:** ${complianceData.version}  
**Created Date:** ${metadata.created_date}  
**Generated:** ${new Date().toISOString()}

## Token Sale Compliance Rules

This document outlines the compliance requirements and restrictions for the token sale.

### 1. Sale Period

The token sale will be conducted within a strictly defined time window:

- **Start Date:** ${tokenSale.start_date}
- **End Date:** ${tokenSale.end_date}

*Contributions outside this period will be automatically rejected by the smart contract.*

### 2. Funding Cap

To ensure regulatory compliance and controlled distribution:

- **Maximum Cap:** ${maxCapFormatted}

*Once this cap is reached, no further contributions will be accepted.*

### 3. Geographic Restrictions

Due to regulatory requirements, participants from the following jurisdictions are prohibited from participating:

- **Blocked Countries:** ${blocklistFormatted}

*The smart contract will verify participant jurisdiction and reject contributions from restricted regions.*

### 4. Know Your Customer (KYC) Requirements

To comply with anti-money laundering (AML) regulations:

- **KYC Threshold:** ${kycThresholdFormatted}
- Contributors whose total contributions meet or exceed this threshold must complete KYC verification
- KYC verification must be completed before the contribution can be accepted

### 5. Compliance Enforcement

All rules are enforced through:

1. **On-chain Smart Contract:** The \`Guardrail.sol\` contract automatically validates all contributions
2. **Real-time Validation:** Each contribution is checked against all rules before acceptance
3. **Immutable Rules:** Once deployed, compliance rules cannot be modified

### 6. Audit Trail

All compliance checks and contribution attempts are recorded on-chain, providing a complete audit trail including:

- Contribution attempts (successful and failed)
- Reasons for any rejected contributions
- Timestamp of all activities

---

*This document was automatically generated from the compliance specification and represents the authoritative compliance policy for this token sale.*`;
}