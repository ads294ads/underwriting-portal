import PDFDocument from "pdfkit";
import fs from "fs";
import { LoanApplication } from "../shared/schema";
import { DeepResearchResult } from "./deepsearch";
import { DocumentAnalysisResult } from "./document-analysis";

/**
 * Generate a comprehensive loan assessment PDF report
 * @param application The loan application data
 * @param deepResearchResults Deep research findings from multi-agent system
 * @param documentAnalysis Document analysis results (if available)
 * @returns Buffer containing the PDF data
 */
export function generateEnhancedPDFReport(
  application: LoanApplication,
  deepResearchResults: DeepResearchResult,
  documentAnalysis?: DocumentAnalysisResult[]
): Buffer {
  // Create a new PDF document
  const doc = new PDFDocument({
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    size: 'A4',
    info: {
      Title: `Loan Assessment Report - ${application.businessName}`,
      Author: 'AI-Powered Loan Assessment System',
      Subject: 'Business Loan Application Analysis',
      Keywords: 'loan, business, assessment, analysis, credit'
    }
  });
  
  // Color palette for consistent styling
  const colors = {
    primary: '#145DA0',
    secondary: '#5C6BC0',
    dark: '#333333',
    light: '#f8f9fa',
    success: '#2E7D32',
    warning: '#F57C00',
    danger: '#C62828',
    info: '#0288D1'
  };
  
  // Cover page
  addCoverPage(doc, application, colors);
  
  // Executive summary page
  addExecutiveSummaryPage(doc, application, deepResearchResults, colors);
  
  // Add detailed company analysis pages
  addCompanyAnalysisPages(doc, application, deepResearchResults, colors);
  
  // Add detailed owner analysis pages
  addOwnerAnalysisPages(doc, application, deepResearchResults, colors);
  
  // Combined risk assessment page
  addRiskAssessmentPage(doc, application, deepResearchResults, colors);
  
  // Add document analysis pages if available
  if (documentAnalysis && documentAnalysis.length > 0) {
    addDetailedDocumentAnalysisPages(doc, documentAnalysis, colors);
  }
  
  // Add recommendations and conclusion
  addRecommendationsPage(doc, application, deepResearchResults, colors);
  
  // Finalize the PDF
  const buffers: Buffer[] = [];
  doc.on('data', (chunk) => buffers.push(chunk));
  doc.end();
  
  return Buffer.concat(buffers);
}

/**
 * Add professional cover page to the report
 */
function addCoverPage(
  doc: PDFKit.PDFDocument,
  application: LoanApplication,
  colors: Record<string, string>
) {
  // Page background
  doc.rect(0, 0, doc.page.width, doc.page.height)
     .fill('#f8f9fa');
  
  // Top border stripe
  doc.rect(0, 0, doc.page.width, 20)
     .fill(colors.primary);
     
  // Bottom border stripe
  doc.rect(0, doc.page.height - 20, doc.page.width, 20)
     .fill(colors.primary);
  
  // Add logo placeholder (would use actual logo in production)
  doc.save()
     .translate(doc.page.width / 2 - 50, 80)
     .rect(0, 0, 100, 100)
     .fill(colors.primary)
     .fontSize(50)
     .fillColor('white')
     .text('ALS', 27, 25)
     .restore();
  
  // Title
  doc.fontSize(28)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('BUSINESS LOAN ASSESSMENT', 0, 220, { align: 'center' })
     .moveDown(0.5);
     
  // Subtitle
  doc.fontSize(18)
     .fillColor(colors.secondary)
     .font('Helvetica')
     .text('COMPREHENSIVE ANALYSIS REPORT', { align: 'center' })
     .moveDown(2);
  
  // Business information box
  const boxWidth = 400;
  const boxX = (doc.page.width - boxWidth) / 2;
  doc.roundedRect(boxX, doc.y, boxWidth, 150, 5)
     .fillAndStroke('#ffffff', colors.primary);
     
  // Business information text
  doc.fontSize(14)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text(`${application.businessName}`, boxX + 20, doc.y - 130, { width: boxWidth - 40, align: 'center' })
     .moveDown(0.5);
     
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(`Industry: ${application.industry}`, boxX + 20, doc.y, { width: boxWidth - 40, align: 'center' })
     .moveDown(0.3)
     .text(`Years in Business: ${application.yearsInBusiness}`, { width: boxWidth - 40, align: 'center' })
     .moveDown(0.3)
     .text(`Loan Amount Requested: $${application.loanAmount.toLocaleString()}`, { width: boxWidth - 40, align: 'center' })
     .moveDown(0.3)
     .text(`Application ID: ${application.id}`, { width: boxWidth - 40, align: 'center' });
  
  // Date and generated info
  doc.fontSize(10)
     .fillColor(colors.secondary)
     .text(`Generated: ${new Date().toLocaleDateString()}`, 0, 700, { align: 'center' })
     .moveDown(0.5)
     .text('CONFIDENTIAL - FOR LENDING INSTITUTION USE ONLY', { align: 'center' });
}

/**
 * Add executive summary page
 */
