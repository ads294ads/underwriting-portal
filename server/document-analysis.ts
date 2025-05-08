import { LoanApplication } from "../shared/schema";
import PDFKit from "pdfkit";

// Types of documents we can analyze
export enum DocumentType {
  TAX_RETURN = "Tax Return",
  FINANCIAL_STATEMENT = "Financial Statement",
  BANK_STATEMENT = "Bank Statement",
  BUSINESS_PLAN = "Business Plan",
  CREDIT_REPORT = "Credit Report",
  CASH_FLOW_PROJECTION = "Cash Flow Projection",
  OTHER = "Other Document"
}

// Interface for the analysis result
export interface DocumentAnalysisResult {
  documentType: DocumentType;
  fileName: string;
  keyFindings: string[];
  financialMetrics: {
    [key: string]: {
      value: string | number;
      trend?: string;
      comparisonToIndustry?: string;
      impact: string;
    };
  };
  underwritingEvaluation: {
    strengths: string[];
    weaknesses: string[];
    risks: string[];
    mitigatingFactors: string[];
  };
  overallAssessment: string;
  impactOnScore: number; // 0-10 impact on the overall score
}

// Function to analyze document content
export async function analyzeDocument(
  fileContent: string,
  fileName: string,
  application: LoanApplication
): Promise<DocumentAnalysisResult> {
  try {
    // Determine document type from filename (in a real app, would use content)
    const documentType = determineDocumentType(fileName);
    
    console.log(`Analyzing document: ${fileName} (${documentType})`);
    
    // Create a prompt for Perplexity API based on the document type and content
    const prompt = generateDocumentAnalysisPrompt(fileContent, documentType, application);
    
    // Call Perplexity API for analysis
    const analysisResponse = await callPerplexityAPI(prompt);
    
    // Parse the response into a structured format
    return parseDocumentAnalysisResponse(analysisResponse, fileName, documentType);
    
  } catch (error) {
    console.error("Error analyzing document:", error);
    
    // Return a fallback analysis result
    return {
      documentType: DocumentType.OTHER,
      fileName: fileName,
      keyFindings: ["Document analysis could not be completed."],
      financialMetrics: {},
      underwritingEvaluation: {
        strengths: [],
        weaknesses: [],
        risks: ["Unable to analyze document content."],
        mitigatingFactors: []
      },
      overallAssessment: "Document analysis could not be completed. Please ensure the document is a valid financial document and try again.",
      impactOnScore: 0
    };
  }
}

// Determine document type from filename or content
function determineDocumentType(fileName: string): DocumentType {
  fileName = fileName.toLowerCase();
  
  if (fileName.includes("tax") || fileName.includes("1040") || fileName.includes("1120")) {
    return DocumentType.TAX_RETURN;
  } else if (fileName.includes("financial") || fileName.includes("income") || 
             fileName.includes("balance") || fileName.includes("statement") ||
             fileName.includes("p&l") || fileName.includes("profit")) {
    return DocumentType.FINANCIAL_STATEMENT;
  } else if (fileName.includes("bank") || fileName.includes("account") || 
             fileName.includes("checking") || fileName.includes("savings")) {
    return DocumentType.BANK_STATEMENT;
  } else if (fileName.includes("business") && fileName.includes("plan")) {
    return DocumentType.BUSINESS_PLAN;
  } else if (fileName.includes("credit") || fileName.includes("equifax") || 
             fileName.includes("experian") || fileName.includes("transunion")) {
    return DocumentType.CREDIT_REPORT;
  } else if (fileName.includes("cash") && (fileName.includes("flow") || fileName.includes("projection"))) {
    return DocumentType.CASH_FLOW_PROJECTION;
  } else {
    return DocumentType.OTHER;
  }
}

