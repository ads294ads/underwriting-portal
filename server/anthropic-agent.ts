import Anthropic from '@anthropic-ai/sdk';
import { LoanApplication } from '../shared/schema';
import { DeepResearchResult } from './deepsearch';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The newest Anthropic model is "claude-3-5-sonnet-20240620" which was released after the knowledge cutoff
const CLAUDE_MODEL = "claude-3-5-sonnet-20240620";

/**
 * The main function to perform deep research using Anthropic's Claude
 * @param application The loan application to research
 * @returns A structured deep research result
 */
export async function performClaudeResearch(application: LoanApplication): Promise<DeepResearchResult> {
  console.log(`Starting Claude deep research for ${application.businessName}`);
  
  try {
    // Perform company research
    const companyAnalysis = await researchCompany(
      application.businessName,
      application.industry,
      application.yearsInBusiness,
      application.annualRevenue
    );
    
    // Perform owner research for each business owner
    const ownerAnalyses = await Promise.all(
      (application.businessOwners || [])
        .filter(owner => {
          // Check if owner has significant ownership (20% or more)
          const ownershipPercent = owner.ownership ? Number(owner.ownership) : 0;
          return ownershipPercent >= 20;
        })
        .map(async owner => {
          return await researchPerson(
            owner.name,
            application.businessName,
            application.industry
          );
        })
    );
    
    // Combine all owner analyses into one
    const ownerAnalysis = combineOwnerAnalyses(ownerAnalyses);
    
    // Calculate combined score
    const companyWeight = 0.7; // 70% weight to company
    const ownerWeight = 0.3; // 30% weight to owner(s)
    const combinedScore = Math.round(
      (companyAnalysis.score * companyWeight) + 
      (ownerAnalysis.score * ownerWeight)
    );
    
    // Determine grade
    const grade = determineGrade(combinedScore);
    
    // Combine risk assessments
    const riskAssessment = {
      highRiskFactors: [
        ...companyAnalysis.highRiskFactors || [],
        ...ownerAnalysis.highRiskFactors || []
      ],
      moderateRiskFactors: [
        ...companyAnalysis.moderateRiskFactors || [],
        ...ownerAnalysis.moderateRiskFactors || []
      ],
      mitigatingFactors: [
        ...companyAnalysis.mitigatingFactors || [],
        ...ownerAnalysis.mitigatingFactors || []
      ]
    };
    
    // Return the complete deep research result
    return {
      companyAnalysis,
      ownerAnalysis,
      combinedScore,
      grade,
      riskAssessment
    };
  } catch (error) {
    console.error("Error performing Claude deep research:", error);
    throw error;
  }
}

/**
 * Research a company using Claude
 */
