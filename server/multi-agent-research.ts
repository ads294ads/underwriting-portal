import { LoanApplication } from "../shared/schema";

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
      "growth trajectory"
    ]
  },
  {
    role: AgentSpecialization.LEGAL_RESEARCHER,
    name: "LegalResearcher",
    specialty: "Legal compliance and litigation analysis",
    researchFocus: [
      "litigation history",
      "regulatory compliance",
      "legal disputes",
      "intellectual property issues",
      "contract obligations"
    ]
  },
  {
    role: AgentSpecialization.FINANCIAL_AUDITOR,
    name: "FinancialAuditor",
    specialty: "Financial health and reporting analysis",
    researchFocus: [
      "financial statement accuracy",
      "cash flow management",
      "debt structure analysis",
      "accounting practices",
      "financial risk assessment"
    ]
  },
  {
    role: AgentSpecialization.INDUSTRY_SPECIALIST,
    name: "IndustrySpecialist",
    specialty: "Industry trends and competitive positioning",
    researchFocus: [
      "industry growth potential",
      "competitive landscape",
      "market share analysis",
      "industry regulations",
      "technological disruption impact"
    ]
  },
  {
    role: AgentSpecialization.MARKET_RESEARCHER,
    name: "MarketResearcher",
    specialty: "Market conditions and customer analysis",
    researchFocus: [
      "target market size",
      "customer demographics",
      "market saturation",
      "customer acquisition costs",
      "customer retention metrics"
    ]
  }
];

// Interface for agent research results
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

// Research coordination
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
    sources: string[];
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
    sources: string[];
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
  try {
    console.log("Starting multi-agent research system...");
    
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error("Perplexity API Key not found.");
    }
    
    // Extract company and owner information
    const companyName = application.businessName;
    const industry = application.industry;
    
    // Get primary owner information
    let primaryOwner = { name: "Business Owner", ownership: 100 }; // Default
    
    if (application.businessOwners && application.businessOwners.length > 0) {
      // Find owners with 20% or more ownership
      const significantOwners = application.businessOwners.filter(owner => 
        owner.ownership >= 20
      );
      
      if (significantOwners.length > 0) {
        // Use the owner with the highest ownership percentage
        primaryOwner = significantOwners.reduce((prev, current) => 
          (prev.ownership > current.ownership) ? prev : current
        );
      }
    }
    
    // Coordinate parallel research tasks
    console.log(`Deploying research agents to analyze ${companyName} (${industry}) and owner ${primaryOwner.name}`);
    
    // Company research - each agent researches in parallel
    const companyResearchPromises: Promise<AgentResearchResult>[] = researchAgents.map(agent => 
      agentResearchCompany(agent, companyName, industry, application)
    );
    
    // Owner research - each agent researches in parallel
    const ownerResearchPromises: Promise<AgentResearchResult>[] = researchAgents.map(agent => 
      agentResearchPerson(agent, primaryOwner.name, companyName, application)
    );
    
    // Wait for all research to complete
    const [companyResults, ownerResults] = await Promise.all([
      Promise.all(companyResearchPromises),
      Promise.all(ownerResearchPromises)
    ]);
    
    console.log("All research agents have completed their tasks. Synthesizing findings...");
    
    // Synthesize company research findings
    const companyAnalysis = synthesizeCompanyResearch(companyResults);
    
    // Synthesize owner research findings
    const ownerAnalysis = synthesizeOwnerResearch(ownerResults);
    
    // Calculate combined score and determine grade
    const combinedScore = Math.round((companyAnalysis.score + ownerAnalysis.score) / 2);
    const grade = determineGrade(combinedScore);
    
    // Identify highest risk factors
    const highRiskFactors = [...companyResults, ...ownerResults]
      .flatMap(result => result.findings.riskFactors.filter((_, i) => i < 2))
      .filter(factor => factor.toLowerCase().includes("high risk") || 
                        factor.toLowerCase().includes("serious concern") ||
                        factor.toLowerCase().includes("critical issue"));
                        
    const moderateRiskFactors = [...companyResults, ...ownerResults]
      .flatMap(result => result.findings.riskFactors)
      .filter(factor => !highRiskFactors.includes(factor) &&
                       (factor.toLowerCase().includes("moderate risk") || 
                        factor.toLowerCase().includes("potential concern")));
                        
    const mitigatingFactors = [...companyResults, ...ownerResults]
      .flatMap(result => result.findings.recommendations)
      .filter(rec => rec.toLowerCase().includes("strength") || 
                    rec.toLowerCase().includes("positive") ||
                    rec.toLowerCase().includes("mitigat"));
    
    return {
      companyAnalysis,
      ownerAnalysis,
      combinedScore,
      grade,
      riskAssessment: {
        highRiskFactors: highRiskFactors.slice(0, 5),
        moderateRiskFactors: moderateRiskFactors.slice(0, 5),
        mitigatingFactors: mitigatingFactors.slice(0, 5)
      }
    };
    
  } catch (error) {
    console.error("Error in multi-agent research system:", error);
    throw error;
  }
}

