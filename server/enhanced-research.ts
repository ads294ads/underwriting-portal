import { LoanApplication } from "../shared/schema";
import { DeepResearchResult } from "./deepsearch";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Constants for entity verification confidence thresholds
const VERIFICATION_THRESHOLD = 0.75; // Minimum confidence to consider an entity verified
const HIGH_CONFIDENCE_THRESHOLD = 0.9; // High confidence in entity verification

/**
 * Enhanced deep research with entity verification and focused research
 * @param application Loan application data
 * @returns Comprehensive research result with verification confidence
 */
export async function performEnhancedDeepResearch(application: LoanApplication): Promise<DeepResearchResult> {
  console.log(`Starting enhanced deep research for ${application.businessName}...`);
  
  try {
    // PHASE 1: Entity Verification
    console.log("Phase 1: Verifying company and owner identities...");
    const companyVerification = await verifyCompanyIdentity(application);
    
    // Verify key owners (those with ≥20% ownership)
    const ownerVerifications = await Promise.all(
      (application.businessOwners || [])
        .filter(owner => {
          const ownershipPercent = owner.ownership ? Number(owner.ownership) : 0;
          return ownershipPercent >= 20;
        })
        .map(async (owner) => {
          return await verifyPersonIdentity(owner.name, application.businessName, application.industry);
        })
    );
    
    // Log verification results
    console.log(`Company verification confidence: ${(companyVerification.confidence * 100).toFixed(1)}%`);
    ownerVerifications.forEach((verification, index) => {
      console.log(`Owner ${index + 1} verification confidence: ${(verification.confidence * 100).toFixed(1)}%`);
    });
    
    // Calculate overall verification confidence
    const averageOwnerConfidence = ownerVerifications.reduce((sum, v) => sum + v.confidence, 0) / 
                                 (ownerVerifications.length || 1);
    const overallVerificationConfidence = (companyVerification.confidence * 0.7) + (averageOwnerConfidence * 0.3);
    
    // PHASE 2: Deep Research on Verified Entities
    console.log(`Phase 2: Conducting deep research on verified entities (overall confidence: ${(overallVerificationConfidence * 100).toFixed(1)}%)...`);
    
    // Company Research based on verified entity
    const companyAnalysis = await researchVerifiedCompany(
      application,
      companyVerification.verifiedName,
      companyVerification.verifiedLocation,
      companyVerification.industryMatch,
      companyVerification.confidence
    );
    
    // Owner Research based on verified identities
    const ownerAnalyses = await Promise.all(
      ownerVerifications.map(async (verification, index) => {
        const owner = application.businessOwners?.[index];
        if (!owner) return null;
        
        return await researchVerifiedPerson(
          owner.name,
          verification.verifiedName,
          verification.verifiedRole,
          verification.confidence,
          application.businessName,
          companyVerification.verifiedName
        );
      })
    );
    
    // Filter out null owner analyses and combine results
    const validOwnerAnalyses = ownerAnalyses.filter(analysis => analysis !== null) as any[];
    const combinedOwnerAnalysis = combineOwnerAnalyses(validOwnerAnalyses);
    
    // Calculate combined score
    const companyWeight = 0.7; // 70% weight to company
    const ownerWeight = 0.3; // 30% weight to owner(s)
    const combinedScore = Math.round(
      (companyAnalysis.score * companyWeight) + 
      (combinedOwnerAnalysis.score * ownerWeight)
    );
    
    // Apply verification confidence adjustment
    // Lower scores when confidence is low
    const adjustedScore = Math.round(
      combinedScore * (0.5 + (0.5 * overallVerificationConfidence))
    );
    
    // Determine grade
    const grade = determineGrade(adjustedScore);
    
    // Generate risk assessment
    const riskAssessment = {
      highRiskFactors: [
        ...companyAnalysis.highRiskFactors || [],
        ...combinedOwnerAnalysis.highRiskFactors || []
      ],
      moderateRiskFactors: [
        ...companyAnalysis.moderateRiskFactors || [],
        ...combinedOwnerAnalysis.moderateRiskFactors || []
      ],
      mitigatingFactors: [
        ...companyAnalysis.mitigatingFactors || [],
        ...combinedOwnerAnalysis.mitigatingFactors || []
      ]
    };
    
    // Add verification warnings if confidence is low
    if (overallVerificationConfidence < VERIFICATION_THRESHOLD) {
      riskAssessment.highRiskFactors.unshift(
        `LOW CONFIDENCE WARNING: Entity verification confidence (${(overallVerificationConfidence * 100).toFixed(1)}%) is below threshold. Research findings may not be for the correct business/owners.`
      );
    } else if (overallVerificationConfidence < HIGH_CONFIDENCE_THRESHOLD) {
      riskAssessment.moderateRiskFactors.unshift(
        `MEDIUM CONFIDENCE WARNING: Entity verification confidence (${(overallVerificationConfidence * 100).toFixed(1)}%) indicates moderate certainty in entity matching.`
      );
    }
    
    // Return the complete research results
    return {
      companyAnalysis,
      ownerAnalysis: combinedOwnerAnalysis,
      combinedScore: adjustedScore,
      grade,
      riskAssessment,
      verificationConfidence: overallVerificationConfidence
    };
    
  } catch (error) {
    console.error("Error in enhanced deep research:", error);
    throw error;
  }
}

