import { LoanApplication } from "../shared/schema";
import { DeepResearchResult } from "./deepsearch";

// Agent specializations
enum AgentSpecialization {
  BUSINESS_ANALYST = "business_analyst",
  LEGAL_RESEARCHER = "legal_researcher",
  FINANCIAL_AUDITOR = "financial_auditor",
  INDUSTRY_SPECIALIST = "industry_specialist",
  MARKET_RESEARCHER = "market_researcher"
}

// Agent roles and their specific focuses
interface Agent {
  role: AgentSpecialization;
  name: string;
  specialty: string;
  researchFocus: string[];
}

// Define our team of specialized agents
const researchAgents: Agent[] = [
  {
    role: AgentSpecialization.BUSINESS_ANALYST,
    name: "BusinessAnalyst",
    specialty: "Business operations and management assessment",
    researchFocus: [
      "business model viability", 
      "operational efficiency", 
      "management team experience", 
      "business history", 
      "competitive positioning",
      "succession planning"
    ]
  },
  {
    role: AgentSpecialization.LEGAL_RESEARCHER,
    name: "LegalResearcher",
    specialty: "Legal history and regulatory compliance",
    researchFocus: [
      "litigation history", 
      "regulatory compliance", 
      "legal risks",
      "contractual obligations",
      "intellectual property status",
      "employment lawsuits"
    ]
  },
  {
    role: AgentSpecialization.FINANCIAL_AUDITOR,
    name: "FinancialAuditor",
    specialty: "Financial health and risk assessment",
    researchFocus: [
      "financial stability", 
      "debt obligations", 
      "credit history",
      "cash flow analysis",
      "financial ratio evaluation",
      "capital structure"
    ]
  },
  {
    role: AgentSpecialization.INDUSTRY_SPECIALIST,
    name: "IndustrySpecialist",
    specialty: "Industry-specific dynamics and trends",
    researchFocus: [
      "industry positioning", 
      "market share", 
      "sector trends",
      "regulatory environment",
      "industry-specific risk factors",
      "technological disruption impacts"
    ]
  },
  {
    role: AgentSpecialization.MARKET_RESEARCHER,
    name: "MarketResearcher",
    specialty: "Market trends and competitive landscape",
    researchFocus: [
      "market growth potential", 
      "competitive landscape", 
      "consumer trends",
      "market disruptions",
      "economic factors",
      "demographic shifts"
    ]
  }
];

interface AgentResearchResult {
  agent: Agent;
  findings: {
    summary: string;
    detailedAnalysis: string;
    keyPoints: string[];
    recommendations: string[];
    riskFactors: string[];
    sources: string[];
  };
  riskScore: number; // 0-100, higher = more risk
  confidenceLevel: number; // 0-100, higher = more confident
}

interface CoordinatedResearchResult {
  companyAnalysis: {
    overview: string;
    legalIssues: string[];
    financialRedFlags: string[];
    reputationInsights: string[];
    industryPosition: string[];
    marketTrends: string[];
    executiveSummary: string;
    detailedFindings: Record<string, string[]>;
    specificEvents?: {
      event: string;
      date: string;
      impact: string;
      source: string;
    }[];
    financialMetrics?: {
      metric: string;
      value: string;
      industryAverage: string;
      trend: string;
    }[];
    sources: string[];
    highRiskFactors: string[];  // Required by DeepResearchResult interface
    moderateRiskFactors: string[]; // Required by DeepResearchResult interface
    mitigatingFactors: string[]; // Required by DeepResearchResult interface
    score: number;
  };
  ownerAnalysis: {
    overview: string;
    legalIssues: string[];
    financialRedFlags: string[];
    reputationInsights: string[];
    managementCapabilities: string[];
    executiveSummary: string;
    detailedFindings: Record<string, string[]>;
    priorBusinessHistory?: {
      companyName: string;
      role: string;
      years: string;
      outcome: string;
    }[];
    sources: string[];
    highRiskFactors: string[];  // Required by DeepResearchResult interface
    moderateRiskFactors: string[]; // Required by DeepResearchResult interface
    mitigatingFactors: string[]; // Required by DeepResearchResult interface
    score: number;
  };
  combinedScore: number;
  grade: string;
  riskAssessment: {
    highRiskFactors: string[];
    moderateRiskFactors: string[];
    mitigatingFactors: string[];
  };
}

/**
 * Perform multi-agent deep research on a company and its owner(s)
 * @param application The loan application to research
 */
