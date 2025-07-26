/**
 * User Choice Workflows
 * Demonstrates different ways users can work with compliance specifications
 */

import { createShorCompliance, ComplianceSpec } from '@shor/compliance-sdk';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';

// Workflow 1: Start from a jurisdiction template
async function templateWorkflow() {
  console.log('\n=== Template-Based Workflow ===\n');
  
  const compliance = createShorCompliance();
  
  // List available templates
  const jurisdictions = await compliance.listJurisdictions();
  console.log('Available templates:', jurisdictions);
  
  // Load a template
  const spec = await compliance.loadJurisdiction('us-sec');
  
  // Customize it
  spec.metadata.project_name = 'My DeFi Protocol';
  spec.modules.token_sale!.max_cap_usd = 30000000;
  spec.modules.token_sale!.min_investment_usd = 50000;
  
  // Save customized version
  await compliance.saveToFile(spec, './my-compliance.yaml');
  console.log('✓ Saved customized compliance spec to my-compliance.yaml');
  
  return spec;
}

// Workflow 2: Load existing user YAML
async function existingYamlWorkflow() {
  console.log('\n=== Existing YAML Workflow ===\n');
  
  const compliance = createShorCompliance();
  
  try {
    // Load user's existing file
    const spec = await compliance.loadFromFile('./compliance.yaml');
    console.log('✓ Loaded compliance.yaml');
    console.log('  Project:', spec.metadata.project_name);
    console.log('  Jurisdiction:', spec.metadata.jurisdiction);
    
    // Make modifications if needed
    if (!spec.modules.token_sale?.kyc_threshold_usd) {
      console.log('Adding KYC threshold...');
      spec.modules.token_sale = {
        ...spec.modules.token_sale,
        kyc_threshold_usd: 10000
      };
    }
    
    return spec;
  } catch (error) {
    console.error('Error loading file:', error.message);
    throw error;
  }
}

// Workflow 3: Build from scratch
async function scratchWorkflow() {
  console.log('\n=== Build From Scratch Workflow ===\n');
  
  const compliance = createShorCompliance();
  
  // Start with empty spec
  const spec = compliance.createEmptySpec();
  
  // Build it step by step
  spec.metadata = {
    project_name: 'Custom Token Sale',
    description: 'Built from scratch',
    jurisdiction: 'United States',
    regulation_framework: 'Custom Framework',
    created_date: new Date().toISOString().split('T')[0]
  };
  
  spec.modules = {
    token_sale: {
      max_cap_usd: 25000000,
      min_investment_usd: 100000,
      kyc_threshold_usd: 0,
      accredited_only: true,
      blocklist: ['KP', 'IR', 'CU'],
      lockup_days: 180
    },
    investor_verification: {
      accredited_verification_required: true,
      bad_actor_check_required: true
    }
  };
  
  console.log('✓ Built compliance spec from scratch');
  return spec;
}

