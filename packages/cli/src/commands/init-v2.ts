import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { JurisdictionLoader } from '../utils/jurisdiction-loader';
import inquirer from 'inquirer';

export const initV2Command = new Command('init')
  .description('Bootstrap a new compliance project')
  .option('-j, --jurisdiction <id>', 'Use a jurisdiction template')
  .option('-l, --list', 'List available jurisdiction templates')
  .option('-i, --interactive', 'Interactive mode to select jurisdiction')
  .action(async (options) => {
    const loader = new JurisdictionLoader();

    // List jurisdictions if requested
    if (options.list) {
      console.log(chalk.bold('\nAvailable Jurisdiction Templates:\n'));
      const jurisdictions = loader.getAvailableJurisdictions();
      
      for (const j of jurisdictions) {
        console.log(chalk.blue(`  ${j.id}`));
        console.log(chalk.gray(`    ${j.description}`));
        console.log(chalk.gray(`    Framework: ${j.framework}\n`));
      }
      return;
    }

    // Interactive mode
    if (options.interactive && !options.jurisdiction) {
      const jurisdictions = loader.getAvailableJurisdictions();
      const choices = jurisdictions.map(j => ({
        name: `${j.name} - ${j.type} (${j.framework})`,
        value: j.id
      }));
      
      choices.unshift({
        name: 'Generic template (no specific jurisdiction)',
        value: 'generic'
      });

      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'jurisdiction',
          message: 'Select a compliance template:',
          choices
        }
      ]);
      
      options.jurisdiction = answer.jurisdiction;
    }

    console.log(chalk.blue('🚀 Initializing compliance project...'));

    // Create policy-library directory
    const policyLibDir = path.join(process.cwd(), 'policy-library');
    if (!fs.existsSync(policyLibDir)) {
      fs.mkdirSync(policyLibDir, { recursive: true });
    }

    // Generate compliance spec
    let complianceSpec: any;
    
    if (options.jurisdiction && options.jurisdiction !== 'generic') {
      try {
        // Use jurisdiction template
        complianceSpec = loader.generateComplianceSpec(options.jurisdiction);
        console.log(chalk.green(`✓ Using ${options.jurisdiction} compliance template`));
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        console.log(chalk.yellow('Run "shor init --list" to see available templates'));
        process.exit(1);
      }
    } else {
      // Use generic template
      complianceSpec = {
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
    }

    // Write compliance.yaml
    const complianceYamlPath = path.join(policyLibDir, 'compliance.yaml');
    if (fs.existsSync(complianceYamlPath)) {
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'compliance.yaml already exists. Overwrite?',
          default: false
        }
      ]);
      
      if (!answer.overwrite) {
        console.log(chalk.yellow('Cancelled'));
        return;
      }
    }
    
    fs.writeFileSync(complianceYamlPath, yaml.dump(complianceSpec, { lineWidth: -1 }));
    console.log(chalk.green('✓ Created compliance.yaml'));

    // Create jurisdiction-specific docs if using template
    if (options.jurisdiction && options.jurisdiction !== 'generic') {
      const docsDir = path.join(policyLibDir, 'docs');
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      const jurisdictionInfo = loader.getAvailableJurisdictions()
        .find(j => j.id === options.jurisdiction);
      
      if (jurisdictionInfo) {
        const readme = `# ${jurisdictionInfo.name} Compliance

This project uses the ${jurisdictionInfo.framework} compliance framework.

## Key Requirements

Review the generated compliance.yaml for specific requirements including:
- KYC/AML thresholds
- Geographic restrictions  
- Regulatory disclosures
- Reporting obligations

## References

${complianceSpec.metadata.references?.map((ref: string) => `- ${ref}`).join('\n') || ''}

## Next Steps

1. Review and customize the compliance.yaml file
2. Run \`shor lint\` to validate
3. Run \`shor compile --with-oracle\` to generate contracts
`;
        
        fs.writeFileSync(path.join(docsDir, 'README.md'), readme);
        console.log(chalk.green('✓ Created jurisdiction documentation'));
      }
    }

    // Write schema.json
    const schemaPath = path.join(policyLibDir, 'schema.json');
    const schema = generateDynamicSchema(complianceSpec);
    fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
    console.log(chalk.green('✓ Created schema.json'));

    console.log(chalk.blue('\n✨ Project initialized successfully!'));
    
    if (options.jurisdiction && options.jurisdiction !== 'generic') {
      console.log(chalk.yellow(`\n⚠️  Important: This template is based on ${options.jurisdiction} regulations.`));
      console.log(chalk.yellow('Please review and customize for your specific use case.'));
    }
    
    console.log(chalk.gray(`\nNext steps:
  1. Edit ${chalk.white('policy-library/compliance.yaml')} to customize your compliance rules
  2. Run ${chalk.white('shor lint')} to validate your configuration
  3. Run ${chalk.white('shor compile --with-oracle')} to generate contracts with KYC integration
  4. Run ${chalk.white('shor verify init --address <addr>')} to start KYC verification`));
  });

function generateDynamicSchema(spec: any): any {
  // Generate a schema based on the actual structure of the spec
  const schema: any = {
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
        "properties": {}
      }
    }
  };

  // Dynamically add module schemas based on the spec
  for (const [moduleName, moduleData] of Object.entries(spec.modules)) {
    schema.properties.modules.properties[moduleName] = {
      "type": "object",
      "properties": {}
    };
    
    // Add properties for each field in the module
    for (const [fieldName, fieldValue] of Object.entries(moduleData as any)) {
      const fieldType = Array.isArray(fieldValue) ? "array" : typeof fieldValue;
      schema.properties.modules.properties[moduleName].properties[fieldName] = {
        "type": fieldType
      };
    }
  }

  return schema;
}