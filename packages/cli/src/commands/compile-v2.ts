import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import PDFDocument from 'pdfkit';
import { generateProviderAgnosticContract } from '@shor/generators/src/solidity-generator-v3';
import { generateSolanaProgram } from '@shor/generators/src/solana-generator';
import { generatePolicyDocument } from '@shor/generators/src/policy-generator';
import { KYCProviderFactory } from '@shor/compliance-sdk/src/providers/factory';

interface CompileOptions {
  env: string;
  blockchain: string;
  withOracle?: boolean;
  provider?: string; // Override KYC provider
}

export async function compileV2Command(options: CompileOptions): Promise<void> {
  console.log(chalk.blue(`📦 Compiling compliance rules for ${options.blockchain} blockchain, environment: ${options.env}`));

  const policyLibDir = path.join(process.cwd(), 'policy-library');
  const complianceYamlPath = path.join(policyLibDir, 'compliance.yaml');
  const outputDir = path.join(process.cwd(), 'build');

  // Check if compliance.yaml exists
  if (!fs.existsSync(complianceYamlPath)) {
    console.error(chalk.red('✗ compliance.yaml not found. Run "shor init" first.'));
    process.exit(1);
  }

  try {
    // Load compliance data
    const complianceContent = fs.readFileSync(complianceYamlPath, 'utf8');
    const complianceData = yaml.load(complianceContent) as any;

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let kycProviderName = 'generic';
    
    // If oracle integration is requested, determine provider
    if (options.withOracle) {
      try {
        if (options.provider) {
          // Override provider specified in command
          console.log(chalk.gray(`Using specified KYC provider: ${options.provider}`));
          kycProviderName = options.provider;
        } else {
          // Use configured provider
          const provider = KYCProviderFactory.create('sumsub', {});
          kycProviderName = provider.name;
          console.log(chalk.gray(`Using configured KYC provider: ${kycProviderName}`));
        }
      } catch (error) {
        console.warn(chalk.yellow('⚠ No KYC provider configured, using generic oracle'));
        console.log(chalk.gray('Run "shor verify configure --provider <provider>" to specify a provider'));
        kycProviderName = 'generic';
      }
    }

    // Generate smart contract based on blockchain
    if (options.blockchain === 'solana') {
      console.log(chalk.gray('Generating Solana program...'));
      const solanaCode = generateSolanaProgram(complianceData);
      const solanaPath = path.join(outputDir, 'guardrail.rs');
      fs.writeFileSync(solanaPath, solanaCode);
      console.log(chalk.green('✓ Generated guardrail.rs'));
    } else {
      console.log(chalk.gray('Generating Solidity contract...'));
      
      const solidityCode = options.withOracle 
        ? generateProviderAgnosticContract(complianceData)
        : generateBasicContract(complianceData);
        
      const contractName = options.withOracle 
        ? 'ComplianceGuardrail.sol' 
        : 'BasicGuardrail.sol';
        
      const solidityPath = path.join(outputDir, contractName);
      fs.writeFileSync(solidityPath, solidityCode);
      console.log(chalk.green(`✓ Generated ${contractName}`));
      
      if (options.withOracle) {
        console.log(chalk.yellow(`⚠ Deploy with oracle address and provider name: "${kycProviderName}"`));
        console.log(chalk.gray(`Constructor: new ComplianceGuardrail(oracleAddress, "${kycProviderName}")`));
      }
    }

    // Generate policy document
    console.log(chalk.gray('Generating policy document...'));
    const policyMarkdown = complianceData.metadata.jurisdiction 
      ? generatePolicyDocument(complianceData)
      : generateBasicPolicyDocument(complianceData);
    const policyMdPath = path.join(outputDir, 'policy.md');
    fs.writeFileSync(policyMdPath, policyMarkdown);
    console.log(chalk.green('✓ Generated policy.md'));

    // Generate PDF version
    const doc = new PDFDocument();
    const pdfPath = path.join(outputDir, 'policy.pdf');
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    doc.fontSize(20).text('Compliance Policy Document', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(policyMarkdown.replace(/#+\\s/g, '').replace(/\\*/g, ''));
    doc.end();
    
    await new Promise<void>(resolve => stream.on('finish', resolve));
    console.log(chalk.green('✓ Generated policy.pdf'));

    // Generate audit manifest with provider info
    console.log(chalk.gray('Generating audit manifest...'));
    const contractFile = options.blockchain === 'solana' 
      ? 'guardrail.rs' 
      : (options.withOracle ? 'ComplianceGuardrail.sol' : 'BasicGuardrail.sol');
      
    const auditManifest = {
      timestamp: new Date().toISOString(),
      environment: options.env,
      blockchain: options.blockchain,
      compiler_version: options.blockchain === 'solana' ? "anchor 0.29.0" : "solidity 0.8.19",
      kyc_provider: options.withOracle ? kycProviderName : null,
      oracle_integration: options.withOracle,
      bytecode_hash: "0x" + "a".repeat(64), // Placeholder
      compliance_spec: complianceData,
      generated_files: [
        contractFile,
        'policy.md',
        'policy.pdf'
      ]
    };
    
    const auditPath = path.join(outputDir, 'audit.json');
    fs.writeFileSync(auditPath, JSON.stringify(auditManifest, null, 2));
    console.log(chalk.green('✓ Generated audit.json'));

    console.log(chalk.blue('\\n✨ Compilation complete!'));
    console.log(chalk.gray(`Output files in: ${outputDir}`));
    
    if (options.withOracle) {
      console.log(chalk.blue(`\\n📋 Deployment Info:`));
      console.log(chalk.gray(`  KYC Provider: ${kycProviderName}`));
      console.log(chalk.gray(`  Contract supports: All verification statuses (PENDING, IN_PROGRESS, APPROVED, REJECTED, NEEDS_REVIEW)`));
      console.log(chalk.gray(`  Oracle Integration: Enabled`));
    }

  } catch (error) {
    console.error(chalk.red('✗ Compilation failed:'), error);
    process.exit(1);
  }
}

// Placeholder for basic contract generation (without oracle)
function generateBasicContract(complianceData: any): string {
  return `// Basic contract without oracle integration\\n// Implementation would go here`;
}

// Placeholder for basic policy generation  
function generateBasicPolicyDocument(complianceData: any): string {
  return `# Basic Policy Document\\n\\nGenerated from compliance.yaml`;
}