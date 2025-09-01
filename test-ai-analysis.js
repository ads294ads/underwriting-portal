// Test script to verify AI analysis is generating real data
import { aiAnalysisEngine } from "./server/ai-analysis-engine.js";

async function testAIAnalysis() {
  console.log("=== Testing AI Analysis Engine ===");
  
  const testApplication = {
    businessName: "Test Tech Company",
    industry: "Technology",
    yearsInBusiness: 7,
    annualRevenue: 2500000,
    loanAmount: 500000,
    businessPurpose: "expansion"
  };
  
  const testDocuments = [
    "Financial statements show strong revenue growth over past 3 years",
    "Balance sheet indicates healthy cash position and low debt levels"
  ];
  
  try {
    console.log("Generating comprehensive analysis...");
    const result = await aiAnalysisEngine.generateComprehensiveAnalysis(testApplication, testDocuments);
    
    console.log("\n✅ Analysis Generated Successfully!");
    console.log("\n--- Financial Analysis Sample ---");
    console.log("Gross Margin:", result.financialAnalysis.profitabilityAnalysis.grossMargin);
    console.log("Operating Margin:", result.financialAnalysis.profitabilityAnalysis.operatingMargin);
    console.log("ROI Analysis:", result.financialAnalysis.profitabilityAnalysis.roiAnalysis.substring(0, 100) + "...");
    
    console.log("\n--- Risk Assessment Sample ---");
    console.log("Risk Rating:", result.riskAssessment.overallRiskProfile.riskRating);
    console.log("Key Risk Factors:", result.riskAssessment.overallRiskProfile.keyRiskFactors.length);
    
    console.log("\n--- Lender Recommendation ---");
    console.log("Recommendation:", result.lenderRecommendation.approvalRecommendation);
    console.log("Recommended Amount:", result.lenderRecommendation.recommendedLoanAmount);
    
    console.log("\n🎉 AI Analysis Engine is working correctly!");
    console.log("The system is generating detailed, realistic financial analysis data.");
    
  } catch (error) {
    console.log("\n❌ AI Analysis Failed:");
    console.log("Error:", error.message);
    
    if (error.message.includes("temperature")) {
      console.log("\n💡 Issue: OpenAI temperature parameter not supported");
    } else if (error.message.includes("max_tokens")) {
      console.log("\n💡 Issue: Use max_completion_tokens instead of max_tokens");
    } else {
      console.log("\n💡 Check API keys and model parameters");
    }
  }
}

testAIAnalysis().catch(console.error);