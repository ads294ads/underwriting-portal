import { LoanApplication } from "../shared/schema";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize API clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT4O_MODEL = "gpt-4o";

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const CLAUDE_MODEL = "claude-3-7-sonnet-20250219";

// Types for company reviews
export interface CompanyReview {
  platform: string;
  rating: number;
  reviewCount: number;
  positiveHighlights: string[];
  negativeHighlights: string[];
  recentTrend: "improving" | "stable" | "declining";
  verificationStatus: "verified" | "likely" | "possible" | "unverified";
  keywordAnalysis?: {
    keyword: string;
    frequency: number;
    sentiment: "positive" | "neutral" | "negative";
  }[];
}

export interface CompanyCustomerFeedback {
  source: string;
  date: string;
  content: string;
  sentiment: "positive" | "neutral" | "negative";
  impactRating: number; // 1-5 scale
  category: string;
  verified: boolean;
}

export interface CompanyComplaint {
  platform: string;
  date: string;
  category: string;
  description: string;
  resolution?: string;
  status: "resolved" | "pending" | "escalated" | "unknown";
  severity: "high" | "medium" | "low";
}

export interface SocialMediaPresence {
  platform: string;
  followerCount?: number;
  engagementRate?: number;
  lastActivityDate?: string;
  overallSentiment: "positive" | "neutral" | "negative" | "mixed";
  activityLevel: "high" | "moderate" | "low" | "inactive";
  verificationStatus: "verified" | "unverified";
}

export interface CompanyReviewAnalysis {
  verificationConfidence: number;
  verifiedBusinessName?: string;
  reviewPlatforms: CompanyReview[];
  customerFeedback: CompanyCustomerFeedback[];
  complaints: CompanyComplaint[];
  socialMedia: SocialMediaPresence[];
  reputationScore: number; // 0-100
  topPositives: string[];
  topNegatives: string[];
  reputationTrend: "improving" | "stable" | "declining";
  summary: string;
}

/**
 * Analyze company reviews and social media presence across multiple platforms
 * @param application Loan application data
 * @returns Comprehensive review analysis
 */
export async function analyzeCompanyReviews(
  application: LoanApplication
): Promise<CompanyReviewAnalysis> {
  console.log(`Starting company review analysis for: ${application.businessName}`);
  
  try {
    // Step 1: Verify company identity and collect basic information
    const verificationResult = await verifyCompanyIdentity(
      application.businessName,
      application.industry,
      application.state
    );
    
    const verifiedName = verificationResult.verifiedName || application.businessName;
    const verificationConfidence = verificationResult.confidence;
    
    console.log(`Company verification result: ${verifiedName} (${Math.round(verificationConfidence * 100)}% confidence)`);
    
    // Initialize the review analysis result
    const reviewAnalysis: CompanyReviewAnalysis = {
      verificationConfidence,
      verifiedBusinessName: verifiedName !== application.businessName ? verifiedName : undefined,
      reviewPlatforms: [],
      customerFeedback: [],
      complaints: [],
      socialMedia: [],
      reputationScore: 70, // Default score
      topPositives: [],
      topNegatives: [],
      reputationTrend: "stable",
      summary: ""
    };
    
    // Step 2: Research review platforms
    await researchReviewPlatforms(
      reviewAnalysis,
      verifiedName,
      application.industry,
      application.state
    );
    
    // Step 3: Research customer feedback and testimonials
    await researchCustomerFeedback(
      reviewAnalysis,
      verifiedName,
      application.industry
    );
    
    // Step 4: Research complaints and negative feedback
    await researchComplaints(
      reviewAnalysis,
      verifiedName,
      application.industry,
      application.state
    );
    
    // Step 5: Research social media presence
    await researchSocialMedia(
      reviewAnalysis,
      verifiedName,
      application.industry
    );
    
    // Step 6: Generate overall reputation assessment and score
    await generateReputationAssessment(reviewAnalysis);
    
    return reviewAnalysis;
  } catch (error) {
    console.error(`Error conducting company review analysis for ${application.businessName}:`, error);
    
    // Return fallback result with error indication
    return {
      verificationConfidence: 0.1,
      reviewPlatforms: [],
      customerFeedback: [],
      complaints: [],
      socialMedia: [],
      reputationScore: 50,
      topPositives: [],
      topNegatives: ["Unable to complete reviews analysis due to technical error"],
      reputationTrend: "stable",
      summary: `We were unable to complete the enhanced company review analysis for ${application.businessName} due to a technical error. Standard verification procedures are recommended.`
    };
  }
}

