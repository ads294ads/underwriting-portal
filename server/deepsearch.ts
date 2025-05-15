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
    reputationInsights: string[]; // Specific findings like "Previously served as CFO at company that faced accounting investigation"
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

// Function to perform deep research on company and owner
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
        const timeoutPromise = new Promise<CoordinatedResearchResult>((_, reject) => {
          setTimeout(() => reject(new Error("Multi-agent research timed out")), 10000); // 10 second timeout
        });
        
        // Race the research against the timeout
        const multiAgentResults = await Promise.race([multiAgentPromise, timeoutPromise])
          .catch(error => {
            console.warn("Multi-agent research timed out or failed:", error.message);
            // Return minimal research results if timeout occurs
            return createDefaultResearchResults(application);
          });
          
        console.log("Multi-agent research complete!");
        return multiAgentResults;
      } catch (multiAgentError) {
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
        console.error("Error with Claude research, falling back to multi-agent approach:", claudeError);
      }
    }
    
    // Fall back to Perplexity if previous methods fail
    if (process.env.PERPLEXITY_API_KEY) {
      console.log("Using Perplexity multi-agent system for deep research...");
      const multiAgentResults = await performMultiAgentResearch(application);
      console.log("Multi-agent research complete!");
      
      return {
        companyAnalysis: {
          overview: multiAgentResults.companyAnalysis.overview,
          legalIssues: multiAgentResults.companyAnalysis.legalIssues,
          financialRedFlags: multiAgentResults.companyAnalysis.financialRedFlags,
          reputationInsights: multiAgentResults.companyAnalysis.reputationInsights,
          industryPosition: multiAgentResults.companyAnalysis.industryPosition,
          marketTrends: multiAgentResults.companyAnalysis.marketTrends,
          executiveSummary: multiAgentResults.companyAnalysis.executiveSummary,
          detailedFindings: multiAgentResults.companyAnalysis.detailedFindings,
          // Include the new specific events and financial metrics fields
          specificEvents: multiAgentResults.companyAnalysis.specificEvents || [],
          financialMetrics: multiAgentResults.companyAnalysis.financialMetrics || [],
          sources: multiAgentResults.companyAnalysis.sources,
          highRiskFactors: multiAgentResults.companyAnalysis.highRiskFactors || [],
          moderateRiskFactors: multiAgentResults.companyAnalysis.moderateRiskFactors || [],
          mitigatingFactors: multiAgentResults.companyAnalysis.mitigatingFactors || [],
          score: multiAgentResults.companyAnalysis.score
        },
        ownerAnalysis: {
          overview: multiAgentResults.ownerAnalysis.overview,
          legalIssues: multiAgentResults.ownerAnalysis.legalIssues,
          financialRedFlags: multiAgentResults.ownerAnalysis.financialRedFlags,
          reputationInsights: multiAgentResults.ownerAnalysis.reputationInsights,
          managementCapabilities: multiAgentResults.ownerAnalysis.managementCapabilities,
          executiveSummary: multiAgentResults.ownerAnalysis.executiveSummary,
          detailedFindings: multiAgentResults.ownerAnalysis.detailedFindings,
          // Include the new prior business history field
          priorBusinessHistory: multiAgentResults.ownerAnalysis.priorBusinessHistory || [],
          sources: multiAgentResults.ownerAnalysis.sources,
          highRiskFactors: multiAgentResults.ownerAnalysis.highRiskFactors || [],
          moderateRiskFactors: multiAgentResults.ownerAnalysis.moderateRiskFactors || [],
          mitigatingFactors: multiAgentResults.ownerAnalysis.mitigatingFactors || [],
          score: multiAgentResults.ownerAnalysis.score
        },
        combinedScore: multiAgentResults.combinedScore,
        grade: multiAgentResults.grade,
        riskAssessment: multiAgentResults.riskAssessment,
        verificationConfidence: 0.5 // Medium confidence for multi-agent research without verification
      };
    }
    
    // If no API keys are available, use fallback
    console.log("No API keys available, using fallback research results");
    return generateFallbackResearchResults();
    
  } catch (error) {
    console.error("Error performing deep research:", error);
    
    // Fallback to simpler research method if all else fails
    console.log("All research methods failed, using basic research fallback...");
    
    try {
      // Research company
      const companyName = application.businessName;
      const industry = application.industry;
      
      // Get owner information
      let ownerName = "Business Owner"; // Default fallback
      
      // Check if we have business owners with 20% or more ownership
      if (application.businessOwners && application.businessOwners.length > 0) {
        // Find owners with 20% or more ownership, handling both ownership property names
        const significantOwners = application.businessOwners.filter(owner => {
          // Check either property, with ownership taking precedence if both exist
          const ownershipValue = typeof owner.ownership !== 'undefined' ? 
                                owner.ownership : 
                                (typeof owner.ownershipPercentage !== 'undefined' ? 
                                 owner.ownershipPercentage : 0);
          return ownershipValue >= 20;
        });
        
        if (significantOwners.length > 0) {
          // Use the owner with the highest ownership percentage
          const primaryOwner = significantOwners.reduce((prev, current) => {
            const prevOwnership = typeof prev.ownership !== 'undefined' ? 
                                prev.ownership : 
                                (typeof prev.ownershipPercentage !== 'undefined' ? 
                                 prev.ownershipPercentage : 0);
            
            const currentOwnership = typeof current.ownership !== 'undefined' ? 
                                  current.ownership : 
                                  (typeof current.ownershipPercentage !== 'undefined' ? 
                                   current.ownershipPercentage : 0);
            
            return (prevOwnership > currentOwnership) ? prev : current;
          });
          
          ownerName = primaryOwner.name;
        }
      }
      
      console.log(`Falling back to researching company: ${companyName} and owner: ${ownerName}`);
      
      // Perform company research
      const companyAnalysis = await researchCompany(companyName, industry);
      
      // Perform owner research
      const ownerAnalysis = await researchPerson(ownerName, companyName, industry);
      
      // Calculate combined score
      const combinedScore = Math.round((companyAnalysis.score + ownerAnalysis.score) / 2);
      
      // Determine grade
      const grade = determineDeepResearchGrade(combinedScore);
      
      // Generate a risk assessment based on the findings
      const riskAssessment = {
        highRiskFactors: [
          ...companyAnalysis.highRiskFactors.slice(0, 2),
          ...ownerAnalysis.highRiskFactors.slice(0, 1)
        ],
        moderateRiskFactors: [
          ...companyAnalysis.moderateRiskFactors.slice(0, 2),
          ...ownerAnalysis.moderateRiskFactors.slice(0, 1)
        ],
        mitigatingFactors: [
          ...companyAnalysis.mitigatingFactors.slice(0, 2),
          ...ownerAnalysis.mitigatingFactors.slice(0, 1)
        ]
      };
      
      return {
        companyAnalysis,
        ownerAnalysis,
        combinedScore,
        grade,
        riskAssessment,
        verificationConfidence: 0.5
      };
    } catch (fallbackError) {
      console.error("Error in fallback research:", fallbackError);
      return generateFallbackResearchResults();
    }
  }
}

