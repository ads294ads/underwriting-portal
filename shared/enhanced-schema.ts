import { pgTable, text, serial, integer, boolean, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Comprehensive Financial Analysis Structure
export type FinancialAnalysis = {
  profitabilityAnalysis: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    ebitdaMargin: number;
    roiAnalysis: string;
    profitabilityTrends: string[];
    industryComparison: string;
    strengthsWeaknesses: string[];
  };
  cashFlowAnalysis: {
    operatingCashFlow: number;
    freeCashFlow: number;
    cashConversionCycle: number;
    seasonalityAnalysis: string;
    cashFlowProjections: string[];
    workingCapitalAnalysis: string;
    liquidityRatios: Record<string, number>;
  };
  debtAnalysis: {
    totalDebt: number;
    debtToEquityRatio: number;
    debtServiceCoverageRatio: number;
    interestCoverageRatio: number;
    debtMaturitySchedule: string[];
    creditUtilization: string;
    debtCapacityAssessment: string;
  };
  balanceSheetStrength: {
    workingCapital: number;
    currentRatio: number;
    quickRatio: number;
    assetQuality: string;
    capitalStructure: string;
    offBalanceSheetItems: string[];
  };
  performanceMetrics: {
    revenueGrowthRate: number;
    earningsGrowthRate: number;
    marketShareTrends: string;
    competitivePosition: string;
    scalabilityAssessment: string;
  };
};

// Comprehensive Risk Assessment Structure
export type RiskAssessment = {
  creditRisk: {
    paymentHistory: string;
    creditScore: number;
    creditUtilization: string;
    bankruptcyHistory: string[];
    collectionAccounts: string[];
    riskRating: "Low" | "Medium" | "High";
    mitigatingFactors: string[];
  };
  operationalRisk: {
    businessModel: string;
    operationalEfficiency: string;
    supplyChainRisks: string[];
    customerConcentration: string;
    keyPersonRisk: string[];
    operationalContinuity: string;
  };
  industryRisk: {
    industryGrowthRate: number;
    cyclicalityAnalysis: string;
    regulatoryRisks: string[];
    technologicalDisruption: string[];
    competitiveLandscape: string;
    industryOutlook: string;
  };
  marketRisk: {
    economicSensitivity: string;
    interestRateSensitivity: string;
    geographicRisks: string[];
    customerDemandVolatility: string;
    pricingPressure: string;
  };
  financialRisk: {
    liquidityRisk: string;
    leverageRisk: string;
    cashFlowVolatility: string;
    foreignExchangeRisk: string;
    interestRateRisk: string;
  };
  overallRiskProfile: {
    riskRating: "Low" | "Medium-Low" | "Medium" | "Medium-High" | "High";
    keyRiskFactors: string[];
    riskMitigationStrategies: string[];
    riskMonitoringRecommendations: string[];
  };
};

// Market and Industry Analysis
export type MarketAnalysis = {
  industryOverview: {
    industrySize: string;
    growthRate: number;
    maturityStage: string;
    keyDrivers: string[];
    challenges: string[];
  };
  competitivePosition: {
    marketShare: string;
    competitiveAdvantages: string[];
    competitiveThreats: string[];
    barrierToEntry: string[];
    differentiationFactors: string[];
  };
  marketOpportunity: {
    growthOpportunities: string[];
    marketTrends: string[];
    customerSegments: string[];
    geographicExpansion: string[];
    productDiversification: string[];
  };
  regulatoryEnvironment: {
    currentRegulations: string[];
    upcomingChanges: string[];
    complianceStatus: string;
    regulatoryRisks: string[];
  };
};

// Management and Leadership Analysis
export type ManagementAnalysis = {
  leadershipTeam: {
    keyExecutives: Array<{
      name: string;
      position: string;
      experience: string;
      qualifications: string[];
      trackRecord: string;
      riskFactors: string[];
    }>;
    leadershipStability: string;
    successionPlanning: string;
    boardOfDirectors: string[];
  };
  managementCapabilities: {
    strategicPlanning: string;
    operationalExecution: string;
    financialManagement: string;
    riskManagement: string;
    corporateGovernance: string;
  };
  organizationalStructure: {
    reportingLines: string;
    decisionMaking: string;
    communicationEffectiveness: string;
    culturalAssessment: string;
  };
  humanResources: {
    employeeRetention: string;
    skillsGaps: string[];
    trainingPrograms: string[];
    compensationStructure: string;
  };
};

// Collateral Analysis
export type CollateralAnalysis = {
  realEstate: Array<{
    propertyType: string;
    marketValue: number;
    liquidationValue: number;
    lienStatus: string;
    conditionAssessment: string;
    marketabilityFactors: string[];
  }>;
  equipment: Array<{
    equipmentType: string;
    ageCondition: string;
    marketValue: number;
    liquidationValue: number;
    obsolescenceRisk: string;
  }>;
  inventory: {
    inventoryType: string;
    turnoverRate: number;
    marketValue: number;
    liquidationValue: number;
    obsolescenceRisk: string;
    seasonalityFactors: string[];
  };
  accountsReceivable: {
    agingAnalysis: Record<string, number>;
    collectionHistory: string;
    customerCreditQuality: string;
    concentrationRisk: string;
  };
  personalGuarantees: Array<{
    guarantorName: string;
    netWorth: number;
    liquidAssets: number;
    creditScore: number;
    guaranteeAmount: number;
  }>;
  overallCollateralAssessment: {
    totalCollateralValue: number;
    loanToValueRatio: number;
    liquidationRecoveryEstimate: number;
    collateralSufficiency: "Excellent" | "Good" | "Adequate" | "Marginal" | "Insufficient";
    monitoringRequirements: string[];
  };
};

