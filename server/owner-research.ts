import { LoanApplication } from "../shared/schema";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT4O_MODEL = "gpt-4o";

// Types of profile data we want to collect
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
 * Conduct enhanced owner research with verification and detailed background check
 * @param ownerName Name of the owner to research
 * @param companyName Associated company name
 * @param industry Industry of the company
 * @returns Detailed owner profile with verification data
 */
export async function conductEnhancedOwnerResearch(
  ownerName: string,
  companyName: string,
  industry: string
): Promise<EnhancedOwnerProfile> {
  console.log(`Starting enhanced owner research for: ${ownerName} (${companyName})`);
  
  try {
    // Step 1: Verify identity and collect initial data
    const verificationResult = await verifyOwnerIdentity(ownerName, companyName);
    
    // If verification confidence is too low, limit the depth of research
    // but still continue with the best match we have
    const verifiedName = verificationResult.verifiedName || ownerName;
    const verificationConfidence = verificationResult.confidence;
    
    console.log(`Owner verification result: ${verifiedName} (${Math.round(verificationConfidence * 100)}% confidence)`);
    
    // If we have moderate confidence, proceed with full research
    const ownerProfile: EnhancedOwnerProfile = {
      ownerName: ownerName,
      verifiedName: verifiedName !== ownerName ? verifiedName : undefined,
      verificationConfidence: verificationConfidence,
      socialProfiles: [],
      businessAssociations: [],
      education: [],
      licenses: [],
      mediaMentions: [],
      legalRecords: [],
      financialRecords: [],
      reviews: [],
      riskScore: 70, // Default moderate score
      riskFactors: [],
      strengthFactors: [],
      summary: ""
    };
    
    // Step 2: Conduct social media and professional profile research
    await researchSocialAndProfessionalProfiles(ownerProfile, verifiedName, companyName, industry);
    
    // Step 3: Research business associations and history
    await researchBusinessAssociations(ownerProfile, verifiedName, companyName);
    
    // Step 4: Conduct legal and financial records search
    await researchLegalAndFinancialRecords(ownerProfile, verifiedName, companyName);
    
    // Step 5: Search for owner reputation and reviews
    await researchReputationAndReviews(ownerProfile, verifiedName, companyName);
    
    // Step 6: Generate final risk assessment and summary
    await generateRiskAssessment(ownerProfile);
    
    return ownerProfile;
  } catch (error) {
    console.error(`Error conducting enhanced owner research for ${ownerName}:`, error);
    
    // Return fallback profile with error indication
    return {
      ownerName: ownerName,
      verificationConfidence: 0.1,
      socialProfiles: [],
      businessAssociations: [
        {
          companyName: companyName,
          role: "Unknown",
          period: "Unknown",
          relationship: "unknown",
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
      riskFactors: ["Unable to complete owner research due to technical error"],
      strengthFactors: [],
      summary: `We were unable to complete the enhanced owner research for ${ownerName} due to a technical error. Standard verification procedures are recommended.`
    };
  }
}

/**
 * Verify owner identity and association with the company
 */
async function verifyOwnerIdentity(
  ownerName: string,
  companyName: string
): Promise<{
  verified: boolean;
  confidence: number;
  verifiedName: string;
  verifiedTitle?: string;
  socialProfiles?: string[];
}> {
  try {
    const verificationPrompt = `
I need to verify the identity of a business owner before conducting detailed background research.

PERSON TO VERIFY:
Name: ${ownerName}
Associated Company: ${companyName}

VERIFICATION TASKS:
1. Search for this exact person in connection with the specified company
2. Determine if this is a real person with a connection to the business
3. Verify the correct spelling of their full name
4. Identify their role/title at the company
5. Find any public social media or professional profiles (LinkedIn, company website bio, etc.)
6. Calculate a confidence score (0.0 to 1.0) for how certain you are this is the correct person

Only report factual, verifiable information from reputable sources. If you cannot verify with high confidence, clearly state this limitation.

Response format:
{
  "verified": boolean,
  "confidence": number between 0.0 and 1.0,
  "verifiedName": "Full verified name with correct spelling",
  "verifiedTitle": "Current verified role/title at company",
  "socialProfiles": ["LinkedIn URL or username", "Twitter handle", "etc"],
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief summary of your verification process and findings"
}`;

    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert investigator specializing in identity verification and background checks for business owners. You only report factual, verifiable information from reputable sources. You never fabricate details or assume connections without evidence."
        },
        { role: "user", content: verificationPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from verification check");
    }
    
    const result = JSON.parse(content);
    
    return {
      verified: result.verified || false,
      confidence: result.confidence || 0.1,
      verifiedName: result.verifiedName || ownerName,
      verifiedTitle: result.verifiedTitle,
      socialProfiles: result.socialProfiles
    };
  } catch (error) {
    console.error(`Error verifying owner identity:`, error);
    return {
      verified: false,
      confidence: 0.1,
      verifiedName: ownerName
    };
  }
}

/**
 * Research social media and professional profiles
 */
async function researchSocialAndProfessionalProfiles(
  profile: EnhancedOwnerProfile,
  verifiedName: string,
  companyName: string,
  industry: string
): Promise<void> {
  try {
    const profilesPrompt = `
Research the social media and professional profiles for this business owner:

PERSON: ${verifiedName}
Company: ${companyName}
Industry: ${industry}

RESEARCH TASKS:
1. Find all major social media platforms where this person has a presence (LinkedIn, Twitter, Facebook, Instagram, etc.)
2. For each profile found, determine:
   - Platform name
   - Username/URL
   - Verification status (verified account, likely match, possible match)
   - Approximate last activity date
   - Follower/connection count if available
3. Research professional credentials:
   - Educational background (institutions, degrees, years)
   - Professional licenses or certifications
   - Professional association memberships
4. Only include profiles you are reasonably confident belong to this specific person

Response format:
{
  "socialProfiles": [
    {
      "platform": "Platform name",
      "url": "Profile URL or username",
      "verificationStatus": "verified", "likely", "possible", or "unverified",
      "lastActivity": "Approximate last activity date",
      "followerCount": number or null
    }
  ],
  "education": [
    {
      "institution": "School name",
      "degree": "Degree type",
      "fieldOfStudy": "Major/Field",
      "year": "Completion year",
      "verificationStatus": "verified", "likely", "possible", or "unverified"
    }
  ],
  "licenses": [
    {
      "type": "License type",
      "issuingAuthority": "Issuing organization",
      "status": "active", "inactive", "expired", "revoked", or "unknown",
      "expirationDate": "Date or null",
      "verificationStatus": "verified", "likely", "possible", or "unverified"
    }
  ],
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief description of your search process and confidence in results"
}`;

    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert investigator specializing in social media and professional profile research. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
        },
        { role: "user", content: profilesPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from social profile research");
    }
    
    const result = JSON.parse(content);
    
    // Update profile with research results
    profile.socialProfiles = result.socialProfiles || [];
    profile.education = result.education || [];
    profile.licenses = result.licenses || [];
    
    console.log(`Found ${profile.socialProfiles.length} social profiles, ${profile.education.length} education entries, and ${profile.licenses.length} professional licenses.`);
  } catch (error) {
    console.error(`Error researching social profiles:`, error);
    // Keep existing profile data, don't override with empty arrays
  }
}

