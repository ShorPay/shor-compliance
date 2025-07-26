// Generic KYC Provider Interface
export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', 
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review'
}

export enum VerificationType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business'
}

export interface VerificationRequest {
  address: string;
  verificationType: VerificationType;
  levelName?: string;
  externalUserId?: string;
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  id: string;
  address: string;
  status: VerificationStatus;
  verificationType: VerificationType;
  verificationUrl?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  providerData?: Record<string, any>; // Provider-specific data
}

export interface VerificationProof {
  address: string;
  verified: boolean;
  timestamp: number;
  signature: string;
  verificationId: string;
  providerName: string;
}

export interface KYCProviderConfig {
  [key: string]: any;
}

export abstract class KYCProvider {
  abstract readonly name: string;
  abstract readonly supportedTypes: VerificationType[];

  // Core verification methods
  abstract initVerification(request: VerificationRequest): Promise<VerificationResult>;
  abstract getVerificationStatus(address: string): Promise<VerificationResult>;
  abstract getVerificationProof(address: string): Promise<VerificationProof>;
  abstract listVerifications(contractAddress?: string): Promise<VerificationResult[]>;

  // Configuration
  abstract isConfigured(): boolean;
  abstract configure(config: Record<string, any>): void;

  // Webhook handling (optional)
  validateWebhook?(payload: any, signature: string): boolean;
  processWebhook?(payload: any): Promise<VerificationResult>;
}