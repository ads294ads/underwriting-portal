import { LoanApplication } from "../shared/schema";
import { DeepResearchResult } from "./deepsearch";
import { conductEnhancedOwnerResearch, EnhancedOwnerProfile } from "./owner-research";
import { analyzeCompanyReviews, CompanyReviewAnalysis } from "./company-reviews";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize API clients with fallback mechanisms
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
}

try {
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize Anthropic client:", error);
}

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT4O_MODEL = "gpt-4o";

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const CLAUDE_MODEL = "claude-3-7-sonnet-20250219";

/**
 * Perform enhanced deep research with entity verification and specialized research modules
 * 
 * This approach uses a two-stage process:
 * 1. Verify the identities of the company and owners
 * 2. Conduct specialized research on verified entities
 * 
 * @param application The loan application to research
 * @returns A structured deep research result with verification data
 */
export async function performEnhancedDeepResearch(application: LoanApplication): Promise<DeepResearchResult> {
  console.log(`Starting enhanced deep research for application: ${application.businessName}`);
  
  try {
    // Step 1: Verify company identity to ensure correct entity is being researched
    const companyVerification = await verifyCompanyIdentity(application);
    console.log(`Company verification complete: ${Math.round(companyVerification.confidence * 100)}% confidence`);
    
    // Step 2: Verify owner identities to ensure correct individuals are being researched
    const ownerVerifications: any[] = [];
    
    if (application.owners && application.owners.length > 0) {
      for (const owner of application.owners) {
        if (owner.ownershipPercentage >= 20) { // Only verify owners with 20% or more ownership
          const ownerVerification = await verifyPersonIdentity(owner.name, application.businessName, companyVerification.verifiedName);
          ownerVerifications.push({
            name: owner.name,
            verifiedName: ownerVerification.verifiedName,
            confidence: ownerVerification.confidence,
            verifiedTitle: ownerVerification.verifiedTitle
          });
          console.log(`Owner verification complete for ${owner.name}: ${Math.round(ownerVerification.confidence * 100)}% confidence`);
        }
      }
    }
    
    // Calculate overall verification confidence
    const verificationScores = [companyVerification.confidence];
    ownerVerifications.forEach(v => verificationScores.push(v.confidence));
    const overallVerificationConfidence = verificationScores.reduce((sum, score) => sum + score, 0) / verificationScores.length;
    
    // Step 3: Research the verified company
    const companyResearch = await researchVerifiedCompany(
      application, 
      companyVerification.verifiedName,
      companyVerification.confidence
    );
    
    // Step 4: Research the verified owners (for those with 20%+ ownership)
    const ownerResearches: any[] = [];
    
    if (application.owners && application.owners.length > 0) {
      for (let i = 0; i < application.owners.length; i++) {
        const owner = application.owners[i];
        
        if (owner.ownershipPercentage >= 20) {
          const ownerVerification = ownerVerifications.find(v => v.name === owner.name);
          
          if (ownerVerification) {
            const ownerResearch = await researchVerifiedPerson(
              owner.name,
              ownerVerification.verifiedName,
              application.businessName,
              companyVerification.verifiedName,
              ownerVerification.confidence
            );
            
            ownerResearches.push(ownerResearch);
            console.log(`Owner research complete for ${ownerVerification.verifiedName}`);
          }
        }
      }
    }
    
    // Step 5: Combine owner analyses into one result
    const combinedOwnerAnalysis = combineOwnerAnalyses(ownerResearches);
    
    // Step 6: Calculate overall score and grade
    const companyScore = companyResearch.score;
    const ownerScore = combinedOwnerAnalysis.score;
    const combinedScore = Math.round((companyScore * 0.7) + (ownerScore * 0.3));
    const grade = determineGrade(combinedScore);
    
    // Step 7: Collect high-level risk factors for combined assessment
    const highRiskFactors = [
      ...companyResearch.highRiskFactors || [],
      ...combinedOwnerAnalysis.highRiskFactors || []
    ];
    
    const moderateRiskFactors = [
      ...companyResearch.moderateRiskFactors || [],
      ...combinedOwnerAnalysis.moderateRiskFactors || []
    ];
    
    const mitigatingFactors = [
      ...companyResearch.mitigatingFactors || [],
      ...combinedOwnerAnalysis.mitigatingFactors || []
    ];
    
    // Return the complete research result
    return {
      companyAnalysis: companyResearch,
      ownerAnalysis: combinedOwnerAnalysis,
      combinedScore,
      grade,
      verificationConfidence: overallVerificationConfidence,
      riskAssessment: {
        highRiskFactors,
        moderateRiskFactors,
        mitigatingFactors
      }
    };
  } catch (error) {
    console.error("Error in enhanced deep research:", error);
    
    // Return a basic fallback result if research fails
    return {
      companyAnalysis: {
        overview: `We attempted to conduct deep research on ${application.businessName} but encountered technical difficulties. The results provided are limited and should be supplemented with manual verification.`,
        legalIssues: [],
        financialRedFlags: [],
        reputationInsights: [],
        executiveSummary: "Research was limited due to technical issues.",
        score: 60
      },
      ownerAnalysis: {
        overview: "Owner analysis was limited due to technical issues.",
        legalIssues: [],
        financialRedFlags: [],
        reputationInsights: [],
        executiveSummary: "Research was limited due to technical issues.",
        score: 60
      },
      combinedScore: 60,
      grade: "C+",
      verificationConfidence: 0.2,
      riskAssessment: {
        highRiskFactors: ["Unable to complete thorough research due to technical issues"],
        moderateRiskFactors: [],
        mitigatingFactors: []
      }
    };
  }
}

