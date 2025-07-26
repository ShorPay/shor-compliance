import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface VerificationInitRequest {
  address: string;
  verificationType: 'individual' | 'business';
  levelName?: string;
  externalUserId?: string;
}

interface VerificationInitResponse {
  applicantId: string;
  verificationUrl: string;
  status: string;
}

interface VerificationStatus {
  address: string;
  applicantId: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reviewResult?: {
    reviewAnswer: 'GREEN' | 'YELLOW' | 'RED';
    moderationComment?: string;
    clientComment?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VerificationProof {
  address: string;
  verified: boolean;
  timestamp: number;
  signature: string;
  applicantId: string;
}

export class ShorApiClient {
  private client: AxiosInstance;
  private apiKey: string | undefined;

  constructor() {
    const config = this.loadConfig();
    const baseURL = process.env.SHOR_API_URL || config.apiUrl || 'https://api.shor.xyz';
    this.apiKey = process.env.SHOR_API_KEY || config.apiKey;

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      }
    });

    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please run "shor config set-api-key <key>"');
        }
        throw error;
      }
    );
  }

  private loadConfig(): any {
    try {
      const configPath = path.join(os.homedir(), '.shor', 'config.json');
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } catch (error) {
      // Config file doesn't exist or is invalid
    }
    return {};
  }

  async initVerification(request: VerificationInitRequest): Promise<VerificationInitResponse> {
    const response = await this.client.post('/api/verify/init', request);
    return response.data;
  }

  async getVerificationStatus(address: string): Promise<VerificationStatus> {
    const response = await this.client.get(`/api/verify/status/${address}`);
    return response.data;
  }

  async getVerificationProof(address: string): Promise<VerificationProof> {
    const response = await this.client.get(`/api/verify/proof/${address}`);
    return response.data;
  }

  async listVerifications(contractAddress?: string): Promise<VerificationStatus[]> {
    const params = contractAddress ? { contractAddress } : {};
    const response = await this.client.get('/api/verify/list', { params });
    return response.data;
  }

  async updateOracleAddress(chain: 'ethereum' | 'solana', address: string): Promise<void> {
    await this.client.post('/api/oracle/update', { chain, address });
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

export const apiClient = new ShorApiClient();