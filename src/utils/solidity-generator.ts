export function generateSolidityContract(complianceData: any): string {
  const tokenSale = complianceData.modules?.token_sale;
  
  if (!tokenSale) {
    throw new Error('No token_sale module found in compliance data');
  }

  // Convert dates to timestamps
  const startTimestamp = Math.floor(new Date(tokenSale.start_date).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(tokenSale.end_date).getTime() / 1000);
  
  // Generate blocklist mapping initialization
  const blocklistEntries = tokenSale.blocklist
    .map((country: string) => `        blockedCountries["${country}"] = true;`)
    .join('\n');

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Guardrail
 * @notice Compliance guardrail contract for token sale
 * @dev Auto-generated from compliance.yaml specification
 */
contract Guardrail {
    uint256 public immutable saleStartTime;
    uint256 public immutable saleEndTime;
    uint256 public immutable maxCapUSD;
    uint256 public immutable kycThresholdUSD;
    
    mapping(string => bool) public blockedCountries;
    mapping(address => uint256) public contributions;
    uint256 public totalRaisedUSD;
    
    event ContributionReceived(address indexed contributor, uint256 amountUSD);
    event ComplianceCheckFailed(address indexed contributor, string reason);
    
    constructor() {
        // Initialize sale parameters from compliance spec
        saleStartTime = ${startTimestamp};
        saleEndTime = ${endTimestamp};
        maxCapUSD = ${tokenSale.max_cap_usd};
        kycThresholdUSD = ${tokenSale.kyc_threshold_usd};
        
        // Initialize blocked countries
${blocklistEntries}
    }
    
    /**
     * @notice Check if the sale is currently active
     */
    function isSaleActive() public view returns (bool) {
        return block.timestamp >= saleStartTime && block.timestamp <= saleEndTime;
    }
    
    /**
     * @notice Validate contribution against compliance rules
     * @param contributor Address of the contributor
     * @param amountUSD Contribution amount in USD
     * @param countryCode Two-letter country code of contributor
     * @param hasKYC Whether contributor has completed KYC
     */
    function validateContribution(
        address contributor,
        uint256 amountUSD,
        string memory countryCode,
        bool hasKYC
    ) public view returns (bool, string memory) {
        // Check sale window
        if (!isSaleActive()) {
            return (false, "Sale not active");
        }
        
        // Check country restrictions
        if (blockedCountries[countryCode]) {
            return (false, "Country blocked");
        }
        
        // Check cap
        if (totalRaisedUSD + amountUSD > maxCapUSD) {
            return (false, "Exceeds sale cap");
        }
        
        // Check KYC requirement
        uint256 totalContribution = contributions[contributor] + amountUSD;
        if (totalContribution >= kycThresholdUSD && !hasKYC) {
            return (false, "KYC required");
        }
        
        return (true, "");
    }
    
    /**
     * @notice Record a contribution (only for demonstration)
     * @dev In production, this would be called by the token sale contract
     */
    function recordContribution(
        address contributor,
        uint256 amountUSD,
        string memory countryCode,
        bool hasKYC
    ) external {
        (bool valid, string memory reason) = validateContribution(
            contributor,
            amountUSD,
            countryCode,
            hasKYC
        );
        
        require(valid, reason);
        
        contributions[contributor] += amountUSD;
        totalRaisedUSD += amountUSD;
        
        emit ContributionReceived(contributor, amountUSD);
    }
}`;
}