/**
 * Verify company identity to ensure correct entity is being researched
 */
async function verifyCompanyIdentity(application: LoanApplication): Promise<{
  verifiedName: string;
  confidence: number;
  website?: string;
  registeredAddress?: string;
  yearFounded?: string;
  registrationStatus?: string;
}> {
  try {
    if (!openai && !anthropic) {
      throw new Error("No AI services available for company verification");
    }
    
    const systemPrompt = `You are an expert business intelligence researcher specializing in company verification and identity confirmation. Your task is to verify the identity of a business entity based on provided information. Only report verifiable facts and clearly indicate confidence levels. Never fabricate information.`;
    
    const userPrompt = `
I need to verify the identity of a business before conducting detailed financial research.

BUSINESS TO VERIFY:
Name: ${application.businessName}
Industry: ${application.industry}
Location: ${application.city || ""}, ${application.state || ""}
Years in Business: ${application.yearsInBusiness || "Unknown"}
Annual Revenue: $${application.annualRevenue?.toLocaleString() || "Unknown"}

VERIFICATION TASKS:
1. Confirm this is a real business entity that exists as described
2. Verify the correct legal name of the business
3. Determine if the business is properly registered
4. Identify the business website if available
5. Find the registered address if available
6. Estimate founding year or age of business
7. Calculate a confidence score (0.0 to 1.0) representing how certain you are that you've identified the correct business

Response format:
{
  "verifiedName": "Correct legal name of business",
  "registrationStatus": "Registered/Unknown/Not Found",
  "website": "Official website URL or null",
  "registeredAddress": "Official address or null",
  "yearFounded": "Year or null",
  "confidence": 0.X, (between 0.0 and 1.0)
  "sources": ["Source 1", "Source 2", ...],
  "verificationNotes": "Brief explanation of your verification process and confidence level"
}`;

    // Try to use Claude first if available
    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ]
        });
        
        if (response.content?.[0]?.text) {
          const result = JSON.parse(response.content[0].text);
          
          return {
            verifiedName: result.verifiedName || application.businessName,
            confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
            website: result.website,
            registeredAddress: result.registeredAddress,
            yearFounded: result.yearFounded,
            registrationStatus: result.registrationStatus
          };
        }
      } catch (claudeError) {
        console.error("Claude company verification failed:", claudeError);
        // Fall back to OpenAI
      }
    }
    
    // Use OpenAI as fallback if Claude fails or isn't available
    if (openai) {
      const response = await openai.chat.completions.create({
        model: GPT4O_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });
      
      if (response.choices?.[0]?.message?.content) {
        const result = JSON.parse(response.choices[0].message.content);
        
        return {
          verifiedName: result.verifiedName || application.businessName,
          confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
          website: result.website,
          registeredAddress: result.registeredAddress,
          yearFounded: result.yearFounded,
          registrationStatus: result.registrationStatus
        };
      }
    }
    
    throw new Error("Company verification failed with all available AI services");
  } catch (error) {
    console.error("Error in company verification:", error);
    
    // Return a fallback with low confidence
    return {
      verifiedName: application.businessName,
      confidence: 0.3,
      registrationStatus: "Unknown - verification failed"
    };
  }
}