/**
 * Verify company identity to ensure correct entity is being researched
 */
async function verifyCompanyIdentity(application: LoanApplication): Promise<{
  verified: boolean;
  confidence: number;
  verifiedName: string;
  verifiedLocation: string;
  industryMatch: boolean;
  website?: string;
  foundingYear?: string;
  additionalIdentifiers: Record<string, string>;
}> {
  try {
    console.log(`Verifying company identity for: ${application.businessName}`);
    
    const prompt = `I need to verify the identity of a business before conducting research. Please help me confirm this is the correct entity and provide key identifying information.

BUSINESS TO VERIFY:
Name: ${application.businessName}
Industry: ${application.industry}
${application.yearsInBusiness ? `Years in Business: ${application.yearsInBusiness}` : ''}
${application.annualRevenue ? `Annual Revenue: $${application.annualRevenue}` : ''}

VERIFICATION TASKS:
1. Search for this exact business entity online
2. Determine if you can find a clear match for this specific business
3. Provide the verified business name (exact legal name if possible)
4. Provide the verified location/headquarters
5. Confirm whether the business operates in the stated industry
6. Provide the business website if available
7. Find the founding year or years in operation if available
8. List any additional identifiers (tax ID, registration numbers, etc.) if publicly available
9. Calculate a confidence score (0.0-1.0) of how certain you are this is the correct business
10. Only use factual information from authoritative sources

DO NOT HALLUCINATE INFORMATION. If you cannot find a clear match, indicate low confidence and explain why.

Format your response as valid JSON with the following structure:
{
  "verified": boolean,
  "confidence": number (0.0-1.0),
  "verifiedName": "Full legal name of verified business",
  "verifiedLocation": "Headquarters location",
  "industryMatch": boolean,
  "website": "Business website if found", 
  "foundingYear": "Year founded if found",
  "additionalIdentifiers": {
    "identifier1": "value1",
    "identifier2": "value2"
  },
  "searchSummary": "Brief summary of search results and confidence justification"
}`;

    // Use OpenAI for entity verification - better at verified factual research
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a business identity verification specialist with expertise in finding and confirming business entities. You only report factual information from verifiable sources and clearly indicate uncertainty. Never hallucinate information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from entity verification");
    }
    
    const result = JSON.parse(content);
    console.log(`Company verification complete - Confidence: ${result.confidence}, Verified Name: ${result.verifiedName}`);
    
    return {
      verified: result.verified || false,
      confidence: result.confidence || 0.1,
      verifiedName: result.verifiedName || application.businessName,
      verifiedLocation: result.verifiedLocation || "Unknown",
      industryMatch: result.industryMatch || false,
      website: result.website,
      foundingYear: result.foundingYear,
      additionalIdentifiers: result.additionalIdentifiers || {}
    };
  } catch (error) {
    console.error("Error verifying company identity:", error);
    // Return fallback with low confidence
    return {
      verified: false,
      confidence: 0.1,
      verifiedName: application.businessName,
      verifiedLocation: "Unknown",
      industryMatch: false,
      additionalIdentifiers: {}
    };
  }
}

