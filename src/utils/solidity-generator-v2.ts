export function generateSolidityContractV2(complianceData: any): string {
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
 * @title GuardrailWithVerification
 * @notice Compliance guardrail contract with Sumsub KYC/AML verification
 * @dev Auto-generated from compliance.yaml specification with oracle integration
 */
contract GuardrailWithVerification {
    // Sale parameters
    uint256 public immutable saleStartTime;
    uint256 public immutable saleEndTime;
    uint256 public immutable maxCapUSD;
    uint256 public immutable kycThresholdUSD;
    
    // Oracle configuration
    address public shorOracle;
    address public owner;
    
    // Verification data structure
    struct Verification {
        bool isVerified;
        uint256 verifiedAt;
        string verificationType; // "individual" or "business"
        string reviewAnswer; // "GREEN", "YELLOW", "RED"
    }
    
    // Mappings
    mapping(string => bool) public blockedCountries;
    mapping(address => uint256) public contributions;
    mapping(address => Verification) public verifications;
    uint256 public totalRaisedUSD;
    
    // Events
    event ContributionReceived(address indexed contributor, uint256 amountUSD);
    event ComplianceCheckFailed(address indexed contributor, string reason);
    event VerificationUpdated(address indexed user, bool verified, string reviewAnswer);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == shorOracle, "Only oracle");
        _;
    }
    
    modifier onlyVerified() {
        require(verifications[msg.sender].isVerified, "Not verified");
        require(
            keccak256(bytes(verifications[msg.sender].reviewAnswer)) == keccak256(bytes("GREEN")),
            "Verification not approved"
        );
        _;
    }
    
    constructor(address _shorOracle) {
        owner = msg.sender;
        shorOracle = _shorOracle;
        
        // Initialize sale parameters from compliance spec
        saleStartTime = ${startTimestamp};
        saleEndTime = ${endTimestamp};
        maxCapUSD = ${tokenSale.max_cap_usd};
        kycThresholdUSD = ${tokenSale.kyc_threshold_usd};
        
        // Initialize blocked countries
${blocklistEntries}
    }
    
    /**
     * @notice Update the oracle address
     * @param _newOracle New oracle address
     */
    function updateOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "Invalid oracle address");
        address oldOracle = shorOracle;
        shorOracle = _newOracle;
        emit OracleUpdated(oldOracle, _newOracle);
    }
    
    /**
     * @notice Update user verification status (called by oracle)
     * @param user User address
     * @param verified Verification status
     * @param verificationType Type of verification
     * @param reviewAnswer Review result from Sumsub
     */
    function updateVerification(
        address user,
        bool verified,
        string memory verificationType,
        string memory reviewAnswer
    ) external onlyOracle {
        verifications[user] = Verification({
            isVerified: verified,
            verifiedAt: block.timestamp,
            verificationType: verificationType,
            reviewAnswer: reviewAnswer
        });
        
        emit VerificationUpdated(user, verified, reviewAnswer);
    }
    
    /**
     * @notice Check if the sale is currently active
     */
    function isSaleActive() public view returns (bool) {
        return block.timestamp >= saleStartTime && block.timestamp <= saleEndTime;
    }
    
    /**
     * @notice Check if an address is verified
     */
    function isVerified(address user) public view returns (bool) {
        return verifications[user].isVerified && 
               keccak256(bytes(verifications[user].reviewAnswer)) == keccak256(bytes("GREEN"));
    }
    
    /**
     * @notice Get verification details for a user
     */
    function getVerification(address user) public view returns (
        bool isVerified,
        uint256 verifiedAt,
        string memory verificationType,
        string memory reviewAnswer
    ) {
        Verification memory v = verifications[user];
        return (v.isVerified, v.verifiedAt, v.verificationType, v.reviewAnswer);
    }
    
    /**
     * @notice Validate contribution against compliance rules
     * @param contributor Address of the contributor
     * @param amountUSD Contribution amount in USD
     * @param countryCode Two-letter country code of contributor
     */
    function validateContribution(
        address contributor,
        uint256 amountUSD,
        string memory countryCode
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
        
        // Check KYC requirement based on threshold
        uint256 totalContribution = contributions[contributor] + amountUSD;
        if (totalContribution >= kycThresholdUSD) {
            if (!verifications[contributor].isVerified) {
                return (false, "Verification required");
            }
            if (keccak256(bytes(verifications[contributor].reviewAnswer)) != keccak256(bytes("GREEN"))) {
                return (false, "Verification not approved");
            }
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
        string memory countryCode
    ) external onlyVerified {
        (bool valid, string memory reason) = validateContribution(
            contributor,
            amountUSD,
            countryCode
        );
        
        require(valid, reason);
        
        contributions[contributor] += amountUSD;
        totalRaisedUSD += amountUSD;
        
        emit ContributionReceived(contributor, amountUSD);
    }
}`;
}