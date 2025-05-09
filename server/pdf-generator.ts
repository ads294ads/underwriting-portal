import PDFDocument from "pdfkit";
import { LoanApplication } from "../shared/schema";
import { DeepResearchResult } from "./deepsearch";

/**
 * Add Deep Research pages to the PDF report
 * @param doc PDFDocument to add pages to
 * @param application The loan application
 * @param deepResearchResults The deep research results
 * @param colors Color palette for styling
 */
export function addDeepResearchPages(
  doc: PDFKit.PDFDocument, 
  application: LoanApplication,
  deepResearchResults: DeepResearchResult,
  colors: Record<string, string>
) {
  // Add Deep Research - Company Analysis page
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('DEEP SEARCH - COMPANY ANALYSIS', 50, 50, { align: 'center' })
     .moveDown(0.5);
     
  // Subheader with explanation
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica-Oblique')
     .text('Comprehensive analysis of company background, legal issues, and financial red flags', 
            { align: 'center' })
     .moveDown(1.5);
  
  // Company overview section
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
  
  // Company Overview section
  let yPos = drawSectionHeader('Company Overview', doc.y);
  
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(deepResearchResults.companyAnalysis.overview || 'No company overview available.', 50, yPos, { width: 495, align: 'justify' })
     .moveDown(1.5);
  
  // Score section
  yPos = drawSectionHeader('Deep Research Score', doc.y);
  
  // Draw score indicator
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.warning;
    return colors.danger;
  };
  
  // Display company score
  const scoreColor = getScoreColor(deepResearchResults.companyAnalysis.score);
  doc.fontSize(14)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text(`Company Research Score: ${deepResearchResults.companyAnalysis.score}/100`, 50, yPos)
     .moveDown(0.5);
  
  // Add colored indicator
  doc.roundedRect(50, doc.y, 100, 30, 5)
     .fillAndStroke(scoreColor, scoreColor);
  
  doc.fillColor('white')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(deepResearchResults.grade, 50 + 40, doc.y - 22, { width: 20, align: 'center' })
     .moveDown(2);
  
  // Legal Issues section
  if (deepResearchResults.companyAnalysis.legalIssues && deepResearchResults.companyAnalysis.legalIssues.length > 0) {
    yPos = drawSectionHeader('Legal Issues Identified', doc.y);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica');
    
    deepResearchResults.companyAnalysis.legalIssues.forEach((issue, index) => {
      doc.fontSize(11)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(issue)
         .moveDown(0.5);
    });
    
    doc.moveDown(1);
  }
  
  // Financial Red Flags section
  if (deepResearchResults.companyAnalysis.financialRedFlags && deepResearchResults.companyAnalysis.financialRedFlags.length > 0) {
    yPos = drawSectionHeader('Financial Red Flags', doc.y);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica');
    
    deepResearchResults.companyAnalysis.financialRedFlags.forEach((flag, index) => {
      doc.fontSize(11)
         .fillColor(colors.warning)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(flag)
         .moveDown(0.5);
    });
    
    doc.moveDown(1);
  }
  
  // Reputation Insights section
  if (deepResearchResults.companyAnalysis.reputationInsights && deepResearchResults.companyAnalysis.reputationInsights.length > 0) {
    yPos = drawSectionHeader('Reputation Insights', doc.y);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica');
    
    deepResearchResults.companyAnalysis.reputationInsights.forEach((insight, index) => {
      const insightColor = insight.toLowerCase().includes('positive') ? colors.success : 
                           insight.toLowerCase().includes('negative') ? colors.danger : colors.secondary;
      
      doc.fontSize(11)
         .fillColor(insightColor)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(insight)
         .moveDown(0.5);
    });
    
    doc.moveDown(1);
  }
  
  // Add confidentiality notice at the bottom
  doc.fontSize(8)
     .fillColor(colors.secondary)
     .text('CONFIDENTIAL: This deep research analysis contains information gathered from public sources. The lender takes no responsibility for inaccuracies in the source data.', 50, 740, { width: 500, align: 'center' });
  
  // Add a second page for Owner Analysis
  doc.addPage();
  
  // Page header for Owner Analysis
  doc.fontSize(18)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('DEEP SEARCH - OWNER ANALYSIS', 50, 50, { align: 'left' })
     .moveDown(1);
  
  // Owner Overview section
  yPos = drawSectionHeader('Owner Overview', doc.y);
  
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(deepResearchResults.ownerAnalysis.overview || 'No owner overview available.', 50, yPos, { width: 495, align: 'justify' })
     .moveDown(1.5);
  
  // Score section for Owner
  yPos = drawSectionHeader('Owner Research Score', doc.y);
  
  // Display owner score
  const ownerScoreColor = getScoreColor(deepResearchResults.ownerAnalysis.score);
  doc.fontSize(14)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text(`Owner Research Score: ${deepResearchResults.ownerAnalysis.score}/100`, 50, yPos)
     .moveDown(0.5);
  
  // Add colored indicator for owner
  doc.roundedRect(50, doc.y, 100, 30, 5)
     .fillAndStroke(ownerScoreColor, ownerScoreColor);
  
  doc.fillColor('white')
     .fontSize(14)
     .font('Helvetica-Bold')
     .text(deepResearchResults.grade, 50 + 40, doc.y - 22, { width: 20, align: 'center' })
     .moveDown(2);
  
  // Legal Issues section for Owner
  if (deepResearchResults.ownerAnalysis.legalIssues && deepResearchResults.ownerAnalysis.legalIssues.length > 0) {
    yPos = drawSectionHeader('Legal Issues Identified', doc.y);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica');
    
    deepResearchResults.ownerAnalysis.legalIssues.forEach((issue, index) => {
      doc.fontSize(11)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(issue)
         .moveDown(0.5);
    });
    
    doc.moveDown(1);
  }
  
  // Financial Red Flags section for Owner
  if (deepResearchResults.ownerAnalysis.financialRedFlags && deepResearchResults.ownerAnalysis.financialRedFlags.length > 0) {
    yPos = drawSectionHeader('Financial Red Flags', doc.y);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica');
    
    deepResearchResults.ownerAnalysis.financialRedFlags.forEach((flag, index) => {
      doc.fontSize(11)
         .fillColor(colors.warning)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(flag)
         .moveDown(0.5);
    });
    
    doc.moveDown(1);
  }
  
  // Reputation Insights section for Owner
  if (deepResearchResults.ownerAnalysis.reputationInsights && deepResearchResults.ownerAnalysis.reputationInsights.length > 0) {
    yPos = drawSectionHeader('Reputation Insights', doc.y);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica');
    
    deepResearchResults.ownerAnalysis.reputationInsights.forEach((insight, index) => {
      const insightColor = insight.toLowerCase().includes('positive') ? colors.success : 
                           insight.toLowerCase().includes('negative') ? colors.danger : colors.secondary;
      
      doc.fontSize(11)
         .fillColor(insightColor)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(insight)
         .moveDown(0.5);
    });
    
    doc.moveDown(1);
  }
  
  // Add impact on loan decision section
  yPos = drawSectionHeader('Impact on Loan Decision', doc.y);
  
  // Determine impact text based on score
  let impactText = '';
  if (deepResearchResults.combinedScore >= 80) {
    impactText = `The deep research findings for ${application.businessName} and its owner indicate a low-risk profile. No significant legal or financial issues were identified that would negatively impact loan approval. The good reputation and clean record positively contribute to the overall assessment.`;
  } else if (deepResearchResults.combinedScore >= 60) {
    impactText = `The deep research findings for ${application.businessName} and its owner indicate a moderate-risk profile. While some minor concerns were identified, they do not significantly impact the loan decision. Close monitoring of the identified issues is recommended if the loan is approved.`;
  } else {
    impactText = `The deep research findings for ${application.businessName} and its owner indicate a high-risk profile. Significant legal and/or financial issues were identified that substantially impact the loan decision. Careful consideration and additional due diligence are strongly recommended before proceeding.`;
  }
  
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(impactText, 50, yPos, { width: 495, align: 'justify' });
  
  // Add confidentiality notice at the bottom of owner page
  doc.fontSize(8)
     .fillColor(colors.secondary)
     .text('CONFIDENTIAL: This deep research analysis contains information gathered from public sources. The lender takes no responsibility for inaccuracies in the source data.', 50, 740, { width: 500, align: 'center' });
    
  return doc;
}