export async function performMultiAgentResearch(application: LoanApplication): Promise<CoordinatedResearchResult> {
  console.log(`Starting multi-agent research for ${application.businessName}`);
  
  // Step 1: Dispatch specialized agents to research the company
  const companyResearchPromises = researchAgents.map(agent => 
    agentResearchCompany(agent, application)
  );
  
  // Step 2: Dispatch specialized agents to research the primary owner
  // For simplicity, we'll research the first owner with >= 20% ownership
  const primaryOwner = application.businessOwners?.find(owner => owner.ownership >= 20);
  const ownerResearchPromises = primaryOwner ? 
    researchAgents.map(agent => agentResearchPerson(agent, application, primaryOwner.name)) :
    [];
  
  // Step 3: Wait for all research to complete
  const [companyResearchResults, ownerResearchResults] = await Promise.all([
    Promise.all(companyResearchPromises),
    Promise.all(ownerResearchPromises)
  ]);
  
  // Step 4: Synthesize findings across agents
  const companyAnalysis = synthesizeCompanyResearch(companyResearchResults);
  const ownerAnalysis = ownerResearchResults.length > 0 ? 
    synthesizeOwnerResearch(ownerResearchResults) : 
    {
      overview: "No majority owner data available for analysis.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      managementCapabilities: [],
      executiveSummary: "Owner analysis skipped due to insufficient data.",
      detailedFindings: {},
      sources: [],
      score: 50 // Neutral score when no data available
    };
  
  // Step 5: Combine company and owner scores with appropriate weighting
  // Company analysis is weighted at 70%, owner analysis at 30%
  const companyWeight = 0.7;
  const ownerWeight = 0.3;
  const weightedCompanyScore = companyAnalysis.score * companyWeight;
  const weightedOwnerScore = ownerAnalysis.score * ownerWeight;
  const combinedScore = Math.round(weightedCompanyScore + weightedOwnerScore);
  
  // Step 6: Determine overall risk assessment
  const companyHighRisks = companyResearchResults.flatMap(r => 
    r.findings.riskFactors.filter(risk => 
      risk.toLowerCase().includes("critical") || 
      risk.toLowerCase().includes("high risk") || 
      risk.toLowerCase().includes("major concern")
    )
  );
  
  const ownerHighRisks = ownerResearchResults.flatMap(r => 
    r.findings.riskFactors.filter(risk => 
      risk.toLowerCase().includes("critical") || 
      risk.toLowerCase().includes("high risk") || 
      risk.toLowerCase().includes("major concern")
    )
  );
  
  const companyModerateRisks = companyResearchResults.flatMap(r => 
    r.findings.riskFactors.filter(risk => 
      risk.toLowerCase().includes("moderate") || 
      risk.toLowerCase().includes("medium risk") || 
      risk.toLowerCase().includes("potential issue")
    )
  );
  
  const ownerModerateRisks = ownerResearchResults.flatMap(r => 
    r.findings.riskFactors.filter(risk => 
      risk.toLowerCase().includes("moderate") || 
      risk.toLowerCase().includes("medium risk") || 
      risk.toLowerCase().includes("potential issue")
    )
  );
  
  const companyStrengths = companyResearchResults.flatMap(r => 
    r.findings.keyPoints.filter(point => 
      point.toLowerCase().includes("strength") || 
      point.toLowerCase().includes("positive") || 
      point.toLowerCase().includes("advantage")
    )
  );
  
  const ownerStrengths = ownerResearchResults.flatMap(r => 
    r.findings.keyPoints.filter(point => 
      point.toLowerCase().includes("strength") || 
      point.toLowerCase().includes("positive") || 
      point.toLowerCase().includes("advantage")
    )
  );
  
  // Generate final result
  const researchResult: CoordinatedResearchResult = {
    companyAnalysis,
    ownerAnalysis,
    combinedScore,
    grade: determineGrade(combinedScore),
    riskAssessment: {
      highRiskFactors: [...sampleItems(companyHighRisks, 3), ...sampleItems(ownerHighRisks, 2)],
      moderateRiskFactors: [...sampleItems(companyModerateRisks, 3), ...sampleItems(ownerModerateRisks, 2)],
      mitigatingFactors: [...sampleItems(companyStrengths, 3), ...sampleItems(ownerStrengths, 2)]
    }
  };
  
  return researchResult;
}

/**
 * Individual agent researches a company
 */
async function agentResearchCompany(
  agent: Agent, 
  application: LoanApplication
): Promise<AgentResearchResult> {
  // Generate specialized prompt for this agent
  const prompt = generateCompanyResearchPrompt(agent, application);
  
  // Send prompt to Perplexity API
  const response = await callPerplexityAPI(prompt, agent.role);
  
  // Parse structured findings from the response
  const findings = parseAgentResearchResponse(response);
  
  // Calculate risk score and confidence based on findings
  const riskScore = calculateRiskScore(findings);
  const confidenceLevel = calculateConfidenceLevel(findings);
  
  return {
    agent,
    findings,
    riskScore,
    confidenceLevel
  };
}

/**
 * Individual agent researches a person
 */
async function agentResearchPerson(
  agent: Agent, 
  application: LoanApplication,
  ownerName: string
): Promise<AgentResearchResult> {
  // Generate specialized prompt for this agent
  const prompt = generateOwnerResearchPrompt(agent, application, ownerName);
  
  // Send prompt to Perplexity API
  const response = await callPerplexityAPI(prompt, agent.role);
  
  // Parse structured findings from the response
  const findings = parseAgentResearchResponse(response);
  
  // Calculate risk score and confidence based on findings
  const riskScore = calculateRiskScore(findings);
  const confidenceLevel = calculateConfidenceLevel(findings);
  
  return {
    agent,
    findings,
    riskScore,
    confidenceLevel
  };
}

/**
 * Generate company research prompt specific to agent specialty
 */
function generateCompanyResearchPrompt(
  agent: Agent, 
  application: LoanApplication
): string {
  const { businessName, industry, yearsInBusiness, annualRevenue } = application;
  
  // Common prompt prefix
  const promptPrefix = `
You are an expert ${agent.specialty} specialist conducting deep research on ${businessName}, a company in the ${industry} industry that has been in business for ${yearsInBusiness} years with annual revenue of ${annualRevenue}.

Your task is to provide a comprehensive analysis focused specifically on ${agent.researchFocus.join(", ")}. This is part of a business loan assessment, so focus on risk factors and strengths that would impact loan repayment ability.

Conduct a thorough web search and provide a detailed analysis with specific findings, not general statements. Include specific dates, numbers, events, and sources when available.

Structure your response as follows:
1. Summary (2-3 sentences overview)
2. Detailed Analysis (minimum 3 paragraphs with specific details)
3. Key Points (5-7 bullet points highlighting strengths)
4. Recommendations (2-3 bullet points)
5. Risk Factors (5-7 bullet points, each labeled as Low, Moderate, or High risk)
6. Sources (list specific sources of information)
`;

  // Agent-specific prompt additions
  let agentSpecificPrompt = "";
  
  switch (agent.role) {
    case AgentSpecialization.BUSINESS_ANALYST:
      agentSpecificPrompt = `
Focus on business operations, management team quality, operational efficiency, and business model viability.
Include specific metrics on employee count, growth trajectory, management team experience, and operational strengths/weaknesses.
`;
      break;
    case AgentSpecialization.LEGAL_RESEARCHER:
      agentSpecificPrompt = `
Focus on litigation history, regulatory compliance issues, legal risks, and intellectual property status.
Mention specific lawsuits, regulatory violations, compliance matters with dates and outcomes when available.
`;
      break;
    case AgentSpecialization.FINANCIAL_AUDITOR:
      agentSpecificPrompt = `
Focus on financial health indicators, debt obligations, profitability trends, and cash flow stability.
Include specific financial ratios, debt levels, profitability percentages and compare to industry averages.
`;
      break;
    case AgentSpecialization.INDUSTRY_SPECIALIST:
      agentSpecificPrompt = `
Focus on industry positioning, market share, competitive advantages/disadvantages, and industry-specific risks.
Include specific market position data, key competitors, industry growth rates and regulatory challenges.
`;
      break;
    case AgentSpecialization.MARKET_RESEARCHER:
      agentSpecificPrompt = `
Focus on market growth potential, competitive landscape, consumer trends, and market disruptions.
Include specific market size data, growth projections, competitor actions, and emerging trends.
`;
      break;
  }
  
  return promptPrefix + agentSpecificPrompt;
}