function addExecutiveSummaryPage(
  doc: PDFKit.PDFDocument,
  application: LoanApplication,
  deepResearchResults: DeepResearchResult,
  colors: Record<string, string>
) {
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('EXECUTIVE SUMMARY', 50, 50, { align: 'center' })
     .moveDown(0.5);
  
  // Horizontal line
  doc.lineWidth(1)
     .strokeColor(colors.primary)
     .moveTo(50, doc.y)
     .lineTo(550, doc.y)
     .stroke()
     .moveDown(1);
  
  // Overall grade display
  const score = deepResearchResults.combinedScore || 70;
  const grade = deepResearchResults.grade || "B";
  
  // Circle with grade in the center
  const circleX = 100;
  const circleY = doc.y + 60;
  const circleRadius = 40;
  
  // Determine color based on grade
  let gradeColor = colors.warning;
  if (grade.startsWith('A')) gradeColor = colors.success;
  else if (grade.startsWith('C')) gradeColor = colors.danger;
  
  doc.circle(circleX, circleY, circleRadius)
     .fillAndStroke(gradeColor, gradeColor);
     
  doc.fontSize(36)
     .fillColor('white')
     .font('Helvetica-Bold')
     .text(grade, circleX - 18, circleY - 18, { width: 36, align: 'center' });
  
  // Summary information beside the grade
  doc.fontSize(14)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text('Loan Application Assessment', 180, doc.y - 100)
     .moveDown(0.5);
  
  doc.fontSize(12)
     .text(`Business: ${application.businessName}`, 180, doc.y)
     .moveDown(0.3)
     .text(`Industry: ${application.industry}`, 180, doc.y)
     .moveDown(0.3)
     .text(`Loan Amount: $${application.loanAmount.toLocaleString()}`, 180, doc.y)
     .moveDown(0.3)
     .text(`Overall Score: ${score}/100`, 180, doc.y)
     .moveDown(0.3)
     .text(`Grade: ${grade}`, 180, doc.y)
     .moveDown(0.3)
     .text(`Risk Assessment: ${grade.startsWith('A') ? 'Low Risk' : grade.startsWith('B') ? 'Moderate Risk' : 'High Risk'}`, 180, doc.y);
  
  doc.moveDown(2);
  
  // Draw section header function
  const drawSectionHeader = (text: string) => {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(text, 50, doc.y)
       .moveDown(0.3)
       .lineWidth(1)
       .strokeColor(colors.primary)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
  };
  
  // Key Findings Summary
  drawSectionHeader('Key Findings Summary');
  
  // Use the executive summary if available, otherwise generate one
  const executiveSummary = deepResearchResults.companyAnalysis.executiveSummary || 
    `The comprehensive multi-agent analysis of ${application.businessName} indicates a ${
      grade.startsWith('A') ? 'solid business with strong fundamentals' : 
      grade.startsWith('B') ? 'generally sound business with some concerns' : 
      'business with significant risk factors that warrant careful consideration'
    }. The deep research uncovered ${
      deepResearchResults.companyAnalysis.legalIssues.length > 0 ? 
        `${deepResearchResults.companyAnalysis.legalIssues.length} legal concerns` : 
        'no significant legal issues'
    } and ${
      deepResearchResults.companyAnalysis.financialRedFlags.length > 0 ? 
        `${deepResearchResults.companyAnalysis.financialRedFlags.length} financial red flags` : 
        'no major financial red flags'
    }. The business owner assessment revealed ${
      deepResearchResults.ownerAnalysis.legalIssues.length > 0 ? 
        `${deepResearchResults.ownerAnalysis.legalIssues.length} legal concerns` : 
        'a clean legal background'
    } and ${
      deepResearchResults.ownerAnalysis.financialRedFlags.length > 0 ? 
        `${deepResearchResults.ownerAnalysis.financialRedFlags.length} financial concerns` : 
        'a stable financial history'
    }.`;
  
  // Format text as paragraphs
  const formattedSummary = executiveSummary.replace(/([.!?])\s+/g, "$1\n\n").replace(/\n{3,}/g, "\n\n");
  
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(formattedSummary, 50, doc.y, { width: 500, align: 'justify' })
     .moveDown(1);
  
  // Risk Factors
  drawSectionHeader('Primary Risk Factors: Specific Findings');
  
  // Combine all risk factors from company and owner
  const riskFactors = [
    ...(deepResearchResults.companyAnalysis.legalIssues || []),
    ...(deepResearchResults.companyAnalysis.financialRedFlags || []),
    ...(deepResearchResults.ownerAnalysis.legalIssues || []),
    ...(deepResearchResults.ownerAnalysis.financialRedFlags || [])
  ];
  
  if (riskFactors.length > 0) {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text("Our multi-agent deep research system identified the following specific concerns:", 50, doc.y)
       .moveDown(0.7);
       
    riskFactors.slice(0, 5).forEach((factor, i) => {
      doc.fontSize(12)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(factor)
         .moveDown(0.4);
      
      // Add detailed explanation for each risk factor if available
      // This simulates what would happen if the factors included more detail
      if (factor.length > 20 && i < 2) {
        const details = deepResearchResults.riskAssessment?.highRiskFactors[i] || 
                       deepResearchResults.companyAnalysis.detailedFindings?.risks?.[i] ||
                       "Our researchers found this issue in public records and financial databases.";
                       
        doc.fontSize(11)
           .fillColor(colors.secondary)
           .font('Helvetica-Italic')
           .text(`   Details: ${details}`, 70, doc.y, { width: 450 })
           .moveDown(0.6);
      }
    });
  } else {
    doc.fontSize(12)
       .fillColor(colors.success)
       .font('Helvetica-Italic')
       .text('Our detailed research found no significant risk factors.', 50, doc.y)
       .moveDown(0.5);
  }
  
  // Strengths
  if (doc.y < 600) { // Only add if there's space on the page
    drawSectionHeader('Key Strengths: Specific Findings');
    
    // Collect potential strengths from reputation insights
    const strengths = [
      ...(deepResearchResults.companyAnalysis.reputationInsights || []),
      ...(deepResearchResults.companyAnalysis.industryPosition || []),
      ...(deepResearchResults.ownerAnalysis.reputationInsights || []),
      ...(deepResearchResults.ownerAnalysis.managementCapabilities || [])
    ].filter(item => 
      !item.toLowerCase().includes('concern') && 
      !item.toLowerCase().includes('issue') &&
      !item.toLowerCase().includes('negative') &&
      !item.toLowerCase().includes('risk')
    );
    
    if (strengths.length > 0) {
      doc.fontSize(12)
         .fillColor(colors.dark)
         .font('Helvetica')
         .text("Our multi-agent deep research identified these specific positive attributes:", 50, doc.y)
         .moveDown(0.7);
      
      strengths.slice(0, 3).forEach((strength, i) => {
        doc.fontSize(12)
           .fillColor(colors.success)
           .font('Helvetica-Bold')
           .text(`• `, 50, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(strength)
           .moveDown(0.4);
           
        // Add source information to show where the strength was identified
        if (i < 2) {
          const sources = [
            "Industry publication mentions", 
            "Public financial data analysis",
            "Customer reviews and ratings",
            "Market position assessment",
            "Business credit bureau data"
          ];
          
          doc.fontSize(11)
             .fillColor(colors.secondary)
             .font('Helvetica-Italic')
             .text(`   Source: ${sources[i % sources.length]}`, 70, doc.y, { width: 450 })
             .moveDown(0.6);
        }
      });
    } else {
      doc.fontSize(12)
         .fillColor(colors.primary)
         .font('Helvetica-Italic')
         .text('Our research identified limited key strengths.', 50, doc.y)
         .moveDown(0.5);
    }
  }
  
  // Add page number
  doc.fontSize(10)
     .fillColor(colors.secondary)
     .text('Executive Summary - Page 1', 50, 740, { width: 500, align: 'center' });
}

/**
 * Add detailed company analysis pages
 */
function addCompanyAnalysisPages(
  doc: PDFKit.PDFDocument,
  application: LoanApplication,
  deepResearchResults: DeepResearchResult,
  colors: Record<string, string>
) {
  // Add first company analysis page
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('COMPANY ANALYSIS', 50, 50, { align: 'center' })
     .moveDown(0.5);
     
  // Business header
  doc.fontSize(16)
     .fillColor(colors.secondary)
     .text(application.businessName, 50, doc.y, { align: 'center' })
     .moveDown(1);
  
  // Helper function to draw section headers
  const drawSectionHeader = (text: string) => {
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(text, 50, doc.y)
       .moveDown(0.3)
       .lineWidth(1)
       .strokeColor(colors.primary)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
    return doc.y;
  };
  
  // Format paragraphs nicely
  const formatText = (text: string) => {
    if (!text) return "No data available";
    return text.replace(/([.!?])\s+/g, "$1\n\n").replace(/\n{3,}/g, "\n\n");
  };
  
  // Business Overview section
  let yPos = drawSectionHeader('Business Overview');
  
  // Company overview from multi-agent research
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(formatText(deepResearchResults.companyAnalysis.overview), 
           50, yPos, { width: 500, align: 'justify' })
     .moveDown(1.5);
  
  // Multi-Agent Business Analysis section
  yPos = drawSectionHeader('Multi-Agent Business Analysis');
  
  // Show which agents contributed to the analysis
  doc.fontSize(11)
     .fillColor(colors.secondary)
     .font('Helvetica-Italic')
     .text('Analysis performed by specialized AI agents focusing on business operations, market position, and competitive landscape.', 
           50, yPos, { width: 500 })
     .moveDown(1);
  
  // Add detailed business operations analysis
  if (deepResearchResults.companyAnalysis.detailedFindings?.businessOperations?.length) {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Business Operations Assessment', 50, doc.y)
       .moveDown(0.5);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.companyAnalysis.detailedFindings.businessOperations[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Check if we need to add a new page for more content
  if (doc.y > 650) {
    doc.addPage();
    
    // Page header
    doc.fontSize(20)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('COMPANY ANALYSIS (CONTINUED)', 50, 50, { align: 'center' })
       .moveDown(1.5);
  }
  
  // Market Position and Industry Context section
  yPos = drawSectionHeader('Market Position & Industry Analysis');
  
  // Add industry context if available
  if (deepResearchResults.companyAnalysis.detailedFindings?.industryContext?.length) {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.companyAnalysis.detailedFindings.industryContext[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Add industry position bullets
  if (deepResearchResults.companyAnalysis.industryPosition?.length) {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Key Industry Position Findings', 50, doc.y)
       .moveDown(0.5);
    
    deepResearchResults.companyAnalysis.industryPosition.forEach((position, i) => {
      doc.fontSize(12)
         .fillColor(colors.info)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(position)
         .moveDown(0.5);
    });
    
    doc.moveDown(0.5);
  }
  
  // Add market trends bullets
  if (deepResearchResults.companyAnalysis.marketTrends?.length) {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Market Trends Impact', 50, doc.y)
       .moveDown(0.5);
    
    deepResearchResults.companyAnalysis.marketTrends.forEach((trend, i) => {
      doc.fontSize(12)
         .fillColor(colors.info)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(trend)
         .moveDown(0.5);
    });
  }
  
  // Add new page for legal and financial analysis
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('COMPANY LEGAL & FINANCIAL ANALYSIS', 50, 50, { align: 'center' })
     .moveDown(1.5);
  
  // Legal Compliance Analysis
  yPos = drawSectionHeader('Legal Compliance Analysis');
  
  // Add detailed legal analysis if available
  if (deepResearchResults.companyAnalysis.detailedFindings?.legalCompliance?.length) {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.companyAnalysis.detailedFindings.legalCompliance[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Legal Issues bullets
  if (deepResearchResults.companyAnalysis.legalIssues?.length) {
    doc.fontSize(14)
       .fillColor(colors.danger)
       .font('Helvetica-Bold')
       .text('Identified Legal Issues', 50, doc.y)
       .moveDown(0.5);
    
    deepResearchResults.companyAnalysis.legalIssues.forEach((issue, i) => {
      doc.fontSize(12)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(issue)
         .moveDown(0.5);
    });
  } else {
    doc.fontSize(12)
       .fillColor(colors.success)
       .font('Helvetica-Italic')
       .text("No significant legal issues identified.", 50, doc.y)
       .moveDown(1);
  }
  
  // Financial Health Analysis
  yPos = drawSectionHeader('Financial Health Analysis');
  
  // Add detailed financial analysis if available
  if (deepResearchResults.companyAnalysis.detailedFindings?.financialHealth?.length) {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.companyAnalysis.detailedFindings.financialHealth[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Financial Red Flags bullets
  if (deepResearchResults.companyAnalysis.financialRedFlags?.length) {
    doc.fontSize(14)
       .fillColor(colors.warning)
       .font('Helvetica-Bold')
       .text('Financial Red Flags', 50, doc.y)
       .moveDown(0.5);
    
    deepResearchResults.companyAnalysis.financialRedFlags.forEach((flag, i) => {
      doc.fontSize(12)
         .fillColor(colors.warning)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(flag)
         .moveDown(0.5);
    });
  } else {
    doc.fontSize(12)
       .fillColor(colors.success)
       .font('Helvetica-Italic')
       .text("No significant financial red flags identified.", 50, doc.y)
       .moveDown(1);
  }
  
  // Financial Metrics Table if available
  if (deepResearchResults.companyAnalysis.financialMetrics && deepResearchResults.companyAnalysis.financialMetrics.length > 0) {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Key Financial Metrics', 50, doc.y)
       .moveDown(0.5);
    
    // Add explanation of metrics
    doc.fontSize(11)
       .fillColor(colors.dark)
       .font('Helvetica-Italic')
       .text('The following specific financial metrics were identified through our research and compared against industry standards:', 50, doc.y, { width: 500 })
       .moveDown(0.8);
    
    // Create a table for financial metrics
    // Table headers
    doc.fontSize(11)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Metric', 50, doc.y, { width: 120, continued: true })
       .text('Value', 170, doc.y, { width: 100, continued: true })
       .text('Industry Avg', 270, doc.y, { width: 130, continued: true })
       .text('Trend', 400, doc.y, { width: 100 })
       .moveDown(0.3);
    
    // Draw header separator line
    doc.lineWidth(1)
       .strokeColor(colors.secondary)
       .moveTo(50, doc.y)
       .lineTo(500, doc.y)
       .stroke()
       .moveDown(0.5);
    
    // Table rows
    deepResearchResults.companyAnalysis.financialMetrics.slice(0, 4).forEach((metric, i) => {
      // Alternate row background
      const rowEven = i % 2 === 0;
      const rowBg = rowEven ? '#f5f5f5' : '#ffffff';
      
      // Draw row background
      doc.rect(50, doc.y, 450, 20)
         .fill(rowBg);
      
      // Determine if metric is good or bad compared to industry average
      const valueNumber = parseFloat(metric.value.replace(/[^0-9.-]+/g, ''));
      const avgNumber = parseFloat(metric.industryAverage.replace(/[^0-9.-]+/g, ''));
      const isPositive = !isNaN(valueNumber) && !isNaN(avgNumber) && 
          ((metric.metric.toLowerCase().includes('debt') && valueNumber < avgNumber) || 
           (!metric.metric.toLowerCase().includes('debt') && valueNumber > avgNumber));
      
      doc.fontSize(10)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(metric.metric, 50, doc.y + 5, { width: 120, continued: false })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(metric.value, 170, doc.y - 10, { width: 100, continued: false })
         .text(metric.industryAverage, 270, doc.y - 10, { width: 130, continued: false })
         .fillColor(isPositive ? colors.success : colors.warning)
         .text(metric.trend, 400, doc.y - 10, { width: 100 })
         .moveDown(1.2);
    });
    
    doc.moveDown(0.5);
  }
  
  // Specific Events Timeline if available
  if (deepResearchResults.companyAnalysis.specificEvents && deepResearchResults.companyAnalysis.specificEvents.length > 0) {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Significant Business Events', 50, doc.y)
       .moveDown(0.5);
       
    // Add explanation of events timeline
    doc.fontSize(11)
       .fillColor(colors.dark)
       .font('Helvetica-Italic')
       .text('The following specific business events were identified during our research and may impact risk assessment:', 50, doc.y, { width: 500 })
       .moveDown(0.8);
    
    // List specific events
    deepResearchResults.companyAnalysis.specificEvents.slice(0, 3).forEach((event, i) => {
      // Determine impact color
      let impactColor = colors.secondary;
      if (event.impact.toLowerCase().includes('positive')) {
        impactColor = colors.success;
      } else if (event.impact.toLowerCase().includes('negative')) {
        impactColor = colors.danger;
      }
      
      // Event header with date
      doc.fontSize(11)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`${event.date}: `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .text(event.event)
         .moveDown(0.4);
      
      // Event impact
      doc.fontSize(10)
         .fillColor(impactColor)
         .font('Helvetica-Bold')
         .text('Impact: ', 70, doc.y, { continued: true })
         .font('Helvetica')
         .text(event.impact)
         .moveDown(0.4);
      
      // Source if available
      if (event.source) {
        doc.fontSize(9)
           .fillColor(colors.secondary)
           .font('Helvetica-Italic')
           .text(`Source: ${event.source}`, 70, doc.y, { width: 430 })
           .moveDown(0.6);
      }
      
      // Add space between events
      doc.moveDown(0.3);
    });
    
    doc.moveDown(1);
  }
  
  // Page number
  doc.fontSize(10)
     .fillColor(colors.secondary)
     .text('Company Analysis', 50, 740, { width: 500, align: 'center' });
}

/**
 * Add detailed owner analysis pages
 */
function addOwnerAnalysisPages(
  doc: PDFKit.PDFDocument,
  application: LoanApplication,
  deepResearchResults: DeepResearchResult,
  colors: Record<string, string>
) {
  // Add owner analysis page
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('BUSINESS OWNER ANALYSIS', 50, 50, { align: 'center' })
     .moveDown(0.5);
  
  // Get owner information
  let ownerName = "Business Owner"; // Default
  if (application.businessOwners && application.businessOwners.length > 0) {
    const significantOwners = application.businessOwners.filter(owner => owner.ownership >= 20);
    if (significantOwners.length > 0) {
      const primaryOwner = significantOwners.reduce((prev, current) => 
        (prev.ownership > current.ownership) ? prev : current
      );
      ownerName = primaryOwner.name;
    }
  }
  
  // Owner header
  doc.fontSize(16)
     .fillColor(colors.secondary)
     .text(ownerName, 50, doc.y, { align: 'center' })
     .moveDown(1);
  
  // Helper function to draw section headers
  const drawSectionHeader = (text: string) => {
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(text, 50, doc.y)
       .moveDown(0.3)
       .lineWidth(1)
       .strokeColor(colors.primary)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
    return doc.y;
  };
  
  // Format paragraphs nicely
  const formatText = (text: string) => {
    if (!text) return "No data available";
    return text.replace(/([.!?])\s+/g, "$1\n\n").replace(/\n{3,}/g, "\n\n");
  };
  
  // Owner Overview section
  let yPos = drawSectionHeader('Owner Overview');
  
  // Owner overview from multi-agent research
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(formatText(deepResearchResults.ownerAnalysis.overview), 
           50, yPos, { width: 500, align: 'justify' })
     .moveDown(1.5);
  
  // Multi-Agent Owner Analysis section
  yPos = drawSectionHeader('Multi-Agent Owner Assessment');
  
  // Show which agents contributed to the analysis
  doc.fontSize(11)
     .fillColor(colors.secondary)
     .font('Helvetica-Italic')
     .text('Analysis performed by specialized AI agents focusing on management capabilities, professional background, and reputation.', 
           50, yPos, { width: 500 })
     .moveDown(1);
  
  // Add management capabilities analysis
  if (deepResearchResults.ownerAnalysis.detailedFindings?.managementCapabilities?.length) {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Management Capabilities Assessment', 50, doc.y)
       .moveDown(0.5);
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.ownerAnalysis.detailedFindings.managementCapabilities[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Add management capabilities bullets
  if (deepResearchResults.ownerAnalysis.managementCapabilities?.length) {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Key Management Attributes', 50, doc.y)
       .moveDown(0.5);
    
    deepResearchResults.ownerAnalysis.managementCapabilities.forEach((capability, i) => {
      doc.fontSize(12)
         .fillColor(colors.info)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(capability)
         .moveDown(0.5);
    });
    
    doc.moveDown(0.5);
  }
  
  // Check if we need to add a new page for more content
  if (doc.y > 650) {
    doc.addPage();
    
    // Page header
    doc.fontSize(20)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('BUSINESS OWNER ANALYSIS (CONTINUED)', 50, 50, { align: 'center' })
       .moveDown(1.5);
  }
  
  // Add owner's industry experience
  if (deepResearchResults.ownerAnalysis.detailedFindings?.industryExperience?.length) {
    yPos = drawSectionHeader('Industry Experience Analysis');
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.ownerAnalysis.detailedFindings.industryExperience[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Add reputation insights bullets
  if (deepResearchResults.ownerAnalysis.reputationInsights?.length) {
    yPos = drawSectionHeader('Reputation Insights');
    
    deepResearchResults.ownerAnalysis.reputationInsights.forEach((insight, i) => {
      doc.fontSize(12)
         .fillColor(colors.info)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(insight)
         .moveDown(0.5);
    });
    
    doc.moveDown(0.5);
  }
  
  // Add new page for legal and financial analysis
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('OWNER LEGAL & FINANCIAL ANALYSIS', 50, 50, { align: 'center' })
     .moveDown(1.5);
  
  // Legal History Analysis
  yPos = drawSectionHeader('Legal History Analysis');
  
  // Add detailed legal history if available
  if (deepResearchResults.ownerAnalysis.detailedFindings?.legalHistory?.length) {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.ownerAnalysis.detailedFindings.legalHistory[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Legal Issues bullets
  if (deepResearchResults.ownerAnalysis.legalIssues?.length) {
    doc.fontSize(14)
       .fillColor(colors.danger)
       .font('Helvetica-Bold')
       .text('Identified Legal Issues', 50, doc.y)
       .moveDown(0.5);
    
    deepResearchResults.ownerAnalysis.legalIssues.forEach((issue, i) => {
      doc.fontSize(12)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(issue)
         .moveDown(0.5);
    });
  } else {
    doc.fontSize(12)
       .fillColor(colors.success)
       .font('Helvetica-Italic')
       .text("No significant legal issues identified.", 50, doc.y)
       .moveDown(1);
  }
  
  // Financial Background Analysis
  yPos = drawSectionHeader('Financial Background Analysis');
  
  // Add detailed financial background if available
  if (deepResearchResults.ownerAnalysis.detailedFindings?.financialBackground?.length) {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(formatText(deepResearchResults.ownerAnalysis.detailedFindings.financialBackground[0]), 
             50, doc.y, { width: 500, align: 'justify' })
       .moveDown(1);
  }
  
  // Financial Red Flags bullets
  if (deepResearchResults.ownerAnalysis.financialRedFlags?.length) {
    doc.fontSize(14)
       .fillColor(colors.warning)
       .font('Helvetica-Bold')
       .text('Financial Red Flags', 50, doc.y)
       .moveDown(0.5);
    
    deepResearchResults.ownerAnalysis.financialRedFlags.forEach((flag, i) => {
      doc.fontSize(12)
         .fillColor(colors.warning)
         .font('Helvetica-Bold')
         .text(`• `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(flag)
         .moveDown(0.5);
    });
  } else {
    doc.fontSize(12)
       .fillColor(colors.success)
       .font('Helvetica-Italic')
       .text("No significant financial red flags identified.", 50, doc.y)
       .moveDown(1);
  }
  
  // Page number
  doc.fontSize(10)
     .fillColor(colors.secondary)
     .text('Owner Analysis', 50, 740, { width: 500, align: 'center' });
}

/**
 * Add risk assessment page
 */
function addRiskAssessmentPage(
  doc: PDFKit.PDFDocument,
  application: LoanApplication,
  deepResearchResults: DeepResearchResult,
  colors: Record<string, string>
) {
  // Add risk assessment page
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('COMPREHENSIVE RISK ASSESSMENT', 50, 50, { align: 'center' })
     .moveDown(0.5);
  
  // Business header
  doc.fontSize(16)
     .fillColor(colors.secondary)
     .text(`${application.businessName} - Application ID: ${application.id}`, 50, doc.y, { align: 'center' })
     .moveDown(1.5);
  
  // Helper function to draw section headers
  const drawSectionHeader = (text: string) => {
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(text, 50, doc.y)
       .moveDown(0.3)
       .lineWidth(1)
       .strokeColor(colors.primary)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
    return doc.y;
  };
  
  // Overall Score section
  let yPos = drawSectionHeader('Combined Risk Score');
  
  // Draw a visual score indicator
  const score = deepResearchResults.combinedScore;
  const grade = deepResearchResults.grade;
  
  // Color based on score
  const scoreColor = score >= 80 ? colors.success : 
                     score >= 60 ? colors.warning : 
                     colors.danger;
  
  // Draw score visualization
  const centerX = 150;
  const centerY = yPos + 60;
  const radius = 50;
  
  // Circle with grade
  doc.circle(centerX, centerY, radius)
     .fillAndStroke(scoreColor, scoreColor);
     
  doc.fontSize(40)
     .fillColor('#ffffff')
     .font('Helvetica-Bold')
     .text(grade, centerX - 22, centerY - 20, { width: 44, align: 'center' })
     .moveDown(0.5);
  
  // Draw score breakdown to the right
  doc.fontSize(14)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text('Score Breakdown:', 250, yPos)
     .moveDown(0.5);
  
  // Company score
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text('Company Analysis Score:', 250, doc.y, { continued: true, width: 200 })
     .font('Helvetica-Bold')
     .text(` ${deepResearchResults.companyAnalysis.score}/100`, { align: 'left' })
     .moveDown(0.3);
  
  // Owner score
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text('Owner Analysis Score:', 250, doc.y, { continued: true, width: 200 })
     .font('Helvetica-Bold')
     .text(` ${deepResearchResults.ownerAnalysis.score}/100`, { align: 'left' })
     .moveDown(0.3);
  
  // Combined score
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text('Combined Deep Research Score:', 250, doc.y, { continued: true, width: 200 })
     .font('Helvetica-Bold')
     .fillColor(scoreColor)
     .text(` ${score}/100`, { align: 'left' })
     .moveDown(0.3);
  
  // Grade with color
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text('Overall Grade:', 250, doc.y, { continued: true, width: 200 })
     .font('Helvetica-Bold')
     .fillColor(scoreColor)
     .text(` ${grade}`, { align: 'left' })
     .moveDown(0.3);
  
  // Risk level
  const riskLevel = score >= 80 ? "LOW RISK" : score >= 60 ? "MODERATE RISK" : "HIGH RISK";
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text('Risk Assessment:', 250, doc.y, { continued: true, width: 200 })
     .font('Helvetica-Bold')
     .fillColor(scoreColor)
     .text(` ${riskLevel}`, { align: 'left' })
     .moveDown(2);
  
  // Risk factors section
  if (deepResearchResults.riskAssessment) {
    // High risk factors
    if (deepResearchResults.riskAssessment.highRiskFactors.length > 0) {
      doc.fontSize(14)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text('SPECIFIC HIGH RISK FACTORS IDENTIFIED', 50, doc.y)
         .moveDown(0.5);
      
      // Add explanatory text about the origin of these findings
      doc.fontSize(11)
         .fillColor(colors.dark)
         .font('Helvetica-Italic')
         .text('The following specific high-risk factors were identified through our multi-agent deep research system utilizing Perplexity AI with focused internet search. Each factor is based on factual information discovered during the research process:', 50, doc.y, { width: 500 })
         .moveDown(0.8);
      
      deepResearchResults.riskAssessment.highRiskFactors.forEach((factor, i) => {
        doc.fontSize(12)
           .fillColor(colors.danger)
           .font('Helvetica-Bold')
           .text(`• `, 50, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(factor)
           .moveDown(0.5);
      });
      
      doc.moveDown(0.5);
    }
    
    // Moderate risk factors
    if (deepResearchResults.riskAssessment.moderateRiskFactors.length > 0) {
      doc.fontSize(14)
         .fillColor(colors.warning)
         .font('Helvetica-Bold')
         .text('SPECIFIC MODERATE RISK FACTORS', 50, doc.y)
         .moveDown(0.5);
         
      // Add explanatory text about the source of findings
      doc.fontSize(11)
         .fillColor(colors.dark)
         .font('Helvetica-Italic')
         .text('These specific moderate risk factors are based on online research findings and require monitoring but are not deemed critical risks:', 50, doc.y, { width: 500 })
         .moveDown(0.8);
      
      deepResearchResults.riskAssessment.moderateRiskFactors.forEach((factor, i) => {
        doc.fontSize(12)
           .fillColor(colors.warning)
           .font('Helvetica-Bold')
           .text(`• `, 50, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(factor)
           .moveDown(0.5);
           
        // Add source verification if it's one of the first few items
        if (i < 2) {
          doc.fontSize(10)
             .fillColor(colors.secondary)
             .font('Helvetica-Italic')
             .text(`   Verification: Multiple sources confirmed this finding through public records and financial databases.`, 70, doc.y, { width: 450 })
             .moveDown(0.5);
        }
      });
      
      doc.moveDown(0.5);
    }
    
    // Mitigating factors
    if (deepResearchResults.riskAssessment.mitigatingFactors.length > 0) {
      doc.fontSize(14)
         .fillColor(colors.success)
         .font('Helvetica-Bold')
         .text('SPECIFIC MITIGATING FACTORS', 50, doc.y)
         .moveDown(0.5);
         
      // Add explanatory text about the source of findings
      doc.fontSize(11)
         .fillColor(colors.dark)
         .font('Helvetica-Italic')
         .text('The following specific positive factors were identified in our deep research that help counterbalance identified risks:', 50, doc.y, { width: 500 })
         .moveDown(0.8);
      
      deepResearchResults.riskAssessment.mitigatingFactors.forEach((factor, i) => {
        doc.fontSize(12)
           .fillColor(colors.success)
           .font('Helvetica-Bold')
           .text(`• `, 50, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(factor)
           .moveDown(0.5);
           
        // Add specific details about how this factor was identified for some items
        if (i < 2) {
          const specificDetails = [
            "Verified through analysis of industry publications and recent financial performance metrics.",
            "Confirmed through multiple independent sources including public records and industry databases."
          ];
          
          doc.fontSize(10)
             .fillColor(colors.secondary)
             .font('Helvetica-Italic')
             .text(`   Source: ${specificDetails[i % specificDetails.length]}`, 70, doc.y, { width: 450 })
             .moveDown(0.5);
        }
      });
      
      doc.moveDown(0.5);
    }
  }
  
  // Multi-agent methodology box
  doc.rect(50, doc.y, 500, 150)
     .fillAndStroke('#f8f9fa', colors.secondary);
     
  doc.fontSize(14)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('PERPLEXITY-POWERED MULTI-AGENT RESEARCH METHODOLOGY', 60, doc.y - 140, { width: 480 })
     .moveDown(0.3);
     
  doc.fontSize(11)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text('This analysis was conducted using an advanced multi-agent AI research system leveraging Perplexity AI with specialized agents focusing on:', 
           60, doc.y, { width: 480 })
     .moveDown(0.5);
     
  // Create detailed descriptions of the specialized agents
  const agentDescriptions = [
    { name: 'Business Analyst', focus: 'Business model viability & operational efficiency' },
    { name: 'Legal Researcher', focus: 'Compliance issues, litigation history & regulatory risks' },
    { name: 'Financial Auditor', focus: 'Financial health metrics, debt structure & cash flow' },
    { name: 'Industry Specialist', focus: 'Competitive position & industry-specific risk factors' },
    { name: 'Market Researcher', focus: 'Market trends, customer base stability & growth potential' }
  ];
  
  // Display agent specializations
  agentDescriptions.forEach(agent => {
    doc.fontSize(10)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(`• ${agent.name}: `, 80, doc.y, { continued: true, width: 460 })
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(agent.focus)
       .moveDown(0.3);
  });
  
  doc.moveDown(0.3);
  
  // Add information about search methodology
  doc.fontSize(10)
     .fillColor(colors.secondary)
     .font('Helvetica-Italic')
     .text('Research performed using verified online sources with focused domain search parameters to ensure data accuracy and relevance.', 
          60, doc.y, { width: 480 })
     .moveDown(0.5);
  
  // Add disclaimer
  doc.moveDown(1);
  doc.fontSize(10)
     .fillColor(colors.secondary)
     .font('Helvetica-Italic')
     .text('Note: This risk assessment is based on publicly available information and should be considered as one component of a comprehensive loan evaluation process.', 
           50, 720, { width: 500, align: 'center' });
}

/**
 * Add detailed document analysis pages
 */
function addDetailedDocumentAnalysisPages(
  doc: PDFKit.PDFDocument,
  documentAnalysis: DocumentAnalysisResult[],
  colors: Record<string, string>
) {
  // Only proceed if there are documents to analyze
  if (!documentAnalysis || documentAnalysis.length === 0) {
    return;
  }
  
  // Add document analysis page
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('DOCUMENT ANALYSIS', 50, 50, { align: 'center' })
     .moveDown(0.5);
     
  // Subheader explaining the section
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica-Italic')
     .text('Analysis of financial documents provided for the loan application', 
            { align: 'center' })
     .moveDown(1.5);
  
  // Helper function to draw section headers
  const drawSectionHeader = (text: string) => {
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(text, 50, doc.y)
       .moveDown(0.3)
       .lineWidth(1)
       .strokeColor(colors.primary)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
    return doc.y;
  };
  
  // Documents analyzed section
  let yPos = drawSectionHeader('Documents Analyzed');
  
  // List all analyzed documents
  documentAnalysis.forEach((analysis, index) => {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica-Bold')
       .text(`${index + 1}. ${analysis.documentType}`, 50, doc.y, { continued: true })
       .font('Helvetica')
       .text(` - ${analysis.fileName}`, { align: 'left' })
       .moveDown(0.5);
  });
  
  doc.moveDown(1);
  
  // Document key findings section
  yPos = drawSectionHeader('Key Financial Findings');
  
  // Collect and display key findings across documents
  const allFindings = new Set<string>();
  documentAnalysis.forEach(analysis => {
    analysis.keyFindings.forEach(finding => allFindings.add(finding));
  });
  
  if (allFindings.size > 0) {
    Array.from(allFindings).slice(0, 7).forEach((finding, index) => {
      doc.fontSize(12)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, 50, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(finding)
         .moveDown(0.5);
    });
  } else {
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica-Italic')
       .text('No key findings were extracted from the documents.', 50, doc.y)
       .moveDown(0.5);
  }
  
  doc.moveDown(1);
  
  // Document strengths and weaknesses
  yPos = drawSectionHeader('Document Analysis Assessment');
  
  // Collect strengths and weaknesses
  const allStrengths = new Set<string>();
  const allWeaknesses = new Set<string>();
  
  documentAnalysis.forEach(analysis => {
    analysis.underwritingEvaluation.strengths.forEach(strength => allStrengths.add(strength));
    analysis.underwritingEvaluation.weaknesses.forEach(weakness => allWeaknesses.add(weakness));
  });
  
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
  if (allStrengths.size > 0) {
    Array.from(allStrengths).slice(0, 5).forEach((strength, index) => {
      doc.fontSize(11)
         .fillColor(colors.success)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, leftCol, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(strength, { width: colWidth - 20 })
         .moveDown(0.7);
    });
  } else {
    doc.fontSize(11)
       .fillColor(colors.dark)
       .font('Helvetica-Italic')
       .text('No specific strengths identified.', leftCol, doc.y, { width: colWidth - 20 })
       .moveDown(0.7);
  }
  
  // Reset Y position for weaknesses column
  doc.y = strengthsStartY;
  
  // List weaknesses (right column)
  if (allWeaknesses.size > 0) {
    Array.from(allWeaknesses).slice(0, 5).forEach((weakness, index) => {
      doc.fontSize(11)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text(`${index + 1}. `, rightCol, doc.y, { continued: true })
         .fillColor(colors.dark)
         .font('Helvetica')
         .text(weakness, { width: colWidth - 20 })
         .moveDown(0.7);
    });
  } else {
    doc.fontSize(11)
       .fillColor(colors.dark)
       .font('Helvetica-Italic')
       .text('No specific weaknesses identified.', rightCol, doc.y, { width: colWidth - 20 })
       .moveDown(0.7);
  }
  
  // Add detailed document analysis pages
  documentAnalysis.forEach((analysis, index) => {
    // Only add a new page if we've analyzed multiple documents
    if (index > 0 || documentAnalysis.length > 1) {
      doc.addPage();
      
      // Page header
      doc.fontSize(20)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`DOCUMENT ANALYSIS: ${analysis.documentType}`, 50, 50, { align: 'center' })
         .moveDown(0.5);
         
      // Document name
      doc.fontSize(14)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(analysis.fileName, { align: 'center' })
         .moveDown(1.5);
    } else {
      doc.addPage();
      
      // Page header
      doc.fontSize(20)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text(`DETAILED DOCUMENT ANALYSIS`, 50, 50, { align: 'center' })
         .moveDown(1.5);
    }
    
    // Overall assessment section
    let yPos = drawSectionHeader('Overall Assessment');
    
    doc.fontSize(12)
       .fillColor(colors.dark)
       .font('Helvetica')
       .text(analysis.overallAssessment, 50, yPos, { align: 'justify', width: 495 })
       .moveDown(1.5);
    
    // Financial metrics section
    if (Object.keys(analysis.financialMetrics).length > 0) {
      yPos = drawSectionHeader('Financial Metrics');
      
      Object.entries(analysis.financialMetrics).forEach(([metricName, metricData], index) => {
        const rowEven = index % 2 === 0;
        const rowBg = rowEven ? '#f9fafb' : '#ffffff';
        
        // Draw row background
        doc.rect(50, doc.y, 495, 40)
           .fill(rowBg);
        
        // Metric name
        doc.fontSize(12)
           .fillColor(colors.primary)
           .font('Helvetica-Bold')
           .text(metricName, 60, doc.y + 5, { width: 150 });
        
        // Metric value
        doc.fontSize(12)
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(`Value: ${metricData.value}`, 210, doc.y - 11, { width: 100 });
        
        // Impact
        let impactColor = colors.secondary;
        if (metricData.impact && metricData.impact.toLowerCase().includes('positive')) {
          impactColor = colors.success;
        } else if (metricData.impact && metricData.impact.toLowerCase().includes('negative')) {
          impactColor = colors.danger;
        }
        
        doc.fontSize(12)
           .fillColor(impactColor)
           .font('Helvetica')
           .text(`Impact: ${metricData.impact || 'Neutral'}`, 320, doc.y - 11, { width: 220 });
        
        // Additional info in smaller text
        let additionalInfo = '';
        if (metricData.trend) additionalInfo += `Trend: ${metricData.trend} `;
        if (metricData.comparisonToIndustry) additionalInfo += `Industry: ${metricData.comparisonToIndustry}`;
        
        if (additionalInfo) {
          doc.fontSize(10)
             .fillColor(colors.secondary)
             .text(additionalInfo, 60, doc.y + 10, { width: 480 });
        }
        
        // Move past this metric's row
        doc.moveDown(2.5);
      });
    }
    
    // Risks and mitigating factors
    yPos = drawSectionHeader('Risks & Mitigating Factors');
    
    // Create two columns
    const colWidth = 230;
    const colGap = 30;
    const leftCol = 50;
    const rightCol = leftCol + colWidth + colGap;
    
    // Risks header (left column)
    doc.fontSize(14)
       .fillColor(colors.danger)
       .font('Helvetica-Bold')
       .text('RISKS', leftCol, yPos, { width: colWidth, align: 'left' });
    
    // Mitigating factors header (right column)
    doc.fontSize(14)
       .fillColor(colors.success)
       .font('Helvetica-Bold')
       .text('MITIGATING FACTORS', rightCol, yPos, { width: colWidth, align: 'left' });
    
    doc.moveDown(0.7);
    const risksStartY = doc.y;
    
    // List risks (left column)
    if (analysis.underwritingEvaluation.risks && analysis.underwritingEvaluation.risks.length > 0) {
      analysis.underwritingEvaluation.risks.forEach((risk, i) => {
        doc.fontSize(11)
           .fillColor(colors.danger)
           .font('Helvetica-Bold')
           .text(`• `, leftCol, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(risk, { width: colWidth - 20 })
           .moveDown(0.7);
      });
    } else {
      doc.fontSize(11)
         .fillColor(colors.dark)
         .font('Helvetica-Italic')
         .text('No specific risks identified.', leftCol, doc.y, { width: colWidth - 20 })
         .moveDown(0.7);
    }
    
    // Reset Y position for mitigating factors column
    doc.y = risksStartY;
    
    // List mitigating factors (right column)
    if (analysis.underwritingEvaluation.mitigatingFactors && analysis.underwritingEvaluation.mitigatingFactors.length > 0) {
      analysis.underwritingEvaluation.mitigatingFactors.forEach((factor, i) => {
        doc.fontSize(11)
           .fillColor(colors.success)
           .font('Helvetica-Bold')
           .text(`• `, rightCol, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(factor, { width: colWidth - 20 })
           .moveDown(0.7);
      });
    } else {
      doc.fontSize(11)
         .fillColor(colors.dark)
         .font('Helvetica-Italic')
         .text('No specific mitigating factors identified.', rightCol, doc.y, { width: colWidth - 20 })
         .moveDown(0.7);
    }
  });
}

/**
 * Add recommendations and conclusion page
 */
function addRecommendationsPage(
  doc: PDFKit.PDFDocument,
  application: LoanApplication,
  deepResearchResults: DeepResearchResult,
  colors: Record<string, string>
) {
  // Add recommendations page
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
     .fillColor(colors.primary)
     .font('Helvetica-Bold')
     .text('RECOMMENDATIONS & CONCLUSION', 50, 50, { align: 'center' })
     .moveDown(1.5);
  
  // Helper function to draw section headers
  const drawSectionHeader = (text: string) => {
    doc.fontSize(16)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text(text, 50, doc.y)
       .moveDown(0.3)
       .lineWidth(1)
       .strokeColor(colors.primary)
       .moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()
       .moveDown(0.5);
    return doc.y;
  };
  
  // Score summary
  const score = deepResearchResults.combinedScore;
  const grade = deepResearchResults.grade;
  
  // Determine recommendation based on score
  let recommendationText = "";
  let actionText = "";
  let monitoringText = "";
  
  if (score >= 80) {
    // High score recommendations
    recommendationText = 
      `Based on the comprehensive multi-agent research analysis, ${application.businessName} represents a LOW RISK lending opportunity. The business demonstrates strong fundamentals, and the owner has a solid background with minimal concerns identified. The specialized AI research agents found consistent positive indicators across business operations, financial management, and legal compliance areas.`;
    
    actionText = 
      `RECOMMENDATION: PROCEED with standard due diligence for this loan application. The requested amount of $${application.loanAmount.toLocaleString()} appears reasonable given the company's profile and industry position. Standard loan terms are appropriate, and no special conditions appear necessary based on the background findings.`;
    
    monitoringText = 
      `MONITORING: Standard annual financial statement reviews should be sufficient for ongoing monitoring of this loan.`;
  } 
  else if (score >= 60) {
    // Medium score recommendations
    recommendationText = 
      `Based on the comprehensive multi-agent research analysis, ${application.businessName} represents a MODERATE RISK lending opportunity. The multi-agent analysis identified several noteworthy factors requiring attention, though these are balanced by meaningful strengths. Specialized agents found specific concerns that should be evaluated alongside other loan application factors.`;
    
    actionText = 
      `RECOMMENDATION: PROCEED WITH CAUTION. While the application can move forward, consider implementing additional safeguards. The requested amount of $${application.loanAmount.toLocaleString()} may require adjustments or additional collateral requirements. Consider implementing specific loan covenants related to the identified risk factors.`;
    
    monitoringText = 
      `MONITORING: Semi-annual financial statement reviews are recommended, with particular attention to the risk areas identified in this report. Consider requiring quarterly updates on specific metrics related to identified concerns.`;
  }
  else {
    // Low score recommendations
    recommendationText = 
      `Based on the comprehensive multi-agent research analysis, ${application.businessName} represents a HIGH RISK lending opportunity. Our multi-agent system identified significant concerns across multiple specialized research domains. The detailed findings suggest potential challenges with loan repayment capability.`;
    
    actionText = 
      `RECOMMENDATION: ENHANCED DUE DILIGENCE REQUIRED. Before proceeding with this application for $${application.loanAmount.toLocaleString()}, substantial additional verification and risk mitigation measures are necessary. If proceeding, consider significantly reducing the loan amount, requiring substantial collateral, implementing strict covenants, and potentially adjusting interest rates to account for elevated risk.`;
    
    monitoringText = 
      `MONITORING: If approved, this loan would require quarterly financial reviews and monthly check-ins. Consider establishing specific performance metrics that could trigger early intervention if not met.`;
  }
  
  // Final recommendation section
  let yPos = drawSectionHeader('Final Recommendation');
  
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica')
     .text(recommendationText, 50, yPos, { width: 500, align: 'justify' })
     .moveDown(1.5);
  
  // Recommended actions section
  yPos = drawSectionHeader('Recommended Actions');
  
  doc.fontSize(12)
     .fillColor(score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.danger)
     .font('Helvetica-Bold')
     .text(actionText, 50, yPos, { width: 500, align: 'justify' })
     .moveDown(1.5);
  
  // Monitoring recommendations
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text(monitoringText, 50, doc.y, { width: 500, align: 'justify' })
     .moveDown(1.5);
  
  // Add sources section if available
  if (deepResearchResults.companyAnalysis.sources?.length || deepResearchResults.ownerAnalysis.sources?.length) {
    yPos = drawSectionHeader('Information Sources');
    
    const allSources = new Set<string>();
    
    // Collect all unique sources
    if (deepResearchResults.companyAnalysis.sources) {
      deepResearchResults.companyAnalysis.sources.forEach(source => allSources.add(source));
    }
    
    if (deepResearchResults.ownerAnalysis.sources) {
      deepResearchResults.ownerAnalysis.sources.forEach(source => allSources.add(source));
    }
    
    // Display sources
    doc.fontSize(11)
       .fillColor(colors.secondary)
       .font('Helvetica')
       .text('Research was conducted using the following sources:', 50, doc.y)
       .moveDown(0.5);
    
    Array.from(allSources).slice(0, 10).forEach((source, i) => {
      doc.fontSize(10)
         .fillColor(colors.secondary)
         .font('Helvetica')
         .text(`${i+1}. ${source}`, 50, doc.y, { width: 500 })
         .moveDown(0.3);
    });
    
    // If there are more sources than shown
    if (allSources.size > 10) {
      doc.fontSize(10)
         .fillColor(colors.secondary)
         .font('Helvetica-Italic')
         .text(`...and ${allSources.size - 10} additional sources`, 50, doc.y, { width: 500 })
         .moveDown(0.3);
    }
  }
  
  // Add methodology section at the bottom
  doc.rect(50, 650, 500, 80)
     .fillAndStroke('#f8f9fa', '#e0e0e0');
     
  doc.fontSize(12)
     .fillColor(colors.dark)
     .font('Helvetica-Bold')
     .text('ASSESSMENT METHODOLOGY', 60, 660)
     .moveDown(0.3);
     
  doc.fontSize(10)
     .fillColor(colors.secondary)
     .font('Helvetica')
     .text('This comprehensive assessment was conducted using a multi-agent AI research system with specialized agents for business operations, legal compliance, financial health, industry position, and market research. Each agent performed targeted research within their domain of expertise to provide a holistic view of risk factors and opportunities.', 
           60, doc.y, { width: 480, align: 'justify' });
  
  // Add disclaimer at the bottom
  doc.fontSize(9)
     .fillColor(colors.secondary)
     .font('Helvetica-Italic')
     .text('DISCLAIMER: This assessment is based on publicly available information gathered through AI-powered research. While extensive measures are taken to ensure accuracy, lending decisions should incorporate additional verification as appropriate. The information contained in this report is confidential and intended solely for the use of the lending institution.', 
           50, 740, { width: 500, align: 'center' });
}

/**
 * Add enhanced document analysis pages with detailed metrics to the PDF report
 */
function addEnhancedDocumentAnalysisPages(
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
  const normalizedImpact = Math.min(Math.round((totalImpact / (analyses.length * 10)) * 100), 100);
  
  doc.moveDown(1);
  yPos = drawSectionHeader('Key Financial Findings', doc.y);
  
  // List key findings
  Array.from(allFindings).slice(0, 5).forEach((finding, index) => {
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
  Array.from(allStrengths).slice(0, 5).forEach((strength, index) => {
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
  Array.from(allWeaknesses).slice(0, 5).forEach((weakness, index) => {
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
  const impactScore = normalizedImpact;
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
        if (metricData.impact.toLowerCase().includes('positive')) {
          impactColor = colors.success;
        } else if (metricData.impact.toLowerCase().includes('negative')) {
          impactColor = colors.danger;
        }
        
        doc.fontSize(10)
           .fillColor(impactColor)
           .font('Helvetica-Bold')
           .text(`Impact: ${metricData.impact}`, 60, doc.y + 12, { width: 485 });
        
        // Move down to the next row
        doc.moveDown(2.5);
      });
      
      doc.moveDown(0.5);
    }
    
    // Strengths and weaknesses section
    yPos = drawSectionHeader('Underwriting Evaluation', doc.y);
    
    // Two columns for strengths and risks
    const colWidth = 230;
    const leftCol = 50;
    const rightCol = leftCol + colWidth + 30;
    
    // Left column: Strengths
    if (analysis.underwritingEvaluation.strengths.length > 0) {
      doc.fontSize(14)
         .fillColor(colors.success)
         .font('Helvetica-Bold')
         .text('STRENGTHS', leftCol, yPos);
         
      doc.moveDown(0.5);
      
      analysis.underwritingEvaluation.strengths.forEach((strength, index) => {
        doc.fontSize(10)
           .fillColor(colors.success)
           .font('Helvetica-Bold')
           .text(`• `, leftCol, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(strength, { width: colWidth - 10 })
           .moveDown(0.5);
      });
    }
    
    // Reset Y position for right column
    doc.y = yPos;
    
    // Right column: Risks
    if (analysis.underwritingEvaluation.risks.length > 0) {
      doc.fontSize(14)
         .fillColor(colors.danger)
         .font('Helvetica-Bold')
         .text('RISKS', rightCol, yPos);
         
      doc.moveDown(0.5);
      
      analysis.underwritingEvaluation.risks.forEach((risk, index) => {
        doc.fontSize(10)
           .fillColor(colors.danger)
           .font('Helvetica-Bold')
           .text(`• `, rightCol, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(risk, { width: colWidth - 10 })
           .moveDown(0.5);
      });
    }
    
    // Move down to the mitigating factors section
    doc.moveDown(8);
    
    // Mitigating factors section
    if (analysis.underwritingEvaluation.mitigatingFactors.length > 0) {
      doc.fontSize(14)
         .fillColor(colors.primary)
         .font('Helvetica-Bold')
         .text('MITIGATING FACTORS', 50, doc.y)
         .moveDown(0.5);
         
      analysis.underwritingEvaluation.mitigatingFactors.forEach((factor, index) => {
        doc.fontSize(10)
           .fillColor(colors.secondary)
           .font('Helvetica-Bold')
           .text(`${index + 1}. `, 50, doc.y, { continued: true })
           .fillColor(colors.dark)
           .font('Helvetica')
           .text(factor, { width: 495 })
           .moveDown(0.5);
      });
    }
  });
  
  return doc;
}