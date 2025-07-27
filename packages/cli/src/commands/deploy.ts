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
  
  // Validate Solana wallet configuration
  const solanaPrivateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!solanaPrivateKey || solanaPrivateKey.trim() === '') {
    console.error(chalk.red('❌ Solana wallet private key not found!'));
    console.log(chalk.yellow('\nTo deploy to Solana, you need to:'));
    console.log(chalk.gray('1. Add your wallet private key to .env file:'));
    console.log('   SOLANA_PRIVATE_KEY=your-base58-encoded-private-key');
    console.log(chalk.gray('\n2. Generate a new wallet if needed:'));
    console.log('   solana-keygen new --outfile ~/.config/solana/id.json');
    console.log('   solana-keygen pubkey ~/.config/solana/id.json');
    console.log(chalk.gray('\n3. Fund your wallet:'));
    if (options.network === 'devnet') {
      console.log('   solana airdrop 2 <your-wallet-address> --url devnet');
    } else if (options.network === 'mainnet') {
      console.log('   Transfer SOL to your wallet address for deployment fees');
    }
    console.log(chalk.gray('\n4. Export private key to .env:'));
    console.log('   cat ~/.config/solana/id.json');
    console.log('   # Copy the array of numbers and convert to base58 format');
    process.exit(1);
  }
  
  // Validate private key format (basic check)
  if (solanaPrivateKey.length < 40) {
    console.error(chalk.red('❌ Invalid Solana private key format!'));
    console.log(chalk.yellow('Private key should be base58-encoded and ~44-88 characters long'));
    process.exit(1);
  }
  
  // Map network names to Solana cluster URLs
  const networkMap: { [key: string]: string } = {
    'localhost': 'http://localhost:8899',
    'devnet': 'https://api.devnet.solana.com',
    'testnet': 'https://api.testnet.solana.com',
    'mainnet': 'https://api.mainnet-beta.solana.com'
  };
  
  const clusterUrl = networkMap[options.network] || options.network;
  
  console.log(chalk.green('✓ Solana wallet configured'));
  console.log(chalk.gray(`Using network: ${clusterUrl}`));
  
  try {
    // Option 1: Try Anchor (recommended for Solana)
    console.log(chalk.gray('Checking for Anchor CLI...'));
    const anchorVersion = await execAsync('anchor --version');
    
    console.log(chalk.green('✓ Anchor found, using for deployment'));
    console.log(chalk.gray(`  Version: ${anchorVersion.stdout.trim()}`));
    
    // Create temporary Anchor project structure
    const tempDir = path.join(process.cwd(), '.temp-anchor-deploy');
    const programsDir = path.join(tempDir, 'programs', 'guardrail', 'src');
    
    // Create directory structure
    fs.mkdirSync(programsDir, { recursive: true });
    
    // Copy the generated Rust program
    const libPath = path.join(programsDir, 'lib.rs');
    fs.copyFileSync(contractPath, libPath);
    
    // Create wallet keypair file from environment variable
    const walletPath = path.join(tempDir, 'wallet.json');
    try {
      // Convert base58 private key to keypair format
      const bs58 = require('bs58');
      const privateKeyBytes = bs58.decode(solanaPrivateKey);
      fs.writeFileSync(walletPath, JSON.stringify(Array.from(privateKeyBytes)));
      console.log(chalk.gray(`✓ Created temporary wallet file`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to process private key. Ensure it\'s valid base58 format.'));
      process.exit(1);
    }

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
wallet = "${walletPath}"

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
      const solanaVersion = await execAsync('solana --version');
      
      console.log(chalk.green('✓ Solana CLI found'));
      console.log(chalk.gray(`  Version: ${solanaVersion.stdout.trim()}`));
      console.log(chalk.yellow('⚠️  Anchor not found, installing...'));
      
      await autoInstallAnchor();
      
      // Retry with Anchor after installation
      console.log(chalk.green('✓ Anchor installed, retrying deployment...'));
      return await deploySolanaProgram(contractPath, options);
      
    } catch (solanaError) {
      // Option 3: Auto-install both Solana CLI and Anchor
      console.log(chalk.yellow('\n⚠️  No Solana deployment tools found'));
      console.log(chalk.blue('🔧 Installing Solana tools automatically...\n'));
      
      await autoInstallSolanaTools();
      
      // Retry deployment after installation
      console.log(chalk.green('✅ Solana tools installed, retrying deployment...'));
      return await deploySolanaProgram(contractPath, options);
    }
  }
}

async function deployEthereumContract(contractPath: string, options: any) {
  console.log(chalk.blue(`Deploying Ethereum contract to ${options.network}...`));
  
  // Validate Ethereum wallet configuration
  const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY;
  if (!ethereumPrivateKey || ethereumPrivateKey.trim() === '') {
    console.error(chalk.red('❌ Ethereum wallet private key not found!'));
    console.log(chalk.yellow('\nTo deploy to Ethereum, you need to:'));
    console.log(chalk.gray('1. Add your wallet private key to .env file:'));
    console.log('   ETHEREUM_PRIVATE_KEY=0x1234567890abcdef...');
    console.log(chalk.gray('\n2. Generate a new wallet if needed:'));
    console.log('   # Using MetaMask: Export private key from account settings');
    console.log('   # Using CLI: npx ethereum-keygen');
    console.log(chalk.gray('\n3. Fund your wallet:'));
    if (options.network === 'localhost') {
      console.log('   # Use local testnet faucet or test accounts');
    } else if (options.network === 'goerli' || options.network === 'sepolia') {
      console.log(`   # Use ${options.network} faucet to get test ETH`);
      console.log(`   # https://faucet.quicknode.com/${options.network}`);
    } else if (options.network === 'mainnet') {
      console.log('   # Transfer ETH to your wallet address for deployment fees');
      console.log('   # Ensure sufficient ETH for gas costs (~0.01-0.1 ETH typically)');
    }
    console.log(chalk.gray('\n4. Security reminder:'));
    console.log('   # Never commit private keys to version control');
    console.log('   # Consider using hardware wallets for mainnet deployments');
    process.exit(1);
  }
  
  // Validate private key format
  if (!ethereumPrivateKey.startsWith('0x')) {
    console.error(chalk.red('❌ Invalid Ethereum private key format!'));
    console.log(chalk.yellow('Private key should start with "0x" and be 64 hex characters long'));
    console.log(chalk.gray('Example: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'));
    process.exit(1);
  }
  
  if (ethereumPrivateKey.length !== 66) { // 0x + 64 hex chars
    console.error(chalk.red('❌ Invalid Ethereum private key length!'));
    console.log(chalk.yellow('Private key should be exactly 66 characters (0x + 64 hex characters)'));
    process.exit(1);
  }
  
  // Validate hex format
  const hexPattern = /^0x[0-9a-fA-F]{64}$/;
  if (!hexPattern.test(ethereumPrivateKey)) {
    console.error(chalk.red('❌ Invalid Ethereum private key format!'));
    console.log(chalk.yellow('Private key should contain only hexadecimal characters (0-9, a-f, A-F)'));
    process.exit(1);
  }
  
  console.log(chalk.green('✓ Ethereum wallet configured'));
  console.log(chalk.gray(`Deploying to ${options.network} network`));
  
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
        // Create simple deployment script inline with wallet configuration
        const simpleDeployScript = `
require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
  // Configure wallet from environment variable
  const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('ETHEREUM_PRIVATE_KEY not found in environment variables');
  }
  
  const provider = ethers.provider;
  const wallet = new ethers.Wallet(privateKey, provider);
  
  console.log('Deploying with account:', wallet.address);
  console.log('Account balance:', (await wallet.getBalance()).toString());
  
  const Contract = await ethers.getContractFactory("Guardrail", wallet);
  const contract = await Contract.deploy();
  await contract.deployed();
  
  console.log("Guardrail deployed to:", contract.address);
  console.log("Transaction hash:", contract.deployTransaction.hash);
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

async function autoInstallSolanaTools() {
  const os = process.platform;
  const homeDir = require('os').homedir();
  
  try {
    // Check if Solana CLI is already installed
    try {
      const solanaVersion = await execAsync('solana --version');
      console.log(chalk.green('✓ Solana CLI already installed'));
      console.log(chalk.gray(`  Version: ${solanaVersion.stdout.trim()}`));
    } catch {
      console.log(chalk.gray('📦 Installing Solana CLI...'));
      
      if (os === 'darwin' || os === 'linux') {
        // Install Solana CLI
        await execAsync('sh -c "$(curl -sSfL https://release.solana.com/stable/install)"', { timeout: 300000 });
        
        // Add to PATH
        const solanaPath = `${homeDir}/.local/share/solana/install/active_release/bin`;
        process.env.PATH = `${solanaPath}:${process.env.PATH}`;
        
        console.log(chalk.green('✓ Solana CLI installed'));
        
        // Verify installation
        const newVersion = await execAsync('solana --version');
        console.log(chalk.gray(`  Version: ${newVersion.stdout.trim()}`));
        
      } else if (os === 'win32') {
        console.log(chalk.yellow('⚠️  Windows detected. Please install manually:'));
        console.log('1. Download from: https://github.com/solana-labs/solana/releases');
        console.log('2. Or use: winget install Solana.SolanaCLI');
        throw new Error('Manual installation required on Windows');
      }
    }
    
    // Check if Rust is installed (required for Anchor)
    try {
      const rustVersion = await execAsync('cargo --version');
      console.log(chalk.green('✓ Rust already installed'));
      console.log(chalk.gray(`  Version: ${rustVersion.stdout.trim()}`));
    } catch {
      console.log(chalk.gray('📦 Installing Rust...'));
      await execAsync('curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y', { timeout: 600000 });
      
      // Source cargo env
      const cargoPath = `${homeDir}/.cargo/bin`;
      process.env.PATH = `${cargoPath}:${process.env.PATH}`;
      
      const newRustVersion = await execAsync('cargo --version');
      console.log(chalk.green('✓ Rust installed'));
      console.log(chalk.gray(`  Version: ${newRustVersion.stdout.trim()}`));
    }
    
    // Install Anchor (this function has its own checks)
    await autoInstallAnchor();
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to auto-install Solana tools'));
    console.log(chalk.yellow('\nPlease install manually:'));
    console.log(chalk.gray('1. Solana CLI: sh -c "$(curl -sSfL https://release.solana.com/stable/install)"'));
    console.log(chalk.gray('2. Rust: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh'));
    console.log(chalk.gray('3. Anchor: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force'));
    throw error;
  }
}

async function autoInstallAnchor() {
  try {
    // Check if Anchor is already installed
    try {
      const anchorVersion = await execAsync('anchor --version');
      console.log(chalk.green('✓ Anchor already installed'));
      console.log(chalk.gray(`  Version: ${anchorVersion.stdout.trim()}`));
      return; // Skip installation if already present
    } catch {
      // Anchor not found, proceed with installation
    }
    
    console.log(chalk.gray('📦 Installing Anchor (this may take 5-10 minutes)...'));
    
    // Check if AVM is already installed
    try {
      await execAsync('avm --version');
      console.log(chalk.green('✓ AVM already installed'));
    } catch {
      // Install AVM (Anchor Version Manager)
      console.log(chalk.gray('  Installing AVM...'));
      await execAsync('cargo install --git https://github.com/coral-xyz/anchor avm --locked --force', { timeout: 600000 });
      console.log(chalk.green('✓ AVM installed'));
    }
    
    // Install latest Anchor
    console.log(chalk.gray('  Installing latest Anchor version...'));
    await execAsync('avm install latest', { timeout: 600000 });
    await execAsync('avm use latest', { timeout: 60000 });
    
    // Verify installation
    const finalVersion = await execAsync('anchor --version');
    console.log(chalk.green('✓ Anchor installed'));
    console.log(chalk.gray(`  Version: ${finalVersion.stdout.trim()}`));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to install Anchor'));
    console.log(chalk.yellow('Please install manually:'));
    console.log('  cargo install --git https://github.com/coral-xyz/anchor avm --locked --force');
    console.log('  avm install latest && avm use latest');
    throw error;
  }
}