/**
 * Generate owner research prompt specific to agent specialty
 */
function generateOwnerResearchPrompt(
  agent: Agent, 
  application: LoanApplication,
  ownerName: string
): string {
  const { businessName, industry } = application;
  
  // Common prompt prefix
  const promptPrefix = `
You are an expert ${agent.specialty} specialist conducting deep research on ${ownerName}, the owner of ${businessName}, a company in the ${industry} industry.

Your task is to provide a comprehensive analysis focused specifically on the owner's ${agent.researchFocus.join(", ")}. This is part of a business loan assessment, so focus on owner-specific risk factors and strengths that would impact loan repayment ability.

Conduct a thorough web search and provide a detailed analysis with specific findings, not general statements. Include specific dates, numbers, events, and sources when available.

Structure your response as follows:
1. Summary (2-3 sentences overview)
2. Detailed Analysis (minimum 3 paragraphs with specific details)
3. Key Points (5-7 bullet points highlighting strengths)
4. Recommendations (2-3 bullet points)
5. Risk Factors (5-7 bullet points, each labeled as Low, Moderate, or High risk)
6. Sources (list specific sources of information)
`;

  // Agent-specific prompt additions
  let agentSpecificPrompt = "";
  
  switch (agent.role) {
    case AgentSpecialization.BUSINESS_ANALYST:
      agentSpecificPrompt = `
Focus on the owner's management experience, business track record, leadership style, and prior business successes/failures.
Include specific details about previous businesses owned/managed, leadership roles, management approach, and business successes or failures.
`;
      break;
    case AgentSpecialization.LEGAL_RESEARCHER:
      agentSpecificPrompt = `
Focus on the owner's personal legal history, bankruptcies, liens, legal disputes, and regulatory issues.
Mention specific legal issues, bankruptcies, tax liens, or other legal matters with dates and outcomes when available.
`;
      break;
    case AgentSpecialization.FINANCIAL_AUDITOR:
      agentSpecificPrompt = `
Focus on the owner's personal financial history, credit issues, investment patterns, and wealth management.
Include specific financial events, credit history issues, investment successes/failures, and wealth indicators if available.
`;
      break;
    case AgentSpecialization.INDUSTRY_SPECIALIST:
      agentSpecificPrompt = `
Focus on the owner's industry reputation, industry expertise, specialization, and industry relationships.
Include specific industry roles, contributions to the industry, specialization areas, and industry recognition.
`;
      break;
    case AgentSpecialization.MARKET_RESEARCHER:
      agentSpecificPrompt = `
Focus on the owner's market innovations, competitive strategies, market positioning, and customer relationship approach.
Include specific market innovations introduced, competitive strategies employed, and market positioning approaches.
`;
      break;
  }
  
  return promptPrefix + agentSpecificPrompt;
}

/**
 * Parse agent research response into structured format
 */
function parseAgentResearchResponse(response: string): {
  summary: string;
  detailedAnalysis: string;
  keyPoints: string[];
  recommendations: string[];
  riskFactors: string[];
  sources: string[];
} {
  // Extract sections based on common patterns
  const summaryMatch = response.match(/(?:Summary|SUMMARY):\s*([\s\S]*?)(?=\n\s*(?:Detailed Analysis|DETAILED ANALYSIS)|$)/i);
  const detailedAnalysisMatch = response.match(/(?:Detailed Analysis|DETAILED ANALYSIS):\s*([\s\S]*?)(?=\n\s*(?:Key Points|KEY POINTS)|$)/i);
  const keyPointsMatch = response.match(/(?:Key Points|KEY POINTS):\s*([\s\S]*?)(?=\n\s*(?:Recommendations|RECOMMENDATIONS)|$)/i);
  const recommendationsMatch = response.match(/(?:Recommendations|RECOMMENDATIONS):\s*([\s\S]*?)(?=\n\s*(?:Risk Factors|RISK FACTORS)|$)/i);
  const riskFactorsMatch = response.match(/(?:Risk Factors|RISK FACTORS):\s*([\s\S]*?)(?=\n\s*(?:Sources|SOURCES)|$)/i);
  const sourcesMatch = response.match(/(?:Sources|SOURCES):\s*([\s\S]*?)$/i);
  
  // Parse structured sections
  const summary = summaryMatch?.[1]?.trim() || "No summary provided";
  const detailedAnalysis = detailedAnalysisMatch?.[1]?.trim() || "No detailed analysis provided";
  
  // Parse bulleted lists
  const keyPoints = extractBulletedList(keyPointsMatch?.[1] || "");
  const recommendations = extractBulletedList(recommendationsMatch?.[1] || "");
  const riskFactors = extractBulletedList(riskFactorsMatch?.[1] || "");
  const sources = extractBulletedList(sourcesMatch?.[1] || "");
  
  return {
    summary,
    detailedAnalysis,
    keyPoints,
    recommendations,
    riskFactors,
    sources
  };
}

/**
 * Extract bulleted list from text
 */
