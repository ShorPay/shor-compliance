const hre = require("hardhat");

async function main() {
  console.log("Deploying Guardrail contract...");
  
  // Get the contract factory
  const Guardrail = await hre.ethers.getContractFactory("Guardrail");
  
  // Deploy the contract
  const guardrail = await Guardrail.deploy();
  
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
      constructorArguments: [],
    });
  }
  
  // Log deployment info
  console.log("\n=== Deployment Summary ===");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Contract Address: ${guardrail.address}`);
  console.log(`Deployer: ${(await hre.ethers.getSigners())[0].address}`);
  
  // Log key parameters
  const maxCap = await guardrail.maxCapUSD();
  const kycThreshold = await guardrail.kycThresholdUSD();
  console.log(`Max Cap: $${ethers.utils.formatUnits(maxCap, 0)}`);
  console.log(`KYC Threshold: $${ethers.utils.formatUnits(kycThreshold, 0)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });