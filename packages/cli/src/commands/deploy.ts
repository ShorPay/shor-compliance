import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const deployCommand = new Command('deploy')
  .description('Deploy generated Guardrail contract')
  .option('-b, --blockchain <blockchain>', 'Target blockchain (ethereum, solana)', 'solana')
  .option('-n, --network <network>', 'Target network (localhost, devnet, testnet, mainnet)', 'devnet')
  .option('-c, --contract <path>', 'Path to contract file (auto-detected based on blockchain)')
  .option('--verify', 'Verify contract on blockchain explorer')
  .action(async (options) => {
    console.log(chalk.blue(`🚀 Deploying Guardrail contract to ${options.blockchain}...`));
    
    // Auto-detect contract path based on blockchain
    const contractPath = options.contract || 
      (options.blockchain === 'solana' ? 'build/guardrail.rs' : 'build/Guardrail.sol');
    
    // Check if contract exists
    if (!fs.existsSync(contractPath)) {
      console.error(chalk.red(`Contract not found: ${contractPath}`));
      console.log(chalk.yellow(`Run "shor compile --blockchain ${options.blockchain}" first to generate the contract`));
      process.exit(1);
    }
    
    if (options.blockchain === 'solana') {
      await deploySolanaProgram(contractPath, options);
    } else {
      await deployEthereumContract(contractPath, options);
    }
  });

async function deploySolanaProgram(contractPath: string, options: any) {
  console.log(chalk.blue(`Deploying Solana program to ${options.network}...`));
  
  // Map network names to Solana cluster URLs
  const networkMap: { [key: string]: string } = {
    'localhost': 'http://localhost:8899',
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
    'mainnet': 'https://api.mainnet-beta.solana.com'
  };
  
  const clusterUrl = networkMap[options.network] || options.network;
  
  try {
    // Option 1: Try Anchor (recommended for Solana)
    console.log(chalk.gray('Checking for Anchor CLI...'));
    await execAsync('anchor --version');
    
    console.log(chalk.green('✓ Using Anchor for deployment'));
    
    // Create temporary Anchor project structure
    const tempDir = path.join(process.cwd(), '.temp-anchor-deploy');
    const programsDir = path.join(tempDir, 'programs', 'guardrail', 'src');
    
    // Create directory structure
    fs.mkdirSync(programsDir, { recursive: true });
    
    // Copy the generated Rust program
    const libPath = path.join(programsDir, 'lib.rs');
    fs.copyFileSync(contractPath, libPath);
    
    // Create minimal Anchor.toml
    const anchorToml = `[features]
resolution = true
skip-lint = false

[programs.${options.network}]
guardrail = "GuardrailProgram111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "${clusterUrl}"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"`;
    
    fs.writeFileSync(path.join(tempDir, 'Anchor.toml'), anchorToml);
    
    // Create minimal Cargo.toml
    const cargoToml = `[package]
name = "guardrail"
version = "0.1.0"
description = "Generated Solana compliance program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "guardrail"

[dependencies]
anchor-lang = "0.29.0"`;
    
    fs.writeFileSync(path.join(tempDir, 'programs', 'guardrail', 'Cargo.toml'), cargoToml);
    
    console.log(chalk.gray(`Building program...`));
    process.chdir(tempDir);
    
    const { stdout: buildOutput } = await execAsync('anchor build');
    console.log(buildOutput);
    
    console.log(chalk.gray(`Deploying to ${options.network}...`));
    const { stdout: deployOutput } = await execAsync(`anchor deploy --provider.cluster ${options.network}`);
    console.log(deployOutput);
    
    // Clean up
    process.chdir('..');
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log(chalk.green('✅ Solana program deployed successfully!'));
    
  } catch (anchorError) {
    // Option 2: Try Solana CLI
    try {
      console.log(chalk.gray('Checking for Solana CLI...'));
      await execAsync('solana --version');
      
      console.log(chalk.yellow('⚠️  Anchor not found, but Solana CLI is available'));
      console.log(chalk.white('\nTo deploy with Solana CLI, you need to:'));
      console.log(chalk.gray('1. Set up an Anchor project:'));
      console.log('   anchor init my-project');
      console.log(`   cp ${contractPath} my-project/programs/my-project/src/lib.rs`);
      console.log('   cd my-project');
      console.log('   anchor build');
      console.log(`   anchor deploy --provider.cluster ${options.network}`);
      
    } catch (solanaError) {
      // Option 3: Provide manual installation instructions
      console.log(chalk.yellow('\n⚠️  No Solana deployment tools found'));
      console.log(chalk.white('\nTo deploy your Solana program, install the required tools:'));
      
      console.log(chalk.gray('\n1. Install Solana CLI:'));
      console.log('   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"');
      
      console.log(chalk.gray('\n2. Install Anchor:'));
      console.log('   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force');
      console.log('   avm install latest');
      console.log('   avm use latest');
      
      console.log(chalk.gray('\n3. Set up wallet and deploy:'));
      console.log('   solana-keygen new');
      console.log(`   solana config set --url ${clusterUrl}`);
      console.log('   anchor init my-project');
      console.log(`   cp ${contractPath} my-project/programs/my-project/src/lib.rs`);
      console.log('   cd my-project && anchor build && anchor deploy');
    }
  }
}

