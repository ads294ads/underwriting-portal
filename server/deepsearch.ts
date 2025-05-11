import { LoanApplication } from "../shared/schema";
import crypto from "crypto";
import { performMultiAgentResearch } from "./multi-agent-research";
import { performClaudeResearch } from "./claude-agent";

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
    score: number; // 0-100 score for the owner research component
  };
  combinedScore: number; // Weighted combined score (0-100)
  grade: string; // Letter grade for deep research component
  riskAssessment?: {
    highRiskFactors: string[];
    moderateRiskFactors: string[];
    mitigatingFactors: string[];
  };
}

// Function to perform deep research on company and owner
export async function performDeepResearch(application: LoanApplication): Promise<DeepResearchResult> {
  try {
    console.log("Starting deep research analysis...");
    
    // Try to use Anthropic Claude API first (higher quality results)
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
    
    // Fall back to Perplexity if Anthropic fails or isn't available
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
          score: multiAgentResults.ownerAnalysis.score
        },
        combinedScore: multiAgentResults.combinedScore,
        grade: multiAgentResults.grade,
        riskAssessment: multiAgentResults.riskAssessment
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
        // Find owners with 20% or more ownership
        const significantOwners = application.businessOwners.filter(owner => 
          owner.ownership >= 20
        );
        
        if (significantOwners.length > 0) {
          // Use the owner with the highest ownership percentage
          const primaryOwner = significantOwners.reduce((prev, current) => 
            (prev.ownership > current.ownership) ? prev : current
          );
          ownerName = primaryOwner.name;
        }
      }
      
      console.log(`Falling back to researching company: ${companyName} and owner: ${ownerName}`);
      
      // Perform company research
      const companyAnalysis = await researchCompany(companyName, industry);
      
      // Perform owner research
      const ownerAnalysis = await researchPerson(ownerName, companyName);
      
      // Calculate combined score
      const combinedScore = Math.round((companyAnalysis.score + ownerAnalysis.score) / 2);
      
      // Determine grade
      const grade = determineDeepResearchGrade(combinedScore);
      
      return {
        companyAnalysis,
        ownerAnalysis,
        combinedScore,
        grade
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
  score: number;
}> {
  try {
    // Create a hash of the company name for privacy in logs
    const companyNameHash = crypto.createHash('md5').update(companyName).digest('hex').substring(0, 8);
    console.log(`Researching company: ${companyNameHash}`);
    
    // Enhanced prompt for Perplexity API with more detailed instructions
    const companyPrompt = `
I need a comprehensive analysis of the company "${companyName}" in the ${industry} industry as part of a business loan underwriting process. 
Focus specifically on these key risk areas:

1. LEGAL ISSUES
   - Any pending or recent lawsuits, especially those related to fraud, contracts, or financial obligations
   - Regulatory violations, investigations, or fines from government agencies
   - Compliance history with industry regulations specific to ${industry}
   - Any judgments, liens, or legal encumbrances on company assets

2. FINANCIAL RED FLAGS
   - Evidence of bankruptcy filings, reorganizations, or debt restructuring
   - History of missed payments, loan defaults, or late payments to creditors
   - Unusual or concerning accounting practices or financial irregularities
   - Major fluctuations in revenue or profitability that indicate instability
   - Recent layoffs, office closures, or other signs of financial distress

3. MANAGEMENT & REPUTATION
   - Background of key executives, including past business failures or successes
   - Public reputation and customer sentiment (review scores, complaints)
   - Industry standing compared to competitors
   - Any evidence of management impropriety or conflicts of interest
   - Stability of leadership team (high turnover would be concerning)

4. MARKET POSITION & STABILITY
   - Current market share and trajectory (growing/declining)
   - Competitive threats within the ${industry} industry
   - Economic factors that may impact future performance
   - Stability of revenue streams and customer base diversity

Please structure your response in clearly labeled sections starting with a 2-3 sentence executive summary of key findings. Only include verified factual information with specific dates, figures, and sources. For each section, use bulleted lists to highlight key findings. This information will directly impact loan decisioning, so accuracy is crucial.`;

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
    
    return {
      overview,
      legalIssues,
      financialRedFlags,
      reputationInsights,
      score
    };
  } catch (error) {
    console.error("Error researching company:", error);
    return {
      overview: `Company analysis for ${companyName} could not be completed at this time.`,
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      score: 70 // Default neutral score
    };
  }
}