/**
 * Verify person identity to ensure correct individual is being researched
 */
async function verifyPersonIdentity(
  ownerName: string,
  businessName: string,
  verifiedBusinessName: string
): Promise<{
  verifiedName: string;
  confidence: number;
  verifiedTitle?: string;
  socialProfiles?: string[];
}> {
  try {
    if (!openai && !anthropic) {
      throw new Error("No AI services available for person verification");
    }
    
    const systemPrompt = `You are an expert investigator specializing in identity verification and background research. Your task is to verify the identity of a business owner based on provided information. Only report verifiable facts and clearly indicate confidence levels. Never fabricate information.`;
    
    const userPrompt = `
I need to verify the identity of a business owner before conducting detailed background research.

PERSON TO VERIFY:
Name: ${ownerName}
Associated Business: ${verifiedBusinessName || businessName}

VERIFICATION TASKS:
1. Confirm this is a real person associated with the specified business
2. Verify the correct full name and spelling
3. Determine their role/title at the company
4. Identify professional social media profiles (LinkedIn, etc.)
5. Calculate a confidence score (0.0 to 1.0) representing how certain you are that you've identified the correct person

Response format:
{
  "verifiedName": "Correct full name with proper spelling",
  "verifiedTitle": "Role/position at the company",
  "socialProfiles": ["LinkedIn URL", "Twitter handle", etc.],
  "confidence": 0.X, (between 0.0 and 1.0)
  "sources": ["Source 1", "Source 2", ...],
  "verificationNotes": "Brief explanation of your verification process and confidence level"
}`;

    // Try to use Claude first if available
    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1000,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ]
        });
        
        if (response.content?.[0]?.text) {
          const result = JSON.parse(response.content[0].text);
          
          return {
            verifiedName: result.verifiedName || ownerName,
            confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
            verifiedTitle: result.verifiedTitle,
            socialProfiles: result.socialProfiles
          };
        }
      } catch (claudeError) {
        console.error("Claude person verification failed:", claudeError);
        // Fall back to OpenAI
      }
    }
    
    // Use OpenAI as fallback if Claude fails or isn't available
    if (openai) {
      const response = await openai.chat.completions.create({
        model: GPT4O_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });
      
      if (response.choices?.[0]?.message?.content) {
        const result = JSON.parse(response.choices[0].message.content);
        
        return {
          verifiedName: result.verifiedName || ownerName,
          confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
          verifiedTitle: result.verifiedTitle,
          socialProfiles: result.socialProfiles
        };
      }
    }
    
    throw new Error("Person verification failed with all available AI services");
  } catch (error) {
    console.error(`Error in person verification for ${ownerName}:`, error);
    
    // Return a fallback with low confidence
    return {
      verifiedName: ownerName,
      confidence: 0.3
    };
  }
}

/**
 * Research a verified company with enhanced context
 */
