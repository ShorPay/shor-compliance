import { Command } from 'commander';
import chalk from 'chalk';
import { KYCProviderFactory } from '@shor/compliance-sdk/src/providers/factory';
import { VerificationStatus, VerificationType } from '@shor/compliance-sdk/src/types/kyc';

export const verifyV2Command = new Command('verify')
  .description('Manage KYC/AML verifications through configured provider');

// Configure provider command
verifyV2Command
  .command('configure')
  .description('Configure KYC provider')
  .requiredOption('-p, --provider <provider>', 'KYC provider (sumsub)')
  .action(async (options) => {
    const factory = kycProviderFactory;
    const availableProviders = factory.getAvailableProviders();
    
    if (!availableProviders.includes(options.provider)) {
      console.error(chalk.red(`Invalid provider. Available: ${availableProviders.join(', ')}`));
      process.exit(1);
    }

    const requirements = factory.getProviderRequirements(options.provider);
    console.log(chalk.blue(`Configuring ${options.provider} provider...`));
    console.log(chalk.gray(`Required configuration: ${requirements.join(', ')}`));
    
    // Interactive configuration would go here
    // For now, show what's needed
    console.log(chalk.yellow(`\nTo complete configuration, add these to your environment or config:`));
    requirements.forEach(req => {
      console.log(chalk.gray(`  ${req.toUpperCase()}: your_${req}_value`));
    });
  });

// List providers command  
verifyV2Command
  .command('providers')
  .description('List available KYC providers')
  .action(async () => {
    const factory = kycProviderFactory;
    const providers = factory.getAvailableProviders();
    
    console.log(chalk.bold('Available KYC Providers:\n'));
    
    providers.forEach(provider => {
      const requirements = factory.getProviderRequirements(provider);
      console.log(chalk.blue(`  ${provider}`));
      console.log(chalk.gray(`    Configuration: ${requirements.join(', ')}`));
      console.log();
    });
  });

// Initialize verification
verifyV2Command
  .command('init')
  .description('Initialize a new verification for an address')
  .requiredOption('-a, --address <address>', 'Address to verify (Ethereum or Solana)')
  .option('-t, --type <type>', 'Verification type (individual|business)', 'individual')
  .option('-l, --level <level>', 'Verification level name', 'basic-kyc')
  .action(async (options) => {
    try {
      const provider = await kycProviderFactory.initialize();
      
      console.log(chalk.gray(`Initializing verification with ${provider.name} provider...`));

      const verificationType = options.type === 'business' 
        ? VerificationType.BUSINESS 
        : VerificationType.INDIVIDUAL;

      const result = await provider.initVerification({
        address: options.address,
        verificationType,
        levelName: options.level,
        externalUserId: options.address
      });

      console.log(chalk.green('✓ Verification initialized successfully'));
      console.log(chalk.bold('Verification ID:'), result.id);
      console.log(chalk.bold('Provider:'), result.providerData ? provider.name : 'Generic');
      if (result.verificationUrl) {
        console.log(chalk.bold('Verification URL:'), chalk.blue(result.verificationUrl));
        console.log(chalk.gray('\nShare this URL with the user to complete verification.'));
      }
    } catch (error: any) {
      console.error(chalk.red('Error initializing verification:'), error.message);
      if (error.message.includes('not configured')) {
        console.log(chalk.yellow('Run "shor verify configure --provider <provider>" first.'));
      }
      process.exit(1);
    }
  });

// Check status
verifyV2Command
  .command('status')
  .description('Check verification status for an address')
  .requiredOption('-a, --address <address>', 'Address to check')
  .action(async (options) => {
    try {
      const provider = await kycProviderFactory.initialize();
      const status = await provider.getVerificationStatus(options.address);

      console.log(chalk.bold('Verification Status:'));
      console.log(chalk.gray('Address:'), status.address);
      console.log(chalk.gray('Provider:'), provider.name);
      console.log(chalk.gray('Status:'), getStatusColor(status.status));
      console.log(chalk.gray('Type:'), status.verificationType);
      console.log(chalk.gray('ID:'), status.id);
      
      if (status.completedAt) {
        console.log(chalk.gray('Completed:'), status.completedAt.toLocaleString());
      }
      
      console.log(chalk.gray('Created:'), status.createdAt.toLocaleString());
      console.log(chalk.gray('Updated:'), status.updatedAt.toLocaleString());

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.error(chalk.yellow('No verification found for this address.'));
      } else {
        console.error(chalk.red('Error checking status:'), error.message);
      }
      process.exit(1);
    }
  });

// List verifications
verifyV2Command
  .command('list')
  .description('List all verifications')
  .option('-c, --contract <address>', 'Filter by contract address')
  .action(async (options) => {
    try {
      const provider = await kycProviderFactory.initialize();
      const verifications = await provider.listVerifications(options.contract);

      if (verifications.length === 0) {
        console.log(chalk.yellow('No verifications found.'));
        return;
      }

      console.log(chalk.bold(`Found ${verifications.length} verification(s) from ${provider.name}:\n`));
      
      verifications.forEach((v) => {
        console.log(chalk.gray('Address:'), v.address);
        console.log(chalk.gray('Status:'), getStatusColor(v.status));
        console.log(chalk.gray('Type:'), v.verificationType);
        console.log(chalk.gray('ID:'), v.id);
        console.log(chalk.gray('Updated:'), v.updatedAt.toLocaleString());
        console.log(chalk.gray('---'));
      });
    } catch (error: any) {
      console.error(chalk.red('Error listing verifications:'), error.message);
      process.exit(1);
    }
  });

// Get proof
verifyV2Command
  .command('proof')
  .description('Get cryptographic proof of verification')
  .requiredOption('-a, --address <address>', 'Address to get proof for')
  .action(async (options) => {
    try {
      const provider = await kycProviderFactory.initialize();
      const proof = await provider.getVerificationProof(options.address);

      console.log(chalk.bold('Verification Proof:'));
      console.log(JSON.stringify(proof, null, 2));
      console.log(chalk.gray(`\nThis proof from ${proof.providerName} can be used to verify status on-chain.`));
    } catch (error: any) {
      console.error(chalk.red('Error getting proof:'), error.message);
      process.exit(1);
    }
  });

function getStatusColor(status: VerificationStatus): string {
  switch (status) {
    case VerificationStatus.APPROVED:
      return chalk.green('✓ Approved');
    case VerificationStatus.IN_PROGRESS:
      return chalk.yellow('⏳ In Progress');
    case VerificationStatus.NEEDS_REVIEW:
      return chalk.yellow('⚠ Needs Review');
    case VerificationStatus.REJECTED:
      return chalk.red('✗ Rejected');
    case VerificationStatus.PENDING:
      return chalk.gray('⏸ Pending');
    default:
      return chalk.gray(status);
  }
}