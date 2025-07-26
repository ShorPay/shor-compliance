import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

interface Config {
  apiKey?: string;
  apiUrl?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.shor');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function loadConfig(): Config {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error(chalk.red('Error loading config:'), error);
  }
  return {};
}

function saveConfig(config: Config): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red('Error saving config:'), error);
    throw error;
  }
}

export const configCommand = new Command('config')
  .description('Configure Shor CLI settings')
  .command('set-api-key <key>')
  .description('Set the API key for Shor backend')
  .action((key: string) => {
    const config = loadConfig();
    config.apiKey = key;
    saveConfig(config);
    console.log(chalk.green('✓ API key saved successfully'));
  });

configCommand
  .command('set-api-url <url>')
  .description('Set the API URL for Shor backend (default: https://api.shor.xyz)')
  .action((url: string) => {
    const config = loadConfig();
    config.apiUrl = url;
    saveConfig(config);
    console.log(chalk.green(`✓ API URL set to: ${url}`));
  });

configCommand
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const config = loadConfig();
    console.log(chalk.bold('Current Configuration:'));
    console.log(chalk.gray('API Key:'), config.apiKey ? chalk.green('***' + config.apiKey.slice(-4)) : chalk.yellow('Not set'));
    console.log(chalk.gray('API URL:'), config.apiUrl || chalk.gray('https://api.shor.xyz (default)'));
  });