/**
 * Research business associations and history
 */
async function researchBusinessAssociations(
  profile: EnhancedOwnerProfile,
  verifiedName: string,
  companyName: string
): Promise<void> {
  try {
    const businessPrompt = `
Research the business associations and history for this business owner:

PERSON: ${verifiedName}
Current Company: ${companyName}

RESEARCH TASKS:
1. Identify all businesses this person is currently associated with
2. Research their previous business associations/history
3. For each business connection, determine:
   - Company name
   - Their role/position
   - Time period of involvement (years)
   - Relationship status (current or former)
   - Verification confidence (verified, likely, possible, unverified)
4. Look for history of:
   - Starting businesses
   - Business failures
   - Selling businesses
   - Board memberships
   - Advisory roles
5. Only include businesses you are reasonably confident are connected to this specific person

Response format:
{
  "businessAssociations": [
    {
      "companyName": "Company name",
      "role": "Position/role",
      "period": "Time period (e.g., 2015-2023)",
      "relationship": "current", "former", or "unknown",
      "verificationStatus": "verified", "likely", "possible", or "unverified"
    }
  ],
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief description of your search process and confidence in results"
}`;

    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert investigator specializing in business history and corporate relationship research. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
        },
        { role: "user", content: businessPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from business association research");
    }
    
    const result = JSON.parse(content);
    
    // Update profile with research results
    profile.businessAssociations = result.businessAssociations || [];
    
    // Make sure the current company is included
    if (!profile.businessAssociations.some(ba => ba.companyName.toLowerCase() === companyName.toLowerCase())) {
      profile.businessAssociations.unshift({
        companyName: companyName,
        role: "Owner/Member",
        period: "Current",
        relationship: "current",
        verificationStatus: profile.verificationConfidence >= 0.7 ? "verified" : "likely"
      });
    }
    
    console.log(`Found ${profile.businessAssociations.length} business associations.`);
  } catch (error) {
    console.error(`Error researching business associations:`, error);
    
    // Ensure at least the current company association exists
    if (profile.businessAssociations.length === 0) {
      profile.businessAssociations.push({
        companyName: companyName,
        role: "Owner/Member",
        period: "Current",
        relationship: "current",
        verificationStatus: profile.verificationConfidence >= 0.7 ? "verified" : "likely"
      });
    }
  }
}

