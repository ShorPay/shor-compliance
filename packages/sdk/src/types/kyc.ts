/**
 * KYC/AML verification types for the Shor Compliance SDK
 */

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum VerificationType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business'
}

export interface VerificationRequest {
  address: string;
  type: VerificationType;
  level?: 'basic' | 'enhanced';
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  status: VerificationStatus;
  verificationId: string;
  reviewAnswer?: 'GREEN' | 'YELLOW' | 'RED';
  verifiedAt?: Date;
  expiresAt?: Date;
  details?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    country?: string;
    idDocument?: {
      type: string;
      number: string;
      country: string;
    };
  };
  riskScore?: number;
  rejectReasons?: string[];
}

export interface VerificationProof {
  address: string;
  verificationId: string;
  timestamp: number;
  reviewAnswer: 'GREEN' | 'YELLOW' | 'RED';
  verificationType: VerificationType;
  signature: string;
  proofData: {
    verifiedAt: number;
    expiresAt?: number;
    country?: string;
    riskScore?: number;
  };
}

export interface KYCProviderConfig {
  apiKey?: string;
  secretKey?: string;
  environment?: 'sandbox' | 'production';
  webhookUrl?: string;
  customConfig?: Record<string, any>;
}

export abstract class KYCProvider {
  protected config: KYCProviderConfig;

  constructor(config: KYCProviderConfig) {
    this.config = config;
  }

  abstract createVerification(request: VerificationRequest): Promise<VerificationResult>;
  abstract checkStatus(verificationId: string): Promise<VerificationResult>;
  abstract generateProof(verificationId: string): Promise<VerificationProof>;
  abstract getName(): string;
  
  get name(): string {
    return this.getName();
  }
  abstract isConfigured(): boolean;
}