async function researchVerifiedCompany(
  application: LoanApplication,
  verifiedName: string,
  verificationConfidence: number
): Promise<any> {
  try {
    console.log(`Starting company research for ${verifiedName} (verification confidence: ${Math.round(verificationConfidence * 100)}%)`);
    
    // Step 1: Conduct review and reputation research
    let reviewAnalysis: CompanyReviewAnalysis | null = null;
    
    try {
      reviewAnalysis = await analyzeCompanyReviews(application);
      console.log(`Review analysis complete for ${verifiedName}`);
    } catch (reviewError) {
      console.error("Error in company review analysis:", reviewError);
      // Continue with other research even if review analysis fails
    }
    
    // Step 2: Prepare specialized company research prompt
    const systemPrompt = `You are an expert business intelligence analyst specializing in conducting thorough company research for loan underwriting. You excel at finding specific risk factors that could impact loan repayment ability. Focus on objective, verifiable facts rather than generalities. Always provide specific examples with dates, amounts, and sources when possible.`;
    
    const userPrompt = `
Conduct comprehensive research on the following business to identify specific risk factors and strengths:

COMPANY: ${verifiedName} (verification confidence: ${Math.round(verificationConfidence * 100)}%)
Industry: ${application.industry}
Location: ${application.city || ""}, ${application.state || ""}
Years in Business: ${application.yearsInBusiness || "Unknown"}
Annual Revenue: $${application.annualRevenue?.toLocaleString() || "Unknown"}

${reviewAnalysis ? `
REVIEW ANALYSIS SUMMARY:
- Overall Reputation Score: ${reviewAnalysis.reputationScore}/100
- Top Positives: ${reviewAnalysis.topPositives.join(', ')}
- Top Negatives: ${reviewAnalysis.topNegatives.join(', ')}
- Reputation Trend: ${reviewAnalysis.reputationTrend}
` : ''}

RESEARCH FOCUS AREAS:
1. Legal Issues - Find specific legal problems including:
   - Active lawsuits (provide case numbers, courts, dates, amounts if possible)
   - Regulatory violations (specific regulations, dates, penalties)
   - Tax liens or judgments (amounts, dates, status)
   - Pending litigation (case types, potential impact)

2. Financial Red Flags - Identify specific financial concerns including:
   - Debt obligations (specific debts, amounts, terms)
   - Cash flow problems (specific indicators, severity)
   - Credit issues (specific reports, scores, concerns)
   - Irregular financial activities (specific examples)

3. Industry Position - Assess competitive position:
   - Market share estimation and trend
   - Competitive advantages/disadvantages (specific examples)
   - Industry disruptions affecting this business
   - Ranking among competitors (with specific comparisons)

4. Market Trends - Evaluate industry outlook:
   - Growth/contraction rate of the specific industry
   - Regulatory changes affecting this business
   - Technology impacts on this business model
   - Emerging competitors or business models

5. High Risk Factors - List 3-5 most significant specific risk factors
6. Moderate Risk Factors - List 3-5 moderate specific risk factors
7. Mitigating Factors - List 3-5 specific positive factors 

Provide a score from 0-100 (higher = less risky) based on your findings.

Response format:
{
  "overview": "2-3 paragraph objective summary of the company",
  "legalIssues": [
    "Specific legal issue 1 with dates and details",
    "Specific legal issue 2 with dates and details",
    ...
  ],
  "financialRedFlags": [
    "Specific financial red flag 1 with figures and details",
    "Specific financial red flag 2 with figures and details",
    ...
  ],
  "reputationInsights": [
    "Specific reputation insight 1 with details",
    "Specific reputation insight 2 with details",
    ...
  ],
  "industryPosition": [
    "Specific competitive position insight 1",
    "Specific competitive position insight 2",
    ...
  ],
  "marketTrends": [
    "Specific market trend 1 affecting this business",
    "Specific market trend 2 affecting this business",
    ...
  ],
  "highRiskFactors": [
    "Specific high risk factor 1",
    "Specific high risk factor 2",
    ...
  ],
  "moderateRiskFactors": [
    "Specific moderate risk factor 1",
    "Specific moderate risk factor 2",
    ...
  ],
  "mitigatingFactors": [
    "Specific mitigating factor 1",
    "Specific mitigating factor 2",
    ...
  ],
  "executiveSummary": "1-2 paragraph summary of key findings",
  "score": X, (0-100, higher = less risky)
  "sources": ["Source 1", "Source 2", ...],
  "researchNotes": "Brief notes on research methodology and limitations"
}`;

    // Try to use Claude first if available
    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ]
        });
        
        if (response.content?.[0]?.text) {
          return JSON.parse(response.content[0].text);
        }
      } catch (claudeError) {
        console.error("Claude company research failed:", claudeError);
        // Fall back to OpenAI
      }
    }
    
    // Use OpenAI as fallback if Claude fails or isn't available
    if (openai) {
      const response = await openai.chat.completions.create({
        model: GPT4O_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });
      
      if (response.choices?.[0]?.message?.content) {
        return JSON.parse(response.choices[0].message.content);
      }
    }
    
    throw new Error("Company research failed with all available AI services");
  } catch (error) {
    console.error(`Error in company research for ${verifiedName}:`, error);
    
    // Return a fallback with minimal data
    return {
      overview: `${verifiedName} is a business in the ${application.industry} industry. Limited information was found to conduct a comprehensive risk assessment.`,
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [
        "Limited public reputation data was found"
      ],
      industryPosition: [
        `Operates in the ${application.industry} industry`
      ],
      marketTrends: [
        "Industry trends could not be comprehensively assessed"
      ],
      highRiskFactors: [
        "Insufficient public information for thorough assessment"
      ],
      moderateRiskFactors: [
        "Limited public business history"
      ],
      mitigatingFactors: [
        `Reported annual revenue of $${application.annualRevenue?.toLocaleString()}`
      ],
      executiveSummary: `Limited public information was found for ${verifiedName}. Standard verification procedures are recommended.`,
      score: 60
    };
  }
}