async function researchCompany(
  companyName: string,
  industry: string,
  yearsInBusiness: string,
  annualRevenue: string
): Promise<any> {
  console.log(`Researching company: ${companyName}`);
  
  const systemPrompt = `You are a company research expert conducting due diligence for a business loan application. 
Your task is to provide a comprehensive analysis of a company using all available information.
Focus on legal issues, financial red flags, reputation insights, and market position.
Be specific, factual, and comprehensive.`;

  const userPrompt = `Conduct a thorough analysis of ${companyName}, a company in the ${industry} industry that has been operating for ${yearsInBusiness} years with an annual revenue of ${annualRevenue}.

Please provide:
1. A detailed company overview (3-4 paragraphs)
2. Any specific legal issues discovered
3. Financial red flags or concerns
4. Reputation insights and customer satisfaction assessment
5. Industry position relative to competitors
6. Market trends affecting this company
7. Specific significant events in the company's history (with dates)
8. Key financial metrics compared to industry averages
9. An executive summary of overall risk level

Format the response as a JSON object following this exact structure:
{
  "overview": "Detailed overview paragraph",
  "legalIssues": ["Legal issue 1", "Legal issue 2"],
  "financialRedFlags": ["Red flag 1", "Red flag 2"],
  "reputationInsights": ["Insight 1", "Insight 2"],
  "industryPosition": ["Position insight 1", "Position insight 2"],
  "marketTrends": ["Trend 1", "Trend 2"],
  "executiveSummary": "Concise summary",
  "specificEvents": [
    {
      "event": "Major event description",
      "date": "Month Year",
      "impact": "Impact description",
      "source": "Source information"
    }
  ],
  "financialMetrics": [
    {
      "metric": "Metric name",
      "value": "Value",
      "industryAverage": "Industry average",
      "trend": "Trend direction"
    }
  ],
  "highRiskFactors": ["High risk factor 1", "High risk factor 2"],
  "moderateRiskFactors": ["Moderate risk factor 1", "Moderate risk factor 2"],
  "mitigatingFactors": ["Mitigating factor 1", "Mitigating factor 2"],
  "score": 75
}

The score should be between 0-100, with higher scores indicating less risk.
Use detailed, specific findings. If information is unavailable, provide a realistic assessment based on industry knowledge.`;

  try {
    // Call Anthropic API with detailed prompt
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    });
    
    // Parse the response
    try {
      const content = response.content[0].text;
      // Find the JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Add sources field if not present
        if (!parsedData.sources) {
          parsedData.sources = [];
        }
        
        return {
          ...parsedData,
          // Ensure all required fields exist
          overview: parsedData.overview || "No overview provided",
          legalIssues: parsedData.legalIssues || [],
          financialRedFlags: parsedData.financialRedFlags || [],
          reputationInsights: parsedData.reputationInsights || [],
          industryPosition: parsedData.industryPosition || [],
          marketTrends: parsedData.marketTrends || [],
          executiveSummary: parsedData.executiveSummary || "No executive summary provided",
          specificEvents: parsedData.specificEvents || [],
          financialMetrics: parsedData.financialMetrics || [],
          score: parsedData.score || 70 // Default to moderate score if not provided
        };
      } else {
        console.error("Failed to extract JSON from Claude response");
        throw new Error("Failed to parse structured data from Claude response");
      }
    } catch (parseError) {
      console.error("Error parsing Claude company research response:", parseError);
      throw parseError;
    }
  } catch (apiError) {
    console.error("Error calling Anthropic API for company research:", apiError);
    throw apiError;
  }
}

/**
 * Research a person using Claude
 */
async function researchPerson(
  ownerName: string,
  companyName: string,
  industry: string
): Promise<any> {
  console.log(`Researching person: ${ownerName}`);
  
  const systemPrompt = `You are a business owner background research expert conducting due diligence for a loan application.
Your task is to analyze the business owner's background, reputation, and risk factors.
Focus on legal history, financial red flags, reputation, and management capabilities.
Be specific, factual, and comprehensive.`;

  const userPrompt = `Conduct a thorough analysis of ${ownerName}, who is an owner of ${companyName} in the ${industry} industry.

Please provide:
1. A detailed overview of the owner's background and qualifications (2-3 paragraphs)
2. Any specific legal issues in their background
3. Financial red flags or concerns related to this individual
4. Reputation insights and professional standing
5. Management capabilities and leadership assessment
6. Prior business history with specific companies and roles
7. An executive summary of the owner's overall risk level as a borrower

Format the response as a JSON object following this exact structure:
{
  "overview": "Detailed overview paragraph",
  "legalIssues": ["Legal issue 1", "Legal issue 2"],
  "financialRedFlags": ["Red flag 1", "Red flag 2"],
  "reputationInsights": ["Insight 1", "Insight 2"],
  "managementCapabilities": ["Capability 1", "Capability 2"],
  "executiveSummary": "Concise summary",
  "priorBusinessHistory": [
    {
      "companyName": "Company name",
      "role": "Role title",
      "years": "Time period",
      "outcome": "Business outcome"
    }
  ],
  "highRiskFactors": ["High risk factor 1", "High risk factor 2"],
  "moderateRiskFactors": ["Moderate risk factor 1", "Moderate risk factor 2"],
  "mitigatingFactors": ["Mitigating factor 1", "Mitigating factor 2"],
  "score": 75
}

The score should be between 0-100, with higher scores indicating less risk.
Use detailed, specific findings. If information is unavailable, provide a realistic assessment based on industry knowledge.`;

  try {
    // Call Anthropic API with detailed prompt
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        { role: "user", content: userPrompt }
      ]
    });
    
    // Parse the response
    try {
      const content = response.content[0].text;
      // Find the JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Add sources field if not present
        if (!parsedData.sources) {
          parsedData.sources = [];
        }
        
        return {
          ...parsedData,
          // Ensure all required fields exist
          overview: parsedData.overview || "No overview provided",
          legalIssues: parsedData.legalIssues || [],
          financialRedFlags: parsedData.financialRedFlags || [],
          reputationInsights: parsedData.reputationInsights || [],
          managementCapabilities: parsedData.managementCapabilities || [],
          executiveSummary: parsedData.executiveSummary || "No executive summary provided",
          priorBusinessHistory: parsedData.priorBusinessHistory || [],
          score: parsedData.score || 70 // Default to moderate score if not provided
        };
      } else {
        console.error("Failed to extract JSON from Claude response");
        throw new Error("Failed to parse structured data from Claude response");
      }
    } catch (parseError) {
      console.error("Error parsing Claude person research response:", parseError);
      throw parseError;
    }
  } catch (apiError) {
    console.error("Error calling Anthropic API for person research:", apiError);
    throw apiError;
  }
}