/**
 * Individual agent researches a company
 */
async function agentResearchCompany(
  agent: Agent, 
  companyName: string, 
  industry: string,
  application: LoanApplication
): Promise<AgentResearchResult> {
  try {
    console.log(`Agent ${agent.name} researching company ${companyName}`);
    
    // Create specialized prompt based on agent specialty
    const prompt = generateCompanyResearchPrompt(agent, companyName, industry, application);
    
    // Perform in-depth research with specialized focus
    const researchResponse = await callPerplexityAPI(prompt, agent.role);
    
    // Parse and structure the response
    const findings = parseAgentResearchResponse(researchResponse);
    
    // Calculate risk scores based on findings
    const riskScore = calculateRiskScore(findings);
    const confidenceLevel = calculateConfidenceLevel(findings);
    
    return {
      agent,
      findings,
      riskScore,
      confidenceLevel
    };
    
  } catch (error) {
    console.error(`Error in agent ${agent.name} company research:`, error);
    
    // Return fallback research with error note
    return {
      agent,
      findings: {
        summary: `Research by ${agent.name} on ${companyName} could not be completed.`,
        detailedAnalysis: "Error occurred during research process.",
        keyPoints: ["Research incomplete due to technical issues."],
        recommendations: ["Manual review recommended due to incomplete automated analysis."],
        riskFactors: ["Unknown risk due to incomplete analysis."],
        sources: []
      },
      riskScore: 50, // Neutral score
      confidenceLevel: 0 // Zero confidence
    };
  }
}

/**
 * Individual agent researches a person
 */
async function agentResearchPerson(
  agent: Agent, 
  ownerName: string, 
  companyName: string,
  application: LoanApplication
): Promise<AgentResearchResult> {
  try {
    console.log(`Agent ${agent.name} researching owner ${ownerName}`);
    
    // Create specialized prompt based on agent specialty
    const prompt = generateOwnerResearchPrompt(agent, ownerName, companyName, application);
    
    // Perform in-depth research
    const researchResponse = await callPerplexityAPI(prompt, agent.role);
    
    // Parse and structure the response
    const findings = parseAgentResearchResponse(researchResponse);
    
    // Calculate risk scores based on findings
    const riskScore = calculateRiskScore(findings);
    const confidenceLevel = calculateConfidenceLevel(findings);
    
    return {
      agent,
      findings,
      riskScore,
      confidenceLevel
    };
    
  } catch (error) {
    console.error(`Error in agent ${agent.name} owner research:`, error);
    
    // Return fallback research with error note
    return {
      agent,
      findings: {
        summary: `Research by ${agent.name} on ${ownerName} could not be completed.`,
        detailedAnalysis: "Error occurred during research process.",
        keyPoints: ["Research incomplete due to technical issues."],
        recommendations: ["Manual review recommended due to incomplete automated analysis."],
        riskFactors: ["Unknown risk due to incomplete analysis."],
        sources: []
      },
      riskScore: 50, // Neutral score
      confidenceLevel: 0 // Zero confidence
    };
  }
}

/**
 * Generate company research prompt specific to agent specialty
 */
