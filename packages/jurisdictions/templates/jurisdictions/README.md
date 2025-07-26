# Jurisdiction Compliance Templates

This directory contains pre-researched compliance templates for various jurisdictions. Each template encodes the specific regulatory requirements for that jurisdiction.

## Available Templates

### 🇺🇸 US Token Sale (`us-token-sale.yaml`)
- **Framework**: SEC Securities Act - Regulation D (506c)
- **Key Features**: Accredited investors only, Form D filing, 1-year lockup
- **Use Case**: Token sales to US accredited investors

### 🇪🇺 EU MiCA Token Sale (`eu-mica-token-sale.yaml`)
- **Framework**: Markets in Crypto-Assets Regulation (MiCA)
- **Key Features**: Whitepaper requirements, €5M threshold, ESG disclosures
- **Use Case**: Token offerings in the European Union

### 🇸🇬 Singapore Payment Token (`singapore-payment-token.yaml`)
- **Framework**: Payment Services Act 2019
- **Key Features**: MAS licensing, AML/CFT requirements, local director
- **Use Case**: Digital payment token services in Singapore

## Using Templates

### Quick Start
```bash
# Use a specific jurisdiction template
shor init --jurisdiction us-token-sale

# List all available templates
shor init --list
```

### Customization
After initializing with a template, you can customize the generated `compliance.yaml`:

1. Edit thresholds and limits
2. Add additional requirements
3. Modify geographic restrictions
4. Update disclosure requirements

## Adding New Jurisdictions

To add a new jurisdiction template:

1. Research the regulatory requirements
2. Create a new YAML file following the existing format
3. Include all mandatory fields and requirements
4. Add references to official regulations
5. Submit a PR with the new template

## Template Structure

Each template includes:

```yaml
version: "1.0"
metadata:
  jurisdiction: "Country/Region Name"
  regulation_framework: "Primary Regulation"
  references: ["Official sources"]
modules:
  token_sale:
    # Sale parameters
  investor_verification:
    # KYC/AML requirements
  reporting_requirements:
    # Regulatory reporting
  # Additional modules as needed
```

## Compliance Notice

These templates are provided as a starting point and should be reviewed by legal counsel. Regulations change frequently, and specific use cases may require additional compliance measures.