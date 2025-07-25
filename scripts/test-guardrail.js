const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Testing Guardrail Contract...\n");

  // Check if Guardrail.sol exists
  const contractPath = path.join(__dirname, "..", "build", "Guardrail.sol");
  if (!fs.existsSync(contractPath)) {
    console.error("❌ Guardrail.sol not found. Run 'ccac compile' first.");
    process.exit(1);
  }

  // Copy contract to Hardhat contracts directory
  const contractsDir = path.join(__dirname, "..", "contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }
  fs.copyFileSync(contractPath, path.join(contractsDir, "Guardrail.sol"));

  // Compile and deploy
  console.log("📦 Compiling contract...");
  await hre.run("compile");

  console.log("🚀 Deploying contract...");
  const Guardrail = await ethers.getContractFactory("Guardrail");
  const guardrail = await Guardrail.deploy();
  await guardrail.deployed();
  console.log(`✅ Contract deployed to: ${guardrail.address}\n`);

  // Get test accounts
  const [owner, user1, user2] = await ethers.getSigners();

  // Test results array
  const results = [];

  // Test 1: Contribution before sale window
  console.log("Test 1: Contribution before sale window");
  try {
    // Set block timestamp to before sale start
    await network.provider.send("evm_setNextBlockTimestamp", [
      Math.floor(Date.now() / 1000) - 86400 * 30 // 30 days ago
    ]);
    await network.provider.send("evm_mine");

    const [valid, reason] = await guardrail.validateContribution(
      user1.address,
      1000,
      "GB",
      false
    );
    
    if (!valid && reason === "Sale not active") {
      console.log("✅ PASS: Correctly rejected - Sale not active\n");
      results.push("Test 1: PASS - Sale window validation works");
    } else {
      console.log("❌ FAIL: Should have rejected contribution\n");
      results.push("Test 1: FAIL - Sale window validation failed");
    }
  } catch (error) {
    console.log("❌ FAIL: Error during test\n");
    results.push("Test 1: FAIL - " + error.message);
  }

  // Test 2: Contribution over the cap
  console.log("Test 2: Contribution over the cap");
  try {
    // Set block timestamp to during sale
    const saleStart = await guardrail.saleStartTime();
    await network.provider.send("evm_setNextBlockTimestamp", [
      saleStart.toNumber() + 86400 // 1 day after start
    ]);
    await network.provider.send("evm_mine");

    const maxCap = await guardrail.maxCapUSD();
    const [valid, reason] = await guardrail.validateContribution(
      user1.address,
      maxCap.add(1),
      "GB",
      true
    );
    
    if (!valid && reason === "Exceeds sale cap") {
      console.log("✅ PASS: Correctly rejected - Exceeds cap\n");
      results.push("Test 2: PASS - Cap validation works");
    } else {
      console.log("❌ FAIL: Should have rejected contribution\n");
      results.push("Test 2: FAIL - Cap validation failed");
    }
  } catch (error) {
    console.log("❌ FAIL: Error during test\n");
    results.push("Test 2: FAIL - " + error.message);
  }

  // Test 3: Contribution from blocked country
  console.log("Test 3: Contribution from blocked country");
  try {
    const [valid, reason] = await guardrail.validateContribution(
      user2.address,
      1000,
      "US", // US is in the default blocklist
      true
    );
    
    if (!valid && reason === "Country blocked") {
      console.log("✅ PASS: Correctly rejected - Country blocked\n");
      results.push("Test 3: PASS - Country restriction works");
    } else {
      console.log("❌ FAIL: Should have rejected contribution\n");
      results.push("Test 3: FAIL - Country restriction failed");
    }
  } catch (error) {
    console.log("❌ FAIL: Error during test\n");
    results.push("Test 3: FAIL - " + error.message);
  }

  // Test 4: Valid contribution
  console.log("Test 4: Valid contribution");
  try {
    await guardrail.recordContribution(
      user1.address,
      500,
      "GB",
      false
    );
    
    const contribution = await guardrail.contributions(user1.address);
    if (contribution.eq(500)) {
      console.log("✅ PASS: Contribution recorded successfully\n");
      results.push("Test 4: PASS - Valid contribution accepted");
    } else {
      console.log("❌ FAIL: Contribution not recorded correctly\n");
      results.push("Test 4: FAIL - Contribution recording failed");
    }
  } catch (error) {
    console.log("❌ FAIL: Error during test\n");
    results.push("Test 4: FAIL - " + error.message);
  }

  // Write test results to file
  const testLog = results.join("\n") + "\n\nTest completed at: " + new Date().toISOString();
  fs.writeFileSync(path.join(__dirname, "..", "test-results.log"), testLog);

  console.log("📊 Test Summary:");
  console.log("================");
  results.forEach(result => console.log(result));
  
  const passed = results.filter(r => r.includes("PASS")).length;
  const failed = results.filter(r => r.includes("FAIL")).length;
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });