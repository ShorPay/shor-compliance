import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const deployCommand = new Command('deploy')
  .description('Deploy generated Guardrail contract')
  .option('-n, --network <network>', 'Target network (localhost, goerli, mainnet, polygon)', 'localhost')
  .option('-c, --contract <path>', 'Path to contract file', 'build/Guardrail.sol')
  .option('--verify', 'Verify contract on Etherscan')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Deploying Guardrail contract...'));
    
    // Check if contract exists
    if (!fs.existsSync(options.contract)) {
      console.error(chalk.red(`Contract not found: ${options.contract}`));
      console.log(chalk.yellow('Run "shor compile" first to generate the contract'));
      process.exit(1);
    }
    
    // Check if deployment method is available
    try {
      // Option 1: Try Thirdweb (easiest)
      console.log(chalk.gray('Checking for Thirdweb CLI...'));
      await execAsync('npx thirdweb --version');
      
      console.log(chalk.green('✓ Using Thirdweb Deploy'));
      console.log(chalk.gray('This will open your browser for deployment'));
      
      const { stdout, stderr } = await execAsync(`npx thirdweb deploy ${options.contract}`);
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
        
        const contractName = path.basename(options.contract);
        const targetPath = path.join(contractsDir, contractName);
        fs.copyFileSync(options.contract, targetPath);
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
        console.log(`   - Copy contract from ${options.contract}`);
        console.log('   - Deploy with MetaMask\n');
        
        console.log(chalk.gray('2. Install Thirdweb:'));
        console.log('   npm install -g @thirdweb-dev/cli');
        console.log(`   npx thirdweb deploy ${options.contract}\n`);
        
        console.log(chalk.gray('3. Install Hardhat:'));
        console.log('   npm install --save-dev hardhat @nomiclabs/hardhat-ethers');
        console.log(`   npx hardhat run deploy/deploy-guardrail.js --network ${options.network}`);
      }
    }
  });