function extractBulletedList(text: string): string[] {
  if (!text) return [];
  
  // Match different bullet point styles
  const bulletPatterns = [
    /(?:^|\n)[-•*] +(.*?)(?=\n[-•*]|\n\n|$)/g,  // Hyphen, bullet, or asterisk
    /(?:^|\n)\d+\. +(.*?)(?=\n\d+\.|\n\n|$)/g,  // Numbered list
    /(?:^|\n)(?:\*\*|__)?(?:\w+)(?:\*\*|__)?: +(.*?)(?=\n(?:\*\*|__)?(?:\w+)(?:\*\*|__)?:|\n\n|$)/g  // Bold/underlined keyword followed by colon
  ];
  
  const results: string[] = [];
  
  // Try each bullet pattern
  for (const pattern of bulletPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    if (matches.length > 0) {
      return matches.map(match => match[1].trim());
    }
  }
  
  // If no bullet patterns matched, try splitting by newlines
  if (results.length === 0) {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  
  return results;
}

/**
 * Calculate risk score based on findings
 */
function calculateRiskScore(findings: {
  summary: string;
  detailedAnalysis: string;
  keyPoints: string[];
  recommendations: string[];
  riskFactors: string[];
}): number {
  // Base score starts at middle (50)
  let score = 50;
  
  // Count risk factors by severity
  const highRisks = findings.riskFactors.filter(risk => 
    risk.toLowerCase().includes("high risk") || 
    risk.toLowerCase().includes("critical") ||
    risk.toLowerCase().includes("major")
  ).length;
  
  const moderateRisks = findings.riskFactors.filter(risk => 
    risk.toLowerCase().includes("moderate risk") || 
    risk.toLowerCase().includes("medium") ||
    risk.toLowerCase().includes("potential")
  ).length;
  
  const lowRisks = findings.riskFactors.filter(risk => 
    risk.toLowerCase().includes("low risk") || 
    risk.toLowerCase().includes("minor")
  ).length;
  
  // Adjust score based on risk factors
  score += highRisks * 10;      // +10 points per high risk
  score += moderateRisks * 5;   // +5 points per moderate risk
  score += lowRisks * 2;        // +2 points per low risk
  
  // Look for mitigating factors in key points
  const strengths = findings.keyPoints.filter(point => 
    point.toLowerCase().includes("strength") || 
    point.toLowerCase().includes("positive") ||
    point.toLowerCase().includes("strong") ||
    point.toLowerCase().includes("excellent")
  ).length;
  
  // Reduce score based on strengths
  score -= strengths * 3;       // -3 points per strength
  
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate confidence level in findings
 */
function calculateConfidenceLevel(findings: {
  summary: string;
  detailedAnalysis: string;
  keyPoints: string[];
  recommendations: string[];
  riskFactors: string[];
  sources: string[];
}): number {
  // Base confidence level
  let confidence = 50;
  
  // Increase confidence based on level of detail
  confidence += Math.min(20, findings.detailedAnalysis.length / 100); // Up to +20 for detailed analysis
  confidence += Math.min(10, findings.keyPoints.length * 2);          // Up to +10 for key points
  confidence += Math.min(10, findings.riskFactors.length * 2);        // Up to +10 for risk factors
  
  // Increase confidence based on sources
  confidence += Math.min(20, findings.sources.length * 4);            // Up to +20 for sources
  
  // Decrease confidence for vague language
  const vaguePhrases = [
    "may be", "could be", "might be", "possibly", "potentially",
    "unclear", "unknown", "limited information", "insufficient data"
  ];
  
  let vagueCount = 0;
  for (const phrase of vaguePhrases) {
    vagueCount += (findings.detailedAnalysis.toLowerCase().match(new RegExp(phrase, 'g')) || []).length;
  }
  
  confidence -= Math.min(30, vagueCount * 3); // Up to -30 for vague language
  
  // Ensure confidence stays within 0-100 range
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Call Perplexity API with specialized agent prompts
 */
async function callPerplexityAPI(
  prompt: string, 
  agentRole: AgentSpecialization
): Promise<string> {
  try {
    // Get Perplexity API key from environment variables
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY is not set in environment variables");
    }
    
    // Create message payload
    const messages = [
      {
        role: "system",
        content: `You are a specialized AI agent with expertise in ${agentRole.replace('_', ' ')}. Provide detailed, factual analysis focused specifically on your area of expertise.`
      },
      {
        role: "user",
        content: prompt
      }
    ];
    
    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages,
        temperature: 0.2,
        max_tokens: 2048,
        frequency_penalty: 1.0,
        presence_penalty: 0.0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling Perplexity API for agent research:", error);
    throw error;
  }
}

/**
 * Extract financial metrics from financial auditor's findings
 */
function extractFinancialMetrics(detailedAnalysis: string): {
  metric: string;
  value: string;
  industryAverage: string;
  trend: string;
}[] {
  if (!detailedAnalysis) return [];
  
  const metrics = [];
  
  // Common financial metrics to look for
  const metricPatterns = [
    { name: "Debt-to-Equity Ratio", regex: /debt[- ]to[- ]equity\s+ratio\s+(?:of|is|at|around|approximately)?\s+([\d.]+)[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)?/i },
    { name: "Current Ratio", regex: /current\s+ratio\s+(?:of|is|at|around|approximately)?\s+([\d.]+)[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)?/i },
    { name: "Quick Ratio", regex: /quick\s+ratio\s+(?:of|is|at|around|approximately)?\s+([\d.]+)[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)?/i },
    { name: "Profit Margin", regex: /profit\s+margin\s+(?:of|is|at|around|approximately)?\s+([\d.]+)%[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)%?/i },
    { name: "Return on Assets", regex: /return\s+on\s+assets\s+(?:of|is|at|around|approximately)?\s+([\d.]+)%[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)%?/i },
    { name: "Return on Equity", regex: /return\s+on\s+equity\s+(?:of|is|at|around|approximately)?\s+([\d.]+)%[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)%?/i },
    { name: "Inventory Turnover", regex: /inventory\s+turnover\s+(?:of|is|at|around|approximately)?\s+([\d.]+)[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)?/i },
    { name: "Revenue Growth", regex: /revenue\s+growth\s+(?:of|is|at|around|approximately)?\s+([\d.]+)%[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)%?/i },
    { name: "Cash Reserves", regex: /cash\s+reserves\s+(?:of|is|at|around|approximately)?\s+\$?([\d.]+)(?:k|M|B|million|billion|thousand)?[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+\$?([\d.]+)(?:k|M|B|million|billion|thousand)?/i },
    { name: "Operating Margin", regex: /operating\s+margin\s+(?:of|is|at|around|approximately)?\s+([\d.]+)%[^\d.]*(?:compared to|vs\.?|industry average|benchmark)?\s+([\d.]+)%?/i },
  ];
  
  // Look for trend indicators
  const trendPatterns = [
    { keyword: "increas", trend: "Increasing 📈" },
    { keyword: "upward", trend: "Increasing 📈" },
    { keyword: "rising", trend: "Increasing 📈" }, 
    { keyword: "grown", trend: "Increasing 📈" },
    { keyword: "grew", trend: "Increasing 📈" },
    { keyword: "improv", trend: "Improving 📈" },
    { keyword: "decreas", trend: "Decreasing 📉" },
    { keyword: "declin", trend: "Declining 📉" },
    { keyword: "downward", trend: "Decreasing 📉" },
    { keyword: "falling", trend: "Decreasing 📉" },
    { keyword: "fell", trend: "Decreasing 📉" },
    { keyword: "deterior", trend: "Deteriorating 📉" },
    { keyword: "stable", trend: "Stable ↔️" },
    { keyword: "consistent", trend: "Stable ↔️" },
    { keyword: "steady", trend: "Stable ↔️" },
    { keyword: "flat", trend: "Stable ↔️" },
    { keyword: "plateau", trend: "Stable ↔️" },
    { keyword: "maintained", trend: "Stable ↔️" },
  ];
  
  // Process each paragraph looking for metrics
  const paragraphs = detailedAnalysis.split('\n\n');
  
  for (const metric of metricPatterns) {
    for (const paragraph of paragraphs) {
      const match = paragraph.match(metric.regex);
      if (match) {
        // Found a metric - extract the value and industry average
        const value = match[1];
        let industryAverage = match[2] || "N/A";
        if (industryAverage === "N/A") {
          // Try to find industry average mentioned separately
          const avgMatch = paragraph.match(/industry\s+average\s+(?:of|is|at|around|approximately)?\s+([\d.]+)%?/i);
          if (avgMatch) {
            industryAverage = avgMatch[1];
          }
        }
        
        // Look for trend indicators in the paragraph
        let trend = "Neutral";
        for (const trendPattern of trendPatterns) {
          if (paragraph.toLowerCase().includes(trendPattern.keyword)) {
            trend = trendPattern.trend;
            break;
          }
        }
        
        metrics.push({
          metric: metric.name,
          value: metric.name.toLowerCase().includes("margin") || metric.name.toLowerCase().includes("growth") || metric.name.toLowerCase().includes("return") ? 
            `${value}%` : value.includes("$") ? value : `${value}`,
          industryAverage: industryAverage === "N/A" ? "N/A" : 
            metric.name.toLowerCase().includes("margin") || metric.name.toLowerCase().includes("growth") || metric.name.toLowerCase().includes("return") ? 
            `${industryAverage}%` : `${industryAverage}`,
          trend: trend
        });
        
        break; // Found this metric, move to the next one
      }
    }
  }
  
  // If no metrics found via patterns, create some basic ones from keywords
  if (metrics.length === 0) {
    // Look for any financial metrics mentioned with numbers
    const basicMetricRegex = /(\w+(?:\s+\w+){0,2})\s+(?:ratio|percentage|rate|value)\s+(?:of|is|at|around|approximately)?\s+([\d.]+)/gi;
    let match;
    while ((match = basicMetricRegex.exec(detailedAnalysis)) !== null) {
      metrics.push({
        metric: match[1].charAt(0).toUpperCase() + match[1].slice(1),
        value: match[2],
        industryAverage: "N/A",
        trend: "Neutral"
      });
    }
  }
  
  return metrics.slice(0, 5); // Return top 5 metrics
}

/**
 * Extract specific events with dates from text
 */
function extractSpecificEvents(detailedAnalysis: string): {
  event: string;
  date: string;
  impact: string;
  source: string;
}[] {
  if (!detailedAnalysis) return [];
  
  const events = [];
  const paragraphs = detailedAnalysis.split('\n\n');
  
  // Date pattern: looking for months and years in various formats
  const datePattern = /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.,]?\s+\d{4}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}/i;
  
  // Impact patterns
  const positiveImpacts = ["positive", "beneficial", "favorable", "improvement", "success", "strengthen", "growth", "increase"];
  const negativeImpacts = ["negative", "unfavorable", "adverse", "decline", "decrease", "loss", "weaken", "liability", "risk", "damage"];
  
  // Event types to look for
  const eventKeywords = [
    "acquisition", "merger", "expansion", "launch", "introduced", "release", "contract", 
    "partnership", "alliance", "litigation", "lawsuit", "settlement", "regulatory", 
    "compliance", "financing", "funding", "investment", "divest", "appointed", "hired",
    "restructuring", "downsizing", "layoff", "bankruptcy", "patent", "award"
  ];
  
  // Source keywords
  const sourceKeywords = ["reported by", "according to", "published in", "announced in", "press release", "filing", "disclosure"];
  
  // Process each paragraph
  for (const paragraph of paragraphs) {
    // Check if paragraph contains date and event keywords
    const dateMatch = paragraph.match(datePattern);
    if (!dateMatch) continue;
    
    const date = dateMatch[0];
    let hasEventKeyword = false;
    let eventType = "";
    
    for (const keyword of eventKeywords) {
      if (paragraph.toLowerCase().includes(keyword)) {
        hasEventKeyword = true;
        eventType = keyword;
        break;
      }
    }
    
    if (!hasEventKeyword) continue;
    
    // Extract event description - take the sentence containing both the date and the event keyword
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
    let eventDescription = "";
    
    for (const sentence of sentences) {
      if (sentence.includes(date) && sentence.toLowerCase().includes(eventType)) {
        eventDescription = sentence.trim();
        break;
      }
    }
    
    if (!eventDescription) {
      // If we couldn't find a sentence with both, take the first 100 chars after removing the date
      eventDescription = paragraph.replace(date, "").trim().slice(0, 100) + "...";
    }
    
    // Determine impact
    let impact = "Neutral impact on business operations";
    for (const positive of positiveImpacts) {
      if (paragraph.toLowerCase().includes(positive)) {
        impact = "Positive impact on business performance";
        break;
      }
    }
    
    for (const negative of negativeImpacts) {
      if (paragraph.toLowerCase().includes(negative)) {
        impact = "Negative impact requiring risk assessment";
        break;
      }
    }
    
    // Find source if available
    let source = "Industry publications";
    for (const sourceKeyword of sourceKeywords) {
      const sourceIndex = paragraph.toLowerCase().indexOf(sourceKeyword);
      if (sourceIndex !== -1) {
        const sourceEnd = paragraph.indexOf(".", sourceIndex);
        if (sourceEnd !== -1) {
          source = paragraph.substring(sourceIndex, sourceEnd).trim();
        }
        break;
      }
    }
    
    events.push({
      event: eventDescription,
      date: date,
      impact: impact,
      source: source
    });
  }
  
  return events.slice(0, 3); // Return top 3 events
}

/**
 * Extract prior business history from text
 */
function extractPriorBusinessHistory(detailedAnalysis: string): {
  companyName: string;
  role: string;
  years: string;
  outcome: string;
}[] {
  if (!detailedAnalysis) return [];
  
  const history = [];
  const paragraphs = detailedAnalysis.split('\n\n');
  
  // Look for paragraphs that mention previous businesses
  const priorBusinessKeywords = [
    "previous business", "prior business", "previous company", "prior company", 
    "previously owned", "prior ownership", "previously founded", "prior venture",
    "previous venture", "former business", "earlier venture", "past business"
  ];
  
  // Common business roles
  const roles = ["CEO", "founder", "co-founder", "owner", "president", "director", "partner", "executive"];
  
  // Year pattern: could be a range like 2015-2020 or just years mentioned
  const yearPattern = /(?:from\s+)?(\d{4})(?:\s*-\s*|\s+to\s+)(\d{4})|(\d{4})/gi;
  
  // Outcome keywords
  const positiveOutcomes = ["success", "profitable", "growth", "increased", "expanded", "acquired by", "acquisition", "sold for"];
  const negativeOutcomes = ["failure", "bankrupt", "bankruptcy", "closed", "shut down", "dissolved", "losses", "unsuccessful"];
  
  // Process each paragraph
  for (const paragraph of paragraphs) {
    let hasPriorBusinessKeyword = false;
    for (const keyword of priorBusinessKeywords) {
      if (paragraph.toLowerCase().includes(keyword)) {
        hasPriorBusinessKeyword = true;
        break;
      }
    }
    
    if (!hasPriorBusinessKeyword) continue;
    
    // Try to extract company name using patterns
    const companyNamePatterns = [
      /(?:at|with|founded|owned|ran|managed|operated)\s+([A-Z][A-Za-z0-9\s&\.,]+)(?:,|\s+in|\s+from|\s+between)/,
      /([A-Z][A-Za-z0-9\s&\.,]+)(?:\s+(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co)\.?)(?:,|\s+)/,
      /(?:company|business|venture)\s+(?:called|named)\s+([A-Z][A-Za-z0-9\s&\.,]+)(?:,|\s+)/
    ];
    
    let companyName = "";
    for (const pattern of companyNamePatterns) {
      const match = paragraph.match(pattern);
      if (match) {
        companyName = match[1].trim();
        break;
      }
    }
    
    if (!companyName) {
      // If we couldn't extract a name, look for text in quotes or just call it "Previous Venture"
      const quoteMatch = paragraph.match(/"([^"]+)"/);
      companyName = quoteMatch ? quoteMatch[1] : "Previous Venture";
    }
    
    // Extract role
    let role = "Owner";
    for (const r of roles) {
      if (paragraph.toLowerCase().includes(r.toLowerCase())) {
        role = r.charAt(0).toUpperCase() + r.slice(1);
        break;
      }
    }
    
    // Extract years
    let years = "Unspecified period";
    // Look for years like 2010-2015 or year ranges mentioned
    const yearMatches = paragraph.match(/\b(19|20)\d{2}\s*[-–—]\s*(19|20)\d{2}\b/);
    if (yearMatches) {
      years = yearMatches[0].replace(/\s+/g, '');
    } else {
      // Look for single years, might indicate current position
      const singleYearMatches = paragraph.match(/\b(19|20)\d{2}\b/g);
      if (singleYearMatches && singleYearMatches.length >= 2) {
        // Use first two years found
        years = `${singleYearMatches[0]}-${singleYearMatches[1]}`;
      } else if (singleYearMatches && singleYearMatches.length === 1) {
        // Just one year found, assume to present
        years = `${singleYearMatches[0]}-present`;
      }
    }
    
    // Determine outcome
    let outcome = "Unspecified outcome";
    for (const positive of positiveOutcomes) {
      if (paragraph.toLowerCase().includes(positive)) {
        outcome = "Successful";
        break;
      }
    }
    
    for (const negative of negativeOutcomes) {
      if (paragraph.toLowerCase().includes(negative)) {
        outcome = "Unsuccessful";
        break;
      }
    }
    
    history.push({
      companyName,
      role,
      years,
      outcome
    });
  }
  
  return history.slice(0, 3); // Return top 3 prior businesses
}