/**
 * Research legal and financial records
 */
async function researchLegalAndFinancialRecords(
  profile: EnhancedOwnerProfile,
  verifiedName: string,
  companyName: string
): Promise<void> {
  try {
    const recordsPrompt = `
Research public legal and financial records for this business owner:

PERSON: ${verifiedName}
Company: ${companyName}

RESEARCH TASKS:
1. Search for legal records associated with this person, including:
   - Civil lawsuits (as plaintiff or defendant)
   - Criminal cases
   - Bankruptcies (personal or business)
   - Tax liens
   - Judgments
   - Regulatory actions
   - Professional disciplinary actions
2. Search for financial records or indicators, including:
   - Property records
   - Foreclosures
   - UCC filings
   - Public financial events (fundraising, investments)
   - Public debt information
3. For each record found, provide:
   - Record type
   - Date
   - Jurisdiction/location
   - Status (pending, resolved, dismissed)
   - Brief description
   - Outcome (if resolved)
   - Source of information
   - Severity assessment (high, medium, low impact on creditworthiness)
4. Only include records you are reasonably confident are associated with this specific person

Response format:
{
  "legalRecords": [
    {
      "type": "Record type (bankruptcy, lawsuit, etc.)",
      "date": "Date filed/occurred",
      "jurisdiction": "Court/locality",
      "status": "pending", "resolved", "dismissed", or "unknown",
      "description": "Brief description of the issue",
      "outcome": "Resolution if applicable",
      "source": "Information source",
      "severity": "high", "medium", or "low"
    }
  ],
  "financialRecords": [
    {
      "type": "Record type (property, foreclosure, etc.)",
      "date": "Date filed/occurred",
      "status": "Status description",
      "amount": "Dollar amount if applicable",
      "description": "Brief description",
      "source": "Information source",
      "impact": "high", "medium", or "low"
    }
  ],
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief description of your search process and confidence in results"
}`;

    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert investigator specializing in legal and financial record research. You only report factual, verifiable information from public records and reputable sources. You never fabricate details or make assumptions without evidence. You understand the difference between allegations and proven facts, and are clear about this distinction in your reporting."
        },
        { role: "user", content: recordsPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from legal/financial records research");
    }
    
    const result = JSON.parse(content);
    
    // Update profile with research results
    profile.legalRecords = result.legalRecords || [];
    profile.financialRecords = result.financialRecords || [];
    
    console.log(`Found ${profile.legalRecords.length} legal records and ${profile.financialRecords.length} financial records.`);
  } catch (error) {
    console.error(`Error researching legal and financial records:`, error);
    // Keep existing profile data, don't override with empty arrays
  }
}

/**
 * Research reputation and reviews
 */