// Function to research company using Perplexity API
async function researchCompany(companyName: string, industry: string): Promise<{
  overview: string;
  legalIssues: string[];
  financialRedFlags: string[];
  reputationInsights: string[];
  highRiskFactors: string[];
  moderateRiskFactors: string[];
  mitigatingFactors: string[];
  score: number;
}> {
  try {
    // Create a hash of the company name for privacy in logs
    const companyNameHash = crypto.createHash('md5').update(companyName).digest('hex').substring(0, 8);
    console.log(`Researching company: ${companyNameHash}`);
    
    // Enhanced prompt for Perplexity API with more detailed instructions
    const companyPrompt = `
I need you to search for and provide SPECIFIC, DETAILED information about "${companyName}" in the ${industry} industry. This is for a business loan assessment, so focus on FACTUAL, VERIFIABLE information. DO NOT say information is unverifiable - search thoroughly using multiple sources.

REQUIRED: Include these details about the company:
- Exact founding date and location
- Current number of employees and locations
- Precise annual revenue figures (most recent available)
- Key executives and their backgrounds
- Products/services offered
- Major clients or customers (if publicly known)

Focus on these specific risk areas with EXACT details:

1. LEGAL PROFILE [MANDATORY]
   - List ALL lawsuits from the past 5 years with case numbers, courts, and outcomes
   - ANY regulatory violations with exact dates, amounts, and agencies involved
   - ALL intellectual property disputes with specific details
   - ANY criminal investigations of the company or executives

2. FINANCIAL DETAILS [MANDATORY]
   - SPECIFIC debt figures with amounts and creditors
   - ANY bankruptcies or reorganizations with exact dates and case numbers
   - Credit rating or payment history information from any source
   - Debt-to-income ratio with EXACT figures
   - ANY tax liens or judgments with specific amounts and dates

3. REPUTATION ASSESSMENT [MANDATORY]
   - Better Business Bureau rating with number of complaints
   - Specific customer reviews with ratings from multiple platforms
   - EXACT quotes from any negative press coverage with sources and dates
   - Awards or recognition with specific names and dates
   - Social media presence metrics (followers, engagement)

4. MARKET POSITION [MANDATORY]
   - Exact market share percentage if available
   - Named competitors with comparative standing
   - Growth rate with SPECIFIC percentage figures
   - Industry ranking if available

IMPORTANT: Your response MUST include EXACT figures, dates, and factual information in each section. Format each point as a specific fact, not a general statement. Begin with a factual executive summary highlighting key findings.

This is extremely important for a loan decision. The company DOES exist and has public information available. Find as much SPECIFIC information as possible.`;

    // Call Perplexity API for company research
    const companyResearchResponse = await callPerplexityAPI(companyPrompt);
    
    // Process the response
    const overview = extractOverview(companyResearchResponse);
    const legalIssues = extractBulletedList(companyResearchResponse, "legal issues", "lawsuits");
    const financialRedFlags = extractBulletedList(companyResearchResponse, "financial red flags", "bankruptcy");
    const reputationInsights = extractBulletedList(companyResearchResponse, "reputation", "management");
    
    // Calculate a score based on the findings (0-100)
    // Higher score = fewer issues found
    const score = calculateResearchScore(companyResearchResponse, legalIssues, financialRedFlags);
    
    // Categorize findings into different risk levels
    const highRiskFactors = legalIssues.filter(issue => 
      issue.toLowerCase().includes("lawsuit") || 
      issue.toLowerCase().includes("bankruptcy") ||
      issue.toLowerCase().includes("fraud") ||
      issue.toLowerCase().includes("criminal")
    );
    
    const moderateRiskFactors = financialRedFlags.filter(flag => 
      !highRiskFactors.includes(flag)
    );
    
    // Extract any positive aspects as mitigating factors
    const mitigatingFactors = reputationInsights.filter(insight => 
      insight.toLowerCase().includes("positive") ||
      insight.toLowerCase().includes("award") ||
      insight.toLowerCase().includes("recognized") ||
      insight.toLowerCase().includes("growth")
    );
    
    return {
      overview,
      legalIssues,
      financialRedFlags,
      reputationInsights,
      highRiskFactors,
      moderateRiskFactors,
      mitigatingFactors,
      score
    };
  } catch (error) {
    console.error("Error researching company:", error);
    return {
      overview: `Company analysis for ${companyName} could not be completed at this time.`,
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      highRiskFactors: ["Unable to verify company identity completely"],
      moderateRiskFactors: ["Limited information available for analysis"],
      mitigatingFactors: ["Standard industry risk assessment can be applied"],
      score: 70 // Default neutral score
    };
  }
}

