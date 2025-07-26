import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import archiver from 'archiver';

interface ExportOptions {
  format: string;
}

export async function exportAuditCommand(options: ExportOptions): Promise<void> {
  console.log(chalk.blue('📋 Exporting audit bundle...'));

  if (options.format !== 'zip') {
    console.error(chalk.red('✗ Only zip format is currently supported'));
    process.exit(1);
  }

  const buildDir = path.join(process.cwd(), 'build');
  const outputPath = path.join(process.cwd(), 'audit-bundle.zip');

  // Check if build directory exists
  if (!fs.existsSync(buildDir)) {
    console.error(chalk.red('✗ Build directory not found. Run "ccac compile" first.'));
    process.exit(1);
  }

  // Check for required files - detect which contract files exist
  const possibleContractFiles = ['Guardrail.sol', 'GuardrailWithVerification.sol', 'guardrail.rs', 'ComplianceGuardrail.sol', 'BasicGuardrail.sol'];
  const contractFile = possibleContractFiles.find(file => fs.existsSync(path.join(buildDir, file)));
  
  if (!contractFile) {
    console.error(chalk.red('✗ No contract file found. Expected one of:'), possibleContractFiles.join(', '));
    console.error(chalk.yellow('Run "shor compile" to generate contract files.'));
    process.exit(1);
  }
  
  const requiredFiles = [contractFile, 'policy.pdf', 'audit.json'];
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(buildDir, file))
  );

  if (missingFiles.length > 0) {
    console.error(chalk.red('✗ Missing required files:'), missingFiles.join(', '));
    console.error(chalk.yellow('Run "ccac compile" to generate all required files.'));
    process.exit(1);
  }

  try {
    // Create zip archive
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      const size = (archive.pointer() / 1024).toFixed(2);
      console.log(chalk.green(`✓ Audit bundle created: ${outputPath} (${size} KB)`));
      console.log(chalk.gray('\nBundle contents:'));
      requiredFiles.forEach(file => {
        console.log(chalk.gray(`  - ${file}`));
      });
      
      // Include test logs if they exist
      const testLogPath = path.join(process.cwd(), 'test-results.log');
      if (fs.existsSync(testLogPath)) {
        console.log(chalk.gray('  - test-results.log'));
      }
    });

    archive.on('error', (err: Error) => {
      throw err;
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add files to archive
    requiredFiles.forEach(file => {
      archive.file(path.join(buildDir, file), { name: file });
    });

    // Add policy.md if it exists
    const policyMdPath = path.join(buildDir, 'policy.md');
    if (fs.existsSync(policyMdPath)) {
      archive.file(policyMdPath, { name: 'policy.md' });
    }

    // Add test results if they exist
    const testLogPath = path.join(process.cwd(), 'test-results.log');
    if (fs.existsSync(testLogPath)) {
      archive.file(testLogPath, { name: 'test-results.log' });
    }

    // Add compliance.yaml for reference
    const complianceYamlPath = path.join(process.cwd(), 'policy-library', 'compliance.yaml');
    if (fs.existsSync(complianceYamlPath)) {
      archive.file(complianceYamlPath, { name: 'compliance.yaml' });
    }

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error(chalk.red('✗ Failed to create audit bundle:'), error);
    process.exit(1);
  }
}