function generateCompanyResearchPrompt(
  agent: Agent, 
  companyName: string, 
  industry: string,
  application: LoanApplication
): string {
  // Common context for all agents
  const commonContext = `
Company Name: ${companyName}
Industry: ${industry}
Annual Revenue: $${application.annualRevenue}
Years in Business: ${application.yearsInBusiness}
Loan Amount Requested: $${application.loanAmount}
  `;
  
  // Specialized questions based on agent role
  let specializedQuestions = "";
  
  switch (agent.role) {
    case AgentSpecialization.BUSINESS_ANALYST:
      specializedQuestions = `
1. What is the business model of ${companyName} and how sustainable is it in the current market?
2. How experienced is the management team and what is their track record?
3. What is the company's growth trajectory over the past 3-5 years?
4. How does the company's operational efficiency compare to industry standards?
5. What strategic initiatives has the company undertaken recently?
      `;
      break;
      
    case AgentSpecialization.LEGAL_RESEARCHER:
      specializedQuestions = `
1. Has ${companyName} been involved in any significant litigation in the past 5 years?
2. Are there any regulatory compliance issues or investigations involving the company?
3. What is the company's intellectual property position and are there any disputes?
4. Are there any pending legal actions that could affect the company's financial stability?
5. Has the company faced any consumer complaints or regulatory fines?
      `;
      break;
      
    case AgentSpecialization.FINANCIAL_AUDITOR:
      specializedQuestions = `
1. What are the key financial ratios for ${companyName} and how do they compare to industry benchmarks?
2. Are there any red flags in the company's financial reporting history?
3. How is the company's debt structured and what is their debt service capacity?
4. What is the company's cash flow situation and liquidity position?
5. Are there any concerning accounting practices or financial inconsistencies?
      `;
      break;
      
    case AgentSpecialization.INDUSTRY_SPECIALIST:
      specializedQuestions = `
1. What is the current state and outlook of the ${industry} industry?
2. How does ${companyName} compare to key competitors in the industry?
3. What market share does the company have and is it growing or declining?
4. What regulatory changes might impact this industry in the near future?
5. How is technological disruption affecting this industry and the company specifically?
      `;
      break;
      
    case AgentSpecialization.MARKET_RESEARCHER:
      specializedQuestions = `
1. What is the size and growth potential of ${companyName}'s target market?
2. Who are the company's primary customers and what is their satisfaction level?
3. What are the customer acquisition costs and retention rates for businesses in this sector?
4. How saturated is the market and what barriers to entry exist?
5. What consumer or market trends might affect demand for the company's products/services?
      `;
      break;
  }
  
  // Construct the full prompt
  return `
You are ${agent.name}, a specialized AI agent focusing on ${agent.specialty}. You are part of a multi-agent system performing deep due diligence on a business loan application.

BUSINESS CONTEXT:
${commonContext}

Your task is to research ${companyName} with a specific focus on your specialization areas:
${agent.researchFocus.join(', ')}

RESEARCH QUESTIONS:
${specializedQuestions}

INSTRUCTIONS:
1. Conduct deep research on the company using the available information.
2. Focus specifically on your area of expertise and the questions above.
3. Be thorough, detailed, and analytical in your assessment.
4. Cite specific facts, figures, dates, and sources whenever possible.
5. Provide both supporting evidence and contrary evidence for balance.

REQUIRED RESPONSE FORMAT:
Provide your response in JSON format with the following structure:
{
  "summary": "A concise 2-3 paragraph summary of your key findings",
  "detailedAnalysis": "A detailed 4-6 paragraph analysis with specific evidence and data points",
  "keyPoints": ["List 5-8 key points from your research"],
  "recommendations": ["List 3-5 recommendations based on your findings"],
  "riskFactors": ["List specific risk factors with severity indicators (High/Medium/Low)"],
  "sources": ["List all sources of information consulted"]
}
`;
}

/**
 * Generate owner research prompt specific to agent specialty
 */