// Function to research person using Perplexity API
async function researchPerson(ownerName: string, companyName: string, industryName: string = "relevant"): Promise<{
  overview: string;
  legalIssues: string[];
  financialRedFlags: string[];
  reputationInsights: string[];
  highRiskFactors: string[];
  moderateRiskFactors: string[];
  mitigatingFactors: string[];
  score: number;
}> {
  try {
    // Create a hash of the owner name for privacy in logs
    const ownerNameHash = crypto.createHash('md5').update(ownerName).digest('hex').substring(0, 8);
    console.log(`Researching business owner: ${ownerNameHash}`);
    
    // Enhanced prompt for Perplexity API with more detailed instructions
    const personPrompt = `
I need you to search for and provide SPECIFIC, DETAILED information about "${ownerName}" who is the owner or executive of "${companyName}". This is for a business loan assessment, so focus on FACTUAL, VERIFIABLE information. DO NOT say information is unverifiable - search thoroughly using multiple sources.

REQUIRED: Include these specific details about the person:
- Current age and location
- Current role at ${companyName} with exact title
- Years of experience in the ${industryName} industry
- Educational background with specific institutions and degrees
- Previous companies they've owned or worked for with dates

Focus on these specific areas with EXACT details:

1. LEGAL HISTORY [MANDATORY]
   - ANY court cases involving this person as a defendant or plaintiff with case numbers and courts
   - ANY criminal records with specific charges, dates, and outcomes
   - ANY professional license issues with exact regulatory bodies and dates
   - ANY restraining orders or injunctions with specific details
   - ANY involvement in legal disputes related to business practices

2. FINANCIAL BACKGROUND [MANDATORY]
   - ANY personal bankruptcies with exact filing dates and case numbers
   - ANY foreclosures or property liens with specific details
   - ANY tax liens with amounts and dates
   - ANY judgments with specific amounts and creditors
   - Credit history information if publicly available

3. BUSINESS HISTORY [MANDATORY]
   - SPECIFIC names of ALL previous businesses owned or managed
   - EXACT outcomes of previous business ventures (successful/failed)
   - ANY business bankruptcies or closures with dates
   - Previous business management positions with exact titles
   - Business performance metrics for companies under their leadership

4. PROFESSIONAL REPUTATION [MANDATORY]
   - SPECIFIC professional awards or recognitions with exact names and dates
   - Exact quotes from business associates or industry publications
   - Specific charitable or community involvement with organization names
   - Social media presence with specific platforms and metrics
   - Public speaking engagements or industry event participation with dates

IMPORTANT: Your response MUST include EXACT dates, names, and factual information in each section. Format each point as a specific fact, not a general statement. Begin with a factual executive summary highlighting key findings.

This is extremely important for a loan decision. The person DOES exist and has public information available. Find as much SPECIFIC information as possible.`;

    // Call Perplexity API for person research
    const personResearchResponse = await callPerplexityAPI(personPrompt);
    
    // Process the response
    const overview = extractOverview(personResearchResponse);
    const legalIssues = extractBulletedList(personResearchResponse, "legal issues", "lawsuits");
    const financialRedFlags = extractBulletedList(personResearchResponse, "financial red flags", "bankruptcy");
    const reputationInsights = extractBulletedList(personResearchResponse, "reputation", "history");
    
    // Calculate a score based on the findings (0-100)
    // Higher score = fewer issues found
    const score = calculateResearchScore(personResearchResponse, legalIssues, financialRedFlags);
    
    // Categorize findings into different risk levels
    const highRiskFactors = legalIssues.filter(issue => 
      issue.toLowerCase().includes("lawsuit") || 
      issue.toLowerCase().includes("bankruptcy") ||
      issue.toLowerCase().includes("fraud") ||
      issue.toLowerCase().includes("criminal")
    );
    
    const moderateRiskFactors = financialRedFlags.filter(flag => 
      !highRiskFactors.includes(flag)
    );
    
    // Extract any positive aspects as mitigating factors
    const mitigatingFactors = reputationInsights.filter(insight => 
      insight.toLowerCase().includes("positive") ||
      insight.toLowerCase().includes("award") ||
      insight.toLowerCase().includes("recognized") ||
      insight.toLowerCase().includes("growth") ||
      insight.toLowerCase().includes("successful")
    );
    
    return {
      overview,
      legalIssues,
      financialRedFlags,
      reputationInsights,
      highRiskFactors,
      moderateRiskFactors,
      mitigatingFactors,
      score
    };
  } catch (error) {
    console.error("Error researching person:", error);
    return {
      overview: `Personal analysis for the owner of ${companyName} could not be completed at this time.`,
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      highRiskFactors: ["Unable to verify owner identity completely"],
      moderateRiskFactors: ["Limited information available for owner analysis"],
      mitigatingFactors: ["Standard owner risk assessment can be applied"],
      score: 70 // Default neutral score
    };
  }
}

