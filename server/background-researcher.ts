export interface BackgroundResearch {
  company: {
    yearsInOperation: number;
    industryRisk: string;
    marketPosition: string;
    growthTrend: string;
    operationalStability: string;
  };
  owners: {
    name: string;
    ownership: number;
    industryExperience: string;
    trackRecord: string;
    creditWorthiness: string;
  }[];
  operationalRisks: {
    keyPersonDependency: boolean;
    supplyChainRisk: string;
    customerConcentration: string;
    regulatoryCompliance: string;
  };
  marketAnalysis: {
    competitiveAdvantage: string;
    marketDemand: string;
    priceStability: string;
    barriersToEntry: string;
  };
  overallAssessment: string;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
}

export async function researchBackgroundWithClaude(
  businessName: string,
  industry: string,
  yearsInBusiness: number,
  ownerNames: string[],
  revenue: number
): Promise<BackgroundResearch> {
  // For MVP, use heuristic-based assessment
  // In production, integrate with Perplexity/web search API
  
  const industryRiskMap: { [key: string]: string } = {
    Manufacturing: "MODERATE - cyclical, capital intensive",
    Retail: "HIGH - competitive, changing consumer behavior",
    Services: "LOW - recurring revenue potential",
    Technology: "MODERATE - innovation dependent",
    Construction: "HIGH - project based, seasonal",
    Healthcare: "LOW - regulated, consistent demand",
    Finance: "HIGH - regulatory scrutiny"
  };

  const riskLevel = yearsInBusiness < 2 ? "HIGH" : yearsInBusiness < 5 ? "MODERATE" : "LOW";
  const growthTrend = revenue > 1000000 ? "EXPANSION" : "STABLE";
  const marketPosition = revenue > 5000000 ? "ESTABLISHED" : revenue > 500000 ? "GROWING" : "EMERGING";

  return {
    company: {
      yearsInOperation: yearsInBusiness,
      industryRisk: industryRiskMap[industry] || "UNKNOWN - requires market research",
      marketPosition,
      growthTrend,
      operationalStability: yearsInBusiness >= 5 ? "STABLE" : "DEVELOPING"
    },
    owners: ownerNames.map(name => ({
      name,
      ownership: 100 / ownerNames.length,
      industryExperience: "Requires background verification",
      trackRecord: "Requires verification",
      creditWorthiness: "Pending credit check"
    })),
    operationalRisks: {
      keyPersonDependency: ownerNames.length === 1,
      supplyChainRisk: industry === "Retail" || industry === "Manufacturing" ? "MODERATE" : "LOW",
      customerConcentration: "Requires detailed analysis",
      regulatoryCompliance: industry === "Finance" || industry === "Healthcare" ? "HIGH" : "STANDARD"
    },
    marketAnalysis: {
      competitiveAdvantage: "Requires market research",
      marketDemand: riskLevel === "LOW" ? "STRONG" : "MODERATE",
      priceStability: industry === "Retail" ? "VARIABLE" : "STABLE",
      barriersToEntry: revenue > 1000000 ? "HIGH" : "MODERATE"
    },
    overallAssessment: `${businessName} operates in ${industry} sector (${industryRiskMap[industry]}). ${yearsInBusiness} years in operation. ${ownerNames.length} owner(s): ${ownerNames.join(", ")}. Market position: ${marketPosition}.`,
    riskLevel
  };
}
