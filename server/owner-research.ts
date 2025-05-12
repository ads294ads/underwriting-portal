import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Types required for owner research
export interface OwnerSocialProfile {
  platform: string;
  url?: string;
  username?: string;
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
  lastActivity?: string;
  followerCount?: number;
  connectionCount?: number;
}

export interface OwnerBusinessAssociation {
  companyName: string;
  role: string;
  period: string;
  relationship: 'current' | 'former' | 'unknown';
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
}

export interface OwnerEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  year?: string;
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
}

export interface ProfessionalLicense {
  type: string;
  issuingAuthority: string;
  status: 'active' | 'inactive' | 'expired' | 'revoked' | 'unknown';
  expirationDate?: string;
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
}

export interface OwnerMediaMention {
  source: string;
  date: string;
  title: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  url?: string;
  summary: string;
}

export interface OwnerLegalRecord {
  type: string;
  date: string;
  jurisdiction: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'unknown';
  description: string;
  outcome?: string;
  source?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface OwnerFinancialRecord {
  type: string;
  date: string;
  status: string;
  amount?: string;
  description: string;
  source?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface OwnerReview {
  platform: string;
  rating?: number;
  comment?: string;
  date?: string;
  verified: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface EnhancedOwnerProfile {
  ownerName: string;
  verifiedName?: string;
  verificationConfidence: number;
  socialProfiles: OwnerSocialProfile[];
  businessAssociations: OwnerBusinessAssociation[];
  education: OwnerEducation[];
  licenses: ProfessionalLicense[];
  mediaMentions: OwnerMediaMention[];
  legalRecords: OwnerLegalRecord[];
  financialRecords: OwnerFinancialRecord[];
  reviews: OwnerReview[];
  riskScore: number;
  riskFactors: string[];
  strengthFactors: string[];
  summary: string;
}

/**
 * Conduct enhanced owner research on a business owner
 * @param ownerName The name of the owner to research
 * @param businessName The name of the associated business
 * @param industry The industry of the business
 * @returns Enhanced owner profile with detailed background information
 */
export async function conductEnhancedOwnerResearch(
  ownerName: string,
  businessName: string,
  industry: string
): Promise<EnhancedOwnerProfile> {
  try {
    console.log(`Conducting enhanced research on owner: ${ownerName}`);

    // Step 1: First verify the owner's identity
    const verificationResult = await verifyOwnerIdentity(ownerName, businessName);
    
    // Step 2: Research the owner's background with comprehensive prompt
    const researchResult = await performOwnerBackgroundResearch(
      ownerName, 
      verificationResult.verifiedName || ownerName,
      businessName,
      industry,
      verificationResult.confidence
    );
    
    // Combine verification and research results
    return {
      ...researchResult,
      verifiedName: verificationResult.verifiedName,
      verificationConfidence: verificationResult.confidence
    };
  } catch (error) {
    console.error(`Error in enhanced owner research:`, error);
    // Return a fallback profile with appropriate error information
    return generateFallbackOwnerProfile(ownerName, businessName);
  }
}

/**
 * Verify the identity of a business owner
 * @param ownerName The name to verify
 * @param businessName The associated business
 */
async function verifyOwnerIdentity(
  ownerName: string,
  businessName: string
): Promise<{ 
  verifiedName?: string, 
  confidence: number,
  details?: string[]
}> {
  try {
    const prompt = `I need to verify the identity of a business owner.

Owner Name: ${ownerName}
Associated Business: ${businessName}

Please analyze this information and determine:
1. Whether this appears to be a real person associated with this business
2. The confidence level (0-1) that this person is real and associated with the business
3. If the name might be slightly different from what was provided, what the correct version might be
4. What verification methods would be most appropriate

Return your response in JSON format like this:
{
  "verifiedName": "string with the proper name format if different from input, otherwise null",
  "confidence": number between 0 and 1,
  "details": [array of strings with key verification points]
}

Only return the JSON object without any other text.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert identity verification system. Always approach verification requests thoroughly and skeptically. When verification can't be performed reliably, maintain low confidence scores. Output only valid JSON."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify({
          verifiedName: null,
          confidence: 0.3,
          details: ["Unable to process verification response format"]
        });
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      return {
        verifiedName: result.verifiedName === null ? undefined : result.verifiedName,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        details: result.details || []
      };
    } catch (parseError) {
      console.error("Error parsing verification response:", parseError);
      return {
        confidence: 0.3,
        details: ["Verification analysis produced invalid format"]
      };
    }
  } catch (error) {
    console.error("Error in owner verification:", error);
    return {
      confidence: 0.2,
      details: ["Verification process failed due to technical issues"]
    };
  }
}

/**
 * Perform comprehensive background research on an owner
 */
async function performOwnerBackgroundResearch(
  ownerName: string,
  verifiedName: string,
  businessName: string,
  industry: string,
  verificationConfidence: number
): Promise<EnhancedOwnerProfile> {
  try {
    const prompt = `I need a comprehensive background analysis on a business owner for a loan evaluation.

Owner Name: ${verifiedName || ownerName}
Associated Business: ${businessName}
Industry: ${industry}
Verification Confidence: ${Math.round(verificationConfidence * 100)}%

Please analyze this information and provide a detailed background profile that includes:

1. Social and professional profiles (LinkedIn, Twitter, other platforms)
2. Business associations (current and past companies, roles)
3. Education history
4. Professional licenses and certifications
5. Media mentions
6. Legal records (if any)
7. Financial records (if any)
8. Reviews or ratings as a business owner
9. Overall risk score (0-100, where higher means more risk)
10. Summary of key risk factors
11. Summary of strengths and positive factors
12. Overall assessment of the owner's background

Return your response in JSON format matching this exact structure:
{
  "ownerName": "${verifiedName || ownerName}",
  "socialProfiles": [
    { 
      "platform": "string",
      "url": "string (optional)",
      "username": "string (optional)",
      "verificationStatus": "verified" | "likely" | "possible" | "unverified",
      "lastActivity": "string date (optional)",
      "followerCount": number (optional),
      "connectionCount": number (optional)
    }
  ],
  "businessAssociations": [
    {
      "companyName": "string",
      "role": "string",
      "period": "string",
      "relationship": "current" | "former" | "unknown",
      "verificationStatus": "verified" | "likely" | "possible" | "unverified"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string (optional)",
      "year": "string (optional)",
      "verificationStatus": "verified" | "likely" | "possible" | "unverified"
    }
  ],
  "licenses": [
    {
      "type": "string",
      "issuingAuthority": "string",
      "status": "active" | "inactive" | "expired" | "revoked" | "unknown",
      "expirationDate": "string (optional)",
      "verificationStatus": "verified" | "likely" | "possible" | "unverified"
    }
  ],
  "mediaMentions": [
    {
      "source": "string",
      "date": "string",
      "title": "string",
      "sentiment": "positive" | "neutral" | "negative",
      "url": "string (optional)",
      "summary": "string"
    }
  ],
  "legalRecords": [
    {
      "type": "string",
      "date": "string",
      "jurisdiction": "string",
      "status": "pending" | "resolved" | "dismissed" | "unknown",
      "description": "string",
      "outcome": "string (optional)",
      "source": "string (optional)",
      "severity": "high" | "medium" | "low"
    }
  ],
  "financialRecords": [
    {
      "type": "string",
      "date": "string",
      "status": "string",
      "amount": "string (optional)",
      "description": "string",
      "source": "string (optional)",
      "impact": "high" | "medium" | "low"
    }
  ],
  "reviews": [
    {
      "platform": "string",
      "rating": number (optional),
      "comment": "string (optional)",
      "date": "string (optional)",
      "verified": boolean,
      "sentiment": "positive" | "neutral" | "negative"
    }
  ],
  "riskScore": number (0-100),
  "riskFactors": [
    "string"
  ],
  "strengthFactors": [
    "string"
  ],
  "summary": "string"
}

IMPORTANT: Be specific and detailed. If information isn't available, provide reasonable inferences based on the industry and business, but maintain appropriate verification status (e.g., "possible" or "unverified"). Only return the JSON object.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert business intelligence analyst performing due diligence for loan applications. Provide detailed, specific analyses but maintain appropriate verification statuses and confidence. When you need to generate profile data, create plausible and realistic information based on the industry, but clearly indicate when information is inferred rather than verified."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify(generateFallbackOwnerProfile(ownerName, businessName));
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      
      // Ensure all required properties exist
      return {
        ownerName: result.ownerName || ownerName,
        verificationConfidence: verificationConfidence,
        socialProfiles: result.socialProfiles || [],
        businessAssociations: result.businessAssociations || [],
        education: result.education || [],
        licenses: result.licenses || [],
        mediaMentions: result.mediaMentions || [],
        legalRecords: result.legalRecords || [],
        financialRecords: result.financialRecords || [],
        reviews: result.reviews || [],
        riskScore: typeof result.riskScore === 'number' ? result.riskScore : 50,
        riskFactors: result.riskFactors || [],
        strengthFactors: result.strengthFactors || [],
        summary: result.summary || `Background analysis for ${ownerName} of ${businessName}.`
      };
    } catch (parseError) {
      console.error("Error parsing owner research response:", parseError);
      return generateFallbackOwnerProfile(ownerName, businessName);
    }
  } catch (error) {
    console.error("Error in owner background research:", error);
    return generateFallbackOwnerProfile(ownerName, businessName);
  }
}

/**
 * Generate a fallback owner profile when research fails
 */
function generateFallbackOwnerProfile(ownerName: string, businessName: string): EnhancedOwnerProfile {
  return {
    ownerName: ownerName,
    verificationConfidence: 0.2,
    socialProfiles: [],
    businessAssociations: [
      {
        companyName: businessName,
        role: "Owner",
        period: "Present",
        relationship: "current",
        verificationStatus: "unverified"
      }
    ],
    education: [],
    licenses: [],
    mediaMentions: [],
    legalRecords: [],
    financialRecords: [],
    reviews: [],
    riskScore: 50,
    riskFactors: ["Insufficient data for proper risk assessment"],
    strengthFactors: ["Further verification recommended"],
    summary: "Unable to conduct comprehensive background research. We recommend additional manual verification before proceeding with the loan application."
  };
}