// Function to call Perplexity API with improved research capabilities
async function callPerplexityAPI(prompt: string): Promise<string> {
  try {
    console.log("Starting enhanced Perplexity API research call");
    
    // Extract key terms from the prompt for direct search queries
    const extractCompanyName = prompt.match(/company "([^"]+)"/);
    const extractOwnerName = prompt.match(/of "([^"]+)"/);
    const companyName = extractCompanyName ? extractCompanyName[1] : null;
    const ownerName = extractOwnerName ? extractOwnerName[1] : null;
    
    // Create direct search queries based on extracted terms
    const directSearchQueries = [];
    if (companyName) {
      directSearchQueries.push(
        `${companyName} company information`,
        `${companyName} financial performance`,
        `${companyName} legal issues`,
        `${companyName} business reputation`
      );
    }
    if (ownerName && companyName) {
      directSearchQueries.push(
        `${ownerName} ${companyName} owner information`,
        `${ownerName} business background`,
        `${ownerName} legal history`
      );
    }
    
    // Use direct search queries if we have them, otherwise use auto
    const searchQueries = directSearchQueries.length > 0 ? directSearchQueries : ["auto"];
    
    console.log(`Using search queries: ${JSON.stringify(searchQueries)}`);
    
    // Prepare the API request with enhanced parameters
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online", // Latest model
        messages: [
          {
            role: "system",
            content: "You are a financial analyst specialized in risk assessment and due diligence for business loans. Your task is to provide FACTUAL, SPECIFIC information about companies and business owners. Include precise details like founding dates, revenue figures, legal filings, and business performance metrics. AVOID saying information is unverifiable or unavailable - instead, search thoroughly using multiple sources and provide the most accurate information you can find. Structure your response with clear sections and use bulleted lists with SPECIFIC facts, not general statements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Lower temperature for more factual responses
        max_tokens: 3000, // Increased token limit for more detailed responses
        top_p: 0.9, // Focus on higher probability tokens
        top_k: 40, // Consider a wider range of likely next tokens
        
        // Enhanced search parameters for better results
        search_recency_filter: "month", // Recent information (past month)
        search_queries: searchQueries, // Use our direct search queries
        search_domain_filter: [], // Don't restrict domains to get broader results
        return_citations: true, // Include citations for verification
        frequency_penalty: 0.3, // Reduce repetition without limiting variety too much
        presence_penalty: 0.1 // Encourage the model to introduce new concepts
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    throw error;
  }
}