// Compliance and Regulatory Check
export type ComplianceCheck = {
  antiMoneyLaundering: {
    customerDueDiligence: string;
    beneficialOwnership: string[];
    sanctionsScreening: string;
    suspiciousActivityReports: string[];
  };
  knowYourCustomer: {
    identityVerification: string;
    addressVerification: string;
    businessVerification: string;
    riskCategorization: "Low" | "Medium" | "High";
  };
  regulatoryCompliance: {
    bankingRegulations: string[];
    industrySpecificRegs: string[];
    environmentalCompliance: string;
    laborCompliance: string;
    taxCompliance: string;
  };
  licenseAndPermits: {
    businessLicenses: string[];
    operatingPermits: string[];
    professionalLicenses: string[];
    expirationDates: Record<string, string>;
  };
};

// Lender Recommendation
export type LenderRecommendation = {
  approvalRecommendation: "Approve" | "Conditional Approval" | "Decline" | "Further Review Required";
  recommendedLoanAmount: number;
  recommendedTerms: {
    interestRate: string;
    loanTerm: string;
    paymentFrequency: string;
    collateralRequirements: string[];
    personalGuarantees: string[];
    financialCovenants: string[];
  };
  conditions: {
    preClosingConditions: string[];
    ongoingCovenants: string[];
    reportingRequirements: string[];
    monitoringSchedule: string;
  };
  riskMitigation: {
    proposedMitigations: string[];
    ongoingMonitoring: string[];
    earlyWarningIndicators: string[];
    exitStrategy: string;
  };
  alternativeStructures: Array<{
    structure: string;
    terms: string;
    riskProfile: string;
    suitability: string;
  }>;
  executiveSummary: string;
  detailedRationale: string;
};

// Enhanced Loan Application Schema
export const enhancedLoanApplications = pgTable("enhanced_loan_applications", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  industry: text("industry").notNull(),
  yearsInBusiness: numeric("years_in_business").notNull(),
  annualRevenue: numeric("annual_revenue").notNull(),
  loanAmount: numeric("loan_amount").notNull(),
  loanPurpose: text("loan_purpose"),
  email: text("email").notNull(),
  businessOwners: json("business_owners").$type<Array<{
    name: string;
    ownership: number;
    title?: string;
    experience?: string;
    creditScore?: number;
  }>>(),
  fileUploaded: boolean("file_uploaded").default(false),
  
  // Enhanced Analysis Results
  financialAnalysis: json("financial_analysis").$type<FinancialAnalysis>(),
  riskAssessment: json("risk_assessment").$type<RiskAssessment>(),
  marketAnalysis: json("market_analysis").$type<MarketAnalysis>(),
  managementAnalysis: json("management_analysis").$type<ManagementAnalysis>(),
  collateralAnalysis: json("collateral_analysis").$type<CollateralAnalysis>(),
  complianceCheck: json("compliance_check").$type<ComplianceCheck>(),
  lenderRecommendation: json("lender_recommendation").$type<LenderRecommendation>(),
  
  // Legacy fields for compatibility
  score: text("score"),
  grade: text("grade"),
  scoringDetails: json("scoring_details").$type<Record<string, number>>(),
  documentAnalysis: json("document_analysis").$type<string[]>(),
  
  // Status and metadata
  analysisStatus: text("analysis_status").default("pending"),
  analysisProgress: integer("analysis_progress").default(0),
  lastAnalysisUpdate: timestamp("last_analysis_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced scoring components with more granular analysis
export const enhancedScoringComponents = [
  { 
    key: "financialStrength", 
    name: "Financial Strength", 
    weight: 0.25, 
    subComponents: [
      "profitability", "cashFlow", "balanceSheetStrength", "debtCapacity"
    ]
  },
  { 
    key: "creditQuality", 
    name: "Credit Quality", 
    weight: 0.20, 
    subComponents: [
      "paymentHistory", "creditScore", "bankruptcyHistory", "collectionAccounts"
    ]
  },
  { 
    key: "businessRisk", 
    name: "Business Risk Profile", 
    weight: 0.15, 
    subComponents: [
      "operationalRisk", "industryRisk", "marketRisk", "managementRisk"
    ]
  },
  { 
    key: "marketPosition", 
    name: "Market Position", 
    weight: 0.15, 
    subComponents: [
      "competitivePosition", "marketShare", "growthProspects", "industryOutlook"
    ]
  },
  { 
    key: "collateralSecurity", 
    name: "Collateral Security", 
    weight: 0.15, 
    subComponents: [
      "collateralValue", "liquidationRecovery", "loanToValue", "guaranteeStrength"
    ]
  },
  { 
    key: "managementQuality", 
    name: "Management Quality", 
    weight: 0.10, 
    subComponents: [
      "leadershipExperience", "trackRecord", "successionPlanning", "governance"
    ]
  }
];

export const insertEnhancedLoanApplicationSchema = createInsertSchema(enhancedLoanApplications)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    analysisStatus: true,
    analysisProgress: true,
    lastAnalysisUpdate: true,
  });

export type InsertEnhancedLoanApplication = z.infer<typeof insertEnhancedLoanApplicationSchema>;
export type EnhancedLoanApplication = typeof enhancedLoanApplications.$inferSelect;