/**
 * Research a verified person with enhanced context
 */
async function researchVerifiedPerson(
  originalName: string,
  verifiedName: string,
  businessName: string,
  verifiedBusinessName: string,
  verificationConfidence: number
): Promise<any> {
  try {
    console.log(`Starting owner research for ${verifiedName} (verification confidence: ${Math.round(verificationConfidence * 100)}%)`);
    
    // Step 1: Conduct enhanced owner research
    let ownerProfile: EnhancedOwnerProfile | null = null;
    
    try {
      ownerProfile = await conductEnhancedOwnerResearch(
        verifiedName,
        verifiedBusinessName || businessName,
        ""  // Industry - already handled in the function
      );
      console.log(`Enhanced owner profile complete for ${verifiedName}`);
    } catch (profileError) {
      console.error("Error in enhanced owner profile:", profileError);
      // Continue with other research even if profile analysis fails
    }
    
    // Step 2: Prepare specialized owner research prompt
    const systemPrompt = `You are an expert background researcher specializing in conducting thorough individual assessments for loan underwriting. You excel at finding specific risk factors that could impact loan repayment ability. Focus on objective, verifiable facts rather than generalities. Always provide specific examples with dates, amounts, and sources when possible.`;
    
    const userPrompt = `
Conduct comprehensive research on the following business owner to identify specific risk factors and strengths:

PERSON: ${verifiedName} (verification confidence: ${Math.round(verificationConfidence * 100)}%)
Business: ${verifiedBusinessName || businessName}

${ownerProfile ? `
OWNER PROFILE SUMMARY:
- Risk Score: ${ownerProfile.riskScore}/100
- Key Risk Factors: ${ownerProfile.riskFactors.join(', ')}
- Key Strengths: ${ownerProfile.strengthFactors.join(', ')}
- Business Associations: ${ownerProfile.businessAssociations.length} companies
- Legal Records: ${ownerProfile.legalRecords.length} records found
- Financial Records: ${ownerProfile.financialRecords.length} records found
` : ''}

RESEARCH FOCUS AREAS:
1. Legal Issues - Find specific legal problems including:
   - Bankruptcy history (chapter, dates, discharge status)
   - Civil lawsuits (case numbers, courts, dates, amounts if possible)
   - Criminal records (charges, dates, outcomes)
   - Tax liens or judgments (amounts, dates, status)

2. Financial Red Flags - Identify specific financial concerns including:
   - Personal debt obligations (specific debts, amounts, terms)
   - Credit issues (specific reports, scores, concerns)
   - Financial distress indicators (foreclosures, short sales, etc.)
   - Irregular financial activities (specific examples)

3. Reputation Insights - Assess professional standing:
   - Professional reputation (specific indicators, examples)
   - Industry reputation (specific mentions, awards, controversies)
   - Previous business outcomes (successes/failures with specific details)
   - Media coverage (specific examples, sentiment)

4. Management Capabilities - Evaluate business acumen:
   - Previous business performance (specific metrics, outcomes)
   - Leadership experience (specific roles, companies, durations)
   - Industry expertise (specific qualifications, experience)
   - Track record (specific accomplishments, failures)

5. High Risk Factors - List 3-5 most significant specific risk factors
6. Moderate Risk Factors - List 3-5 moderate specific risk factors
7. Mitigating Factors - List 3-5 specific positive factors 

Provide a score from 0-100 (higher = less risky) based on your findings.

Response format:
{
  "overview": "2-3 paragraph objective summary of the owner",
  "legalIssues": [
    "Specific legal issue 1 with dates and details",
    "Specific legal issue 2 with dates and details",
    ...
  ],
  "financialRedFlags": [
    "Specific financial red flag 1 with figures and details",
    "Specific financial red flag 2 with figures and details",
    ...
  ],
  "reputationInsights": [
    "Specific reputation insight 1 with details",
    "Specific reputation insight 2 with details",
    ...
  ],
  "managementCapabilities": [
    "Specific capability assessment 1",
    "Specific capability assessment 2",
    ...
  ],
  "highRiskFactors": [
    "Specific high risk factor 1",
    "Specific high risk factor 2",
    ...
  ],
  "moderateRiskFactors": [
    "Specific moderate risk factor 1",
    "Specific moderate risk factor 2",
    ...
  ],
  "mitigatingFactors": [
    "Specific mitigating factor 1",
    "Specific mitigating factor 2",
    ...
  ],
  "executiveSummary": "1-2 paragraph summary of key findings",
  "score": X, (0-100, higher = less risky)
  "sources": ["Source 1", "Source 2", ...],
  "researchNotes": "Brief notes on research methodology and limitations"
}`;

    // Try to use Claude first if available
    if (anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 4000,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt }
          ]
        });
        
        if (response.content?.[0]?.text) {
          return JSON.parse(response.content[0].text);
        }
      } catch (claudeError) {
        console.error("Claude owner research failed:", claudeError);
        // Fall back to OpenAI
      }
    }
    
    // Use OpenAI as fallback if Claude fails or isn't available
    if (openai) {
      const response = await openai.chat.completions.create({
        model: GPT4O_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });
      
      if (response.choices?.[0]?.message?.content) {
        return JSON.parse(response.choices[0].message.content);
      }
    }
    
    throw new Error("Owner research failed with all available AI services");
  } catch (error) {
    console.error(`Error in owner research for ${verifiedName}:`, error);
    
    // Return a fallback with minimal data
    return {
      overview: `${verifiedName} is associated with ${businessName}. Limited information was found to conduct a comprehensive risk assessment.`,
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [
        "Limited public reputation data was found"
      ],
      managementCapabilities: [
        "Management capabilities could not be comprehensively assessed"
      ],
      highRiskFactors: [
        "Insufficient public information for thorough assessment"
      ],
      moderateRiskFactors: [
        "Limited public professional history"
      ],
      mitigatingFactors: [
        `Currently associated with ${businessName}`
      ],
      executiveSummary: `Limited public information was found for ${verifiedName}. Standard verification procedures are recommended.`,
      score: 60
    };
  }
}