/**
 * Verify company identity
 */
async function verifyCompanyIdentity(
  businessName: string,
  industry: string,
  state?: string
): Promise<{
  verified: boolean;
  confidence: number;
  verifiedName: string;
  verifiedWebsite?: string;
  verifiedLocation?: string;
}> {
  try {
    const locationContext = state ? `in ${state}` : "";
    const verificationPrompt = `
I need to verify the identity of a business before conducting detailed review and reputation research.

BUSINESS TO VERIFY:
Name: ${businessName}
Industry: ${industry}
Location: ${locationContext}

VERIFICATION TASKS:
1. Search for this exact business
2. Determine if this is a registered, legitimate business
3. Verify the correct spelling/formatting of the business name
4. Identify their official website if available
5. Confirm their primary location
6. Calculate a confidence score (0.0 to 1.0) for how certain you are this is the correct business

Only report factual, verifiable information from reputable sources. If you cannot verify with high confidence, clearly state this limitation.

Response format:
{
  "verified": boolean,
  "confidence": number between 0.0 and 1.0,
  "verifiedName": "Full verified business name with correct spelling",
  "verifiedWebsite": "Official website URL",
  "verifiedLocation": "Primary business location",
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief summary of your verification process and findings"
}`;

    try {
      // Try Claude first for verification
      const claudeResponse = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: verificationPrompt
          }
        ],
        system: "You are an expert investigator specializing in business verification. You only report factual, verifiable information from reputable sources. You never fabricate details or assume connections without evidence."
      });

      const content = claudeResponse.content[0];
      if (content && 'text' in content) {
        const claudeContent = content.text;
        const result = JSON.parse(claudeContent);
        return {
          verified: result.verified || false,
          confidence: result.confidence || 0.1,
          verifiedName: result.verifiedName || businessName,
          verifiedWebsite: result.verifiedWebsite,
          verifiedLocation: result.verifiedLocation
        };
      }
    } catch (error) {
      console.error("Claude verification failed, falling back to OpenAI:", error);
    }
    
    // Fallback to OpenAI if Claude fails
    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert investigator specializing in business verification. You only report factual, verifiable information from reputable sources. You never fabricate details or assume connections without evidence."
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
      verifiedName: result.verifiedName || businessName,
      verifiedWebsite: result.verifiedWebsite,
      verifiedLocation: result.verifiedLocation
    };
  } catch (error) {
    console.error(`Error verifying company identity:`, error);
    return {
      verified: false,
      confidence: 0.1,
      verifiedName: businessName
    };
  }
}

/**
 * Research review platforms for the company
 */
async function researchReviewPlatforms(
  reviewAnalysis: CompanyReviewAnalysis,
  businessName: string,
  industry: string,
  state?: string
): Promise<void> {
  try {
    const locationContext = state ? `in ${state}` : "";
    const reviewPrompt = `
Research reviews for this business across major review platforms:

BUSINESS: ${businessName}
Industry: ${industry}
Location: ${locationContext}

RESEARCH TASKS:
1. Search for this business on major review platforms, including:
   - Google Business Reviews
   - Yelp
   - Better Business Bureau (BBB)
   - TrustPilot
   - Industry-specific review sites relevant to ${industry}
2. For each platform where the business is found, determine:
   - Overall rating (out of 5 stars)
   - Number of reviews
   - Key positive themes/highlights (3-5 specific examples)
   - Key negative themes/highlights (3-5 specific examples)
   - Recent trend (improving, stable, declining)
   - Verification status (verified business listing, likely match, possible match)
3. If possible, identify common keywords/phrases in reviews and their frequency
4. Only include review platforms where you can reasonably confirm this is the correct business

Response format:
{
  "reviewPlatforms": [
    {
      "platform": "Platform name",
      "rating": number (out of 5),
      "reviewCount": number,
      "positiveHighlights": ["Specific positive point 1", "Specific positive point 2", ...],
      "negativeHighlights": ["Specific negative point 1", "Specific negative point 2", ...],
      "recentTrend": "improving", "stable", or "declining",
      "verificationStatus": "verified", "likely", "possible", or "unverified",
      "keywordAnalysis": [
        {
          "keyword": "word or phrase",
          "frequency": number,
          "sentiment": "positive", "neutral", or "negative"
        }
      ]
    }
  ],
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief description of your search process and confidence in results"
}`;

    try {
      // Try Claude first for review platform research
      const claudeResponse = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: reviewPrompt
          }
        ],
        system: "You are an expert researcher specializing in business reviews and reputation analysis. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
      });

      const content = claudeResponse.content[0];
      if (content && 'text' in content) {
        const claudeContent = content.text;
        const result = JSON.parse(claudeContent);
        reviewAnalysis.reviewPlatforms = result.reviewPlatforms || [];
        console.log(`Found ${reviewAnalysis.reviewPlatforms.length} review platforms using Claude.`);
        return;
      }
    } catch (error) {
      console.error("Claude review platform research failed, falling back to OpenAI:", error);
    }
    
    // Fallback to OpenAI if Claude fails
    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert researcher specializing in business reviews and reputation analysis. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
        },
        { role: "user", content: reviewPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from review platform research");
    }
    
    const result = JSON.parse(content);
    
    // Update analysis with research results
    reviewAnalysis.reviewPlatforms = result.reviewPlatforms || [];
    console.log(`Found ${reviewAnalysis.reviewPlatforms.length} review platforms using OpenAI.`);
  } catch (error) {
    console.error(`Error researching review platforms:`, error);
    // Keep existing review data, don't override with empty arrays
  }
}

