import { LoanApplication } from "../shared/schema";
import Anthropic from '@anthropic-ai/sdk';
import { VerificationStatus } from "../client/src/components/verification-status";
import PDFDocument from "pdfkit";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Get verification status for entities in a loan application
 * @param application The loan application to check verification for
 */
export async function getVerificationStatus(application: LoanApplication): Promise<VerificationStatus> {
  try {
    console.log("Verifying entities for application:", application.id);
    
    // Extract business address if available
    const businessAddress = application.address || "";
    const companyVerification = await verifyCompany(application.businessName, application.industry, businessAddress);
    
    // Find primary owner
    let primaryOwner = null;
    if (application.businessOwners && application.businessOwners.length > 0) {
      const significantOwners = application.businessOwners.filter(owner => 
        owner.ownershipPercentage !== undefined ? 
        owner.ownershipPercentage >= 20 : 
        (owner as any).ownership >= 20);
      
      if (significantOwners.length > 0) {
        primaryOwner = significantOwners.reduce((prev, current) => {
          const prevOwnership = prev.ownershipPercentage !== undefined ? 
            prev.ownershipPercentage : 
            (prev as any).ownership;
          const currentOwnership = current.ownershipPercentage !== undefined ? 
            current.ownershipPercentage : 
            (current as any).ownership;
          return (prevOwnership > currentOwnership) ? prev : current;
        });
      } else {
        primaryOwner = application.businessOwners[0];
      }
    }
    
    let ownerVerification = {
      isVerified: false,
      confidence: 0
    };
    
    if (primaryOwner) {
      ownerVerification = await verifyOwner(
        primaryOwner.name, 
        application.businessName,
        businessAddress
      );
    }
    
    // Calculate overall confidence as weighted average (company 60%, owner 40%)
    const overallConfidence = (companyVerification.confidence * 0.6) + 
                              (ownerVerification.confidence * 0.4);
    
    return {
      company: companyVerification,
      owner: ownerVerification,
      overallConfidence: overallConfidence
    };
  } catch (error) {
    console.error("Error in entity verification:", error);
    // Return fallback verification status
    return {
      company: {
        isVerified: false,
        confidence: 0.2,
        details: ["Verification failed due to technical issues"]
      },
      owner: {
        isVerified: false,
        confidence: 0.2,
        details: ["Verification failed due to technical issues"]
      },
      overallConfidence: 0.2
    };
  }
}

/**
 * Verify a company entity
 * @param businessName Company name to verify
 * @param industry The industry of the company
 * @param address The address of the company (optional)
 */
async function verifyCompany(businessName: string, industry: string, address?: string): Promise<{
  isVerified: boolean;
  confidence: number;
  source?: string;
  method?: string;
  details?: string[];
}> {
  try {
    const addressText = address ? `with address ${address}` : '';
    
    const prompt = `I need to verify the existence and identity of a business entity. 
    
Business Name: ${businessName}
Industry: ${industry}
${address ? `Address: ${address}` : ''}

Please analyze this information and determine:
1. The confidence level (0-1) that this is a real, existing business entity
2. What verification methods would be most appropriate
3. Key details that support or contradict the verification
4. Any discrepancies or red flags in the provided information

Return your response in JSON format like this:
{
  "isVerified": boolean,
  "confidence": number between 0 and 1,
  "source": "string describing verification methods used",
  "details": [array of strings with key verification points]
}

Only return the JSON object without any other text.`;

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      system: "You are an expert business verification system. Always approach verification requests thoroughly and skeptically. When verification can't be performed reliably, maintain low confidence scores. Output only valid JSON."
    });

    const responseText = response.content[0].text;
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      return {
        isVerified: result.isVerified || false,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        source: result.source,
        method: "AI-assisted verification",
        details: result.details || []
      };
    } catch (parseError) {
      console.error("Error parsing verification response:", parseError);
      // Return a fallback result if parsing fails
      return {
        isVerified: false,
        confidence: 0.3,
        method: "AI-assisted verification",
        details: ["Verification analysis produced invalid format"]
      };
    }
  } catch (error) {
    console.error("Error in company verification:", error);
    return {
      isVerified: false,
      confidence: 0.2,
      details: ["Verification process failed due to technical issues"]
    };
  }
}