/**
 * Synthesize company research from multiple agent findings
 */
function synthesizeCompanyResearch(agentResults: AgentResearchResult[]): {
  overview: string;
  legalIssues: string[];
  financialRedFlags: string[];
  reputationInsights: string[];
  industryPosition: string[];
  marketTrends: string[];
  executiveSummary: string;
  detailedFindings: Record<string, string[]>;
  specificEvents?: {
    event: string;
    date: string;
    impact: string;
    source: string;
  }[];
  financialMetrics?: {
    metric: string;
    value: string;
    industryAverage: string;
    trend: string;
  }[];
  sources: string[];
  score: number;
} {
  // Extract and organize findings by agent role
  const businessAnalystFindings = agentResults.find(r => r.agent.role === AgentSpecialization.BUSINESS_ANALYST)?.findings;
  const legalResearcherFindings = agentResults.find(r => r.agent.role === AgentSpecialization.LEGAL_RESEARCHER)?.findings;
  const financialAuditorFindings = agentResults.find(r => r.agent.role === AgentSpecialization.FINANCIAL_AUDITOR)?.findings;
  const industrySpecialistFindings = agentResults.find(r => r.agent.role === AgentSpecialization.INDUSTRY_SPECIALIST)?.findings;
  const marketResearcherFindings = agentResults.find(r => r.agent.role === AgentSpecialization.MARKET_RESEARCHER)?.findings;
  
  // Create comprehensive overview combining different perspectives
  const overview = [
    businessAnalystFindings?.summary || "",
    financialAuditorFindings?.summary || "",
    industrySpecialistFindings?.summary || ""
  ].filter(s => s).join("\n\n");
  
  // Weighted risk score calculation
  const riskScores = agentResults.map(r => ({
    role: r.agent.role,
    score: r.riskScore,
    confidence: r.confidenceLevel
  }));
  
  // Weight scores by confidence level
  const totalConfidence = riskScores.reduce((sum, item) => sum + item.confidence, 0);
  let weightedScore = 0;
  
  if (totalConfidence > 0) {
    weightedScore = riskScores.reduce((sum, item) => sum + (item.score * (item.confidence / totalConfidence)), 0);
  } else {
    // If no confidence, use simple average
    weightedScore = riskScores.reduce((sum, item) => sum + item.score, 0) / riskScores.length;
  }
  
  // Convert risk score to safety score (100 - risk)
  const safetyScore = 100 - Math.round(weightedScore);
  
  // Collect all sources without duplication
  const allSources = new Set<string>();
  agentResults.forEach(r => r.findings.sources.forEach(source => allSources.add(source)));
  
  // Generate financial metrics from the financial auditor's findings
  const financialMetrics = financialAuditorFindings ? extractFinancialMetrics(financialAuditorFindings.detailedAnalysis) : [];
  
  // Generate specific events from business analyst and industry specialist findings
  const specificEvents = extractSpecificEvents(
    [businessAnalystFindings?.detailedAnalysis, industrySpecialistFindings?.detailedAnalysis].filter(Boolean).join("\n\n")
  );
  
  // Organize findings by category
  return {
    overview,
    legalIssues: (legalResearcherFindings?.riskFactors || []).filter(issue => issue.toLowerCase().includes("legal") || issue.toLowerCase().includes("litigation") || issue.toLowerCase().includes("regulatory")),
    financialRedFlags: (financialAuditorFindings?.riskFactors || []).filter(issue => issue.toLowerCase().includes("financial") || issue.toLowerCase().includes("cash flow") || issue.toLowerCase().includes("debt")),
    reputationInsights: [
      ...(businessAnalystFindings?.keyPoints || []).filter(point => point.toLowerCase().includes("reputation") || point.toLowerCase().includes("management")),
      ...(marketResearcherFindings?.keyPoints || []).filter(point => point.toLowerCase().includes("reputation") || point.toLowerCase().includes("customer"))
    ],
    industryPosition: (industrySpecialistFindings?.keyPoints || []),
    marketTrends: (marketResearcherFindings?.keyPoints || []),
    executiveSummary: generateExecutiveSummary(agentResults, "company"),
    detailedFindings: {
      businessOperations: businessAnalystFindings?.detailedAnalysis ? [businessAnalystFindings.detailedAnalysis] : [],
      legalCompliance: legalResearcherFindings?.detailedAnalysis ? [legalResearcherFindings.detailedAnalysis] : [],
      financialHealth: financialAuditorFindings?.detailedAnalysis ? [financialAuditorFindings.detailedAnalysis] : [],
      industryContext: industrySpecialistFindings?.detailedAnalysis ? [industrySpecialistFindings.detailedAnalysis] : [],
      marketPosition: marketResearcherFindings?.detailedAnalysis ? [marketResearcherFindings.detailedAnalysis] : []
    },
    financialMetrics,
    specificEvents,
    sources: Array.from(allSources),
    score: safetyScore
  };
}

