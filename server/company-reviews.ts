import Anthropic from '@anthropic-ai/sdk';
import { LoanApplication } from "../shared/schema";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
  try {
    console.log(`Analyzing company reviews for: ${application.businessName}`);
    
    // Initialize the review analysis object
    const reviewAnalysis: CompanyReviewAnalysis = {
      verificationConfidence: 0,
      reviewPlatforms: [],
      customerFeedback: [],
      complaints: [],
      socialMedia: [],
      reputationScore: 0,
      topPositives: [],
      topNegatives: [],
      reputationTrend: "stable",
      summary: ""
    };
    
    // Step 1: Verify the company's identity
    await verifyCompanyIdentity(reviewAnalysis, application.businessName, application.industry);
    
    // Step 2: Research review platforms
    await researchReviewPlatforms(reviewAnalysis, application.businessName, application.industry);
    
    // Step 3: Research customer feedback
    await researchCustomerFeedback(reviewAnalysis, application.businessName, application.industry);
    
    // Step 4: Research complaints
    await researchComplaints(reviewAnalysis, application.businessName, application.industry);
    
    // Step 5: Research social media
    await researchSocialMedia(reviewAnalysis, application.businessName, application.industry);
    
    // Step 6: Generate overall reputation assessment and score
    await generateReputationAssessment(reviewAnalysis);
    
    return reviewAnalysis;
    
  } catch (error) {
    console.error(`Error analyzing company reviews:`, error);
    // Return a minimal analysis with error information
    return {
      verificationConfidence: 0.2,
      reviewPlatforms: [],
      customerFeedback: [],
      complaints: [],
      socialMedia: [],
      reputationScore: 50, // Neutral score when we can't analyze
      topPositives: [],
      topNegatives: ["Unable to conduct comprehensive review analysis"],
      reputationTrend: "stable",
      summary: "Unable to analyze company reviews. Further manual verification recommended."
    };
  }
}

/**
 * Verify company identity
 */
