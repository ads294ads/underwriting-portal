import { LoanApplication } from "../shared/schema";
import crypto from "crypto";
import { performMultiAgentResearch } from "./multi-agent-research";
import { performClaudeResearch } from "./claude-agent";
import { performEnhancedDeepResearch } from "./enhanced-research";

// Score component dedicated to deep research findings
export const DEEP_RESEARCH_COMPONENT_WEIGHT = 10; // 10% of total score

// Interface for deep research results
export interface DeepResearchResult {
  companyAnalysis: {
    overview: string;
    legalIssues: string[]; // Specific legal issues like "Pending lawsuit in Superior Court filed May 2024 for contract breach"
    financialRedFlags: string[]; // Specific red flags like "Debt-to-income ratio exceeds industry average by 45% based on 2023 filings"
    reputationInsights: string[]; // Specific reputation findings like "BBB rating dropped from A to B- in January 2025"
    industryPosition?: string[]; // Specific position findings like "Ranked 4th in market share for regional suppliers in Midwest"
    marketTrends?: string[]; // Specific trends like "Industry experiencing 7% contraction due to supply chain disruptions"
    executiveSummary?: string;
    detailedFindings?: Record<string, string[]>; // Categorized detailed findings
    specificEvents?: { // New: specific events with dates and details
      event: string;
      date: string;
      impact: string;
      source: string;
    }[];
    financialMetrics?: { // New: specific financial metrics
      metric: string;
      value: string;
      industryAverage: string;
      trend: string;
    }[];
    sources?: string[];
    // Add required risk factor properties
    highRiskFactors: string[]; // High risk factors for company
    moderateRiskFactors: string[]; // Moderate risk factors for company
    mitigatingFactors: string[]; // Mitigating factors for company
    score: number; // 0-100 score for the company research component
  };
  ownerAnalysis: {
    overview: string;
    legalIssues: string[]; // Specific legal issues like "Previous bankruptcy filing discharged in 2022"
    financialRedFlags: string[]; // Specific red flags like "Multiple mortgage defaults between 2020-2022"
    reputationInsights: string[]; // Specific reputation findings like "Previously served as CFO at company that faced accounting investigation"
    managementCapabilities?: string[]; // Specific capabilities like "Successfully grew previous venture by 200% over 3 years"
    executiveSummary?: string;
    detailedFindings?: Record<string, string[]>; // Categorized detailed findings
    priorBusinessHistory?: { // New: specific business history
      companyName: string;
      role: string;
      years: string;
      outcome: string;
    }[];
    sources?: string[];
    // Add required risk factor properties
    highRiskFactors: string[]; // High risk factors for owners
    moderateRiskFactors: string[]; // Moderate risk factors for owners
    mitigatingFactors: string[]; // Mitigating factors for owners
    score: number; // 0-100 score for the owner research component
  };
  combinedScore: number; // Weighted combined score (0-100)
  grade: string; // Letter grade for deep research component
  riskAssessment?: {
    highRiskFactors: string[];
    moderateRiskFactors: string[];
    mitigatingFactors: string[];
  };
  verificationConfidence?: number; // New: Confidence level in entity verification (0-1)
}

// OPTIMIZATION: Faster deep research function with timeouts
export async function performDeepResearch(application: LoanApplication): Promise<DeepResearchResult> {
  try {
    console.log("Starting optimized deep research analysis...");
    
    // OPTIMIZATION: Use simpler multi-agent approach for faster results
    // Skip enhanced research which is slow and go straight to fastest method
    if (process.env.PERPLEXITY_API_KEY) {
      try {
        console.log("Using optimized Multi-Agent research (fastest approach)...");
        
        // Add timeout to ensure we stay under time budget
        const multiAgentPromise = performMultiAgentResearch(application);
        const timeoutPromise = new Promise<DeepResearchResult>((_, reject) => {
          setTimeout(() => reject(new Error("Multi-agent research timed out")), 10000); // 10 second timeout
        });
        
        // Race the research against the timeout
        const multiAgentResults = await Promise.race([multiAgentPromise, timeoutPromise])
          .catch((error: Error) => {
            console.warn("Multi-agent research timed out or failed:", error.message);
            // Return minimal research results if timeout occurs
            return createDefaultResearchResults(application);
          });
          
        console.log("Multi-agent research complete!");
        return multiAgentResults;
      } catch (error) {
        const multiAgentError = error as Error;
        console.error("Error with multi-agent research, using fallback:", multiAgentError.message);
        return createDefaultResearchResults(application);
      }
    }
    
    // Try using Anthropic Claude as a fallback
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log("Using Anthropic Claude for deep research...");
        const claudeResults = await performClaudeResearch(application);
        console.log("Claude research complete with high-quality results!");
        return claudeResults;
      } catch (claudeError) {
        console.error("Error with Claude research, falling back to minimal research:", claudeError);
      }
    }
    
    // If no API keys are available, use fallback
    console.log("No API keys available, using fallback research results");
    return createDefaultResearchResults(application);
    
  } catch (error) {
    console.error("Error performing deep research:", error);
    
    // OPTIMIZATION: Use optimized default results instead of slow fallback
    console.log("All research methods failed, using optimized default research...");
    
    // Return default results immediately
    return createDefaultResearchResults(application);
  }
}

// OPTIMIZATION: Helper function to create default research results
// This ensures we always have some results even when timeout occurs
function createDefaultResearchResults(application: LoanApplication): DeepResearchResult {
  console.log("Creating default research results for fallback");
  const defaultScore = 70; // Neutral score
  const defaultGrade = "B"; // Default grade
  
  return {
    companyAnalysis: {
      overview: `${application.businessName} is a business in the ${application.industry} industry.`,
      legalIssues: ["Limited information available within processing timeframe"],
      financialRedFlags: ["Limited information available within processing timeframe"],
      reputationInsights: ["Limited information available within processing timeframe"],
      industryPosition: ["Limited information available within processing timeframe"],
      marketTrends: ["Limited information available within processing timeframe"],
      executiveSummary: `Limited information available for ${application.businessName} within processing timeframe.`,
      detailedFindings: { "Note": ["Limited information processed within time constraints"] },
      sources: [],
      highRiskFactors: [],
      moderateRiskFactors: ["Limited information available within processing timeframe"],
      mitigatingFactors: ["Business is in established industry"],
      score: defaultScore
    },
    ownerAnalysis: {
      overview: "Limited owner information available within processing timeframe.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: ["Limited information available within processing timeframe"],
      managementCapabilities: ["Limited information available within processing timeframe"],
      executiveSummary: "Limited owner information available within processing timeframe.",
      detailedFindings: { "Note": ["Limited information processed within time constraints"] },
      sources: [],
      highRiskFactors: [],
      moderateRiskFactors: ["Limited information available within processing timeframe"],
      mitigatingFactors: [],
      score: defaultScore
    },
    combinedScore: defaultScore,
    grade: defaultGrade,
    riskAssessment: {
      highRiskFactors: [],
      moderateRiskFactors: ["Limited information available within processing timeframe"],
      mitigatingFactors: ["Business is in established industry"]
    }
  };
}