// Generate prompt for Perplexity based on document type
function generateDocumentAnalysisPrompt(content: string, documentType: DocumentType, application: LoanApplication): string {
  const businessContext = `
Business Name: ${application.businessName}
Industry: ${application.industry}
Years in Business: ${application.yearsInBusiness}
Annual Revenue: $${application.annualRevenue}
Loan Amount Requested: $${application.loanAmount}
  `;
  
  let prompt = `
I need you to analyze the following ${documentType} for a business loan application. The document belongs to ${application.businessName}, which is in the ${application.industry} industry, has been operating for ${application.yearsInBusiness} years, with annual revenue of $${application.annualRevenue}, and is requesting a loan of $${application.loanAmount}.

DOCUMENT CONTENT:
${content}

Please analyze this document as an expert underwriter for business loans and provide a comprehensive evaluation including:

1. Key financial findings from the document
2. Critical financial metrics with values, trends, and comparison to industry standards
3. Strengths and weaknesses from an underwriting perspective
4. Risks identified in the document
5. Mitigating factors that could offset the risks
6. Overall assessment of how this document impacts the loan application

Format your response as a structured JSON object with the following keys:
- keyFindings: array of strings identifying critical insights
- financialMetrics: object with metric name keys, each containing value, trend, comparisonToIndustry, and impact
- underwritingEvaluation: object with arrays for strengths, weaknesses, risks, mitigatingFactors
- overallAssessment: string with overall evaluation
- impactOnScore: number from 0-10 indicating how this should impact the loan score (10 is most positive)

Be specific, detailed, and base your analysis on actual numbers and content from the document.
`;

  // Add specialized instructions based on document type
  switch (documentType) {
    case DocumentType.TAX_RETURN:
      prompt += `
For tax returns specifically, focus on:
- Net income and effective tax rate
- Revenue growth year-over-year
- Business deductions and potential add-backs
- Owner's draw or distributions
- Any tax liens or payments due
- Schedule C analysis if applicable
`;
      break;
    case DocumentType.FINANCIAL_STATEMENT:
      prompt += `
For financial statements specifically, focus on:
- Profit margins (gross and net)
- Current ratio and quick ratio
- Debt-to-equity ratio
- Inventory turnover
- Accounts receivable aging
- Cash position
- Trends over reported periods
`;
      break;
    case DocumentType.BANK_STATEMENT:
      prompt += `
For bank statements specifically, focus on:
- Average daily balance
- Deposit frequency and consistency
- Overdrafts or NSF incidents
- Cash flow patterns
- Evidence of other debt payments
- Unusual large transactions
- Revenue verification compared to reported amounts
`;
      break;
    // Add specialized prompts for other document types
  }
  
  return prompt;
}

// Call Perplexity API
async function callPerplexityAPI(prompt: string): Promise<string> {
  try {
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
            content: "You are an expert financial analyst and loan underwriter with decades of experience evaluating business loan applications. You analyze financial documents to assess loan risk and creditworthiness. Provide detailed, structured analysis following underwriting standards for small to medium businesses."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2500
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling Perplexity API for document analysis:", error);
    throw error;
  }
}

// Parse API response into our format
function parseDocumentAnalysisResponse(response: string, fileName: string, documentType: DocumentType): DocumentAnalysisResult {
  try {
    // Parse the JSON response
    const parsed = JSON.parse(response);
    
    // Map to our structure
    return {
      documentType,
      fileName,
      keyFindings: parsed.keyFindings || [],
      financialMetrics: parsed.financialMetrics || {},
      underwritingEvaluation: {
        strengths: parsed.underwritingEvaluation?.strengths || [],
        weaknesses: parsed.underwritingEvaluation?.weaknesses || [],
        risks: parsed.underwritingEvaluation?.risks || [],
        mitigatingFactors: parsed.underwritingEvaluation?.mitigatingFactors || []
      },
      overallAssessment: parsed.overallAssessment || "No overall assessment provided.",
      impactOnScore: parsed.impactOnScore ? Math.min(Math.max(parsed.impactOnScore, 0), 10) : 5
    };
  } catch (error) {
    console.error("Error parsing document analysis response:", error);
    
    // Return a basic structure if parsing fails
    return {
      documentType,
      fileName,
      keyFindings: ["Analysis completed but response format was unexpected."],
      financialMetrics: {},
      underwritingEvaluation: {
        strengths: [],
        weaknesses: [],
        risks: ["Unable to parse detailed analysis."],
        mitigatingFactors: []
      },
      overallAssessment: "The document was analyzed but results cannot be structured properly. Please review the document manually.",
      impactOnScore: 0
    };
  }
}