/**
 * Combine multiple owner analyses into one
 */
function combineOwnerAnalyses(ownerAnalyses: any[]): any {
  if (ownerAnalyses.length === 0) {
    return {
      overview: "No owner information provided.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      managementCapabilities: [],
      executiveSummary: "No owner information to analyze.",
      priorBusinessHistory: [],
      sources: [],
      score: 70,
      highRiskFactors: [],
      moderateRiskFactors: [],
      mitigatingFactors: []
    };
  }

  if (ownerAnalyses.length === 1) {
    return ownerAnalyses[0];
  }

  // Combine multiple owners' analyses
  const allLegalIssues: string[] = [];
  const allFinancialRedFlags: string[] = [];
  const allReputationInsights: string[] = [];
  const allManagementCapabilities: string[] = [];
  const allPriorBusinessHistory: any[] = [];
  const allSources: string[] = [];
  const allHighRiskFactors: string[] = [];
  const allModerateRiskFactors: string[] = [];
  const allMitigatingFactors: string[] = [];
  let totalScore = 0;

  ownerAnalyses.forEach(analysis => {
    allLegalIssues.push(...(analysis.legalIssues || []));
    allFinancialRedFlags.push(...(analysis.financialRedFlags || []));
    allReputationInsights.push(...(analysis.reputationInsights || []));
    allManagementCapabilities.push(...(analysis.managementCapabilities || []));
    allPriorBusinessHistory.push(...(analysis.priorBusinessHistory || []));
    allSources.push(...(analysis.sources || []));
    allHighRiskFactors.push(...(analysis.highRiskFactors || []));
    allModerateRiskFactors.push(...(analysis.moderateRiskFactors || []));
    allMitigatingFactors.push(...(analysis.mitigatingFactors || []));
    totalScore += analysis.score || 70;
  });

  // Create combined overview
  const combinedOverview = `Analysis of ${ownerAnalyses.length} business owners reveals ${
    allLegalIssues.length > 0 ? "some legal concerns" : "no significant legal issues"
  } and ${
    allFinancialRedFlags.length > 0 ? "potential financial red flags" : "generally sound financial backgrounds"
  }. Their combined management experience is ${
    allManagementCapabilities.length > 3 ? "extensive" : "moderate"
  }, with ${allPriorBusinessHistory.length} previous business ventures noted.`;

  // Create executive summary
  const executiveSummary = `The ownership team presents a ${
    totalScore / ownerAnalyses.length > 80 ? "low" : 
    totalScore / ownerAnalyses.length > 60 ? "moderate" : "high"
  } risk profile based on ${
    allHighRiskFactors.length > 3 ? "significant concerning factors" : 
    allHighRiskFactors.length > 0 ? "some concerning factors" : "minimal concerning factors"
  }, balanced by ${
    allMitigatingFactors.length > 3 ? "strong mitigating factors" : 
    allMitigatingFactors.length > 0 ? "some positive attributes" : "limited positive indicators"
  }.`;

  return {
    overview: combinedOverview,
    legalIssues: [...new Set(allLegalIssues)],
    financialRedFlags: [...new Set(allFinancialRedFlags)],
    reputationInsights: [...new Set(allReputationInsights)],
    managementCapabilities: [...new Set(allManagementCapabilities)],
    executiveSummary: executiveSummary,
    priorBusinessHistory: allPriorBusinessHistory.slice(0, 5), // Limit to 5 most relevant
    sources: [...new Set(allSources)],
    score: Math.round(totalScore / ownerAnalyses.length),
    highRiskFactors: [...new Set(allHighRiskFactors)],
    moderateRiskFactors: [...new Set(allModerateRiskFactors)],
    mitigatingFactors: [...new Set(allMitigatingFactors)]
  };
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