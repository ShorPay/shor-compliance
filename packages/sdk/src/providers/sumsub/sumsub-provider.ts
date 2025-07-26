import axios, { AxiosInstance } from 'axios';
import { KYCProvider, VerificationRequest, VerificationResult, VerificationStatus, VerificationType, VerificationProof } from '../kyc-provider';

export class SumsubProvider extends KYCProvider {
  readonly name = 'sumsub';
  readonly supportedTypes = [VerificationType.INDIVIDUAL, VerificationType.BUSINESS];
  
  private client: AxiosInstance;
  private apiKey?: string;
  private appToken?: string;
  private secretKey?: string;

  constructor() {
    super();
    this.client = axios.create({
      baseURL: 'https://api.sumsub.com'
    });
  }

  configure(config: Record<string, any>): void {
    this.apiKey = config.apiKey;
    this.appToken = config.appToken;
    this.secretKey = config.secretKey;
    
    this.client.defaults.headers.common['X-App-Token'] = this.appToken;
    this.client.defaults.headers.common['X-API-Key'] = this.apiKey;
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.appToken && this.secretKey);
  }

  async initVerification(request: VerificationRequest): Promise<VerificationResult> {
    const response = await this.client.post('/resources/applicants', {
      externalUserId: request.address,
      type: request.verificationType,
      levelName: request.levelName || 'basic-kyc-level'
    });

    const applicant = response.data;
    
    // Get access token for verification URL
    const tokenResponse = await this.client.post(`/resources/accessTokens?userId=${applicant.id}`, {
      levelName: request.levelName || 'basic-kyc-level'
    });

    return {
      id: applicant.id,
      address: request.address,
      status: this.mapSumsubStatus(applicant.review?.reviewStatus),
      verificationType: request.verificationType,
      verificationUrl: `https://cockpit.sumsub.com/idensic/l/#/token/${tokenResponse.data.token}`,
      createdAt: new Date(applicant.createdAt),
      updatedAt: new Date(applicant.modifiedAt),
      providerData: applicant
    };
  }

  async getVerificationStatus(address: string): Promise<VerificationResult> {
    const response = await this.client.get(`/resources/applicants/${address}/one`);
    const applicant = response.data;

    return {
      id: applicant.id,
      address: address,
      status: this.mapSumsubStatus(applicant.review?.reviewStatus, applicant.review?.reviewResult?.reviewAnswer),
      verificationType: applicant.type === 'individual' ? VerificationType.INDIVIDUAL : VerificationType.BUSINESS,
      completedAt: applicant.review?.reviewResult?.reviewAnswer ? new Date(applicant.review.completedAt) : undefined,
      createdAt: new Date(applicant.createdAt),
      updatedAt: new Date(applicant.modifiedAt),
      providerData: applicant
    };
  }

  async getVerificationProof(address: string): Promise<VerificationProof> {
    const status = await this.getVerificationStatus(address);
    
    // Create proof with Sumsub data
    const proof = {
      address,
      verified: status.status === VerificationStatus.APPROVED,
      timestamp: Math.floor(Date.now() / 1000),
      verificationId: status.id,
      providerName: this.name,
      signature: '' // Would implement actual signing logic
    };

    // Generate signature using secret key
    proof.signature = this.generateSignature(proof);
    
    return proof;
  }

  async listVerifications(contractAddress?: string): Promise<VerificationResult[]> {
    const response = await this.client.get('/resources/applicants', {
      params: { limit: 100 }
    });

    return response.data.items.map((applicant: any) => ({
      id: applicant.id,
      address: applicant.externalUserId,
      status: this.mapSumsubStatus(applicant.review?.reviewStatus, applicant.review?.reviewResult?.reviewAnswer),
      verificationType: applicant.type === 'individual' ? VerificationType.INDIVIDUAL : VerificationType.BUSINESS,
      completedAt: applicant.review?.reviewResult?.reviewAnswer ? new Date(applicant.review.completedAt) : undefined,
      createdAt: new Date(applicant.createdAt),
      updatedAt: new Date(applicant.modifiedAt),
      providerData: applicant
    }));
  }

  validateWebhook(payload: any, signature: string): boolean {
    // Implement Sumsub webhook signature validation
    return true; // Placeholder
  }

  async processWebhook(payload: any): Promise<VerificationResult> {
    const applicant = payload.applicant;
    return {
      id: applicant.applicantId,
      address: applicant.externalUserId,
      status: this.mapSumsubStatus(payload.reviewStatus, payload.reviewResult?.reviewAnswer),
      verificationType: applicant.type === 'individual' ? VerificationType.INDIVIDUAL : VerificationType.BUSINESS,
      completedAt: payload.reviewResult?.reviewAnswer ? new Date() : undefined,
      createdAt: new Date(applicant.createdAt),
      updatedAt: new Date(),
      providerData: payload
    };
  }

  private mapSumsubStatus(reviewStatus?: string, reviewAnswer?: string): VerificationStatus {
    if (reviewAnswer === 'GREEN') return VerificationStatus.APPROVED;
    if (reviewAnswer === 'RED') return VerificationStatus.REJECTED;
    if (reviewAnswer === 'YELLOW') return VerificationStatus.NEEDS_REVIEW;
    
    switch (reviewStatus) {
      case 'init': return VerificationStatus.PENDING;
      case 'pending': return VerificationStatus.IN_PROGRESS;
      case 'queued': return VerificationStatus.IN_PROGRESS;
      case 'completed': return VerificationStatus.APPROVED;
      default: return VerificationStatus.PENDING;
    }
  }

  private generateSignature(proof: Omit<VerificationProof, 'signature'>): string {
    // Implement actual signing logic with secret key
    return 'placeholder_signature';
  }
}