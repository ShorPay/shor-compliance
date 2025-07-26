import { Command } from 'commander';
import chalk from 'chalk';
import { createShorCompliance } from '@shor/compliance-sdk';
import { JurisdictionLoader } from '@shor/jurisdictions/src/jurisdiction-loader';

export const optionsCommand = new Command('options')
  .description('Show all available options and configurations')
  .option('--sdk', 'Show SDK configuration options')
  .option('--compile', 'Show compile command options')
  .option('--jurisdictions', 'Show available jurisdictions')
  .option('--kyc', 'Show available KYC providers')
  .action(async (options) => {
    const sdk = createShorCompliance();
    
    // If no specific option is requested, show all
    const showAll = !options.sdk && !options.compile && !options.jurisdictions && !options.kyc;
    
    if (showAll || options.sdk) {
      console.log(chalk.bold('\n📦 SDK Configuration Options:\n'));
      const configSchema = sdk.getConfigSchema();
      
      for (const [key, value] of Object.entries(configSchema)) {
        console.log(chalk.blue(`  ${key}:`));
        console.log(chalk.gray(`    Type: ${value.type}`));
        console.log(chalk.gray(`    Description: ${value.description}`));
        
        if ('options' in value) {
          console.log(chalk.gray(`    Options: ${value.options.join(', ')}`));
        }
        if ('default' in value) {
          console.log(chalk.gray(`    Default: ${value.default}`));
        }
        console.log();
      }
    }
    
    if (showAll || options.compile) {
      console.log(chalk.bold('\n⚙️  Compile Command Options:\n'));
      const compileSchema = sdk.getCompileOptionsSchema();
      
      for (const [key, value] of Object.entries(compileSchema)) {
        console.log(chalk.blue(`  --${key.replace(/([A-Z])/g, '-$1').toLowerCase()}:`));
        console.log(chalk.gray(`    Type: ${value.type}`));
        console.log(chalk.gray(`    Description: ${value.description}`));
        
        if ('options' in value) {
          console.log(chalk.gray(`    Options: ${value.options.join(', ')}`));
        }
        if ('default' in value) {
          console.log(chalk.gray(`    Default: ${value.default}`));
        }
        console.log();
      }
      
      console.log(chalk.blue('  --env:'));
      console.log(chalk.gray('    Type: string'));
      console.log(chalk.gray('    Description: Target environment'));
      console.log(chalk.gray('    Options: development, production'));
      console.log(chalk.gray('    Default: production\n'));
      
      console.log(chalk.blue('  --with-oracle:'));
      console.log(chalk.gray('    Type: boolean'));
      console.log(chalk.gray('    Description: Include Sumsub oracle integration for on-chain verification'));
      console.log(chalk.gray('    Default: false\n'));
    }
    
    if (showAll || options.jurisdictions) {
      console.log(chalk.bold('\n🏛️  Available Jurisdictions:\n'));
      try {
        const jurisdictions = await sdk.listJurisdictions();
        const loader = new JurisdictionLoader();
        const details = loader.getAvailableJurisdictions();
        
        for (const jurisdiction of jurisdictions) {
          const detail = details.find(d => d.id === jurisdiction);
          console.log(chalk.blue(`  ${jurisdiction}`));
          if (detail) {
            console.log(chalk.gray(`    Name: ${detail.name}`));
            console.log(chalk.gray(`    Framework: ${detail.framework}`));
            console.log(chalk.gray(`    Type: ${detail.type}`));
            console.log(chalk.gray(`    Description: ${detail.description}`));
          }
          console.log();
        }
      } catch (error) {
        console.log(chalk.red('    Error loading jurisdictions'));
      }
    }
    
    if (showAll || options.kyc) {
      console.log(chalk.bold('\n🔍 Available KYC Providers:\n'));
      const providers = sdk.getAvailableKYCProviders();
      
      if (providers.length === 0) {
        console.log(chalk.gray('    No KYC providers registered'));
        console.log(chalk.gray('    Note: Providers are registered when imported'));
      } else {
        for (const provider of providers) {
          console.log(chalk.blue(`  ${provider}`));
          
          // Add specific provider details if known
          if (provider === 'sumsub') {
            console.log(chalk.gray('    Description: Sumsub KYC/AML verification provider'));
            console.log(chalk.gray('    Required config: appToken, secretKey, baseURL'));
          }
          console.log();
        }
      }
    }
    
    if (showAll) {
      console.log(chalk.bold('\n💡 Usage Examples:\n'));
      console.log(chalk.gray('  # Initialize with specific jurisdiction'));
      console.log(chalk.white('  shor init --jurisdiction us-sec\n'));
      
      console.log(chalk.gray('  # Compile for Solana with oracle integration'));
      console.log(chalk.white('  shor compile --blockchain solana --with-oracle\n'));
      
      console.log(chalk.gray('  # SDK usage with custom configuration'));
      console.log(chalk.white(`  const compliance = createShorCompliance({
    jurisdiction: 'eu-mica',
    blockchain: 'ethereum',
    environment: 'production'
  });\n`));
      
      console.log(chalk.gray('  # Get help for specific commands'));
      console.log(chalk.white('  shor init --help'));
      console.log(chalk.white('  shor compile --help'));
      console.log(chalk.white('  shor verify --help\n'));
    }
  });