// Workflow 4: Interactive builder
async function interactiveWorkflow() {
  console.log('\n=== Interactive Builder Workflow ===\n');
  
  const compliance = createShorCompliance();
  
  // Ask user how they want to start
  const { startingPoint } = await inquirer.prompt([
    {
      type: 'list',
      name: 'startingPoint',
      message: 'How would you like to create your compliance spec?',
      choices: [
        { name: 'Start from a jurisdiction template', value: 'template' },
        { name: 'Load my existing compliance.yaml', value: 'existing' },
        { name: 'Create from scratch', value: 'scratch' }
      ]
    }
  ]);
  
  let spec: ComplianceSpec;
  
  switch (startingPoint) {
    case 'template':
      const { jurisdiction } = await inquirer.prompt([
        {
          type: 'list',
          name: 'jurisdiction',
          message: 'Select jurisdiction:',
          choices: await compliance.listJurisdictions()
        }
      ]);
      spec = await compliance.loadJurisdiction(jurisdiction);
      break;
      
    case 'existing':
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Path to your compliance.yaml:',
          default: './compliance.yaml'
        }
      ]);
      spec = await compliance.loadFromFile(filePath);
      break;
      
    case 'scratch':
      spec = compliance.createEmptySpec();
      break;
  }
  
  // Now customize it interactively
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: spec.metadata.project_name || 'My Token Sale'
    },
    {
      type: 'number',
      name: 'maxCap',
      message: 'Maximum raise (USD):',
      default: spec.modules.token_sale?.max_cap_usd || 50000000
    },
    {
      type: 'number',
      name: 'minInvestment',
      message: 'Minimum investment (USD):',
      default: spec.modules.token_sale?.min_investment_usd || 10000
    },
    {
      type: 'confirm',
      name: 'requireKYC',
      message: 'Require KYC for all investors?',
      default: (spec.modules.token_sale?.kyc_threshold_usd || 0) === 0
    },
    {
      type: 'confirm',
      name: 'saveToFile',
      message: 'Save to compliance.yaml?',
      default: true
    }
  ]);
  
  // Update spec with answers
  spec.metadata.project_name = answers.projectName;
  spec.modules.token_sale = {
    ...spec.modules.token_sale,
    max_cap_usd: answers.maxCap,
    min_investment_usd: answers.minInvestment,
    kyc_threshold_usd: answers.requireKYC ? 0 : 10000
  };
  
  if (answers.saveToFile) {
    await compliance.saveToFile(spec, './compliance.yaml');
    console.log('✓ Saved to compliance.yaml');
  }
  
  return spec;
}

// Workflow 5: CLI integration
async function cliWorkflow() {
  console.log('\n=== CLI Integration Workflow ===\n');
  
  console.log('The CLI provides multiple ways to work with compliance specs:\n');
  
  console.log('1. Initialize from template:');
  console.log('   $ shor init --jurisdiction us-sec\n');
  
  console.log('2. Initialize interactively:');
  console.log('   $ shor init --interactive\n');
  
  console.log('3. Use existing compliance.yaml:');
  console.log('   $ shor compile  # uses ./compliance.yaml by default\n');
  
  console.log('4. Specify custom YAML file:');
  console.log('   $ shor compile --config ./my-custom-compliance.yaml\n');
  
  console.log('5. Build interactively:');
  console.log('   $ shor build  # step-by-step builder\n');
}

// Main example runner
async function main() {
  console.log('=== Shor Compliance: User Choice Examples ===\n');
  console.log('Users can choose how they want to work with compliance specs:\n');
  
  const { workflow } = await inquirer.prompt([
    {
      type: 'list',
      name: 'workflow',
      message: 'Select a workflow to try:',
      choices: [
        { name: 'Start from jurisdiction template', value: 'template' },
        { name: 'Load existing YAML file', value: 'existing' },
        { name: 'Build from scratch', value: 'scratch' },
        { name: 'Interactive builder', value: 'interactive' },
        { name: 'View CLI options', value: 'cli' }
      ]
    }
  ]);
  
  try {
    let spec: ComplianceSpec | undefined;
    
    switch (workflow) {
      case 'template':
        spec = await templateWorkflow();
        break;
      case 'existing':
        spec = await existingYamlWorkflow();
        break;
      case 'scratch':
        spec = await scratchWorkflow();
        break;
      case 'interactive':
        spec = await interactiveWorkflow();
        break;
      case 'cli':
        await cliWorkflow();
        break;
    }
    
    if (spec) {
      console.log('\n=== Final Compliance Spec ===');
      console.log('Version:', spec.version);
      console.log('Project:', spec.metadata.project_name);
      console.log('Modules:', Object.keys(spec.modules));
      
      // Now compile it
      console.log('\n=== Compilation ===');
      const compliance = createShorCompliance();
      const result = await compliance.compile(spec);
      console.log('Generated:', Object.keys(result.contracts), Object.keys(result.documents));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Export for testing
export {
  templateWorkflow,
  existingYamlWorkflow,
  scratchWorkflow,
  interactiveWorkflow,
  cliWorkflow
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}