/**
 * Combine multiple owner analyses into one
 */
function combineOwnerAnalyses(ownerAnalyses: any[]): any {
  if (ownerAnalyses.length === 0) {
    return {
      overview: "No owner analysis was conducted.",
      legalIssues: [],
      financialRedFlags: [],
      reputationInsights: [],
      managementCapabilities: [],
      highRiskFactors: ["No owner analysis conducted"],
      moderateRiskFactors: [],
      mitigatingFactors: [],
      executiveSummary: "No owner information was provided for analysis.",
      score: 50
    };
  }
  
  if (ownerAnalyses.length === 1) {
    return ownerAnalyses[0];
  }
  
  // Combine multiple owner analyses
  const combinedOverview = "Multiple owners were analyzed as part of this assessment.";
  
  const combinedLegalIssues: string[] = [];
  const combinedFinancialRedFlags: string[] = [];
  const combinedReputationInsights: string[] = [];
  const combinedManagementCapabilities: string[] = [];
  const combinedHighRiskFactors: string[] = [];
  const combinedModerateRiskFactors: string[] = [];
  const combinedMitigatingFactors: string[] = [];
  
  let totalScore = 0;
  
  // Collect all findings
  ownerAnalyses.forEach((analysis, index) => {
    combinedLegalIssues.push(
      ...(analysis.legalIssues || []).map((issue: string) => `Owner ${index + 1}: ${issue}`)
    );
    
    combinedFinancialRedFlags.push(
      ...(analysis.financialRedFlags || []).map((flag: string) => `Owner ${index + 1}: ${flag}`)
    );
    
    combinedReputationInsights.push(
      ...(analysis.reputationInsights || []).map((insight: string) => `Owner ${index + 1}: ${insight}`)
    );
    
    combinedManagementCapabilities.push(
      ...(analysis.managementCapabilities || []).map((capability: string) => `Owner ${index + 1}: ${capability}`)
    );
    
    combinedHighRiskFactors.push(
      ...(analysis.highRiskFactors || []).map((factor: string) => `Owner ${index + 1}: ${factor}`)
    );
    
    combinedModerateRiskFactors.push(
      ...(analysis.moderateRiskFactors || []).map((factor: string) => `Owner ${index + 1}: ${factor}`)
    );
    
    combinedMitigatingFactors.push(
      ...(analysis.mitigatingFactors || []).map((factor: string) => `Owner ${index + 1}: ${factor}`)
    );
    
    totalScore += analysis.score || 50;
  });
  
  // Calculate average score
  const averageScore = Math.round(totalScore / ownerAnalyses.length);
  
  // Generate combined executive summary
  const combinedExecutiveSummary = `This analysis is based on the assessment of ${ownerAnalyses.length} business owners. The overall owner risk score is ${averageScore}/100. ${combinedHighRiskFactors.length > 0 ? `Key risk factors include: ${combinedHighRiskFactors.slice(0, 3).join('; ')}` : 'No significant owner risk factors were identified.'} ${combinedMitigatingFactors.length > 0 ? `Key mitigating factors include: ${combinedMitigatingFactors.slice(0, 3).join('; ')}` : ''}`;
  
  return {
    overview: combinedOverview,
    legalIssues: combinedLegalIssues,
    financialRedFlags: combinedFinancialRedFlags,
    reputationInsights: combinedReputationInsights,
    managementCapabilities: combinedManagementCapabilities,
    highRiskFactors: combinedHighRiskFactors,
    moderateRiskFactors: combinedModerateRiskFactors,
    mitigatingFactors: combinedMitigatingFactors,
    executiveSummary: combinedExecutiveSummary,
    score: averageScore
  };
}

/**
 * Determine grade based on score
 */
function determineGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  return "C-";
}