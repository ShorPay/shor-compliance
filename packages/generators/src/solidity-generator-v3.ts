export function generateProviderAgnosticContract(complianceData: any): string {
  const tokenSale = complianceData.modules?.token_sale;
  
  if (!tokenSale) {
    throw new Error('No token_sale module found in compliance data');
  }

  // Convert dates to timestamps
  const startTimestamp = tokenSale.start_date 
    ? Math.floor(new Date(tokenSale.start_date).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  const endTimestamp = tokenSale.end_date
    ? Math.floor(new Date(tokenSale.end_date).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
  
  // Generate blocklist mapping initialization
  const blocklistEntries = (tokenSale.blocklist || [])
    .map((country: string) => `        blockedCountries["${country}"] = true;`)
    .join('\n');

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ComplianceGuardrail
 * @notice Provider-agnostic compliance guardrail contract with KYC/AML verification
 * @dev Auto-generated from compliance.yaml specification with oracle integration
 * @dev Supports multiple KYC providers through standardized verification states
 */
contract ComplianceGuardrail {
    // Verification status enum - matches generic KYC provider interface
    enum VerificationStatus {
        PENDING,
        IN_PROGRESS, 
        APPROVED,
        REJECTED,
        NEEDS_REVIEW
    }

    enum VerificationType {
        INDIVIDUAL,
        BUSINESS
    }

    // Sale parameters
    uint256 public immutable saleStartTime;
    uint256 public immutable saleEndTime;
    uint256 public immutable maxCapUSD;
    uint256 public immutable kycThresholdUSD;
    
    // Oracle configuration
    address public oracle;
    address public owner;
    string public kycProviderName;
    
    // Verification data structure
    struct Verification {
        bool isVerified;
        uint256 verifiedAt;
        VerificationType verificationType;
        VerificationStatus status;
        string verificationId; // Provider-specific ID
        string providerName;   // Which provider verified this user
    }
    
    // Mappings
    mapping(string => bool) public blockedCountries;
    mapping(address => uint256) public contributions;
    mapping(address => Verification) public verifications;
    uint256 public totalRaisedUSD;
    
    // Events
    event ContributionReceived(address indexed contributor, uint256 amountUSD);
    event ComplianceCheckFailed(address indexed contributor, string reason);
    event VerificationUpdated(address indexed user, VerificationStatus status, string provider);
    event OracleUpdated(address indexed oldOracle, address indexed newOracle);
    event ProviderUpdated(string oldProvider, string newProvider);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle");
        _;
    }
    
    modifier onlyApproved() {
        require(verifications[msg.sender].isVerified, "Not verified");
        require(
            verifications[msg.sender].status == VerificationStatus.APPROVED,
            "Verification not approved"
        );
        _;
    }
    
    modifier onlyDuringSale() {
        require(block.timestamp >= saleStartTime, "Sale not started");
        require(block.timestamp <= saleEndTime, "Sale ended");
        _;
    }
    
    constructor(address _oracle, string memory _kycProviderName) {
        owner = msg.sender;
        oracle = _oracle;
        kycProviderName = _kycProviderName;
        
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
        address oldOracle = oracle;
        oracle = _newOracle;
        emit OracleUpdated(oldOracle, _newOracle);
    }

    /**
     * @notice Update the KYC provider name
     * @param _newProvider New provider name
     */
    function updateProvider(string memory _newProvider) external onlyOwner {
        string memory oldProvider = kycProviderName;
        kycProviderName = _newProvider;
        emit ProviderUpdated(oldProvider, _newProvider);
    }
    
    /**
     * @notice Update user verification status (called by oracle)
     * @param user User address
     * @param verified Verification status boolean
     * @param status Detailed verification status
     * @param verificationType Type of verification
     * @param verificationId Provider-specific verification ID
     * @param providerName Name of the KYC provider
     */
    function updateVerification(
        address user,
        bool verified,
        VerificationStatus status,
        VerificationType verificationType,
        string memory verificationId,
        string memory providerName
    ) external onlyOracle {
        verifications[user] = Verification({
            isVerified: verified,
            verifiedAt: block.timestamp,
            verificationType: verificationType,
            status: status,
            verificationId: verificationId,
            providerName: providerName
        });
        
        emit VerificationUpdated(user, status, providerName);
    }
    
    /**
     * @notice Check if a user is verified and approved
     * @param user User address to check
     * @return verified True if user is verified and approved
     */
    function isUserApproved(address user) public view returns (bool verified) {
        Verification memory v = verifications[user];
        return v.isVerified && v.status == VerificationStatus.APPROVED;
    }
    
    /**
     * @notice Get verification details for a user
     * @param user User address
     * @return verified Whether user is verified
     * @return verifiedAt Timestamp of verification
     * @return verificationType Type of verification
     * @return status Current verification status
     * @return verificationId Provider-specific ID
     * @return providerName Name of the provider that verified
     */
    function getVerification(address user) external view returns (
        bool verified,
        uint256 verifiedAt,
        VerificationType verificationType,
        VerificationStatus status,
        string memory verificationId,
        string memory providerName
    ) {
        Verification memory v = verifications[user];
        return (v.isVerified, v.verifiedAt, v.verificationType, v.status, v.verificationId, v.providerName);
    }
    
    /**
     * @notice Process a contribution with compliance checks
     * @param contributor Address of the contributor
     * @param amountUSD Amount in USD
     * @param country Country code of contributor
     */
    function processContribution(
        address contributor,
        uint256 amountUSD,
        string memory country
    ) external onlyDuringSale {
        // Check if country is blocked
        if (blockedCountries[country]) {
            emit ComplianceCheckFailed(contributor, "Country blocked");
            revert("Country not allowed");
        }
        
        // Check KYC requirement
        if (amountUSD >= kycThresholdUSD) {
            if (!isUserApproved(contributor)) {
                emit ComplianceCheckFailed(contributor, "KYC verification required");
                revert("KYC verification required for this amount");
            }
        }
        
        // Check max cap
        if (totalRaisedUSD + amountUSD > maxCapUSD) {
            emit ComplianceCheckFailed(contributor, "Max cap exceeded");
            revert("Maximum cap would be exceeded");
        }
        
        // Process contribution
        contributions[contributor] += amountUSD;
        totalRaisedUSD += amountUSD;
        
        emit ContributionReceived(contributor, amountUSD);
    }
    
    /**
     * @notice Batch update multiple verifications (gas optimization)
     * @param users Array of user addresses
     * @param verifications Array of verification data
     */
    function batchUpdateVerifications(
        address[] calldata users,
        Verification[] calldata verifications
    ) external onlyOracle {
        require(users.length == verifications.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < users.length; i++) {
            verifications[users[i]] = verifications[i];
            emit VerificationUpdated(users[i], verifications[i].status, verifications[i].providerName);
        }
    }
}`;
}