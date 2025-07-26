import { Command } from 'commander';
import chalk from 'chalk';
import { apiClient } from '../services/api-client';

export const verifyCommand = new Command('verify')
  .description('Manage KYC/AML verifications through Sumsub');

verifyCommand
  .command('init')
  .description('Initialize a new verification for an address')
  .requiredOption('-a, --address <address>', 'Ethereum or Solana address to verify')
  .option('-t, --type <type>', 'Verification type (individual or business)', 'individual')
  .option('-l, --level <level>', 'Verification level name', 'basic-kyc')
  .action(async (options) => {
    try {
      if (!apiClient.isConfigured()) {
        console.error(chalk.red('Error: API key not configured. Run "shor config set-api-key <key>" first.'));
        process.exit(1);
      }

      console.log(chalk.gray('Initializing verification...'));

      const result = await apiClient.initVerification({
        address: options.address,
        verificationType: options.type,
        levelName: options.level,
        externalUserId: options.address
      });

      console.log(chalk.green('✓ Verification initialized successfully'));
      console.log(chalk.bold('Applicant ID:'), result.applicantId);
      console.log(chalk.bold('Verification URL:'), chalk.blue(result.verificationUrl));
      console.log(chalk.gray('\nShare this URL with the user to complete verification.'));
    } catch (error: any) {
      console.error(chalk.red('Error initializing verification:'), error.message);
      process.exit(1);
    }
  });

verifyCommand
  .command('status')
  .description('Check verification status for an address')
  .requiredOption('-a, --address <address>', 'Address to check')
  .action(async (options) => {
    try {
      if (!apiClient.isConfigured()) {
        console.error(chalk.red('Error: API key not configured. Run "shor config set-api-key <key>" first.'));
        process.exit(1);
      }

      const status = await apiClient.getVerificationStatus(options.address);

      console.log(chalk.bold('Verification Status:'));
      console.log(chalk.gray('Address:'), status.address);
      console.log(chalk.gray('Status:'), getStatusColor(status.status));
      
      if (status.reviewResult) {
        console.log(chalk.gray('Review Result:'), getReviewColor(status.reviewResult.reviewAnswer));
        if (status.reviewResult.moderationComment) {
          console.log(chalk.gray('Comment:'), status.reviewResult.moderationComment);
        }
      }
      
      console.log(chalk.gray('Created:'), new Date(status.createdAt).toLocaleString());
      console.log(chalk.gray('Updated:'), new Date(status.updatedAt).toLocaleString());
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.error(chalk.yellow('No verification found for this address.'));
      } else {
        console.error(chalk.red('Error checking status:'), error.message);
      }
      process.exit(1);
    }
  });

verifyCommand
  .command('list')
  .description('List all verifications')
  .option('-c, --contract <address>', 'Filter by contract address')
  .action(async (options) => {
    try {
      if (!apiClient.isConfigured()) {
        console.error(chalk.red('Error: API key not configured. Run "shor config set-api-key <key>" first.'));
        process.exit(1);
      }

      const verifications = await apiClient.listVerifications(options.contract);

      if (verifications.length === 0) {
        console.log(chalk.yellow('No verifications found.'));
        return;
      }

      console.log(chalk.bold(`Found ${verifications.length} verification(s):\n`));
      
      verifications.forEach((v) => {
        console.log(chalk.gray('Address:'), v.address);
        console.log(chalk.gray('Status:'), getStatusColor(v.status));
        if (v.reviewResult) {
          console.log(chalk.gray('Result:'), getReviewColor(v.reviewResult.reviewAnswer));
        }
        console.log(chalk.gray('Updated:'), new Date(v.updatedAt).toLocaleString());
        console.log(chalk.gray('---'));
      });
    } catch (error: any) {
      console.error(chalk.red('Error listing verifications:'), error.message);
      process.exit(1);
    }
  });

verifyCommand
  .command('proof')
  .description('Get cryptographic proof of verification')
  .requiredOption('-a, --address <address>', 'Address to get proof for')
  .action(async (options) => {
    try {
      if (!apiClient.isConfigured()) {
        console.error(chalk.red('Error: API key not configured. Run "shor config set-api-key <key>" first.'));
        process.exit(1);
      }

      const proof = await apiClient.getVerificationProof(options.address);

      console.log(chalk.bold('Verification Proof:'));
      console.log(JSON.stringify(proof, null, 2));
      console.log(chalk.gray('\nThis proof can be used to verify the status on-chain.'));
    } catch (error: any) {
      console.error(chalk.red('Error getting proof:'), error.message);
      process.exit(1);
    }
  });

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.green(status);
    case 'processing':
      return chalk.yellow(status);
    case 'rejected':
      return chalk.red(status);
    default:
      return chalk.gray(status);
  }
}

function getReviewColor(answer: string): string {
  switch (answer) {
    case 'GREEN':
      return chalk.green('✓ Approved');
    case 'YELLOW':
      return chalk.yellow('⚠ Needs Review');
    case 'RED':
      return chalk.red('✗ Rejected');
    default:
      return answer;
  }
}