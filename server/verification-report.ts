import PDFKit from "pdfkit";
import { DeepResearchResult } from "./deepsearch";
import { LoanApplication } from "../shared/schema";

/**
 * Add entity verification details to the PDF report
 * @param doc PDFDocument to add content to
 * @param deepResearchResults Results from deep research including verification data
 * @param application The loan application data
 * @param colors Color palette for the document
 */
export function addVerificationDetailsPage(
  doc: PDFKit.PDFDocument,
  deepResearchResults: DeepResearchResult,
  application: LoanApplication,
  colors: Record<string, string>
) {
  // Only add this page if verification data is available
  if (deepResearchResults.verificationConfidence === undefined) {
    return;
  }
  
  // Add a new page
  doc.addPage();
  
  // Page header
  doc.fontSize(20)
    .fillColor(colors.primary)
    .font('Helvetica-Bold')
    .text('ENTITY VERIFICATION REPORT', 50, 50, { align: 'center' })
    .moveDown(0.5);
  
  // Horizontal line
  doc.lineWidth(1)
    .strokeColor(colors.primary)
    .moveTo(50, doc.y)
    .lineTo(550, doc.y)
    .stroke()
    .moveDown(1);
  
  // Add introduction
  doc.fontSize(12)
    .fillColor(colors.dark)
    .font('Helvetica')
    .text(
      'This report section details the entity verification process performed as part of the deep research. '+
      'Entity verification is critical for ensuring that research findings are relevant to the correct business and individuals.',
      50, doc.y, { width: 500, align: 'justify' }
    )
    .moveDown(1);
  
  // Show overall verification confidence
  const verificationPercent = Math.round((deepResearchResults.verificationConfidence || 0) * 100);
  
  // Determine verification status and color
  let verificationStatus = "Unknown";
  let statusColor = colors.primary;
  
  if (verificationPercent >= 90) {
    verificationStatus = "High Confidence";
    statusColor = colors.success;
  } else if (verificationPercent >= 75) {
    verificationStatus = "Good Confidence";
    statusColor = colors.secondary;
  } else if (verificationPercent >= 50) {
    verificationStatus = "Moderate Confidence"; 
    statusColor = colors.warning;
  } else {
    verificationStatus = "Low Confidence";
    statusColor = colors.danger;
  }
  
  // Draw verification box
  doc.rect(50, doc.y, 500, 80)
    .fillAndStroke('#f8fafc', statusColor);
  
  doc.fillColor(statusColor)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text("OVERALL VERIFICATION STATUS", 70, doc.y + 15);
  
  doc.fillColor(colors.dark)
    .fontSize(20)
    .text(`${verificationStatus} (${verificationPercent}%)`, 70, doc.y + 5);
  
  // Add confidence meter (horizontal bar)
  const barWidth = 300;
  const filledWidth = Math.max(10, Math.min(barWidth, (barWidth * verificationPercent) / 100));
  
  doc.rect(70, doc.y + 15, barWidth, 15)
    .fillAndStroke('#e2e8f0', '#94a3b8');
  
  doc.rect(70, doc.y - 15, filledWidth, 15)
    .fillAndStroke(statusColor);
  
  doc.moveDown(6);
  
  // Add explanation of impact
  doc.fontSize(12)
    .fillColor(colors.dark)
    .font('Helvetica')
    .text(
      `Impact on Research: ${
        verificationPercent < 50 ? 
          "The low verification confidence means that research findings should be treated with significant caution. The findings may not be related to the correct entity." : 
        verificationPercent < 75 ?
          "The moderate verification confidence suggests that while the research is likely related to the correct entities, additional verification is recommended." :
          "The high verification confidence indicates that the research findings are highly likely to be related to the correct entities."
      }`,
      50, doc.y, { width: 500 }
    )
    .moveDown(2);
  
  // Section heading function
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
  
  // Company verification details
  drawSectionHeader('Company Verification Details');
  
  // Create a table-like structure
  const tableData = [
    ['Field', 'Application Data', 'Verified Data'],
    ['Company Name', application.businessName, 'Company legal name verification attempted'],
    ['Industry', application.industry, 'Industry verification attempted'],
    ['Years in Business', application.yearsInBusiness, 'Business history verification attempted'],
    ['Annual Revenue', `$${application.annualRevenue}`, 'Financial data verification attempted']
  ];
  
  // Draw the table
  const colWidths = [130, 180, 190];
  const rowHeight = 25;
  let startY = doc.y;
  
  // Draw header row with background
  doc.rect(50, startY, 500, rowHeight)
    .fillAndStroke(colors.primary, colors.primary);
  
  doc.fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(12);
  
  tableData[0].forEach((text, i) => {
    const xPos = 50 + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
    doc.text(text, xPos + 5, startY + 7);
  });
  
  // Draw data rows
  for (let rowIndex = 1; rowIndex < tableData.length; rowIndex++) {
    startY += rowHeight;
    
    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.rect(50, startY, 500, rowHeight)
        .fillAndStroke('#f8fafc', '#e2e8f0');
    } else {
      doc.rect(50, startY, 500, rowHeight)
        .fillAndStroke('white', '#e2e8f0');
    }
    
    // Draw cell text
    doc.fillColor(colors.dark)
      .font('Helvetica-Bold')
      .fontSize(11);
    
    doc.text(tableData[rowIndex][0], 55, startY + 7);
    
    doc.font('Helvetica')
      .text(tableData[rowIndex][1], 50 + colWidths[0] + 5, startY + 7);
    
    doc.font('Helvetica-Italic')
      .text(tableData[rowIndex][2], 50 + colWidths[0] + colWidths[1] + 5, startY + 7);
  }
  
  doc.moveDown(4);
  
  // Verification search methods
  drawSectionHeader('Verification Methods Used');
  
  const methods = [
    {
      name: 'Business Registry Search',
      description: 'Search of official business registries and public record databases to verify legal existence and status.'
    },
    {
      name: 'Cross-Reference Verification',
      description: 'Multiple data sources were cross-checked to confirm identity consistency across platforms.'
    },
    {
      name: 'Industry Classification',
      description: 'Analysis of products, services, and market position to verify industry categorization.'
    },
    {
      name: 'Owner/Business Connection',
      description: 'Verification of relationship between named business owners and target company.'
    }
  ];
  
  methods.forEach(method => {
    doc.fillColor(colors.primary)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(`• ${method.name}`, 50, doc.y)
      .fillColor(colors.dark)
      .font('Helvetica')
      .fontSize(11)
      .text(method.description, 70, doc.y, { width: 480 })
      .moveDown(1);
  });
  
  // Warning box for low confidence
  if (verificationPercent < 50) {
    doc.rect(50, doc.y, 500, 80)
      .fillAndStroke('#fee2e2', '#ef4444');
    
    doc.fillColor('#b91c1c')
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('LOW CONFIDENCE WARNING', 70, doc.y + 15);
    
    doc.fillColor('#7f1d1d')
      .font('Helvetica')
      .fontSize(11)
      .text(
        'The entity verification process could not reliably confirm the identities of the business and/or key owners. '+
        'This significantly impacts the reliability of the research findings. Manual verification is strongly recommended '+
        'before making any lending decisions based on the deep research component of this report.',
        70, doc.y + 5, { width: 460 }
      );
  }
  
  // Add page number
  doc.fontSize(10)
    .fillColor(colors.secondary)
    .text('Entity Verification - Page 1', 50, 740, { width: 500, align: 'center' });
}