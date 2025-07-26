import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';

const defaultComplianceYaml = {
  version: '1.0',
  metadata: {
    project_name: 'Token Sale Compliance',
    description: 'Compliance rules for token sale',
    created_date: new Date().toISOString().split('T')[0]
  },
  modules: {
    token_sale: {
      start_date: '2024-03-01',
      end_date: '2024-06-01',
      max_cap_usd: 5000000,
      kyc_threshold_usd: 1000,
      blocklist: ['US', 'CN', 'IR']
    }
  }
};

const schema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "metadata", "modules"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$"
    },
    "metadata": {
      "type": "object",
      "required": ["project_name", "description", "created_date"],
      "properties": {
        "project_name": { "type": "string" },
        "description": { "type": "string" },
        "created_date": { 
          "type": "string",
          "format": "date"
        }
      }
    },
    "modules": {
      "type": "object",
      "properties": {
        "token_sale": {
          "type": "object",
          "required": ["start_date", "end_date", "max_cap_usd", "kyc_threshold_usd", "blocklist"],
          "properties": {
            "start_date": { 
              "type": "string",
              "format": "date"
            },
            "end_date": { 
              "type": "string",
              "format": "date"
            },
            "max_cap_usd": {
              "type": "number",
              "minimum": 0
            },
            "kyc_threshold_usd": {
              "type": "number",
              "minimum": 0
            },
            "blocklist": {
              "type": "array",
              "items": {
                "type": "string",
                "pattern": "^[A-Z]{2}$"
              }
            }
          }
        }
      }
    }
  }
};

export function initCommand(): void {
  console.log(chalk.blue('🚀 Initializing compliance project...'));

  // Create policy-library directory
  const policyLibDir = path.join(process.cwd(), 'policy-library');
  if (!fs.existsSync(policyLibDir)) {
    fs.mkdirSync(policyLibDir, { recursive: true });
  }

  // Write compliance.yaml
  const complianceYamlPath = path.join(policyLibDir, 'compliance.yaml');
  if (fs.existsSync(complianceYamlPath)) {
    console.log(chalk.yellow('⚠️  compliance.yaml already exists'));
  } else {
    fs.writeFileSync(complianceYamlPath, yaml.dump(defaultComplianceYaml));
    console.log(chalk.green('✓ Created compliance.yaml'));
  }

  // Write schema.json
  const schemaPath = path.join(policyLibDir, 'schema.json');
  if (fs.existsSync(schemaPath)) {
    console.log(chalk.yellow('⚠️  schema.json already exists'));
  } else {
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
    console.log(chalk.green('✓ Created schema.json'));
  }

  console.log(chalk.blue('\n✨ Project initialized successfully!'));
  console.log(chalk.gray(`\nNext steps:
  1. Edit ${chalk.white('policy-library/compliance.yaml')} to define your compliance rules
  2. Run ${chalk.white('shor lint')} to validate your configuration
  3. Run ${chalk.white('shor compile')} to generate contracts and documentation`));
}