/**
 * Verify an owner entity
 * @param ownerName Owner name to verify
 * @param businessName Associated business
 * @param address Business address (optional)
 */
async function verifyOwner(ownerName: string, businessName: string, address?: string): Promise<{
  isVerified: boolean;
  confidence: number;
  source?: string;
  method?: string;
  details?: string[];
}> {
  try {
    const addressText = address ? `located at ${address}` : '';
    
    const prompt = `I need to verify the existence and identity of a business owner.
    
Owner Name: ${ownerName}
Associated Business: ${businessName}
${address ? `Business Address: ${address}` : ''}

Please analyze this information and determine:
1. The confidence level (0-1) that this is a real person who owns/operates this business
2. What verification methods would be most appropriate
3. Key details that support or contradict the verification
4. Any discrepancies or red flags in the provided information

Return your response in JSON format like this:
{
  "isVerified": boolean,
  "confidence": number between 0 and 1,
  "source": "string describing verification methods used",
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

    const responseText = response.content[0].text;
    
    try {
      // Parse the response as JSON
      const result = JSON.parse(responseText);
      return {
        isVerified: result.isVerified || false,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        source: result.source,
        method: "AI-assisted verification",
        details: result.details || []
      };
    } catch (parseError) {
      console.error("Error parsing verification response:", parseError);
      // Return a fallback result if parsing fails
      return {
        isVerified: false,
        confidence: 0.3,
        method: "AI-assisted verification",
        details: ["Verification analysis produced invalid format"]
      };
    }
  } catch (error) {
    console.error("Error in owner verification:", error);
    return {
      isVerified: false,
      confidence: 0.2,
      details: ["Verification process failed due to technical issues"]
    };
  }
}

/**
 * Add verification details to the PDF report
 * @param doc The PDF document to add verification details to
 * @param verification The verification status data
 * @param businessName The name of the business
 */
export function addVerificationDetailsPage(
  doc: PDFKit.PDFDocument,
  verification: VerificationStatus,
  businessName: string
): void {
  // Start a new page if not at the beginning
  if (doc.y > 100) {
    doc.addPage();
  }
  
  // Define colors
  const colors = {
    primary: "#1e40af",
    secondary: "#6b7280",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    dark: "#111827",
    light: "#f3f4f6",
  };
  
  // Helper function to format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper to convert confidence to text
  const getConfidenceLevel = (confidence: number): string => {
    if (confidence >= 0.9) return "Very High";
    if (confidence >= 0.7) return "High";
    if (confidence >= 0.5) return "Moderate";
    if (confidence >= 0.3) return "Low";
    return "Very Low";
  };
  
  // Helper to get color based on confidence
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.7) return colors.success;
    if (confidence >= 0.4) return colors.warning;
    return colors.danger;
  };
  
  // Page Header
  doc.fontSize(24)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('ENTITY VERIFICATION REPORT', 50, 50, { align: 'center' })
     .moveDown(0.5);
  
  // Business Name
  doc.fontSize(16)
     .fillColor(colors.dark)
     .text(`Business: ${businessName}`, 50, doc.y, { align: 'center' })
     .moveDown(0.5);
  
  // Report Date
  doc.fontSize(12)
     .fillColor(colors.secondary)
     .text(`Verification Date: ${formatDate(new Date())}`, 50, doc.y, { align: 'center' })
     .moveDown(1.5);
  
  // Overall Verification Status
  doc.fontSize(14)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text('Overall Verification Status', 50, doc.y)
     .moveDown(0.5);
  
  const overallColor = getConfidenceColor(verification.overallConfidence);
  
  // Draw overall confidence circle
  const centerX = 100;
  let centerY = doc.y + 30;
  const radius = 35;
  
  doc.circle(centerX, centerY, radius)
     .fillAndStroke(overallColor, colors.primary);
  
  // Add confidence percentage text
  doc.fillColor('white')
     .fontSize(16)
     .font('Helvetica-Bold')
     .text(`${Math.round(verification.overallConfidence * 100)}%`, centerX - 20, centerY - 8, { width: 40, align: 'center' });
  
  // Overall Summary
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(
       `Overall verification confidence: ${getConfidenceLevel(verification.overallConfidence)}`,
       160, centerY - 25, { width: 350 }
     )
     .moveDown(0.2);
  
  let summaryText = "";
  if (verification.overallConfidence >= 0.7) {
    summaryText = "The entities in this application have been verified with high confidence using multiple reliable sources.";
  } else if (verification.overallConfidence >= 0.4) {
    summaryText = "The entities in this application have been partially verified, with some inconsistencies or limitations in available information.";
  } else {
    summaryText = "The entities in this application could not be verified with confidence. Further verification steps are strongly recommended.";
  }
  
  doc.text(summaryText, 160, doc.y, { width: 350 })
     .moveDown(2);
  
  // Company Verification Details
  if (verification.company) {
    doc.fontSize(14)
       .fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text('Company Verification', 50, doc.y)
       .moveDown(0.5);
    
    const companyColor = getConfidenceColor(verification.company.confidence);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(`Verification Status: ${verification.company.isVerified ? 'Verified' : 'Not Verified'}`, 50, doc.y)
       .moveDown(0.2);
    
    doc.text(`Confidence Level: ${getConfidenceLevel(verification.company.confidence)} (${Math.round(verification.company.confidence * 100)}%)`, 50, doc.y)
       .moveDown(0.2);
    
    if (verification.company.source) {
      doc.text(`Verification Source: ${verification.company.source}`, 50, doc.y)
         .moveDown(0.2);
    }
    
    if (verification.company.method) {
      doc.text(`Verification Method: ${verification.company.method}`, 50, doc.y)
         .moveDown(0.2);
    }
    
    // Company verification details
    if (verification.company.details && verification.company.details.length > 0) {
      doc.moveDown(0.5)
         .font('Helvetica-Bold')
         .text('Verification Details:', 50, doc.y)
         .moveDown(0.2)
         .font('Helvetica');
      
      verification.company.details.forEach((detail, index) => {
        doc.text(`${index + 1}. ${detail}`, 70, doc.y);
        doc.moveDown(0.2);
      });
    }
    
    doc.moveDown(1);
  }
  
  // Owner Verification Details
  if (verification.owner) {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }
    
    doc.fontSize(14)
       .fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text('Owner Verification', 50, doc.y)
       .moveDown(0.5);
    
    const ownerColor = getConfidenceColor(verification.owner.confidence);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(`Verification Status: ${verification.owner.isVerified ? 'Verified' : 'Not Verified'}`, 50, doc.y)
       .moveDown(0.2);
    
    doc.text(`Confidence Level: ${getConfidenceLevel(verification.owner.confidence)} (${Math.round(verification.owner.confidence * 100)}%)`, 50, doc.y)
       .moveDown(0.2);
    
    if (verification.owner.source) {
      doc.text(`Verification Source: ${verification.owner.source}`, 50, doc.y)
         .moveDown(0.2);
    }
    
    if (verification.owner.method) {
      doc.text(`Verification Method: ${verification.owner.method}`, 50, doc.y)
         .moveDown(0.2);
    }
    
    // Owner verification details
    if (verification.owner.details && verification.owner.details.length > 0) {
      doc.moveDown(0.5)
         .font('Helvetica-Bold')
         .text('Verification Details:', 50, doc.y)
         .moveDown(0.2)
         .font('Helvetica');
      
      verification.owner.details.forEach((detail, index) => {
        doc.text(`${index + 1}. ${detail}`, 70, doc.y);
        doc.moveDown(0.2);
      });
    }
  }
  
  // Footer with verification disclaimer
  const footerY = doc.page.height - 50;
  
  doc.fontSize(8)
     .fillColor(colors.secondary)
     .text(
       'IMPORTANT: This verification report is based on available information and should not be considered a guarantee of identity. Additional verification steps may be required for high-risk transactions.',
       50, footerY, { width: 500, align: 'center' }
     );
}