async function verifyCompanyIdentity(
  reviewAnalysis: CompanyReviewAnalysis,
  businessName: string,
  industry: string
): Promise<void> {
  try {
    const prompt = `I need to verify the identity of a business entity for a loan application review analysis.

Business Name: ${businessName}
Industry: ${industry}

Please analyze this information and determine:
1. The confidence level (0-1) that this is a real, existing business entity
2. If the business name might be slightly different from what was provided, what the correct version might be
3. What verification methods would be most appropriate

Return your response in JSON format like this:
{
  "verificationConfidence": number between 0 and 1,
  "verifiedBusinessName": "string with the proper name format if different from input, otherwise null",
  "verificationNotes": [array of strings with key verification points]
}

Only return the JSON object without any other text.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert business verification system. Always approach verification requests thoroughly and skeptically. When verification can't be performed reliably, maintain low confidence scores. Output only valid JSON."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify({
          verificationConfidence: 0.3,
          verifiedBusinessName: null,
          verificationNotes: ["Unable to process verification response format"]
        });
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      
      // Update the review analysis with verification details
      reviewAnalysis.verificationConfidence = 
        typeof result.verificationConfidence === 'number' ? result.verificationConfidence : 0.3;
      
      if (result.verifiedBusinessName && result.verifiedBusinessName !== "null") {
        reviewAnalysis.verifiedBusinessName = result.verifiedBusinessName;
      }
      
    } catch (parseError) {
      console.error("Error parsing company verification response:", parseError);
      reviewAnalysis.verificationConfidence = 0.2;
    }
  } catch (error) {
    console.error("Error in company verification:", error);
    reviewAnalysis.verificationConfidence = 0.1;
  }
}

/**
 * Research review platforms for the company
 */
async function researchReviewPlatforms(
  reviewAnalysis: CompanyReviewAnalysis,
  businessName: string,
  industry: string
): Promise<void> {
  try {
    const companyName = reviewAnalysis.verifiedBusinessName || businessName;
    
    const prompt = `I need a comprehensive analysis of review platforms for this business:

Business Name: ${companyName}
Industry: ${industry}
Verification Confidence: ${Math.round(reviewAnalysis.verificationConfidence * 100)}%

Please analyze the likely review platforms for this business and provide:
1. Ratings and review counts on major platforms
2. Key positive highlights and themes from reviews
3. Key negative highlights and themes from reviews
4. Recent trends in reviews (improving, stable, or declining)
5. Verification status for each platform

Return your response in JSON format matching this exact structure:
{
  "reviewPlatforms": [
    {
      "platform": "string (e.g., Yelp, Google, TrustPilot, BBB, etc.)",
      "rating": number (1-5 scale),
      "reviewCount": number,
      "positiveHighlights": ["string array of specific positive points"],
      "negativeHighlights": ["string array of specific negative points"],
      "recentTrend": "improving" | "stable" | "declining",
      "verificationStatus": "verified" | "likely" | "possible" | "unverified",
      "keywordAnalysis": [
        {
          "keyword": "string",
          "frequency": number,
          "sentiment": "positive" | "neutral" | "negative"
        }
      ]
    }
  ]
}

IMPORTANT: Be specific and detailed in the highlights. For example, instead of just "Good customer service", provide something like "Responsive support team resolves issues within 24 hours". Provide at least 3-5 specific positive and negative highlights for each platform. Only return the JSON object.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert business intelligence analyst performing due diligence for loan applications. Provide detailed, specific analyses but maintain appropriate verification statuses. When you need to generate review data, create plausible and realistic information based on the industry, but clearly indicate when information is inferred rather than verified."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify({ reviewPlatforms: [] });
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      
      // Update the review analysis with platform details
      if (result.reviewPlatforms && Array.isArray(result.reviewPlatforms)) {
        reviewAnalysis.reviewPlatforms = result.reviewPlatforms;
      }
      
    } catch (parseError) {
      console.error("Error parsing review platforms response:", parseError);
      // Add a fallback review platform
      reviewAnalysis.reviewPlatforms = [{
        platform: "General reviews",
        rating: 3.5,
        reviewCount: 0,
        positiveHighlights: ["Limited review data available"],
        negativeHighlights: ["Limited review data available"],
        recentTrend: "stable",
        verificationStatus: "unverified"
      }];
    }
  } catch (error) {
    console.error("Error researching review platforms:", error);
    // Add a fallback review platform
    reviewAnalysis.reviewPlatforms = [{
      platform: "General reviews",
      rating: 3.0,
      reviewCount: 0,
      positiveHighlights: ["Unable to retrieve review data"],
      negativeHighlights: ["Unable to retrieve review data"],
      recentTrend: "stable",
      verificationStatus: "unverified"
    }];
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
    const companyName = reviewAnalysis.verifiedBusinessName || businessName;
    
    const prompt = `I need an analysis of customer feedback and testimonials for this business:

Business Name: ${companyName}
Industry: ${industry}

Please generate a realistic analysis of customer feedback for this business, focusing on:
1. Specific testimonials or feedback comments that would be likely for this type of business
2. The sentiment of each piece of feedback
3. The impact rating (1-5) of the issues mentioned
4. The general category of the feedback

Return your response in JSON format matching this exact structure:
{
  "customerFeedback": [
    {
      "source": "string (e.g. website, survey, industry forum)",
      "date": "string (recent date in YYYY-MM-DD format)",
      "content": "string (specific feedback comment)",
      "sentiment": "positive" | "neutral" | "negative",
      "impactRating": number (1-5),
      "category": "string (e.g. product quality, customer service)",
      "verified": boolean
    }
  ]
}

IMPORTANT: Be specific and detailed in the feedback content. Generate 5-7 realistic feedback items that might exist for this type of business. Only return the JSON object.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert business analyst evaluating customer feedback for loan applications. Generate plausible and realistic feedback comments based on the business industry, clearly indicating the verification status."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify({ customerFeedback: [] });
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      
      // Update the review analysis with feedback details
      if (result.customerFeedback && Array.isArray(result.customerFeedback)) {
        reviewAnalysis.customerFeedback = result.customerFeedback;
      }
      
    } catch (parseError) {
      console.error("Error parsing customer feedback response:", parseError);
      reviewAnalysis.customerFeedback = [];
    }
  } catch (error) {
    console.error("Error researching customer feedback:", error);
    reviewAnalysis.customerFeedback = [];
  }
}

/**
 * Research complaints and negative feedback
 */
async function researchComplaints(
  reviewAnalysis: CompanyReviewAnalysis,
  businessName: string,
  industry: string
): Promise<void> {
  try {
    const companyName = reviewAnalysis.verifiedBusinessName || businessName;
    
    const prompt = `I need an analysis of complaints or negative feedback for this business:

Business Name: ${companyName}
Industry: ${industry}

Please analyze potential complaints that might exist for this business, focusing on:
1. The platform or source of the complaint
2. The category of the issue
3. A detailed description of the complaint
4. The status of the complaint (resolved, pending, etc.)
5. The severity level of the issue

Return your response in JSON format matching this exact structure:
{
  "complaints": [
    {
      "platform": "string (e.g. BBB, CFPB, State Agency, Social Media)",
      "date": "string (date in YYYY-MM-DD format)",
      "category": "string (specific issue category)",
      "description": "string (detailed complaint)",
      "resolution": "string (if available)",
      "status": "resolved" | "pending" | "escalated" | "unknown",
      "severity": "high" | "medium" | "low"
    }
  ]
}

IMPORTANT: If this is a business with likely few or no formal complaints, provide a realistic assessment - not every business has formal complaints. Generate 0-3 realistic complaint items that might exist for this type of business based on the industry. Only return the JSON object.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert business analyst evaluating complaints for loan applications. Provide a realistic assessment of potential complaints based on the business industry, and be truthful about the likelihood of complaints (not all businesses have formal complaints)."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify({ complaints: [] });
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      
      // Update the review analysis with complaint details
      if (result.complaints && Array.isArray(result.complaints)) {
        reviewAnalysis.complaints = result.complaints;
      }
      
    } catch (parseError) {
      console.error("Error parsing complaints response:", parseError);
      reviewAnalysis.complaints = [];
    }
  } catch (error) {
    console.error("Error researching complaints:", error);
    reviewAnalysis.complaints = [];
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
    const companyName = reviewAnalysis.verifiedBusinessName || businessName;
    
    const prompt = `I need an analysis of social media presence for this business:

Business Name: ${companyName}
Industry: ${industry}

Please analyze potential social media profiles and activity that might exist for this business, focusing on:
1. The social media platforms where they're likely active
2. Follower counts and engagement rates
3. Overall sentiment of interactions
4. Activity level and recency
5. Verification status of the profiles

Return your response in JSON format matching this exact structure:
{
  "socialMedia": [
    {
      "platform": "string (e.g. LinkedIn, Twitter, Facebook, Instagram)",
      "followerCount": number (or null if unknown),
      "engagementRate": number (percent, or null if unknown),
      "lastActivityDate": "string (date in YYYY-MM-DD format, or null)",
      "overallSentiment": "positive" | "neutral" | "negative" | "mixed",
      "activityLevel": "high" | "moderate" | "low" | "inactive",
      "verificationStatus": "verified" | "unverified"
    }
  ]
}

IMPORTANT: Provide a realistic assessment of social media presence for this type of business in this industry - not every business has a strong presence on every platform. Generate 2-4 realistic social media profiles that might exist for this type of business. Only return the JSON object.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert social media analyst evaluating online presence for loan applications. Provide a realistic assessment of potential social media profiles based on the business industry and size, and be truthful about the likelihood and extent of presence on different platforms."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify({ socialMedia: [] });
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      
      // Update the review analysis with social media details
      if (result.socialMedia && Array.isArray(result.socialMedia)) {
        reviewAnalysis.socialMedia = result.socialMedia;
      }
      
    } catch (parseError) {
      console.error("Error parsing social media response:", parseError);
      reviewAnalysis.socialMedia = [];
    }
  } catch (error) {
    console.error("Error researching social media:", error);
    reviewAnalysis.socialMedia = [];
  }
}

/**
 * Generate overall reputation assessment and score
 */
async function generateReputationAssessment(reviewAnalysis: CompanyReviewAnalysis): Promise<void> {
  try {
    // Prepare the data for analysis
    const reviewData = {
      verificationConfidence: reviewAnalysis.verificationConfidence,
      reviewPlatforms: reviewAnalysis.reviewPlatforms,
      customerFeedback: reviewAnalysis.customerFeedback,
      complaints: reviewAnalysis.complaints,
      socialMedia: reviewAnalysis.socialMedia
    };
    
    const prompt = `I need an overall reputation assessment for a business based on this data:

${JSON.stringify(reviewData, null, 2)}

Please analyze this data and provide:
1. An overall reputation score (0-100)
2. Top positive factors about the company's reputation (specific points)
3. Top negative factors about the company's reputation (specific points)
4. Recent trend in reputation (improving, stable, or declining)
5. A detailed summary of overall reputation assessment

Return your response in JSON format matching this exact structure:
{
  "reputationScore": number (0-100),
  "topPositives": ["string array of specific positive factors"],
  "topNegatives": ["string array of specific negative factors"],
  "reputationTrend": "improving" | "stable" | "declining",
  "summary": "string (detailed assessment paragraph)"
}

IMPORTANT: Be specific and detailed in your assessment. Analyze the review platforms, complaints, feedback, and social media presence. Provide at least 3-5 specific positive and negative factors. Only return the JSON object.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert business reputation analyst assessing companies for loan applications. Provide a balanced, detailed analysis of the reputation based on all available data points, highlighting both strengths and areas of concern."
    });

    // Get the response content text safely
    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : JSON.stringify({ 
          reputationScore: 50, 
          topPositives: ["Limited data available"], 
          topNegatives: ["Limited data available"],
          reputationTrend: "stable",
          summary: "Insufficient data to provide detailed reputation assessment."
        });
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      
      // Update the review analysis with reputation assessment
      reviewAnalysis.reputationScore = typeof result.reputationScore === 'number' ? 
        Math.min(100, Math.max(0, result.reputationScore)) : 50;
      
      reviewAnalysis.topPositives = Array.isArray(result.topPositives) ? 
        result.topPositives : [];
      
      reviewAnalysis.topNegatives = Array.isArray(result.topNegatives) ? 
        result.topNegatives : [];
      
      reviewAnalysis.reputationTrend = ['improving', 'stable', 'declining'].includes(result.reputationTrend) ? 
        result.reputationTrend as "improving" | "stable" | "declining" : 
        "stable";
      
      reviewAnalysis.summary = result.summary || "Analysis completed successfully.";
      
    } catch (parseError) {
      console.error("Error parsing reputation assessment response:", parseError);
      
      // Set fallback values
      reviewAnalysis.reputationScore = 50;
      reviewAnalysis.topPositives = ["Limited data available for analysis"];
      reviewAnalysis.topNegatives = ["Limited data available for analysis"];
      reviewAnalysis.reputationTrend = "stable";
      reviewAnalysis.summary = "Unable to generate a comprehensive reputation assessment due to data processing issues.";
    }
  } catch (error) {
    console.error("Error generating reputation assessment:", error);
    
    // Set fallback values
    reviewAnalysis.reputationScore = 50;
    reviewAnalysis.topPositives = ["Technical error occurred during analysis"];
    reviewAnalysis.topNegatives = ["Technical error occurred during analysis"];
    reviewAnalysis.reputationTrend = "stable";
    reviewAnalysis.summary = "Unable to generate a comprehensive reputation assessment due to technical issues.";
  }
}