// Helper functions to process research responses
function extractOverview(text: string): string {
  // Try to extract first paragraph (usually the summary)
  const paragraphs = text.split('\n\n');
  if (paragraphs.length > 0) {
    return paragraphs[0].replace(/^#+ .+\n/, '').trim(); // Remove any headings
  }
  return text.substring(0, 300) + "..."; // Fallback to first 300 characters
}

function extractBulletedList(text: string, keyword1: string, keyword2: string): string[] {
  // Find sections that mention keywords - support for markdown headers
  const sections: string[] = [];
  const sectionTitles = [
    "LEGAL ISSUES", "LEGAL BACKGROUND", "LAWSUITS", 
    "FINANCIAL RED FLAGS", "FINANCIAL STABILITY", "BANKRUPTCY", 
    "REPUTATION", "MANAGEMENT", "PROFESSIONAL BACKGROUND", "CHARACTER"
  ];
  
  // Split by markdown headers and section titles
  const lines = text.split('\n');
  let currentSection = "";
  let inRelevantSection = false;
  
  for (const line of lines) {
    // Check if this is a section header
    const headerMatch = line.match(/^#+\s+(.+)$/);
    const sectionTitle = headerMatch ? headerMatch[1].toUpperCase() : "";
    
    if (headerMatch) {
      // Save previous section if relevant
      if (inRelevantSection && currentSection.trim()) {
        sections.push(currentSection);
      }
      
      // Check if new section is relevant
      inRelevantSection = sectionTitles.some(title => 
        sectionTitle.includes(title) || 
        sectionTitle.includes(keyword1.toUpperCase()) || 
        sectionTitle.includes(keyword2.toUpperCase())
      );
      
      currentSection = "";
    } else {
      // Add line to current section if relevant
      if (inRelevantSection) {
        currentSection += line + '\n';
      }
    }
  }
  
  // Add the last section if relevant
  if (inRelevantSection && currentSection.trim()) {
    sections.push(currentSection);
  }
  
  // If no sections were found through headers, fall back to paragraph matching
  if (sections.length === 0) {
    const relevantParagraphs = text.split('\n\n').filter(p => 
      p.toLowerCase().includes(keyword1) || p.toLowerCase().includes(keyword2)
    );
    sections.push(...relevantParagraphs);
  }
  
  // Extract bullet points and sentences
  const bulletPoints: string[] = [];
  
  sections.forEach(section => {
    // Check for bullet list items - match various bullet formats including numbered lists
    const bulletMatches = section.match(/^[\s]*[•\-\*\d+\.]\s+(.+)$/gm);
    if (bulletMatches && bulletMatches.length > 0) {
      bulletMatches.forEach(bullet => {
        // Clean up the bullet text
        const cleanedBullet = bullet.replace(/^[\s]*[•\-\*\d+\.]\s+/, '').trim();
        if (cleanedBullet && cleanedBullet.length > 10) bulletPoints.push(cleanedBullet);
      });
    } else {
      // If no bullets, extract sentences that mention keywords
      const sentences = section.split(/\.\s+/);
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        if ((lowerSentence.includes(keyword1) || lowerSentence.includes(keyword2)) && sentence.length > 15) {
          // Ensure the sentence ends with proper punctuation
          bulletPoints.push(sentence.trim() + (sentence.endsWith('.') ? '' : '.'));
        }
      });
    }
  });
  
  // Deduplicate and prioritize the most informative bullet points
  let uniqueItems = Array.from(new Set(bulletPoints))
    // Sort by length (prioritize more detailed points) and keyword relevance
    .sort((a, b) => {
      // Count keyword occurrences as a measure of relevance
      const aRelevance = (a.toLowerCase().match(new RegExp(keyword1, 'g')) || []).length +
                        (a.toLowerCase().match(new RegExp(keyword2, 'g')) || []).length;
      const bRelevance = (b.toLowerCase().match(new RegExp(keyword1, 'g')) || []).length +
                        (b.toLowerCase().match(new RegExp(keyword2, 'g')) || []).length;
      
      // Prioritize relevance first, then length for similarly relevant items
      if (aRelevance !== bRelevance) return bRelevance - aRelevance;
      return b.length - a.length;
    });
    
  // Limit to 5 most relevant items but ensure we have some items if available
  return uniqueItems.slice(0, 5);
}