function generateOwnerResearchPrompt(
  agent: Agent, 
  ownerName: string, 
  companyName: string,
  application: LoanApplication
): string {
  // Common context for all agents
  const commonContext = `
Owner Name: ${ownerName}
Company Name: ${companyName}
Industry: ${application.industry}
Years in Business: ${application.yearsInBusiness}
  `;
  
  // Specialized questions based on agent role
  let specializedQuestions = "";
  
  switch (agent.role) {
    case AgentSpecialization.BUSINESS_ANALYST:
      specializedQuestions = `
1. What is ${ownerName}'s leadership style and management philosophy?
2. What previous business ventures has the owner been involved with?
3. How does the owner's experience align with the current business needs?
4. What is the owner's educational background and relevant certifications?
5. How involved is the owner in day-to-day operations vs. strategic decision-making?
      `;
      break;
      
    case AgentSpecialization.LEGAL_RESEARCHER:
      specializedQuestions = `
1. Has ${ownerName} been involved in any personal or business litigation?
2. Are there any regulatory actions or investigations involving the owner?
3. Are there any legal issues in the owner's background that might affect lending risk?
4. Has the owner been involved with any businesses that faced regulatory issues?
5. Are there any conflicts of interest in the owner's business relationships?
      `;
      break;
      
    case AgentSpecialization.FINANCIAL_AUDITOR:
      specializedQuestions = `
1. What is ${ownerName}'s personal financial history and stability?
2. Has the owner been involved with any bankruptcies or financial restructurings?
3. What is the owner's approach to financial management in current and past businesses?
4. Are there any tax liens or personal financial issues that could affect the business?
5. How has the owner handled business finances in previous ventures?
      `;
      break;
      
    case AgentSpecialization.INDUSTRY_SPECIALIST:
      specializedQuestions = `
1. What is ${ownerName}'s reputation within the ${application.industry} industry?
2. How long has the owner been active in this specific industry?
3. Does the owner have recognized expertise or thought leadership in this field?
4. Has the owner adapted to major industry changes and trends in the past?
5. What industry relationships and connections does the owner maintain?
      `;
      break;
      
    case AgentSpecialization.MARKET_RESEARCHER:
      specializedQuestions = `
1. How does ${ownerName} engage with customers and understand market needs?
2. What is the owner's approach to marketing and brand development?
3. Has the owner demonstrated ability to identify and capitalize on market opportunities?
4. What is the owner's public reputation and media presence?
5. How does the owner respond to market feedback and customer concerns?
      `;
      break;
  }
  
  // Construct the full prompt
  return `
You are ${agent.name}, a specialized AI agent focusing on ${agent.specialty}. You are part of a multi-agent system performing deep due diligence on a business owner for a loan application.

BUSINESS OWNER CONTEXT:
${commonContext}

Your task is to research ${ownerName} with a specific focus on your specialization areas:
${agent.researchFocus.join(', ')}

RESEARCH QUESTIONS:
${specializedQuestions}

INSTRUCTIONS:
1. Conduct deep research on the business owner using the available information.
2. Focus specifically on your area of expertise and the questions above.
3. Be thorough, detailed, and analytical in your assessment.
4. Cite specific facts, figures, dates, and sources whenever possible.
5. Provide both supporting evidence and contrary evidence for balance.

REQUIRED RESPONSE FORMAT:
Provide your response in JSON format with the following structure:
{
  "summary": "A concise 2-3 paragraph summary of your key findings",
  "detailedAnalysis": "A detailed 4-6 paragraph analysis with specific evidence and data points",
  "keyPoints": ["List 5-8 key points from your research"],
  "recommendations": ["List 3-5 recommendations based on your findings"],
  "riskFactors": ["List specific risk factors with severity indicators (High/Medium/Low)"],
  "sources": ["List all sources of information consulted"]
}
`;
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
  try {
    // Attempt to parse JSON response
    const parsed = JSON.parse(response);
    
    return {
      summary: parsed.summary || "No summary provided.",
      detailedAnalysis: parsed.detailedAnalysis || "No detailed analysis provided.",
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      sources: Array.isArray(parsed.sources) ? parsed.sources : []
    };
  } catch (error) {
    console.error("Error parsing agent research response:", error);
    
    // Extract what we can from the text response
    const lines = response.split('\n');
    const keyPoints: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    
    lines.forEach(line => {
      if (line.includes("risk") || line.includes("concern")) {
        riskFactors.push(line.trim());
      } else if (line.includes("recommend") || line.includes("should")) {
        recommendations.push(line.trim());
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        keyPoints.push(line.trim().substring(2));
      }
    });
    
    // Construct a minimal response
    return {
      summary: response.substring(0, 500) + "...",
      detailedAnalysis: response,
      keyPoints: keyPoints.slice(0, 5),
      recommendations: recommendations.slice(0, 3),
      riskFactors: riskFactors.slice(0, 3),
      sources: []
    };
  }
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
  sources: string[];
}): number {
  // Start with a neutral score
  let riskScore = 50;
  
  // Count high/medium/low risk factors
  const highRiskCount = findings.riskFactors.filter(risk => 
    risk.toLowerCase().includes("high risk") || 
    risk.toLowerCase().includes("critical")
  ).length;
  
  const mediumRiskCount = findings.riskFactors.filter(risk => 
    risk.toLowerCase().includes("medium risk") || 
    risk.toLowerCase().includes("moderate")
  ).length;
  
  const lowRiskCount = findings.riskFactors.filter(risk => 
    risk.toLowerCase().includes("low risk") || 
    risk.toLowerCase().includes("minor")
  ).length;
  
  // Add risk points for each factor
  riskScore += highRiskCount * 10;
  riskScore += mediumRiskCount * 5;
  riskScore += lowRiskCount * 2;
  
  // Adjust for positive recommendations
  const positiveRecommendations = findings.recommendations.filter(rec => 
    rec.toLowerCase().includes("strength") || 
    rec.toLowerCase().includes("positive") ||
    rec.toLowerCase().includes("advantage")
  ).length;
  
  riskScore -= positiveRecommendations * 3;
  
  // Check for specific concerning terms in the analysis
  const concerningTerms = [
    "bankruptcy", "litigation", "lawsuit", "fraud", "investigation", 
    "regulatory action", "default", "late payment", "criminal", "violation"
  ];
  
  concerningTerms.forEach(term => {
    if (findings.detailedAnalysis.toLowerCase().includes(term)) {
      riskScore += 3;
    }
  });
  
  // Cap score between 0-100
  return Math.max(0, Math.min(100, riskScore));
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
  // Base confidence on amount of information and specificity
  let confidence = 50;
  
  // More sources = higher confidence
  confidence += Math.min(findings.sources.length * 5, 20);
  
  // More specific key points = higher confidence
  const specificKeyPoints = findings.keyPoints.filter(point => 
    /\d+%|\$\d+|\d+\.?\d*|[Jj]anuary|[Ff]ebruary|[Mm]arch|[Aa]pril|[Mm]ay|[Jj]une|[Jj]uly|[Aa]ugust|[Ss]eptember|[Oo]ctober|[Nn]ovember|[Dd]ecember|\d{4}/.test(point)
  ).length;
  
  confidence += specificKeyPoints * 3;
  
  // Check for hedging language that reduces confidence
  const hedgingPhrases = [
    "may be", "could be", "possibly", "potentially", "unclear", 
    "insufficient data", "limited information", "uncertain", "seems to be", "appears to"
  ];
  
  hedgingPhrases.forEach(phrase => {
    const matches = (findings.detailedAnalysis.match(new RegExp(phrase, "gi")) || []).length;
    confidence -= matches * 2;
  });
  
  // Cap confidence between 0-100
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
    // Customize system prompt based on agent role
    let systemPrompt = "You are a specialized AI agent performing deep research for business loan due diligence.";
    
    switch (agentRole) {
      case AgentSpecialization.BUSINESS_ANALYST:
        systemPrompt = "You are a business operations analyst with over 20 years of experience evaluating business models, operational efficiency, and management quality. Your analysis focuses on business fundamentals and execution capability.";
        break;
      case AgentSpecialization.LEGAL_RESEARCHER:
        systemPrompt = "You are a legal researcher with expertise in corporate law, regulatory compliance, and litigation research. Your analysis focuses on identifying legal risks and compliance issues.";
        break;
      case AgentSpecialization.FINANCIAL_AUDITOR:
        systemPrompt = "You are a financial auditor with expertise in financial statement analysis, accounting practices, and financial risk assessment. Your analysis focuses on financial health and transparency.";
        break;
      case AgentSpecialization.INDUSTRY_SPECIALIST:
        systemPrompt = "You are an industry specialist with deep knowledge of market dynamics, competitive positioning, and industry trends. Your analysis focuses on industry-specific success factors and challenges.";
        break;
      case AgentSpecialization.MARKET_RESEARCHER:
        systemPrompt = "You are a market researcher with expertise in consumer behavior, market trends, and competitive analysis. Your analysis focuses on market potential and customer-related factors.";
        break;
    }
    
    // Prepare the API request
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        // Enhanced search parameters
        search_focus: "internet",
        search_queries: ["auto"],
        search_recency_filter: "month",
        search_domain_filter: ["finance", "legal", "news", "research"],
        return_citations: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling Perplexity API for agent research:", error);
    throw error;
  }
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