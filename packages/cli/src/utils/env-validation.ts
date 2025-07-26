import chalk from 'chalk';

interface EnvRequirement {
  name: string;
  description: string;
  required: boolean;
}

export interface KYCProviderEnvRequirements {
  provider: string;
  requirements: EnvRequirement[];
}

export const KYC_PROVIDER_REQUIREMENTS: Record<string, KYCProviderEnvRequirements> = {
  sumsub: {
    provider: 'sumsub',
    requirements: [
      {
        name: 'SUMSUB_APP_TOKEN',
        description: 'Sumsub App Token from your dashboard',
        required: true
      },
      {
        name: 'SUMSUB_SECRET_KEY',
        description: 'Sumsub Secret Key from your dashboard',
        required: true
      },
      {
        name: 'SUMSUB_BASE_URL',
        description: 'Sumsub API base URL (default: https://api.sumsub.com)',
        required: false
      }
    ]
  }
};

export function validateKYCEnvironment(provider: string = 'sumsub'): boolean {
  const requirements = KYC_PROVIDER_REQUIREMENTS[provider];
  
  if (!requirements) {
    console.error(chalk.red(`✗ Unknown KYC provider: ${provider}`));
    console.log(chalk.gray(`Available providers: ${Object.keys(KYC_PROVIDER_REQUIREMENTS).join(', ')}`));
    return false;
  }

  const missingRequired: EnvRequirement[] = [];
  const missingOptional: EnvRequirement[] = [];

  requirements.requirements.forEach(req => {
    const value = process.env[req.name];
    if (!value) {
      if (req.required) {
        missingRequired.push(req);
      } else {
        missingOptional.push(req);
      }
    }
  });

  if (missingRequired.length > 0) {
    console.error(chalk.red(`✗ Missing required environment variables for ${provider} KYC provider:`));
    console.log();
    
    missingRequired.forEach(req => {
      console.log(chalk.red(`  ${req.name}`));
      console.log(chalk.gray(`    ${req.description}`));
      console.log();
    });

    console.log(chalk.yellow('To fix this, add the following to your environment:'));
    console.log();
    
    missingRequired.forEach(req => {
      console.log(chalk.white(`  export ${req.name}="your_${req.name.toLowerCase()}"`));
    });
    
    if (missingOptional.length > 0) {
      console.log();
      console.log(chalk.gray('Optional environment variables:'));
      missingOptional.forEach(req => {
        console.log(chalk.gray(`  export ${req.name}="your_${req.name.toLowerCase()}"`));
        console.log(chalk.gray(`    ${req.description}`));
      });
    }

    console.log();
    console.log(chalk.blue('Or create a .env file in your project root:'));
    console.log();
    missingRequired.forEach(req => {
      console.log(chalk.white(`  ${req.name}=your_${req.name.toLowerCase()}`));
    });
    
    console.log();
    console.log(chalk.gray('For Sumsub, get your credentials from: https://cockpit.sumsub.com/'));
    
    return false;
  }

  if (missingOptional.length > 0) {
    console.log(chalk.yellow(`⚠️  Optional environment variables not set for ${provider}:`));
    missingOptional.forEach(req => {
      console.log(chalk.gray(`  ${req.name}: ${req.description}`));
    });
    console.log();
  }

  return true;
}

export function showKYCProviderRequirements(provider?: string): void {
  if (provider) {
    const requirements = KYC_PROVIDER_REQUIREMENTS[provider];
    if (!requirements) {
      console.error(chalk.red(`✗ Unknown KYC provider: ${provider}`));
      return;
    }
    
    console.log(chalk.bold(`🔑 Environment requirements for ${provider}:`));
    console.log();
    
    requirements.requirements.forEach(req => {
      const status = process.env[req.name] ? chalk.green('✓ Set') : chalk.red('✗ Missing');
      const required = req.required ? chalk.red('[REQUIRED]') : chalk.gray('[OPTIONAL]');
      
      console.log(`  ${chalk.blue(req.name)} ${required} ${status}`);
      console.log(chalk.gray(`    ${req.description}`));
      console.log();
    });
  } else {
    console.log(chalk.bold('🔑 KYC Provider Environment Requirements:'));
    console.log();
    
    Object.values(KYC_PROVIDER_REQUIREMENTS).forEach(providerReq => {
      console.log(chalk.blue(`  ${providerReq.provider}:`));
      providerReq.requirements.forEach(req => {
        const required = req.required ? chalk.red('[REQUIRED]') : chalk.gray('[OPTIONAL]');
        console.log(`    ${req.name} ${required}`);
        console.log(chalk.gray(`      ${req.description}`));
      });
      console.log();
    });
  }
}