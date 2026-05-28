import { analyzeDocumentsWithClaude, DocumentAnalysisResult } from "./document-processor";
import { calculateFinancialRatios, compareToBenchmark } from "./financial-calculator";
import { researchBackgroundWithClaude } from "./background-researcher";
import { calculateRiskScore } from "./risk-scorer";
import { generateComprehensiveReport, ComprehensiveReport } from "./report-generator";
import { LoanApplication } from "../shared/schema";

export async function performComprehensiveUnderwriting(
  application: LoanApplication
): Promise<ComprehensiveReport> {
  console.log(`[UNDERWRITING] Starting analysis for ${application.businessName}`);

  try {
    // STEP 1: Analyze documents with Claude
    console.log("[STEP 1] Analyzing documents...");
    const documentAnalysis = await analyzeDocumentsWithClaude(
      application.businessName,
      application.documentAnalysis || []
    );
    console.log(`[STEP 1] Document analysis confidence: ${documentAnalysis.confidence}%`);

    // STEP 2: Calculate financial ratios
    console.log("[STEP 2] Calculating financial ratios...");
    const ratios = calculateFinancialRatios(
      documentAnalysis.revenue || application.annualRevenue,
      documentAnalysis.netIncome,
      documentAnalysis.totalAssets,
      documentAnalysis.totalLiabilities,
      documentAnalysis.cashOnHand,
      documentAnalysis.accountsReceivable,
      documentAnalysis.inventory,
      documentAnalysis.operatingExpense,
      documentAnalysis.costOfGoodsSold,
      documentAnalysis.interestExpense
    );
    console.log(`[STEP 2] Current Ratio: ${ratios.liquidity.currentRatio.toFixed(2)}x`);

    // STEP 3: Compare to industry benchmarks
    console.log("[STEP 3] Benchmarking against industry...");
    const benchmark = compareToBenchmark(ratios, application.industry);
    console.log(`[STEP 3] Industry: ${application.industry}, Assessment: ${benchmark.assessment}`);

    // STEP 4: Research background
    console.log("[STEP 4] Researching company and owner background...");
    const background = await researchBackgroundWithClaude(
      application.businessName,
      application.industry,
      application.yearsInBusiness,
      application.businessOwners?.map(o => o.name) || [],
      documentAnalysis.revenue || application.annualRevenue
    );
    console.log(`[STEP 4] Risk Level: ${background.riskLevel}`);

    // STEP 5: Calculate risk score
    console.log("[STEP 5] Calculating comprehensive risk score...");
    const riskScore = calculateRiskScore(
      ratios.liquidity.currentRatio,
      ratios.profitability.netMargin,
      ratios.leverage.debtToEquity,
      ratios.leverage.interestCoverage,
      documentAnalysis.revenue || application.annualRevenue,
      application.yearsInBusiness,
      application.loanAmount,
      application.industry,
      application.businessOwners?.length || 1
    );
    console.log(`[STEP 5] Overall Risk: ${riskScore.overallRisk.toFixed(0)}/100, Recommendation: ${riskScore.recommendation}`);

    // STEP 6: Generate comprehensive report
    console.log("[STEP 6] Generating comprehensive report...");
    const report = generateComprehensiveReport(
      application.businessName,
      application.loanAmount,
      application.annualRevenue,
      application.industry,
      application.yearsInBusiness,
      application.businessOwners?.map(o => o.name) || [],
      documentAnalysis,
      ratios,
      benchmark,
      background,
      riskScore,
      parseFloat(application.score),
      application.grade
    );
    console.log("[STEP 6] Report generated successfully");

    console.log(`[UNDERWRITING] Analysis complete for ${application.businessName}`);
    return report;
  } catch (error) {
    console.error("[UNDERWRITING] Error during analysis:", error);
    throw error;
  }
}