async function deployEthereumContract(contractPath: string, options: any) {
  console.log(chalk.blue(`Deploying Ethereum contract to ${options.network}...`));
  
  try {
    // Option 1: Try Thirdweb (easiest)
    console.log(chalk.gray('Checking for Thirdweb CLI...'));
    await execAsync('npx thirdweb --version');
    
    console.log(chalk.green('✓ Using Thirdweb Deploy'));
    console.log(chalk.gray('This will open your browser for deployment'));
    
    const { stdout, stderr } = await execAsync(`npx thirdweb deploy ${contractPath}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    
  } catch (thirdwebError) {
    // Option 2: Try Hardhat
    try {
      console.log(chalk.gray('Checking for Hardhat...'));
      await execAsync('npx hardhat --version');
      
      // Copy contract to contracts folder
      const contractsDir = path.join(process.cwd(), 'contracts');
      if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
      }
      
      const contractName = path.basename(contractPath);
      const targetPath = path.join(contractsDir, contractName);
      fs.copyFileSync(contractPath, targetPath);
      console.log(chalk.green(`✓ Copied contract to ${targetPath}`));
      
      // Deploy with Hardhat
      console.log(chalk.blue(`Deploying to ${options.network}...`));
      const deployScript = path.join(__dirname, '../../deploy/deploy-guardrail.js');
      
      if (!fs.existsSync(deployScript)) {
        // Create simple deployment script inline
        const simpleDeployScript = `
async function main() {
  const Contract = await ethers.getContractFactory("Guardrail");
  const contract = await Contract.deploy();
  await contract.deployed();
  console.log("Guardrail deployed to:", contract.address);
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});`;
        
        fs.writeFileSync('deploy-temp.js', simpleDeployScript);
        const { stdout, stderr } = await execAsync(`npx hardhat run deploy-temp.js --network ${options.network}`);
        console.log(stdout);
        if (stderr) console.error(stderr);
        fs.unlinkSync('deploy-temp.js');
      } else {
        const { stdout, stderr } = await execAsync(`npx hardhat run ${deployScript} --network ${options.network}`);
        console.log(stdout);
        if (stderr) console.error(stderr);
      }
      
    } catch (hardhatError) {
      // Option 3: Provide manual instructions
      console.log(chalk.yellow('\n⚠️  No deployment tool found'));
      console.log(chalk.white('\nTo deploy your contract, you can:'));
      console.log(chalk.gray('\n1. Use Remix (easiest):'));
      console.log('   - Go to https://remix.ethereum.org');
      console.log(`   - Copy contract from ${contractPath}`);
      console.log('   - Deploy with MetaMask\n');
      
      console.log(chalk.gray('2. Install Thirdweb:'));
      console.log('   npm install -g @thirdweb-dev/cli');
      console.log(`   npx thirdweb deploy ${contractPath}\n`);
      
      console.log(chalk.gray('3. Install Hardhat:'));
      console.log('   npm install --save-dev hardhat @nomiclabs/hardhat-ethers');
      console.log(`   npx hardhat run deploy/deploy-guardrail.js --network ${options.network}`);
    }
  }
}