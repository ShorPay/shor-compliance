import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export function lintCommand(): void {
  console.log(chalk.blue('🔍 Validating compliance configuration...'));

  const policyLibDir = path.join(process.cwd(), 'policy-library');
  const complianceYamlPath = path.join(policyLibDir, 'compliance.yaml');
  const schemaPath = path.join(policyLibDir, 'schema.json');

  // Check if files exist
  if (!fs.existsSync(complianceYamlPath)) {
    console.error(chalk.red('✗ compliance.yaml not found. Run "ccac init" first.'));
    process.exit(1);
  }

  if (!fs.existsSync(schemaPath)) {
    console.error(chalk.red('✗ schema.json not found. Run "ccac init" first.'));
    process.exit(1);
  }

  try {
    // Load compliance.yaml
    const complianceContent = fs.readFileSync(complianceYamlPath, 'utf8');
    const complianceData = yaml.load(complianceContent);

    // Load schema
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);

    // Validate
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(complianceData);

    if (valid) {
      console.log(chalk.green('✓ compliance.yaml is valid'));
      
      // Additional semantic validations
      const tokenSale = (complianceData as any).modules?.token_sale;
      if (tokenSale) {
        const startDate = new Date(tokenSale.start_date);
        const endDate = new Date(tokenSale.end_date);
        
        if (endDate <= startDate) {
          console.warn(chalk.yellow('⚠️  Warning: end_date should be after start_date'));
        }
        
        if (tokenSale.kyc_threshold_usd > tokenSale.max_cap_usd) {
          console.warn(chalk.yellow('⚠️  Warning: kyc_threshold_usd exceeds max_cap_usd'));
        }
      }
    } else {
      console.error(chalk.red('✗ Validation failed:'));
      validate.errors?.forEach((error) => {
        const field = error.instancePath || error.schemaPath;
        console.error(chalk.red(`  - ${field}: ${error.message}`));
        if (error.params) {
          console.error(chalk.gray(`    ${JSON.stringify(error.params)}`));
        }
      });
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('✗ Error reading or parsing files:'), error);
    process.exit(1);
  }
}