function calculateResearchScore(fullText: string, legalIssues: string[], financialRedFlags: string[]): number {
  // Base score of 85 (assume good unless issues found)
  let score = 85;
  
  // Check for positive indicators
  const positivePatterns = [
    /excellent.+reputation/i, /strong.+track record/i, /no.+issues/i, 
    /positive.+review/i, /good.+standing/i, /no.+legal/i, /clean.+record/i
  ];
  
  // Check for negative indicators
  const negativePatterns = [
    /lawsuit/i, /litigation/i, /fraud/i, /bankruptcy/i, /debt/i, 
    /default/i, /late.+payment/i, /criminal/i, /violation/i, /fine/i,
    /penalty/i, /investigation/i, /regulatory/i, /scandal/i
  ];
  
  // Add points for positive indicators
  positivePatterns.forEach(pattern => {
    if (pattern.test(fullText)) score += 3;
  });
  
  // Subtract points for negative indicators
  negativePatterns.forEach(pattern => {
    if (pattern.test(fullText)) score -= 5;
  });
  
  // Major deductions for actual issues found
  score -= legalIssues.length * 7;
  score -= financialRedFlags.length * 8;
  
  // Cap the score between 20 and 95
  return Math.max(20, Math.min(95, score));
}

// Determine grade for deep research findings
function determineDeepResearchGrade(score: number): string {
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

// Generate fallback research results when API is unavailable
function generateFallbackResearchResults(): DeepResearchResult {
  return {
    companyAnalysis: {
      overview: "Unable to perform deep company analysis at this time. This section requires an active API connection.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      industryPosition: [],
      marketTrends: [],
      executiveSummary: "Deep analysis unavailable due to API connection issues. Please check API keys and try again.",
      detailedFindings: {},
      specificEvents: [],
      financialMetrics: [],
      sources: [],
      highRiskFactors: [
        "Limited company verification - identity confidence low.",
        "Unable to verify legal standing with current search parameters."
      ],
      moderateRiskFactors: [
        "Industry trends unavailable with current search depth.",
        "Financial metrics require standard verification."
      ],
      mitigatingFactors: [
        "Standard industry risk assessment can be applied.",
        "Traditional due diligence recommended."
      ],
      score: 65
    },
    ownerAnalysis: {
      overview: "Unable to perform deep owner analysis at this time. This section requires an active API connection.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      managementCapabilities: [],
      executiveSummary: "Deep analysis unavailable due to API connection issues. Please check API keys and try again.",
      detailedFindings: {},
      priorBusinessHistory: [],
      sources: [],
      highRiskFactors: [
        "Owner identity verification limited - confidence low.",
        "Unable to assess relationship to company with current search parameters."
      ],
      moderateRiskFactors: [
        "Management history unavailable with current search depth.",
        "Prior business ventures require standard verification."
      ],
      mitigatingFactors: [
        "Standard background checks can be applied.",
        "Traditional reference verification recommended."
      ],
      score: 65
    },
    combinedScore: 65,
    grade: "B-",
    riskAssessment: {
      highRiskFactors: [
        "Deep research capabilities limited - uncertain risk level.",
        "Entity verification confidence very low."
      ],
      moderateRiskFactors: [
        "Standard industry risks apply.",
        "Limited verification of business history and performance."
      ],
      mitigatingFactors: [
        "Recommend standard due diligence to identify mitigating factors.",
        "Additional documentation can offset limited online research."
      ]
    },
    verificationConfidence: 0.2
  };
}