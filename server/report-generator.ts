import { DocumentAnalysisResult } from "./document-processor";
import { FinancialRatios, BenchmarkComparison } from "./financial-calculator";
import { BackgroundResearch } from "./background-researcher";
import { RiskScore } from "./risk-scorer";

export interface ComprehensiveReport {
  executiveSummary: {
    businessName: string;
    loanAmount: number;
    recommendation: string;
    overallRisk: number;
    keyMetrics: { [key: string]: string | number };
  };
  financialAnalysis: {
    extractedData: Partial<DocumentAnalysisResult>;
    calculatedRatios: FinancialRatios;
    benchmark: BenchmarkComparison;
    dataQuality: string;
  };
  riskAssessment: RiskScore;
  backgroundResearch: BackgroundResearch;
  reportMetadata: {
    generatedAt: string;
    analysisConfidence: number;
    dataSourcesUsed: string[];
    recommendedVerifications: string[];
  };
}

export function generateComprehensiveReport(
  businessName: string,
  loanAmount: number,
  annualRevenue: number,
  industry: string,
  yearsInBusiness: number,
  ownerNames: string[],
  documentAnalysis: DocumentAnalysisResult,
  ratios: FinancialRatios,
  benchmark: BenchmarkComparison,
  background: BackgroundResearch,
  riskScore: RiskScore,
  applicationScore: number,
  applicationGrade: string
): ComprehensiveReport {
  
  const confidenceScore = Math.min(100, documentAnalysis.confidence + (yearsInBusiness > 5 ? 20 : 0));
  
  return {
    executiveSummary: {
      businessName,
      loanAmount,
      recommendation: riskScore.recommendation,
      overallRisk: riskScore.overallRisk,
      keyMetrics: {
        "LendScore": applicationScore,
        "Grade": applicationGrade,
        "Financial Health Risk": `${riskScore.financialRisk.toFixed(0)}/100`,
        "Operational Risk": `${riskScore.operationalRisk.toFixed(0)}/100`,
        "Market Risk": `${riskScore.marketRisk.toFixed(0)}/100`,
        "Current Ratio": ratios.liquidity.currentRatio.toFixed(2),
        "Net Margin": `${ratios.profitability.netMargin.toFixed(1)}%`,
        "Debt-to-Equity": ratios.leverage.debtToEquity.toFixed(2)
      }
    },
    financialAnalysis: {
      extractedData: {
        revenue: documentAnalysis.revenue,
        netIncome: documentAnalysis.netIncome,
        totalAssets: documentAnalysis.totalAssets,
        totalLiabilities: documentAnalysis.totalLiabilities,
        cashOnHand: documentAnalysis.cashOnHand,
        confidence: documentAnalysis.confidence,
        summary: documentAnalysis.summary,
        redFlags: documentAnalysis.redFlags
      },
      calculatedRatios: ratios,
      benchmark,
      dataQuality: confidenceScore > 80 ? "HIGH - Reliable for decisions" : confidenceScore > 60 ? "MODERATE - Verify key figures" : "LOW - Requires additional documentation"
    },
    riskAssessment: riskScore,
    backgroundResearch: background,
    reportMetadata: {
      generatedAt: new Date().toISOString(),
      analysisConfidence: confidenceScore,
      dataSourcesUsed: [
        "Application submission data",
        "Document analysis via Claude",
        "Financial ratio calculations",
        "Industry benchmarking",
        "LendScore proprietary algorithm"
      ],
      recommendedVerifications: [
        "Bank statements (last 12 months)",
        "Tax returns (last 2 years)",
        "Personal credit report - all owners",
        "Business credit report",
        "Verify business registration",
        "Check for liens and judgments",
        "Conduct owner background checks"
      ]
    }
  };
}
