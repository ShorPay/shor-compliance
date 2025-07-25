#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { lintCommand } from './commands/lint';
import { compileCommand } from './commands/compile';
import { exportAuditCommand } from './commands/export-audit';

const program = new Command();

program
  .name('ccac')
  .description('Compliance-as-Code CLI - Generate smart contracts and documentation from compliance specifications')
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
  .action(compileCommand);

program
  .command('export-audit')
  .description('Export audit bundle containing all artifacts')
  .option('--format <format>', 'Output format', 'zip')
  .action(exportAuditCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}