/**
 * Research customer feedback and testimonials
 */
async function researchCustomerFeedback(
  reviewAnalysis: CompanyReviewAnalysis,
  businessName: string,
  industry: string
): Promise<void> {
  try {
    const feedbackPrompt = `
Research customer feedback and testimonials for this business:

BUSINESS: ${businessName}
Industry: ${industry}

RESEARCH TASKS:
1. Search for customer testimonials and feedback from various sources:
   - Company website
   - Social media posts
   - Case studies
   - Industry forums
   - News articles or interviews
2. For each significant piece of feedback found, determine:
   - Source
   - Approximate date
   - Content/key points
   - Overall sentiment (positive, neutral, negative)
   - Impact rating (1-5, where 5 is highly impactful)
   - Category (product quality, customer service, value, etc.)
   - Verification status (verified customer or not)
3. Focus on detailed, substantive feedback rather than simple ratings
4. Only include feedback you can reasonably confirm is about this specific business

Response format:
{
  "customerFeedback": [
    {
      "source": "Where the feedback was found",
      "date": "Approximate date",
      "content": "Brief description of the feedback",
      "sentiment": "positive", "neutral", or "negative",
      "impactRating": number from 1-5,
      "category": "Category of feedback",
      "verified": boolean
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
          content: "You are an expert researcher specializing in customer feedback analysis. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
        },
        { role: "user", content: feedbackPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from customer feedback research");
    }
    
    const result = JSON.parse(content);
    
    // Update analysis with research results
    reviewAnalysis.customerFeedback = result.customerFeedback || [];
    console.log(`Found ${reviewAnalysis.customerFeedback.length} customer feedback items.`);
  } catch (error) {
    console.error(`Error researching customer feedback:`, error);
    // Keep existing feedback data, don't override with empty arrays
  }
}

/**
 * Research complaints and negative feedback
 */
async function researchComplaints(
  reviewAnalysis: CompanyReviewAnalysis,
  businessName: string,
  industry: string,
  state?: string
): Promise<void> {
  try {
    const locationContext = state ? `in ${state}` : "";
    const complaintsPrompt = `
Research complaints and negative feedback about this business:

BUSINESS: ${businessName}
Industry: ${industry}
Location: ${locationContext}

RESEARCH TASKS:
1. Search for formal complaints and negative feedback from various sources:
   - Better Business Bureau (BBB) complaints
   - Consumer protection agencies
   - Industry regulators
   - Consumer complaint boards
   - Social media complaints
   - Ripoff Report or similar sites
2. For each significant complaint found, determine:
   - Platform/source
   - Approximate date
   - Category of complaint
   - Description of the issue
   - Resolution (if available)
   - Status (resolved, pending, escalated, unknown)
   - Severity (high, medium, low impact on reputation)
3. Focus on formal complaints rather than minor negative reviews
4. Only include complaints you can reasonably confirm are about this specific business

Response format:
{
  "complaints": [
    {
      "platform": "Where the complaint was filed",
      "date": "Approximate date",
      "category": "Type of complaint",
      "description": "Brief description of the issue",
      "resolution": "How it was resolved (if known)",
      "status": "resolved", "pending", "escalated", or "unknown",
      "severity": "high", "medium", or "low"
    }
  ],
  "sources": ["Source 1", "Source 2"],
  "searchDetails": "Brief description of your search process and confidence in results"
}`;

    try {
      // Try Claude first for complaints research
      const claudeResponse = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: complaintsPrompt
          }
        ],
        system: "You are an expert researcher specializing in business complaints and consumer protection. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
      });

      const content = claudeResponse.content[0];
      if (content && 'text' in content) {
        const claudeContent = content.text;
        const result = JSON.parse(claudeContent);
        reviewAnalysis.complaints = result.complaints || [];
        console.log(`Found ${reviewAnalysis.complaints.length} complaints using Claude.`);
        return;
      }
    } catch (error) {
      console.error("Claude complaints research failed, falling back to OpenAI:", error);
    }
    
    // Fallback to OpenAI if Claude fails
    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert researcher specializing in business complaints and consumer protection. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
        },
        { role: "user", content: complaintsPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from complaints research");
    }
    
    const result = JSON.parse(content);
    
    // Update analysis with research results
    reviewAnalysis.complaints = result.complaints || [];
    console.log(`Found ${reviewAnalysis.complaints.length} complaints using OpenAI.`);
  } catch (error) {
    console.error(`Error researching complaints:`, error);
    // Keep existing complaints data, don't override with empty arrays
  }
}

/**
 * Research social media presence
 */
async function researchSocialMedia(
  reviewAnalysis: CompanyReviewAnalysis,
  businessName: string,
  industry: string
): Promise<void> {
  try {
    const socialMediaPrompt = `
Research the social media presence of this business:

BUSINESS: ${businessName}
Industry: ${industry}

RESEARCH TASKS:
1. Search for this business on major social media platforms:
   - Facebook
   - Twitter/X
   - Instagram
   - LinkedIn
   - YouTube
   - TikTok
   - Industry-specific platforms relevant to ${industry}
2. For each platform where the business has a presence, determine:
   - Follower/subscriber count
   - Engagement rate (if possible)
   - Date of most recent activity
   - Overall sentiment of comments/interactions (positive, neutral, negative, mixed)
   - Activity level (high, moderate, low, inactive)
   - Verification status (verified account or not)
3. Focus on the business's official accounts, not mentions by others
4. Only include social media accounts you can reasonably confirm belong to this specific business

Response format:
{
  "socialMedia": [
    {
      "platform": "Platform name",
      "followerCount": number or null,
      "engagementRate": number or null,
      "lastActivityDate": "Approximate date",
      "overallSentiment": "positive", "neutral", "negative", or "mixed",
      "activityLevel": "high", "moderate", "low", or "inactive",
      "verificationStatus": "verified" or "unverified"
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
          content: "You are an expert researcher specializing in social media analysis. You only report factual, verifiable information from public sources. You never fabricate details or make assumptions without evidence."
        },
        { role: "user", content: socialMediaPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from social media research");
    }
    
    const result = JSON.parse(content);
    
    // Update analysis with research results
    reviewAnalysis.socialMedia = result.socialMedia || [];
    console.log(`Found ${reviewAnalysis.socialMedia.length} social media profiles.`);
  } catch (error) {
    console.error(`Error researching social media:`, error);
    // Keep existing social media data, don't override with empty arrays
  }
}

/**
 * Generate overall reputation assessment and score
 */
async function generateReputationAssessment(reviewAnalysis: CompanyReviewAnalysis): Promise<void> {
  try {
    // Convert the analysis to a string representation for the prompt
    const analysisJson = JSON.stringify(reviewAnalysis, null, 2);
    
    const assessmentPrompt = `
Based on the following company review analysis, generate a comprehensive reputation assessment:

${analysisJson}

ASSESSMENT TASKS:
1. Analyze all the data to calculate an overall reputation score (0-100, higher is better)
2. Identify the top 3-5 positive aspects of the company's reputation
3. Identify the top 3-5 negative aspects or concerns
4. Determine the overall reputation trend (improving, stable, declining)
5. Write a concise summary of the company's reputation profile

Response format:
{
  "reputationScore": number between 0 and 100,
  "topPositives": ["Positive aspect 1", "Positive aspect 2", ...],
  "topNegatives": ["Negative aspect 1", "Negative aspect 2", ...],
  "reputationTrend": "improving", "stable", or "declining",
  "summary": "Concise 2-3 paragraph summary of the company's reputation"
}`;

    try {
      // Try Claude first for reputation assessment
      const claudeResponse = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: assessmentPrompt
          }
        ],
        system: "You are an expert reputation analyst specializing in evaluating businesses for loan underwriting. You excel at identifying patterns in complex data and producing clear, actionable assessments. You focus on facts rather than conjecture, and you clearly document the evidence for your conclusions."
      });

      const content = claudeResponse.content[0];
      if (content && 'text' in content) {
        const claudeContent = content.text;
        const result = JSON.parse(claudeContent);
        
        // Update analysis with assessment results
        reviewAnalysis.reputationScore = result.reputationScore || 70;
        reviewAnalysis.topPositives = result.topPositives || [];
        reviewAnalysis.topNegatives = result.topNegatives || [];
        reviewAnalysis.reputationTrend = result.reputationTrend || "stable";
        reviewAnalysis.summary = result.summary || "";
        
        console.log(`Generated reputation assessment using Claude with score: ${reviewAnalysis.reputationScore}`);
        return;
      }
    } catch (error) {
      console.error("Claude reputation assessment failed, falling back to OpenAI:", error);
    }
    
    // Fallback to OpenAI if Claude fails
    const response = await openai.chat.completions.create({
      model: GPT4O_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an expert reputation analyst specializing in evaluating businesses for loan underwriting. You excel at identifying patterns in complex data and producing clear, actionable assessments. You focus on facts rather than conjecture, and you clearly document the evidence for your conclusions."
        },
        { role: "user", content: assessmentPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from reputation assessment");
    }
    
    const result = JSON.parse(content);
    
    // Update analysis with assessment results
    reviewAnalysis.reputationScore = result.reputationScore || 70;
    reviewAnalysis.topPositives = result.topPositives || [];
    reviewAnalysis.topNegatives = result.topNegatives || [];
    reviewAnalysis.reputationTrend = result.reputationTrend || "stable";
    reviewAnalysis.summary = result.summary || "";
    
    console.log(`Generated reputation assessment using OpenAI with score: ${reviewAnalysis.reputationScore}`);
  } catch (error) {
    console.error(`Error generating reputation assessment:`, error);
    
    // Provide basic assessment if API fails
    if (!reviewAnalysis.summary) {
      reviewAnalysis.summary = `${reviewAnalysis.verifiedBusinessName || "The business"} has a presence on ${reviewAnalysis.reviewPlatforms.length} review platforms and ${reviewAnalysis.socialMedia.length} social media sites. Limited information was found to conduct a comprehensive reputation assessment.`;
    }
    
    // Ensure we have at least basic positive/negative points
    if (reviewAnalysis.topPositives.length === 0) {
      // Generate some basic positives based on available data
      if (reviewAnalysis.reviewPlatforms.length > 0) {
        const highestRatedPlatform = reviewAnalysis.reviewPlatforms.reduce(
          (highest, current) => current.rating > highest.rating ? current : highest,
          { platform: "", rating: 0 } as CompanyReview
        );
        
        if (highestRatedPlatform.rating >= 4) {
          reviewAnalysis.topPositives.push(`Strong rating (${highestRatedPlatform.rating}/5) on ${highestRatedPlatform.platform}`);
        }
      }
      
      if (reviewAnalysis.complaints.length === 0) {
        reviewAnalysis.topPositives.push("No major complaints found in research");
      }
      
      if (reviewAnalysis.socialMedia.length > 0) {
        reviewAnalysis.topPositives.push("Established social media presence");
      }
    }
    
    if (reviewAnalysis.topNegatives.length === 0) {
      // Generate some basic negatives based on available data
      if (reviewAnalysis.verificationConfidence < 0.5) {
        reviewAnalysis.topNegatives.push("Low verification confidence - business identity could not be confirmed with high certainty");
      }
      
      if (reviewAnalysis.complaints.length > 0) {
        reviewAnalysis.topNegatives.push(`${reviewAnalysis.complaints.length} formal complaints identified`);
      }
      
      const lowRatedPlatforms = reviewAnalysis.reviewPlatforms.filter(p => p.rating < 3);
      if (lowRatedPlatforms.length > 0) {
        reviewAnalysis.topNegatives.push(`Low ratings (below 3/5) on ${lowRatedPlatforms.length} review platforms`);
      }
    }
  }
}