/**
 * Verify person identity to ensure correct individual is being researched
 */
async function verifyPersonIdentity(
  personName: string,
  companyName: string,
  industry: string
): Promise<{
  verified: boolean;
  confidence: number;
  verifiedName: string;
  verifiedRole: string;
  connectionToCompany: string;
  socialProfiles: string[];
}> {
  try {
    console.log(`Verifying identity for person: ${personName} associated with ${companyName}`);
    
    const prompt = `I need to verify the identity of a business owner/executive before conducting research. Please help me confirm this is the correct person and provide key identifying information.

PERSON TO VERIFY:
Name: ${personName}
Associated Company: ${companyName}
Industry: ${industry}

VERIFICATION TASKS:
1. Search for this person in connection with the specified company
2. Determine if you can find a clear match for this specific individual
3. Provide the verified full name with correct spelling
4. Verify their role or position at the company
5. Explain their connection to the company (owner, co-founder, executive, etc.)
6. List any public social media or professional profiles you can find (LinkedIn, company bio, etc.)
7. Calculate a confidence score (0.0-1.0) of how certain you are this is the correct person
8. Only use factual information from authoritative sources

DO NOT HALLUCINATE INFORMATION. If you cannot find a clear match, indicate low confidence and explain why.

Format your response as valid JSON with the following structure:
{
  "verified": boolean,
  "confidence": number (0.0-1.0),
  "verifiedName": "Full verified name with correct spelling",
  "verifiedRole": "Current verified role at company",
  "connectionToCompany": "Description of connection to company",
  "socialProfiles": ["URL1", "URL2"],
  "searchSummary": "Brief summary of search results and confidence justification"
}`;

    // Use OpenAI for entity verification
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a person identity verification specialist with expertise in finding and confirming business relationships. You only report factual information from verifiable sources and clearly indicate uncertainty. Never hallucinate information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from person verification");
    }
    
    const result = JSON.parse(content);
    console.log(`Person verification complete - Confidence: ${result.confidence}, Verified Name: ${result.verifiedName}`);
    
    return {
      verified: result.verified || false,
      confidence: result.confidence || 0.1,
      verifiedName: result.verifiedName || personName,
      verifiedRole: result.verifiedRole || "Unknown",
      connectionToCompany: result.connectionToCompany || "Unknown",
      socialProfiles: result.socialProfiles || []
    };
  } catch (error) {
    console.error("Error verifying person identity:", error);
    // Return fallback with low confidence
    return {
      verified: false,
      confidence: 0.1,
      verifiedName: personName,
      verifiedRole: "Unknown",
      connectionToCompany: "Unknown",
      socialProfiles: []
    };
  }
}

/**
 * Research a verified company with enhanced context
 */
