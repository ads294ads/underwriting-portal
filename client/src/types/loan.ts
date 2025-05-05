export interface LoanApplication {
  id: number;
  businessName: string;
  industry: string;
  yearsInBusiness: number;
  annualRevenue: number;
  loanAmount: number;
  email: string;
  fileUploaded: boolean;
  score?: number;
  grade?: string;
  scoringDetails?: Record<string, number>;
  documentAnalysis?: string[];
  createdAt?: Date;
}

export interface ScoringComponent {
  key: string;
  name: string;
  weight: number;
  desc: string;
}

export interface GradeScale {
  grade: string;
  minScore: number;
  maxScore: number;
  description: string;
}