// Function to combine multiple document analyses into a single assessment
export function combineDocumentAnalyses(analyses: DocumentAnalysisResult[]): {
  overallFindings: string[];
  overallImpact: number;
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
} {
  // If no analyses, return empty result
  if (!analyses || analyses.length === 0) {
    return {
      overallFindings: [],
      overallImpact: 0,
      strengthsAndWeaknesses: {
        strengths: [],
        weaknesses: []
      }
    };
  }
  
  // Combine key findings across all documents (deduplicate similar findings)
  const allFindings = new Set<string>();
  const allStrengths = new Set<string>();
  const allWeaknesses = new Set<string>();
  let totalImpact = 0;
  
  analyses.forEach(analysis => {
    // Add key findings
    analysis.keyFindings.forEach(finding => allFindings.add(finding));
    
    // Add strengths and weaknesses
    analysis.underwritingEvaluation.strengths.forEach(strength => allStrengths.add(strength));
    analysis.underwritingEvaluation.weaknesses.forEach(weakness => allWeaknesses.add(weakness));
    
    // Sum total impact on score
    totalImpact += analysis.impactOnScore;
  });
  
  // Normalize overall impact to 0-100 range
  // Max possible impact is 10 * number of documents, normalize to 0-100
  const normalizedImpact = Math.min(Math.round((totalImpact / (analyses.length * 10)) * 100), 100);
  
  return {
    overallFindings: Array.from(allFindings),
    overallImpact: normalizedImpact,
    strengthsAndWeaknesses: {
      strengths: Array.from(allStrengths),
      weaknesses: Array.from(allWeaknesses)
    }
  };
}

