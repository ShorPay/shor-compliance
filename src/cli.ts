#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { lintCommand } from './commands/lint';
import { compileCommand } from './commands/compile';
import { exportAuditCommand } from './commands/export-audit';
import { configCommand } from './commands/config';
import { verifyCommand } from './commands/verify';

const program = new Command();

program
  .name('shor')
  .description('Shor Compliance CLI - Generate smart contracts and documentation from compliance specifications')
  .version('1.0.0');

program
  .command('init')
  .description('Bootstrap a new compliance project')
  .action(initCommand);

program
  .command('lint')
  .description('Validate compliance.yaml against schema')
  .action(lintCommand);

program
  .command('compile')
  .description('Generate smart contract, policy document, and audit manifest')
  .option('--env <environment>', 'Target environment', 'production')
  .option('--blockchain <blockchain>', 'Target blockchain (ethereum|solana)', 'ethereum')
  .option('--with-oracle', 'Include Sumsub oracle integration for on-chain verification')
  .action(compileCommand);

program
  .command('export-audit')
  .description('Export audit bundle containing all artifacts')
  .option('--format <format>', 'Output format', 'zip')
  .action(exportAuditCommand);

// Add config commands directly to program
configCommand.commands.forEach(cmd => program.addCommand(cmd));
program.addCommand(verifyCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}