async function researchVerifiedCompany(
  application: LoanApplication,
  verifiedName: string,
  verifiedLocation: string,
  industryMatch: boolean,
  verificationConfidence: number
): Promise<any> {
  try {
    console.log(`Researching verified company: ${verifiedName}`);
    
    // Build specific search query based on verified information
    const searchContext = `
Verified Business Name: ${verifiedName}
Verified Location: ${verifiedLocation}
Stated Industry: ${application.industry}
Industry Match Confirmed: ${industryMatch ? "Yes" : "No"}
Verification Confidence: ${(verificationConfidence * 100).toFixed(1)}%
Years In Business: ${application.yearsInBusiness || "Unknown"}
Annual Revenue Range: ${application.annualRevenue ? `$${application.annualRevenue}` : "Unknown"}
`;

    const prompt = `Conduct comprehensive business research focused on loan risk assessment for this verified entity:

${searchContext}

RESEARCH FOCUS AREAS:
1. Legal issues: lawsuits, regulatory actions, compliance violations, legal judgments, liens
2. Financial stability: bankruptcy history, defaults, credit issues, debt/liquidity concerns
3. Reputation: customer reviews, BBB ratings, complaints, industry reputation
4. Market position: competitive landscape, industry trends, market share
5. Management quality: leadership track record, turnover, scandals
6. Recent news: major events, mergers, acquisitions, layoffs
7. Public records: tax issues, license problems, regulatory filings

For each area, provide:
- Specific factual findings with dates, amounts, and measurable impacts
- Links to reliable sources where information was found
- Clear indication of severity (high, medium, low risk)

Format your response as valid JSON with this structure:
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
  "sources": ["Source URL 1", "Source URL 2"],
  "highRiskFactors": ["High risk factor 1", "High risk factor 2"],
  "moderateRiskFactors": ["Moderate risk factor 1", "Moderate risk factor 2"],
  "mitigatingFactors": ["Mitigating factor 1", "Mitigating factor 2"],
  "score": 75
}

The score should be between 0-100, with higher scores indicating less risk.
Include "No significant issues found" in appropriate sections if nothing negative is discovered after thorough research.
If verification confidence is below 75%, indicate this clearly in your findings.`;

    // Use GPT-4o for entity research with verification context
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a business intelligence researcher with expertise in due diligence for loan applications. You perform targeted searches for specific verified businesses and report only factual information from verifiable sources. You are thorough in finding legal, financial, and reputational issues that may affect loan risk."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from company research");
    }
    
    const result = JSON.parse(content);
    
    // Ensure all required fields exist
    return {
      overview: result.overview || "No overview provided",
      legalIssues: result.legalIssues || [],
      financialRedFlags: result.financialRedFlags || [],
      reputationInsights: result.reputationInsights || [],
      industryPosition: result.industryPosition || [],
      marketTrends: result.marketTrends || [],
      executiveSummary: result.executiveSummary || "No executive summary provided",
      specificEvents: result.specificEvents || [],
      financialMetrics: result.financialMetrics || [],
      sources: result.sources || [],
      highRiskFactors: result.highRiskFactors || [],
      moderateRiskFactors: result.moderateRiskFactors || [],
      mitigatingFactors: result.mitigatingFactors || [],
      score: result.score || 70 // Default to moderate score if not provided
    };
  } catch (error) {
    console.error("Error researching verified company:", error);
    throw error;
  }
}

/**
 * Research a verified person with enhanced context
 */
