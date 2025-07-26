const hre = require("hardhat");

async function main() {
  console.log("Deploying Guardrail contract...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get oracle address from environment or use deployer as default
  const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address;
  console.log("Oracle address:", oracleAddress);
  
  // Get the contract factory
  const Guardrail = await hre.ethers.getContractFactory("Guardrail");
  
  // Deploy the contract with oracle address
  const guardrail = await Guardrail.deploy(oracleAddress);
  
  // Wait for deployment
  await guardrail.deployed();
  
  console.log(`Guardrail deployed to: ${guardrail.address}`);
  
  // Verify on Etherscan (if not on localhost)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await guardrail.deployTransaction.wait(5);
    
    console.log("Verifying contract on Etherscan...");
    await hre.run("verify:verify", {
      address: guardrail.address,
      constructorArguments: [oracleAddress],
    });
  }
  
  // Log deployment info
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Contract Address: ${guardrail.address}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Oracle Address: ${oracleAddress}`);
  
  // Log key parameters
  const maxCap = await guardrail.maxCapUSD();
  const kycThreshold = await guardrail.kycThresholdUSD();
  console.log(`Max Cap: $${ethers.utils.formatUnits(maxCap, 0)}`);
  console.log(`KYC Threshold: $${ethers.utils.formatUnits(kycThreshold, 0)}`);
  
  console.log("\n⚠️  IMPORTANT: Only the oracle address can update verifications!");
  console.log("To use a different oracle address, set ORACLE_ADDRESS environment variable");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });