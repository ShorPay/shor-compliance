#!/usr/bin/env node

// Must load environment variables FIRST, before any other imports
require('dotenv').config();

import { Command } from 'commander';
import chalk from 'chalk';
import { initV2Command } from './commands/init-v2';
import { lintCommand } from './commands/lint';
import { compileCommand } from './commands/compile';
import { exportAuditCommand } from './commands/export-audit';
import { deployCommand } from './commands/deploy';
import { configCommand } from './commands/config';
import { verifyV2Command } from './commands/verify';
import { optionsCommand } from './commands/options';

const program = new Command();

program
  .name('shor')
  .description('Shor Compliance CLI - Generate smart contracts and documentation from compliance specifications')
  .version('1.0.0');

program.addCommand(initV2Command);

program
  .command('lint')
  .description('Validate compliance.yaml against schema')
  .action(lintCommand);

program
  .command('compile')
  .description('Generate smart contract, policy document, and audit manifest')
  .option('--env <environment>', 'Target environment', 'production')
  .option('--blockchain <blockchain>', 'Target blockchain (ethereum|solana)', 'solana')
  .option('--with-oracle', 'Include Sumsub oracle integration for on-chain verification')
  .option('-i, --interactive', 'Interactive mode to configure compilation options')
  .action(compileCommand);

program
  .command('export-audit')
  .description('Export audit bundle containing all artifacts')
  .option('--format <format>', 'Output format', 'zip')
  .action(exportAuditCommand);

program.addCommand(deployCommand);

// Add config commands directly to program
configCommand.commands.forEach(cmd => program.addCommand(cmd));
program.addCommand(verifyV2Command);
program.addCommand(optionsCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}