/**
 * Synthesize owner research from multiple agent findings
 */
function synthesizeOwnerResearch(agentResults: AgentResearchResult[]): {
  overview: string;
  legalIssues: string[];
  financialRedFlags: string[];
  reputationInsights: string[];
  managementCapabilities: string[];
  executiveSummary: string;
  detailedFindings: Record<string, string[]>;
  priorBusinessHistory?: {
    companyName: string;
    role: string;
    years: string;
    outcome: string;
  }[];
  sources: string[];
  score: number;
} {
  // Extract and organize findings by agent role
  const businessAnalystFindings = agentResults.find(r => r.agent.role === AgentSpecialization.BUSINESS_ANALYST)?.findings;
  const legalResearcherFindings = agentResults.find(r => r.agent.role === AgentSpecialization.LEGAL_RESEARCHER)?.findings;
  const financialAuditorFindings = agentResults.find(r => r.agent.role === AgentSpecialization.FINANCIAL_AUDITOR)?.findings;
  const industrySpecialistFindings = agentResults.find(r => r.agent.role === AgentSpecialization.INDUSTRY_SPECIALIST)?.findings;
  
  // Create comprehensive overview combining different perspectives
  const overview = [
    businessAnalystFindings?.summary || "",
    legalResearcherFindings?.summary || "",
    financialAuditorFindings?.summary || ""
  ].filter(s => s).join("\n\n");
  
  // Weighted risk score calculation
  const riskScores = agentResults.map(r => ({
    role: r.agent.role,
    score: r.riskScore,
    confidence: r.confidenceLevel
  }));
  
  // Weight scores by confidence level
  const totalConfidence = riskScores.reduce((sum, item) => sum + item.confidence, 0);
  let weightedScore = 0;
  
  if (totalConfidence > 0) {
    weightedScore = riskScores.reduce((sum, item) => sum + (item.score * (item.confidence / totalConfidence)), 0);
  } else {
    // If no confidence, use simple average
    weightedScore = riskScores.reduce((sum, item) => sum + item.score, 0) / riskScores.length;
  }
  
  // Convert risk score to safety score (100 - risk)
  const safetyScore = 100 - Math.round(weightedScore);
  
  // Collect all sources without duplication
  const allSources = new Set<string>();
  agentResults.forEach(r => r.findings.sources.forEach(source => allSources.add(source)));
  
  // Extract prior business history from business analyst findings
  const priorBusinessHistory = businessAnalystFindings ? extractPriorBusinessHistory(businessAnalystFindings.detailedAnalysis) : [];
  
  // Organize findings by category
  return {
    overview,
    legalIssues: (legalResearcherFindings?.riskFactors || []).filter(issue => issue.toLowerCase().includes("legal") || issue.toLowerCase().includes("litigation") || issue.toLowerCase().includes("regulatory")),
    financialRedFlags: (financialAuditorFindings?.riskFactors || []).filter(issue => issue.toLowerCase().includes("financial") || issue.toLowerCase().includes("bankruptcy") || issue.toLowerCase().includes("debt")),
    reputationInsights: [
      ...(businessAnalystFindings?.keyPoints || []).filter(point => point.toLowerCase().includes("reputation") || point.toLowerCase().includes("history")),
      ...(industrySpecialistFindings?.keyPoints || []).filter(point => point.toLowerCase().includes("reputation") || point.toLowerCase().includes("experience"))
    ],
    managementCapabilities: (businessAnalystFindings?.keyPoints || []).filter(point => point.toLowerCase().includes("management") || point.toLowerCase().includes("leadership") || point.toLowerCase().includes("experience")),
    executiveSummary: generateExecutiveSummary(agentResults, "owner"),
    detailedFindings: {
      managementCapabilities: businessAnalystFindings?.detailedAnalysis ? [businessAnalystFindings.detailedAnalysis] : [],
      legalHistory: legalResearcherFindings?.detailedAnalysis ? [legalResearcherFindings.detailedAnalysis] : [],
      financialBackground: financialAuditorFindings?.detailedAnalysis ? [financialAuditorFindings.detailedAnalysis] : [],
      industryExperience: industrySpecialistFindings?.detailedAnalysis ? [industrySpecialistFindings.detailedAnalysis] : []
    },
    priorBusinessHistory,
    sources: Array.from(allSources),
    score: safetyScore
  };
}