// Function to research person using Perplexity API
async function researchPerson(ownerName: string, companyName: string): Promise<{
  overview: string;
  legalIssues: string[];
  financialRedFlags: string[];
  reputationInsights: string[];
  score: number;
}> {
  try {
    // Create a hash of the owner name for privacy in logs
    const ownerNameHash = crypto.createHash('md5').update(ownerName).digest('hex').substring(0, 8);
    console.log(`Researching business owner: ${ownerNameHash}`);
    
    // Enhanced prompt for Perplexity API with more detailed instructions
    const personPrompt = `
I need a comprehensive background analysis of "${ownerName}" who is associated with the company "${companyName}" as part of a business loan underwriting process.
Focus specifically on these key risk areas:

1. LEGAL BACKGROUND
   - Any personal lawsuits, especially those related to fraud, contracts, or financial matters
   - Criminal records or charges relevant to business operations or financial trustworthiness
   - Any restraining orders, injunctions, or other legal complications
   - Professional license suspensions, revocations, or disciplinary actions

2. FINANCIAL STABILITY
   - Personal bankruptcy filings (Chapter 7, 11, or 13) in the past 10 years
   - Foreclosures, short sales, or significant property liens
   - Tax liens, judgment liens, or unpaid tax history
   - Pattern of delinquencies or defaults on personal obligations
   - Evidence of unusual financial activity that suggests instability

3. PROFESSIONAL BACKGROUND
   - History with previous businesses (successes and failures)
   - Track record of business leadership and management skills
   - Pattern of starting and abandoning businesses
   - Professional achievements, awards, and recognitions
   - Educational background and qualifications relevant to ${companyName}

4. REPUTATION & CHARACTER
   - Public perception and reputation in business community
   - Notable philanthropic or community involvement (positive indicator)
   - Any controversies, scandals, or negative press coverage
   - Online reviews, ratings, or testimonials about business practices
   - Any evidence of fraudulent, deceptive, or unethical behavior

Please structure your response in clearly labeled sections starting with a 2-3 sentence executive summary of key findings. Only include verified factual information with specific dates, figures, and sources. For each section, use bulleted lists to highlight key findings.

Remember, this information will directly impact loan decisioning, so accuracy is crucial. Focus on objective facts rather than speculation or rumors.`;

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
    
    return {
      overview,
      legalIssues,
      financialRedFlags,
      reputationInsights,
      score
    };
  } catch (error) {
    console.error("Error researching person:", error);
    return {
      overview: `Personal analysis for the owner of ${companyName} could not be completed at this time.`,
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      score: 70 // Default neutral score
    };
  }
}

// Function to call Perplexity API
async function callPerplexityAPI(prompt: string): Promise<string> {
  try {
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
            content: "You are a financial analyst specialized in risk assessment and due diligence for business loans. Provide factual, objective information from reliable sources. Always include specific details with dates, figures, and citations. Focus on verifiable financial and legal information, not speculation. Structure your response with clear sections for different risk categories. Use bulleted lists for key findings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Lower temperature for more factual responses
        max_tokens: 3000, // Increased token limit for more detailed responses
        // Enhanced search parameters
        search_focus: "internet", // Explicitly tell Perplexity to search the web
        search_queries: ["auto"], // Auto-generate search queries based on the prompt
        search_recency_filter: "month", // Recent information
        search_domain_filter: ["research", "news", "finance", "legal"], // Added finance and legal domains
        return_citations: true, // Include citations for verification
        frequency_penalty: 0.5 // Reduce repetitive statements
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
      overview: "Unable to perform deep company analysis at this time. This section requires an active Perplexity API connection.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      industryPosition: [],
      marketTrends: [],
      executiveSummary: "Deep analysis unavailable due to API connection issues. Please check Perplexity API key and try again.",
      detailedFindings: {},
      specificEvents: [],
      financialMetrics: [],
      sources: [],
      score: 70
    },
    ownerAnalysis: {
      overview: "Unable to perform deep owner analysis at this time. This section requires an active Perplexity API connection.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      managementCapabilities: [],
      executiveSummary: "Deep analysis unavailable due to API connection issues. Please check Perplexity API key and try again.",
      detailedFindings: {},
      priorBusinessHistory: [],
      sources: [],
      score: 70
    },
    combinedScore: 70,
    grade: "B"
  };
}