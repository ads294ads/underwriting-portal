import Anthropic from "@anthropic-ai/sdk";
import { LoanApplication } from "../shared/schema";

export async function performComprehensiveUnderwriting(application: LoanApplication) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    // STEP 1: Extract financials from uploaded documents
    console.log("[UNDERWRITING] Step 1: Analyzing documents...");
    const docAnalysisPrompt = `You are a banking analyst. Review these financial documents for ${application.businessName} in the ${application.industry} industry.

Documents uploaded: ${application.documentAnalysis?.join(", ") || "None"}

Extract and analyze:
- Revenue, expenses, net income, cash position
- Assets, liabilities, equity
- Any red flags or concerns
- How do stated financials match the claims?

Return as JSON with: revenue, netIncome, assets, liabilities, cashPosition, redFlags, confidenceScore (0-100).`;

    const docResponse = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1000,
      messages: [{ role: "user", content: docAnalysisPrompt }]
    });

    let documentAnalysis = { revenue: 0, netIncome: 0, assets: 0, liabilities: 0, cashPosition: 0, redFlags: [], confidenceScore: 0 };
    try {
      const jsonMatch = docResponse.content[0].type === 'text' ? docResponse.content[0].text.match(/\{[\s\S]*\}/) : null;
      if (jsonMatch) documentAnalysis = JSON.parse(jsonMatch[0]);
    } catch (e) {}

    // STEP 2: Synthesize underwriting recommendation
    console.log("[UNDERWRITING] Step 2: Synthesizing underwriting decision...");
    const underwritingPrompt = `You are a senior loan officer making an underwriting decision.

Business: ${application.businessName}
Industry: ${application.industry}
Loan Request: $${application.loanAmount}
Claimed Annual Revenue: $${application.annualRevenue}

Financial Analysis from Documents:
- Actual Revenue: $${documentAnalysis.revenue || application.annualRevenue}
- Net Income: $${documentAnalysis.netIncome}
- Assets: $${documentAnalysis.assets}
- Liabilities: $${documentAnalysis.liabilities}
- Cash Position: $${documentAnalysis.cashPosition}

Red Flags Found: ${documentAnalysis.redFlags.join(", ") || "None"}

Question: Does this loan make sense? Would you approve, review further, or decline?
- Consider: loan-to-revenue ratio, liquidity, leverage, income stability
- Do the numbers pencil out?
- Are there credibility concerns?

Return JSON: { recommendation: "APPROVE|REVIEW|DECLINE", reasoning: "...", riskScore: 0-100, keyMetrics: {...}, nextSteps: [...] }`;

    const underwritingResponse = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1500,
      messages: [{ role: "user", content: underwritingPrompt }]
    });

    let underwriting = { recommendation: "REVIEW", reasoning: "Analysis incomplete", riskScore: 50, keyMetrics: {}, nextSteps: [] };
    try {
      const jsonMatch = underwritingResponse.content[0].type === 'text' ? underwritingResponse.content[0].text.match(/\{[\s\S]*\}/) : null;
      if (jsonMatch) underwriting = JSON.parse(jsonMatch[0]);
    } catch (e) {}

    // STEP 3: Format final report
    const report = {
      executiveSummary: {
        recommendation: underwriting.recommendation,
        reasoning: underwriting.reasoning,
        overallRisk: underwriting.riskScore,
        keyFindings: [
          `Loan Request: $${application.loanAmount}`,
          `Stated Revenue: $${application.annualRevenue}`,
          `Document Analysis Confidence: ${documentAnalysis.confidenceScore}%`,
          `Red Flags: ${documentAnalysis.redFlags.length > 0 ? documentAnalysis.redFlags.join(", ") : "None identified"}`
        ]
      },
      financialAnalysis: {
        documentedRevenue: documentAnalysis.revenue,
        documentedNetIncome: documentAnalysis.netIncome,
        documentedAssets: documentAnalysis.assets,
        documentedLiabilities: documentAnalysis.liabilities,
        loanToRevenueRatio: ((application.loanAmount / (documentAnalysis.revenue || application.annualRevenue)) * 100).toFixed(1) + "%"
      },
      recommendation: underwriting.recommendation,
      nextSteps: underwriting.nextSteps || ["Request additional documentation", "Conduct background verification"],
      generatedAt: new Date().toISOString()
    };

    return report;
  } catch (error: any) {
    console.error("[UNDERWRITING] Error:", error);
    throw error;
  }
}
