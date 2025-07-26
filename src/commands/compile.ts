import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import PDFDocument from 'pdfkit';
import { generateSolidityContract } from '../utils/solidity-generator';
import { generateSolidityContractV2 } from '../utils/solidity-generator-v2';
import { generateSolanaProgram } from '../utils/solana-generator';
import { generatePolicyDocument } from '../utils/policy-generator';
import { generatePolicyDocumentV2 } from '../utils/policy-generator-v2';

interface CompileOptions {
  env: string;
  blockchain: string;
  withOracle?: boolean;
}

export async function compileCommand(options: CompileOptions): Promise<void> {
  console.log(chalk.blue(`📦 Compiling compliance rules for ${options.blockchain} blockchain, environment: ${options.env}`));

  const policyLibDir = path.join(process.cwd(), 'policy-library');
  const complianceYamlPath = path.join(policyLibDir, 'compliance.yaml');
  const outputDir = path.join(process.cwd(), 'build');

  // Check if compliance.yaml exists
  if (!fs.existsSync(complianceYamlPath)) {
    console.error(chalk.red('✗ compliance.yaml not found. Run "ccac init" first.'));
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
        ? generateSolidityContractV2(complianceData)
        : generateSolidityContract(complianceData);
      const contractName = options.withOracle ? 'GuardrailWithVerification.sol' : 'Guardrail.sol';
      const solidityPath = path.join(outputDir, contractName);
      fs.writeFileSync(solidityPath, solidityCode);
      console.log(chalk.green(`✓ Generated ${contractName}`));
      
      if (options.withOracle) {
        console.log(chalk.yellow('⚠  Remember to deploy with the Shor oracle address'));
      }
    }

    // Generate policy document
    console.log(chalk.gray('Generating policy document...'));
    // Use V2 generator if it's a jurisdiction template
    const policyMarkdown = complianceData.metadata.jurisdiction 
      ? generatePolicyDocumentV2(complianceData)
      : generatePolicyDocument(complianceData);
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
    doc.fontSize(12).text(policyMarkdown.replace(/#+\s/g, '').replace(/\*/g, ''));
    doc.end();
    
    await new Promise<void>(resolve => stream.on('finish', resolve));
    console.log(chalk.green('✓ Generated policy.pdf'));

    // Generate audit manifest
    console.log(chalk.gray('Generating audit manifest...'));
    const contractFile = options.blockchain === 'solana' 
      ? 'guardrail.rs' 
      : (options.withOracle ? 'GuardrailWithVerification.sol' : 'Guardrail.sol');
    const auditManifest = {
      timestamp: new Date().toISOString(),
      environment: options.env,
      blockchain: options.blockchain,
      compiler_version: options.blockchain === 'solana' ? "anchor 0.29.0" : "solidity 0.8.19",
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

    console.log(chalk.blue('\n✨ Compilation complete!'));
    console.log(chalk.gray(`Output files in: ${outputDir}`));

  } catch (error) {
    console.error(chalk.red('✗ Compilation failed:'), error);
    process.exit(1);
  }
}