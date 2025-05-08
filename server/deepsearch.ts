import { LoanApplication } from "../shared/schema";
import crypto from "crypto";

// Score component dedicated to deep research findings
export const DEEP_RESEARCH_COMPONENT_WEIGHT = 10; // 10% of total score

// Interface for deep research results
export interface DeepResearchResult {
  companyAnalysis: {
    overview: string;
    legalIssues: string[];
    financialRedFlags: string[];
    reputationInsights: string[];
    score: number; // 0-100 score for the company research component
  };
  ownerAnalysis: {
    overview: string;
    legalIssues: string[];
    financialRedFlags: string[];
    reputationInsights: string[];
    score: number; // 0-100 score for the owner research component
  };
  combinedScore: number; // Weighted combined score (0-100)
  grade: string; // Letter grade for deep research component
}

// Function to perform deep research on company and owner
export async function performDeepResearch(application: LoanApplication): Promise<DeepResearchResult> {
  try {
    console.log("Starting deep research analysis...");
    
    if (!process.env.PERPLEXITY_API_KEY) {
      console.log("Perplexity API Key not found, using fallback research results");
      return generateFallbackResearchResults();
    }
    
    // Research company
    const companyName = application.businessName;
    const industry = application.industry;
    
    // Sanitize owner information for privacy
    // In a real app, owner name would be extracted from uploaded tax documents
    // For demo, we'll use a privacy-safe placeholder
    const ownerName = "Business Owner"; // Would be extracted from documents in production
    
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
  } catch (error) {
    console.error("Error performing deep research:", error);
    return generateFallbackResearchResults();
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
    
    // Prompt for Perplexity API
    const companyPrompt = `
I need a comprehensive analysis of the company "${companyName}" in the ${industry} industry. 
Focus specifically on:

1. Recent legal issues, lawsuits, or regulatory actions against the company
2. Any financial red flags, including bankruptcies, missed payments, loan defaults, or irregular financial practices
3. Management reputation and any issues with key executives
4. Overall market standing and reliability as a borrower

Please only include verified factual information with specific dates, figures, and sources where available. 
Format the response in clear sections and focus exclusively on objective information that would be relevant for a loan assessment.
Start with a brief 2-3 sentence overview summarizing your findings.`;

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
    
    // Prompt for Perplexity API
    const personPrompt = `
I need a comprehensive analysis of "${ownerName}" who is associated with the company "${companyName}". 
Focus specifically on:

1. Any personal legal issues, lawsuits, or criminal records
2. Personal financial red flags such as bankruptcies, foreclosures, or tax liens
3. Professional reputation and business history
4. Any public controversies or issues that might affect creditworthiness

Please only include verified factual information with specific dates, figures, and sources where available. 
Format the response in clear sections and focus exclusively on objective information that would be relevant for a loan assessment.
Start with a brief 2-3 sentence overview summarizing your findings.`;

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
            content: "You are a financial analyst specialized in risk assessment and due diligence. Provide factual, objective information from reliable sources. Always provide specific details including dates, figures, and citations where possible. Never make up information or present speculation as fact."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        search_recency_filter: "month",
        search_domain_filter: ["research", "news"]
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
  // Find sections that mention keywords
  const lowerText = text.toLowerCase();
  const relevantParagraphs = text.split('\n\n').filter(p => 
    p.toLowerCase().includes(keyword1) || p.toLowerCase().includes(keyword2)
  );
  
  // Extract bullet points and sentences
  const bulletPoints: string[] = [];
  
  relevantParagraphs.forEach(para => {
    // Check for bullet list items
    const bulletMatches = para.match(/^[•\-\*]\s+(.+)$/gm);
    if (bulletMatches) {
      bulletMatches.forEach(bullet => {
        const cleanedBullet = bullet.replace(/^[•\-\*]\s+/, '').trim();
        if (cleanedBullet) bulletPoints.push(cleanedBullet);
      });
    } else {
      // If no bullets, extract sentences that mention keywords
      const sentences = para.split(/\.\s+/);
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        if ((lowerSentence.includes(keyword1) || lowerSentence.includes(keyword2)) && sentence.length > 15) {
          bulletPoints.push(sentence.trim() + (sentence.endsWith('.') ? '' : '.'));
        }
      });
    }
  });
  
  // Deduplicate and return 
  const uniqueItems = Array.from(new Set(bulletPoints));
  return uniqueItems.slice(0, 5); // Return up to 5 unique items
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
      score: 70
    },
    ownerAnalysis: {
      overview: "Unable to perform deep owner analysis at this time. This section requires an active Perplexity API connection.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      score: 70
    },
    combinedScore: 70,
    grade: "B"
  };
}