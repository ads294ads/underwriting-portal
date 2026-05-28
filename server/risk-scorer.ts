export interface RiskScore {
  financialRisk: number;
  operationalRisk: number;
  marketRisk: number;
  ownerRisk: number;
  overallRisk: number;
  riskFactors: string[];
  strengths: string[];
  recommendation: "APPROVE" | "REVIEW" | "DECLINE";
}

export function calculateRiskScore(
  currentRatio: number,
  netMargin: number,
  debtToEquity: number,
  interestCoverage: number,
  revenue: number,
  yearsInBusiness: number,
  loanAmount: number,
  industry: string,
  ownerCount: number
): RiskScore {
  const riskFactors: string[] = [];
  const strengths: string[] = [];
  let financialRisk = 0;
  let operationalRisk = 0;
  let marketRisk = 0;
  let ownerRisk = 0;

  // FINANCIAL RISK ASSESSMENT
  if (currentRatio < 1.0) {
    financialRisk += 30;
    riskFactors.push("Poor liquidity - current ratio below 1.0");
  } else if (currentRatio < 1.5) {
    financialRisk += 15;
    riskFactors.push("Tight liquidity - current ratio below 1.5");
  } else {
    strengths.push("Strong liquidity position");
  }

  if (netMargin < 0) {
    financialRisk += 40;
    riskFactors.push("Negative net income - business unprofitable");
  } else if (netMargin < 3) {
    financialRisk += 20;
    riskFactors.push("Low profit margin - minimal earnings buffer");
  } else if (netMargin > 10) {
    strengths.push("Healthy profit margins");
  }

  if (debtToEquity > 3) {
    financialRisk += 25;
    riskFactors.push("High leverage - debt-to-equity exceeds 3x");
  } else if (debtToEquity > 2) {
    financialRisk += 15;
    riskFactors.push("Moderate leverage - debt-to-equity above 2x");
  }

  if (interestCoverage < 1.5) {
    financialRisk += 30;
    riskFactors.push("Poor debt service capacity - interest coverage below 1.5x");
  } else if (interestCoverage > 3) {
    strengths.push("Strong debt service capacity");
  }

  const ltvRatio = loanAmount / Math.max(revenue, 1);
  if (ltvRatio > 0.5) {
    financialRisk += 20;
    riskFactors.push(`High loan request relative to revenue (${(ltvRatio * 100).toFixed(0)}%)`);
  }

  // OPERATIONAL RISK ASSESSMENT
  if (yearsInBusiness < 2) {
    operationalRisk += 35;
    riskFactors.push("Early stage business - less than 2 years operation");
  } else if (yearsInBusiness < 5) {
    operationalRisk += 15;
    riskFactors.push("Relatively new business - less than 5 years operation");
  } else if (yearsInBusiness > 10) {
    strengths.push("Established business with track record");
  }

  if (ownerCount === 1) {
    operationalRisk += 15;
    riskFactors.push("Key person dependency - single owner");
  } else {
    strengths.push("Management team diversity");
  }

  // MARKET RISK ASSESSMENT
  const volatileIndustries = ["Retail", "Construction", "Hospitality"];
  if (volatileIndustries.includes(industry)) {
    marketRisk += 20;
    riskFactors.push(`${industry} sector has high market volatility`);
  } else {
    marketRisk += 5;
  }

  if (revenue < 250000) {
    marketRisk += 20;
    riskFactors.push("Small revenue base - limited scale");
  } else if (revenue > 5000000) {
    strengths.push("Significant revenue scale");
  }

  // OWNER RISK ASSESSMENT
  ownerRisk = 25; // Placeholder for background checks
  riskFactors.push("Owner background verification pending");

  // CALCULATE OVERALL RISK
  const overallRisk = Math.min(100, (financialRisk + operationalRisk + marketRisk + ownerRisk) / 4);

  // RECOMMENDATION
  let recommendation: "APPROVE" | "REVIEW" | "DECLINE" = "REVIEW";
  if (overallRisk < 30) {
    recommendation = "APPROVE";
  } else if (overallRisk > 70) {
    recommendation = "DECLINE";
  }

  return {
    financialRisk: Math.min(100, financialRisk),
    operationalRisk: Math.min(100, operationalRisk),
    marketRisk: Math.min(100, marketRisk),
    ownerRisk: Math.min(100, ownerRisk),
    overallRisk,
    riskFactors,
    strengths,
    recommendation
  };
}