async function researchVerifiedPerson(
  originalName: string,
  verifiedName: string,
  verifiedRole: string,
  verificationConfidence: number,
  originalCompanyName: string,
  verifiedCompanyName: string
): Promise<any> {
  try {
    console.log(`Researching verified person: ${verifiedName}, role: ${verifiedRole}`);
    
    // Build specific search context for the verified person
    const searchContext = `
Verified Name: ${verifiedName}
Verified Role: ${verifiedRole}
Name From Application: ${originalName}
Verification Confidence: ${(verificationConfidence * 100).toFixed(1)}%
Company: ${verifiedCompanyName}
`;

    const prompt = `Conduct comprehensive background research for loan risk assessment on this verified individual:

${searchContext}

RESEARCH FOCUS AREAS:
1. Legal issues: lawsuits, judgments, criminal records, bankruptcies, liens
2. Financial history: personal bankruptcies, foreclosures, debt issues, tax liens
3. Professional reputation: work history, leadership record, professional sanctions
4. Business history: previous businesses owned, their outcomes, bankruptcies
5. Public records: property records, licenses, voter registrations
6. Social media & news: controversies, major life events, public statements
7. Relationships: business partners, other companies, political connections

For each area, provide:
- Specific factual findings with dates, amounts, and measurable impacts
- Links to reliable sources where information was found
- Clear indication of severity (high, medium, low risk)

Format your response as valid JSON with this structure:
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
  "sources": ["Source URL 1", "Source URL 2"],
  "highRiskFactors": ["High risk factor 1", "High risk factor 2"],
  "moderateRiskFactors": ["Moderate risk factor 1", "Moderate risk factor 2"],
  "mitigatingFactors": ["Mitigating factor 1", "Mitigating factor 2"],
  "score": 75
}

The score should be between 0-100, with higher scores indicating less risk.
Include "No significant issues found" in appropriate sections if nothing negative is discovered after thorough research.
If verification confidence is below 75%, indicate this clearly in your findings.`;

    // Use GPT-4o for person research
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a background investigation specialist with expertise in due diligence for loan applications. You perform targeted searches for specific verified individuals and report only factual information from verifiable sources. You are thorough in finding legal, financial, and reputational issues that may affect loan risk."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    // Parse response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from person research");
    }
    
    const result = JSON.parse(content);
    
    // Ensure all required fields exist
    return {
      overview: result.overview || "No overview provided",
      legalIssues: result.legalIssues || [],
      financialRedFlags: result.financialRedFlags || [],
      reputationInsights: result.reputationInsights || [],
      managementCapabilities: result.managementCapabilities || [],
      executiveSummary: result.executiveSummary || "No executive summary provided",
      priorBusinessHistory: result.priorBusinessHistory || [],
      sources: result.sources || [],
      highRiskFactors: result.highRiskFactors || [],
      moderateRiskFactors: result.moderateRiskFactors || [],
      mitigatingFactors: result.mitigatingFactors || [],
      score: result.score || 70 // Default to moderate score if not provided
    };
  } catch (error) {
    console.error("Error researching verified person:", error);
    throw error;
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

  // Remove duplicate entries using array filter
  const uniqueLegalIssues = allLegalIssues.filter((value, index, self) => self.indexOf(value) === index);
  const uniqueFinancialRedFlags = allFinancialRedFlags.filter((value, index, self) => self.indexOf(value) === index);
  const uniqueReputationInsights = allReputationInsights.filter((value, index, self) => self.indexOf(value) === index);
  const uniqueManagementCapabilities = allManagementCapabilities.filter((value, index, self) => self.indexOf(value) === index);
  const uniqueSources = allSources.filter((value, index, self) => self.indexOf(value) === index);
  const uniqueHighRiskFactors = allHighRiskFactors.filter((value, index, self) => self.indexOf(value) === index);
  const uniqueModerateRiskFactors = allModerateRiskFactors.filter((value, index, self) => self.indexOf(value) === index);
  const uniqueMitigatingFactors = allMitigatingFactors.filter((value, index, self) => self.indexOf(value) === index);

  // Return combined analysis
  return {
    overview: combinedOverview,
    legalIssues: uniqueLegalIssues,
    financialRedFlags: uniqueFinancialRedFlags,
    reputationInsights: uniqueReputationInsights,
    managementCapabilities: uniqueManagementCapabilities,
    executiveSummary: executiveSummary,
    priorBusinessHistory: allPriorBusinessHistory.slice(0, 5), // Limit to 5 most relevant
    sources: uniqueSources,
    score: Math.round(totalScore / ownerAnalyses.length),
    highRiskFactors: uniqueHighRiskFactors,
    moderateRiskFactors: uniqueModerateRiskFactors,
    mitigatingFactors: uniqueMitigatingFactors
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