/**
 * Generate executive summary from multiple agent findings
 */
function generateExecutiveSummary(agentResults: AgentResearchResult[], type: "company" | "owner"): string {
  // Combine key insights across all agents
  const allKeyPoints = agentResults.flatMap(r => r.findings.keyPoints).filter(Boolean);
  const allRiskFactors = agentResults.flatMap(r => r.findings.riskFactors).filter(Boolean);
  const allRecommendations = agentResults.flatMap(r => r.findings.recommendations).filter(Boolean);
  
  // Calculate overall confidence
  const avgConfidence = agentResults.reduce((sum, r) => sum + r.confidenceLevel, 0) / agentResults.length;
  const confidenceLevel = avgConfidence >= 70 ? "high" : avgConfidence >= 40 ? "moderate" : "low";
  
  // Count risk levels
  const highRisks = allRiskFactors.filter(r => r.toLowerCase().includes("high") || r.toLowerCase().includes("critical")).length;
  const moderateRisks = allRiskFactors.filter(r => r.toLowerCase().includes("medium") || r.toLowerCase().includes("moderate")).length;
  const lowRisks = allRiskFactors.filter(r => r.toLowerCase().includes("low") || r.toLowerCase().includes("minor")).length;
  
  // Overall risk assessment
  let riskAssessment = "moderate";
  if (highRisks > 2) riskAssessment = "high";
  else if (highRisks === 0 && lowRisks > moderateRisks) riskAssessment = "low";
  
  // Choose appropriate descriptors based on type
  const entityDesc = type === "company" ? "company" : "business owner";
  const aspectDesc = type === "company" ? 
    "business model, financial health, market position, and legal status" : 
    "management experience, financial background, industry expertise, and legal history";
  
  // Generate summary paragraphs
  const summary = `
EXECUTIVE SUMMARY

Our multi-agent research system has conducted a comprehensive analysis of this ${entityDesc}'s ${aspectDesc}. The investigation involved specialized AI agents focusing on different aspects of due diligence, with a ${confidenceLevel} level of confidence in the findings.

The analysis identified ${highRisks} high-risk factors, ${moderateRisks} moderate-risk factors, and ${lowRisks} low-risk factors, resulting in an overall ${riskAssessment} risk assessment. Key strengths include ${sampleItems(allKeyPoints.filter(k => k.toLowerCase().includes("strength") || k.toLowerCase().includes("positive")), 2).join(" and ")}. Primary concerns include ${sampleItems(allRiskFactors.filter(r => r.toLowerCase().includes("high")), 2).join(" and ")}.

Based on our comprehensive analysis, we ${riskAssessment === "high" ? "recommend caution" : riskAssessment === "moderate" ? "suggest proceeding with standard monitoring" : "see favorable indicators"} for this loan application. ${sampleItems(allRecommendations, 1)[0] || ""}
`;

  return summary.trim();
}

/**
 * Determine grade based on score
 */
function determineGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  return "C-";
}

/**
 * Helper to select a sample of items from an array
 */
function sampleItems<T>(items: T[], count: number): T[] {
  if (!items.length) return [];
  if (items.length <= count) return items;
  
  // Select diverse items (from beginning, middle, end)
  const result: T[] = [];
  const step = Math.floor(items.length / count);
  
  for (let i = 0; i < count; i++) {
    const index = Math.min(i * step, items.length - 1);
    result.push(items[index]);
  }
  
  return result;
}