// Add document analysis pages to PDF report
export function addDocumentAnalysisPagesToPDF(
  doc: PDFKit.PDFDocument,
  analyses: DocumentAnalysisResult[],
  colors: Record<string, string>
): PDFKit.PDFDocument {
  if (!analyses || analyses.length === 0) {
    return doc;
  }
  
  // Create header function
  const drawSectionHeader = (text: string, y: number) => {
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(text, 50, y)
       .moveDown(0.5)
       .lineWidth(1)
       .strokeColor(colors.primary)
       .moveTo(50, doc.y)
       .lineTo(545, doc.y)
       .stroke()
       .moveDown(0.5);
    return doc.y;
  };
  
  // Add comprehensive document analysis section
  doc.addPage();
  
  // Page header
  doc.fontSize(18)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('DOCUMENT ANALYSIS & UNDERWRITING ASSESSMENT', 50, 50, { align: 'left' })
     .moveDown(1);
  
  // Summary of documents analyzed
  let yPos = drawSectionHeader('Documents Analyzed', doc.y);
  
  analyses.forEach((analysis, index) => {
    doc.fontSize(11)
       .fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text(`${index + 1}. ${analysis.documentType}`, 50, doc.y, { continued: true })
       .font('Helvetica')
       .text(` - ${analysis.fileName}`, { align: 'left' })
       .moveDown(0.5);
  });
  
  // Combine document analyses for an overall assessment
  const combinedAnalysis = combineDocumentAnalyses(analyses);
  
  doc.moveDown(1);
  yPos = drawSectionHeader('Key Financial Findings', doc.y);
  
  // List key findings
  combinedAnalysis.overallFindings.slice(0, 5).forEach((finding, index) => {
    doc.fontSize(11)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(`${index + 1}. `, 50, doc.y, { continued: true })
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(finding)
       .moveDown(0.5);
  });
  
  // Add strengths and weaknesses
  doc.moveDown(1);
  yPos = drawSectionHeader('Underwriting Assessment', doc.y);
  
  // Two-column layout for strengths and weaknesses
  const colWidth = 230;
  const colGap = 30;
  const leftCol = 50;
  const rightCol = leftCol + colWidth + colGap;
  
  // Strengths header (left column)
  doc.fontSize(14)
     .fillColor(colors.success)
     .font('Helvetica-Bold')
     .text('STRENGTHS', leftCol, yPos, { width: colWidth, align: 'left' });
  
  // Weaknesses header (right column)
  doc.fontSize(14)
     .fillColor(colors.danger)
     .font('Helvetica-Bold')
     .text('WEAKNESSES', rightCol, yPos, { width: colWidth, align: 'left' });
  
  doc.moveDown(0.7);
  const strengthsStartY = doc.y;
  
  // List strengths (left column)
  combinedAnalysis.strengthsAndWeaknesses.strengths.slice(0, 5).forEach((strength, index) => {
    doc.fontSize(10)
       .fillColor(colors.success)
       .font('Helvetica-Bold')
       .text(`${index + 1}. `, leftCol, doc.y, { continued: true })
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(strength, { width: colWidth - 20 })
       .moveDown(0.7);
  });
  
  // Reset Y position for weaknesses column
  doc.y = strengthsStartY;
  
  // List weaknesses (right column)
  combinedAnalysis.strengthsAndWeaknesses.weaknesses.slice(0, 5).forEach((weakness, index) => {
    doc.fontSize(10)
       .fillColor(colors.danger)
       .font('Helvetica-Bold')
       .text(`${index + 1}. `, rightCol, doc.y, { continued: true })
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(weakness, { width: colWidth - 20 })
       .moveDown(0.7);
  });
  
  // Reset Y position to the bottom of the longer column
  doc.moveDown(3);
  
  // Impact on score section
  yPos = drawSectionHeader('Impact on Loan Decision', doc.y);
  
  // Draw impact score visualization
  const impactScore = combinedAnalysis.overallImpact;
  const impactColor = impactScore >= 70 ? colors.success : 
                      impactScore >= 40 ? colors.warning : 
                      colors.danger;
  
  doc.fontSize(14)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text(`Document Assessment Impact: ${impactScore}/100`, 50, doc.y)
     .moveDown(0.5);
  
  // Impact score bar
  const barWidth = 400;
  const barHeight = 20;
  const impactWidth = Math.floor((impactScore / 100) * barWidth);
  
  // Draw background bar
  doc.rect(50, doc.y, barWidth, barHeight)
     .fillAndStroke('#e5e7eb', '#e5e7eb');
  
  // Draw impact portion
  doc.rect(50, doc.y, impactWidth, barHeight)
     .fillAndStroke(impactColor, impactColor);
  
  doc.moveDown(2);
  
  // Add individual document pages for detailed analysis
  analyses.forEach((analysis, index) => {
    // Add new page for each document if more than one
    if (index > 0 || analyses.length > 1) {
      doc.addPage();
    } else {
      doc.moveDown(3);
    }
    
    // Document header
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(`DETAILED ANALYSIS: ${analysis.documentType}`, 50, 50, { align: 'left' })
       .fontSize(12)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text(analysis.fileName, 50, doc.y, { align: 'left' })
       .moveDown(1.5);
    
    // Overall assessment
    yPos = drawSectionHeader('Overall Assessment', doc.y);
    
    doc.fontSize(11)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(analysis.overallAssessment, 50, yPos, { align: 'justify', width: 495 })
       .moveDown(1.5);
    
    // Financial metrics
    if (Object.keys(analysis.financialMetrics).length > 0) {
      yPos = drawSectionHeader('Financial Metrics', doc.y);
      
      // Create a table for financial metrics
      Object.entries(analysis.financialMetrics).forEach(([metricName, metricData], index) => {
        const rowEven = index % 2 === 0;
        const rowBg = rowEven ? '#f9fafb' : '#ffffff';
        
        // Draw row background
        doc.rect(50, doc.y, 495, 40)
           .fill(rowBg);
        
        // Metric name
        doc.fontSize(11)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text(metricName, 60, doc.y + 5, { width: 150 });
        
        // Metric value
        doc.fontSize(11)
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(`Value: ${metricData.value}`, 210, doc.y - 11, { width: 100 });
        
        // Trend and comparison if available
        let additionalInfo = '';
        if (metricData.trend) additionalInfo += `Trend: ${metricData.trend} `;
        if (metricData.comparisonToIndustry) additionalInfo += `Industry: ${metricData.comparisonToIndustry}`;
        
        if (additionalInfo) {
          doc.fontSize(10)
             .fillColor(colors.secondary)
             .text(additionalInfo, 320, doc.y - 11, { width: 220 });
        }
        
        // Impact
        let impactColor = colors.secondary;
        if (metricData.impact.toLowerCase().includes('positive')) impactColor = colors.success;
        if (metricData.impact.toLowerCase().includes('negative')) impactColor = colors.danger;
        
        doc.fontSize(10)
           .fillColor(impactColor)
           .text(metricData.impact, 320, doc.y + 5, { width: 220 });
        
        doc.moveDown(2.5);
      });
    }
    
    // Add strengths and weaknesses
    yPos = drawSectionHeader('Strengths & Weaknesses', doc.y);
    
    // Strengths list
    if (analysis.underwritingEvaluation.strengths.length > 0) {
      doc.fontSize(12)
         .fillColor(colors.success)
         .font('Helvetica-Bold')
         .text('Strengths:', 50, doc.y)
         .moveDown(0.5);
      
      analysis.underwritingEvaluation.strengths.forEach((strength, idx) => {
        doc.fontSize(10)
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(`• ${strength}`, 70, doc.y, { width: 475 })
           .moveDown(0.5);
      });
      
      doc.moveDown(0.5);
    }
    
    // Weaknesses list
    if (analysis.underwritingEvaluation.weaknesses.length > 0) {
      doc.fontSize(12)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text('Weaknesses:', 50, doc.y)
         .moveDown(0.5);
      
      analysis.underwritingEvaluation.weaknesses.forEach((weakness, idx) => {
        doc.fontSize(10)
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(`• ${weakness}`, 70, doc.y, { width: 475 })
           .moveDown(0.5);
      });
      
      doc.moveDown(0.5);
    }
    
    // Risks and mitigating factors in two columns
    if (analysis.underwritingEvaluation.risks.length > 0 || analysis.underwritingEvaluation.mitigatingFactors.length > 0) {
      yPos = drawSectionHeader('Risks & Mitigating Factors', doc.y);
      
      const riskStartY = doc.y;
      
      // Risks (left column)
      if (analysis.underwritingEvaluation.risks.length > 0) {
        doc.fontSize(12)
           .fillColor(colors.warning)
           .font('Helvetica-Bold')
           .text('Risks:', leftCol, doc.y)
           .moveDown(0.5);
        
        analysis.underwritingEvaluation.risks.forEach((risk, idx) => {
          doc.fontSize(10)
             .fillColor(colors.dark)
             .font('Helvetica')
             .text(`• ${risk}`, leftCol + 20, doc.y, { width: colWidth - 20 })
             .moveDown(0.5);
        });
      }
      
      // Reset Y position for right column
      doc.y = riskStartY;
      
      // Mitigating factors (right column)
      if (analysis.underwritingEvaluation.mitigatingFactors.length > 0) {
        doc.fontSize(12)
           .fillColor(colors.success)
           .font('Helvetica-Bold')
           .text('Mitigating Factors:', rightCol, doc.y)
           .moveDown(0.5);
        
        analysis.underwritingEvaluation.mitigatingFactors.forEach((factor, idx) => {
          doc.fontSize(10)
             .fillColor(colors.dark)
             .font('Helvetica')
             .text(`• ${factor}`, rightCol + 20, doc.y, { width: colWidth - 20 })
             .moveDown(0.5);
        });
      }
    }
    
    // Footer
    doc.fontSize(8)
       .fillColor(colors.secondary)
       .text('This analysis is based on the document provided and may be subject to limitations based on document quality and completeness.', 50, 740, { width: 495, align: 'center' });
  });
  
  return doc;
}