async function researchReputationAndReviews(
  profile: EnhancedOwnerProfile,
  verifiedName: string,
  companyName: string
): Promise<void> {
  try {
    const reputationPrompt = `
Research the reputation and public perception of this business owner:

PERSON: ${verifiedName}
Company: ${companyName}

RESEARCH TASKS:
1. Search for media mentions and articles about this person, including:
   - News articles
   - Press releases
   - Industry publications
   - Blog posts
   - Interviews
2. Look for public reviews or comments about this person on:
   - Business review platforms (Yelp, Google, etc.)
   - Professional review sites
   - Social media mentions
3. For media mentions, provide:
   - Source
   - Date
   - Title/headline
   - Sentiment assessment (positive, neutral, negative)
   - Brief summary
   - URL if available
4. For reviews, provide:
   - Platform
   - Rating (if numerical)
   - Key comments
   - Date
   - Verification status (verified purchaser/client or not)
   - Sentiment (positive, neutral, negative)
5. Only include mentions and reviews you are reasonably confident are about this specific person

Response format:
{
  "mediaMentions": [
    {
      "source": "Publication/website name",
      "date": "Publication date",
      "title": "Article title",
      "sentiment": "positive", "neutral", or "negative",
      "url": "URL if available",
      "summary": "Brief summary of the mention"
    }
  ],
  "reviews": [
    {
      "platform": "Review platform",
      "rating": numerical rating or null,
      "comment": "Key comment text",
      "date": "Review date",
      "verified": boolean,
      "sentiment": "positive", "neutral", or "negative"
    }
  ],
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief description of your search process and confidence in results"
}`;

    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert investigator specializing in reputation research and media analysis. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
        },
        { role: "user", content: reputationPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from reputation research");
    }
    
    const result = JSON.parse(content);
    
    // Update profile with research results
    profile.mediaMentions = result.mediaMentions || [];
    profile.reviews = result.reviews || [];
    
    console.log(`Found ${profile.mediaMentions.length} media mentions and ${profile.reviews.length} reviews.`);
  } catch (error) {
    console.error(`Error researching reputation:`, error);
    // Keep existing profile data, don't override with empty arrays
  }
}

/**
 * Generate risk assessment and summary
 */
async function generateRiskAssessment(profile: EnhancedOwnerProfile): Promise<void> {
  try {
    // Convert the profile to a string representation for the prompt
    const profileJson = JSON.stringify(profile, null, 2);
    
    const assessmentPrompt = `
Based on the following owner research profile, generate a comprehensive risk assessment:

${profileJson}

ASSESSMENT TASKS:
1. Analyze all the data to identify key risk factors
2. Identify positive/mitigating factors
3. Calculate an overall risk score (0-100, where higher is less risky)
4. Write a concise summary of the owner's background and risk profile

Response format:
{
  "riskScore": number between 0 and 100,
  "riskFactors": ["Risk factor 1", "Risk factor 2", ...],
  "strengthFactors": ["Strength 1", "Strength 2", ...],
  "summary": "Concise 2-3 paragraph summary of the owner's background and risk profile"
}`;

    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert risk analyst specializing in evaluating business owners for loan underwriting. You excel at identifying patterns in complex data and producing clear, actionable risk assessments. You focus on facts rather than conjecture, and you clearly document the evidence for your conclusions."
        },
        { role: "user", content: assessmentPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from risk assessment");
    }
    
    const result = JSON.parse(content);
    
    // Update profile with assessment results
    profile.riskScore = result.riskScore || 70;
    profile.riskFactors = result.riskFactors || [];
    profile.strengthFactors = result.strengthFactors || [];
    profile.summary = result.summary || "";
    
    console.log(`Generated risk assessment with score: ${profile.riskScore}`);
  } catch (error) {
    console.error(`Error generating risk assessment:`, error);
    
    // Provide basic assessment if API fails
    if (!profile.summary) {
      profile.summary = `${profile.verifiedName || profile.ownerName} is associated with ${profile.businessAssociations.length} businesses, including ${profile.businessAssociations[0]?.companyName || "unknown"}. Limited information was found to conduct a comprehensive risk assessment.`;
    }
    
    // Ensure we have at least basic risk/strength factors
    if (profile.riskFactors.length === 0) {
      if (profile.verificationConfidence < 0.5) {
        profile.riskFactors.push("Low verification confidence - identity could not be confirmed with high certainty");
      }
      if (profile.legalRecords.length > 0) {
        profile.riskFactors.push(`${profile.legalRecords.length} legal records found that may impact creditworthiness`);
      }
    }
    
    if (profile.strengthFactors.length === 0) {
      if (profile.businessAssociations.length > 1) {
        profile.strengthFactors.push(`Multiple business associations indicate entrepreneurial experience`);
      }
      if (profile.education.length > 0) {
        profile.strengthFactors.push(`Educational background includes ${profile.education[0]?.degree || "formal education"}`);
      }
    }
  }
}