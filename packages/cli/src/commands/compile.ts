import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import PDFDocument from 'pdfkit';
import inquirer from 'inquirer';
import { generateSolidityContract } from '@shor/generators/src/solidity-generator';
import { generateSolidityContractV2 } from '@shor/generators/src/solidity-generator-v2';
import { generateSolanaProgram } from '@shor/generators/src/solana-generator';
import { generatePolicyDocument } from '@shor/generators/src/policy-generator';

interface CompileOptions {
  env: string;
  blockchain: string;
  withOracle?: boolean;
  interactive?: boolean;
}

export async function compileCommand(options: CompileOptions): Promise<void> {
  // Interactive mode
  if (options.interactive) {
    console.log(chalk.blue('🔧 Interactive compilation mode\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'blockchain',
        message: 'Select target blockchain:',
        choices: [
          { name: 'Solana (Default)', value: 'solana' },
          { name: 'Ethereum', value: 'ethereum' }
        ],
        default: 'solana'
      },
      {
        type: 'list',
        name: 'env',
        message: 'Select target environment:',
        choices: [
          { name: 'Production (Default)', value: 'production' },
          { name: 'Development', value: 'development' }
        ],
        default: 'production'
      },
      {
        type: 'confirm',
        name: 'withOracle',
        message: 'Include KYC oracle integration for on-chain verification?',
        default: false,
        when: (answers) => answers.blockchain === 'ethereum'
      },
      {
        type: 'confirm',
        name: 'generatePdf',
        message: 'Generate PDF version of policy document?',
        default: true
      }
    ]);
    
    options.blockchain = answers.blockchain;
    options.env = answers.env;
    options.withOracle = answers.withOracle || false;
    
    console.log(chalk.gray('\n📋 Configuration Summary:'));
    console.log(chalk.gray(`  Blockchain: ${options.blockchain}`));
    console.log(chalk.gray(`  Environment: ${options.env}`));
    console.log(chalk.gray(`  Oracle Integration: ${options.withOracle ? 'Yes' : 'No'}`));
    console.log(chalk.gray(`  Generate PDF: ${answers.generatePdf ? 'Yes' : 'No'}`));
    console.log();
  }
  
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
    // Use PDF Generator enhanced enforcement indicators
    const policyMarkdown = generatePolicyDocument(complianceData);
    const policyMdPath = path.join(outputDir, 'policy.md');
    fs.writeFileSync(policyMdPath, policyMarkdown);
    console.log(chalk.green('✓ Generated policy.md'));

    // Generate PDF version with enhanced formatting
    const doc = new PDFDocument({ margin: 50 });
    const pdfPath = path.join(outputDir, 'policy.pdf');
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);
    
    // Title
    doc.fontSize(24).text('Compliance Policy Document', { align: 'center' });
    doc.moveDown();
    
    // Add enforcement legend
    doc.fontSize(14).text('Enforcement Indicators:', { underline: true });
    doc.fontSize(12)
      .text('[ON-CHAIN]: Automatically enforced by smart contract', { indent: 20 })
      .text('[OFF-CHAIN]: Manual process required', { indent: 20 })
      .text('[HYBRID]: Combination of both', { indent: 20 });
    doc.moveDown(2);
    
    // Process markdown content for PDF
    const lines = policyMarkdown.split('\n');
    for (const line of lines) {
      if (line.startsWith('# ')) {
        doc.fontSize(20).text(line.replace('# ', ''), { align: 'center' });
      } else if (line.startsWith('## ')) {
        doc.moveDown();
        doc.fontSize(16).text(line.replace('## ', ''), { underline: true });
      } else if (line.startsWith('### ')) {
        doc.fontSize(14).text(line.replace('### ', ''));
      } else if (line.startsWith('- ')) {
        doc.fontSize(11).text(line, { indent: 20 });
      } else if (line.includes('🔗') || line.includes('📋') || line.includes('🔄')) {
        // Highlight enforcement indicators
        doc.fontSize(12).fillColor('blue').text(line).fillColor('black');
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        doc.fontSize(11).font('Helvetica-Bold').text(line.replace(/\*\*/g, ''));
        doc.font('Helvetica');
      } else {
        doc.fontSize(11).text(line);
      }
    }
    
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