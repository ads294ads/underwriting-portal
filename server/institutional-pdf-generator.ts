import PDFDocument from 'pdfkit';
import { FinancialAnalysis, RiskAssessment, MarketAnalysis, ManagementAnalysis, CollateralAnalysis, ComplianceCheck, LenderRecommendation } from "../shared/enhanced-schema";

export class InstitutionalPDFGenerator {
  private doc: PDFKit.PDFDocument;
  private pageHeight: number = 792;
  private pageWidth: number = 612;
  private margin: number = 50;
  private currentY: number = 50;

  constructor() {
    this.doc = new PDFDocument({
      size: 'letter',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
  }

  private addHeader() {
    this.doc.fontSize(24).font('Helvetica-Bold')
      .text('COMMERCIAL LOAN ASSESSMENT REPORT', this.margin, this.currentY, {
        align: 'center',
        width: this.pageWidth - 2 * this.margin
      });
    
    this.currentY += 40;
    
    // Add a horizontal line
    this.doc.strokeColor('#333333')
      .lineWidth(2)
      .moveTo(this.margin, this.currentY)
      .lineTo(this.pageWidth - this.margin, this.currentY)
      .stroke();
    
    this.currentY += 30;
  }

  private addSection(title: string, fontSize: number = 16) {
    this.checkPageBreak(60);
    
    this.doc.fontSize(fontSize).font('Helvetica-Bold')
      .fillColor('#1a365d')
      .text(title, this.margin, this.currentY);
    
    this.currentY += fontSize + 10;
    
    // Add underline
    this.doc.strokeColor('#1a365d')
      .lineWidth(1)
      .moveTo(this.margin, this.currentY - 5)
      .lineTo(this.margin + 200, this.currentY - 5)
      .stroke();
    
    this.currentY += 15;
  }

  private addSubsection(title: string, fontSize: number = 12) {
    this.checkPageBreak(40);
    
    this.doc.fontSize(fontSize).font('Helvetica-Bold')
      .fillColor('#2d3748')
      .text(title, this.margin, this.currentY);
    
    this.currentY += fontSize + 8;
  }

  private addText(text: string, fontSize: number = 10, indent: number = 0) {
    this.checkPageBreak(20);
    
    this.doc.fontSize(fontSize).font('Helvetica')
      .fillColor('#000000')
      .text(text, this.margin + indent, this.currentY, {
        width: this.pageWidth - 2 * this.margin - indent,
        align: 'left'
      });
    
    this.currentY += this.doc.heightOfString(text, {
      width: this.pageWidth - 2 * this.margin - indent
    }) + 5;
  }

  private addBulletPoint(text: string, fontSize: number = 10, indent: number = 20) {
    this.checkPageBreak(20);
    
    this.doc.fontSize(fontSize).font('Helvetica')
      .fillColor('#000000')
      .text('•', this.margin + indent, this.currentY)
      .text(text, this.margin + indent + 15, this.currentY, {
        width: this.pageWidth - 2 * this.margin - indent - 15,
        align: 'left'
      });
    
    this.currentY += this.doc.heightOfString(text, {
      width: this.pageWidth - 2 * this.margin - indent - 15
    }) + 3;
  }

  private addTable(headers: string[], rows: string[][], fontSize: number = 9) {
    this.checkPageBreak(100);
    
    const tableWidth = this.pageWidth - 2 * this.margin;
    const colWidth = tableWidth / headers.length;
    let tableY = this.currentY;
    
    // Draw headers
    this.doc.fontSize(fontSize).font('Helvetica-Bold').fillColor('#ffffff');
    this.doc.rect(this.margin, tableY, tableWidth, 25).fill('#1a365d');
    
    headers.forEach((header, i) => {
      this.doc.text(header, this.margin + i * colWidth + 5, tableY + 8, {
        width: colWidth - 10,
        align: 'left'
      });
    });
    
    tableY += 25;
    
    // Draw rows
    this.doc.font('Helvetica').fillColor('#000000');
    rows.forEach((row, rowIndex) => {
      const rowColor = rowIndex % 2 === 0 ? '#f7fafc' : '#ffffff';
      this.doc.rect(this.margin, tableY, tableWidth, 20).fill(rowColor);
      
      row.forEach((cell, i) => {
        this.doc.text(cell, this.margin + i * colWidth + 5, tableY + 5, {
          width: colWidth - 10,
          align: 'left'
        });
      });
      
      tableY += 20;
    });
    
    this.currentY = tableY + 15;
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addExecutiveSummary(application: any, recommendation: LenderRecommendation) {
    this.addSection('EXECUTIVE SUMMARY', 18);
    
    this.addText(recommendation.executiveSummary, 11);
    this.currentY += 10;
    
    // Key metrics table
    const metrics = [
      ['Requested Loan Amount', `$${Number(application.loanAmount).toLocaleString()}`],
      ['Recommended Amount', `$${recommendation.recommendedLoanAmount.toLocaleString()}`],
      ['Recommendation', recommendation.approvalRecommendation],
      ['Risk Rating', 'Medium'], // Could be derived from risk assessment
      ['Recommended Rate', recommendation.recommendedTerms.interestRate]
    ];
    
    this.addTable(['Metric', 'Value'], metrics);
  }

  private addFinancialAnalysis(analysis: FinancialAnalysis) {
    this.addSection('FINANCIAL ANALYSIS', 16);
    
    // Profitability Analysis
    this.addSubsection('Profitability Analysis');
    this.addText(`Gross Margin: ${analysis.profitabilityAnalysis.grossMargin}%`);
    this.addText(`Operating Margin: ${analysis.profitabilityAnalysis.operatingMargin}%`);
    this.addText(`EBITDA Margin: ${analysis.profitabilityAnalysis.ebitdaMargin}%`);
    this.addText(`Net Margin: ${analysis.profitabilityAnalysis.netMargin}%`);
    this.currentY += 5;
    
    this.addText(analysis.profitabilityAnalysis.roiAnalysis, 10);
    this.addText(analysis.profitabilityAnalysis.industryComparison, 10);
    this.currentY += 10;
    
    // Profitability Trends
    this.addSubsection('Profitability Trends');
    analysis.profitabilityAnalysis.profitabilityTrends.forEach(trend => {
      this.addBulletPoint(trend);
    });
    this.currentY += 10;
    
    // Cash Flow Analysis
    this.addSubsection('Cash Flow Analysis');
    this.addText(`Operating Cash Flow: $${analysis.cashFlowAnalysis.operatingCashFlow.toLocaleString()}`);
    this.addText(`Free Cash Flow: $${analysis.cashFlowAnalysis.freeCashFlow.toLocaleString()}`);
    this.addText(`Cash Conversion Cycle: ${analysis.cashFlowAnalysis.cashConversionCycle} days`);
    this.currentY += 5;
    
    this.addText(analysis.cashFlowAnalysis.seasonalityAnalysis, 10);
    this.addText(analysis.cashFlowAnalysis.workingCapitalAnalysis, 10);
    this.currentY += 10;
    
    // Liquidity Ratios
    this.addSubsection('Liquidity Ratios');
    const liquidityRatios = [
      ['Current Ratio', analysis.cashFlowAnalysis.liquidityRatios.currentRatio?.toString() || 'N/A'],
      ['Quick Ratio', analysis.cashFlowAnalysis.liquidityRatios.quickRatio?.toString() || 'N/A'],
      ['Cash Ratio', analysis.cashFlowAnalysis.liquidityRatios.cashRatio?.toString() || 'N/A']
    ];
    this.addTable(['Ratio', 'Value'], liquidityRatios);
    
    // Debt Analysis
    this.addSubsection('Debt Analysis');
    this.addText(`Total Debt: $${analysis.debtAnalysis.totalDebt.toLocaleString()}`);
    this.addText(`Debt-to-Equity Ratio: ${analysis.debtAnalysis.debtToEquityRatio}`);
    this.addText(`Debt Service Coverage Ratio: ${analysis.debtAnalysis.debtServiceCoverageRatio}`);
    this.addText(`Interest Coverage Ratio: ${analysis.debtAnalysis.interestCoverageRatio}`);
    this.currentY += 5;
    
    this.addText(analysis.debtAnalysis.creditUtilization, 10);
    this.addText(analysis.debtAnalysis.debtCapacityAssessment, 10);
  }

  private addRiskAssessment(assessment: RiskAssessment) {
    this.addSection('RISK ASSESSMENT', 16);
    
    // Overall Risk Profile
    this.addSubsection('Overall Risk Rating');
    this.addText(`Risk Rating: ${assessment.overallRiskProfile.riskRating}`, 12);
    this.currentY += 10;
    
    // Key Risk Factors
    this.addSubsection('Key Risk Factors');
    assessment.overallRiskProfile.keyRiskFactors.forEach(factor => {
      this.addBulletPoint(factor);
    });
    this.currentY += 10;
    
    // Credit Risk
    this.addSubsection('Credit Risk Assessment');
    this.addText(`Credit Score: ${assessment.creditRisk.creditScore}`);
    this.addText(`Risk Rating: ${assessment.creditRisk.riskRating}`);
    this.addText(assessment.creditRisk.paymentHistory, 10);
    this.addText(assessment.creditRisk.creditUtilization, 10);
    this.currentY += 10;
    
    // Operational Risk
    this.addSubsection('Operational Risk');
    this.addText(assessment.operationalRisk.businessModel, 10);
    this.addText(assessment.operationalRisk.operationalEfficiency, 10);
    this.addText(assessment.operationalRisk.customerConcentration, 10);
    this.currentY += 10;
    
    // Industry Risk
    this.addSubsection('Industry Risk');
    this.addText(`Industry Growth Rate: ${assessment.industryRisk.industryGrowthRate}%`);
    this.addText(assessment.industryRisk.cyclicalityAnalysis, 10);
    this.addText(assessment.industryRisk.competitiveLandscape, 10);
    this.addText(assessment.industryRisk.industryOutlook, 10);
    this.currentY += 10;
    
    // Risk Mitigation
    this.addSubsection('Risk Mitigation Strategies');
    assessment.overallRiskProfile.riskMitigationStrategies.forEach(strategy => {
      this.addBulletPoint(strategy);
    });
  }

  private addMarketAnalysis(analysis: MarketAnalysis) {
    this.addSection('MARKET & INDUSTRY ANALYSIS', 16);
    
    // Industry Overview
    this.addSubsection('Industry Overview');
    this.addText(`Industry Size: ${analysis.industryOverview.industrySize}`);
    this.addText(`Growth Rate: ${analysis.industryOverview.growthRate}%`);
    this.addText(`Maturity Stage: ${analysis.industryOverview.maturityStage}`);
    this.currentY += 5;
    
    this.addSubsection('Key Industry Drivers');
    analysis.industryOverview.keyDrivers.forEach(driver => {
      this.addBulletPoint(driver);
    });
    this.currentY += 10;
    
    // Competitive Position
    this.addSubsection('Competitive Position');
    this.addText(`Market Share: ${analysis.competitivePosition.marketShare}`);
    this.currentY += 5;
    
    this.addText('Competitive Advantages:', 10);
    analysis.competitivePosition.competitiveAdvantages.forEach(advantage => {
      this.addBulletPoint(advantage);
    });
    this.currentY += 5;
    
    this.addText('Competitive Threats:', 10);
    analysis.competitivePosition.competitiveThreats.forEach(threat => {
      this.addBulletPoint(threat);
    });
    this.currentY += 10;
    
    // Market Opportunity
    this.addSubsection('Market Opportunities');
    analysis.marketOpportunity.growthOpportunities.forEach(opportunity => {
      this.addBulletPoint(opportunity);
    });
    this.currentY += 10;
    
    // Regulatory Environment
    this.addSubsection('Regulatory Environment');
    this.addText(analysis.regulatoryEnvironment.complianceStatus, 10);
    
    if (analysis.regulatoryEnvironment.regulatoryRisks.length > 0) {
      this.addText('Regulatory Risks:', 10);
      analysis.regulatoryEnvironment.regulatoryRisks.forEach(risk => {
        this.addBulletPoint(risk);
      });
    }
  }

  private addManagementAnalysis(analysis: ManagementAnalysis) {
    this.addSection('MANAGEMENT ANALYSIS', 16);
    
    // Leadership Team
    this.addSubsection('Leadership Team Assessment');
    analysis.leadershipTeam.keyExecutives.forEach(executive => {
      this.addText(`${executive.name} - ${executive.position}`, 11);
      this.addText(`Experience: ${executive.experience}`, 10, 20);
      this.addText(`Track Record: ${executive.trackRecord}`, 10, 20);
      
      if (executive.riskFactors.length > 0) {
        this.addText('Risk Factors:', 10, 20);
        executive.riskFactors.forEach(risk => {
          this.addBulletPoint(risk, 9, 40);
        });
      }
      this.currentY += 10;
    });
    
    // Management Capabilities
    this.addSubsection('Management Capabilities');
    this.addText(`Strategic Planning: ${analysis.managementCapabilities.strategicPlanning}`, 10);
    this.addText(`Operational Execution: ${analysis.managementCapabilities.operationalExecution}`, 10);
    this.addText(`Financial Management: ${analysis.managementCapabilities.financialManagement}`, 10);
    this.addText(`Risk Management: ${analysis.managementCapabilities.riskManagement}`, 10);
    this.currentY += 10;
    
    // Organizational Structure
    this.addSubsection('Organizational Assessment');
    this.addText(analysis.organizationalStructure.reportingLines, 10);
    this.addText(analysis.organizationalStructure.decisionMaking, 10);
    this.addText(analysis.organizationalStructure.culturalAssessment, 10);
  }

  private addCollateralAnalysis(analysis: CollateralAnalysis) {
    this.addSection('COLLATERAL ANALYSIS', 16);
    
    // Overall Assessment
    this.addSubsection('Overall Collateral Assessment');
    this.addText(`Total Collateral Value: $${analysis.overallCollateralAssessment.totalCollateralValue.toLocaleString()}`);
    this.addText(`Loan-to-Value Ratio: ${analysis.overallCollateralAssessment.loanToValueRatio}%`);
    this.addText(`Liquidation Recovery Estimate: ${analysis.overallCollateralAssessment.liquidationRecoveryEstimate}%`);
    this.addText(`Collateral Sufficiency: ${analysis.overallCollateralAssessment.collateralSufficiency}`);
    this.currentY += 10;
    
    // Real Estate
    if (analysis.realEstate.length > 0) {
      this.addSubsection('Real Estate Collateral');
      analysis.realEstate.forEach(property => {
        this.addText(`Property Type: ${property.propertyType}`, 10);
        this.addText(`Market Value: $${property.marketValue.toLocaleString()}`, 10, 20);
        this.addText(`Liquidation Value: $${property.liquidationValue.toLocaleString()}`, 10, 20);
        this.addText(`Condition: ${property.conditionAssessment}`, 10, 20);
        this.addText(`Lien Status: ${property.lienStatus}`, 10, 20);
        this.currentY += 10;
      });
    }
    
    // Equipment
    if (analysis.equipment.length > 0) {
      this.addSubsection('Equipment Collateral');
      analysis.equipment.forEach(equipment => {
        this.addText(`Equipment Type: ${equipment.equipmentType}`, 10);
        this.addText(`Age/Condition: ${equipment.ageCondition}`, 10, 20);
        this.addText(`Market Value: $${equipment.marketValue.toLocaleString()}`, 10, 20);
        this.addText(`Liquidation Value: $${equipment.liquidationValue.toLocaleString()}`, 10, 20);
        this.addText(`Obsolescence Risk: ${equipment.obsolescenceRisk}`, 10, 20);
        this.currentY += 10;
      });
    }
    
    // Personal Guarantees
    if (analysis.personalGuarantees.length > 0) {
      this.addSubsection('Personal Guarantees');
      const guaranteeData = analysis.personalGuarantees.map(guarantee => [
        guarantee.guarantorName,
        `$${guarantee.netWorth.toLocaleString()}`,
        `$${guarantee.liquidAssets.toLocaleString()}`,
        guarantee.creditScore.toString(),
        `$${guarantee.guaranteeAmount.toLocaleString()}`
      ]);
      
      this.addTable(
        ['Guarantor', 'Net Worth', 'Liquid Assets', 'Credit Score', 'Guarantee Amount'],
        guaranteeData
      );
    }
    
    // Monitoring Requirements
    if (analysis.overallCollateralAssessment.monitoringRequirements.length > 0) {
      this.addSubsection('Monitoring Requirements');
      analysis.overallCollateralAssessment.monitoringRequirements.forEach(requirement => {
        this.addBulletPoint(requirement);
      });
    }
  }

  private addRecommendation(recommendation: LenderRecommendation) {
    this.addSection('LENDING RECOMMENDATION', 16);
    
    // Primary Recommendation
    this.addSubsection('Primary Recommendation');
    this.addText(`Recommendation: ${recommendation.approvalRecommendation}`, 12);
    this.addText(`Recommended Loan Amount: $${recommendation.recommendedLoanAmount.toLocaleString()}`, 11);
    this.currentY += 10;
    
    // Recommended Terms
    this.addSubsection('Recommended Terms & Conditions');
    this.addText(`Interest Rate: ${recommendation.recommendedTerms.interestRate}`);
    this.addText(`Loan Term: ${recommendation.recommendedTerms.loanTerm}`);
    this.addText(`Payment Frequency: ${recommendation.recommendedTerms.paymentFrequency}`);
    this.currentY += 5;
    
    if (recommendation.recommendedTerms.collateralRequirements.length > 0) {
      this.addText('Collateral Requirements:', 10);
      recommendation.recommendedTerms.collateralRequirements.forEach(requirement => {
        this.addBulletPoint(requirement);
      });
    }
    
    if (recommendation.recommendedTerms.personalGuarantees.length > 0) {
      this.addText('Personal Guarantee Requirements:', 10);
      recommendation.recommendedTerms.personalGuarantees.forEach(guarantee => {
        this.addBulletPoint(guarantee);
      });
    }
    
    if (recommendation.recommendedTerms.financialCovenants.length > 0) {
      this.addText('Financial Covenants:', 10);
      recommendation.recommendedTerms.financialCovenants.forEach(covenant => {
        this.addBulletPoint(covenant);
      });
    }
    this.currentY += 10;
    
    // Conditions
    this.addSubsection('Conditions & Requirements');
    if (recommendation.conditions.preClosingConditions.length > 0) {
      this.addText('Pre-Closing Conditions:', 10);
      recommendation.conditions.preClosingConditions.forEach(condition => {
        this.addBulletPoint(condition);
      });
    }
    
    if (recommendation.conditions.ongoingCovenants.length > 0) {
      this.addText('Ongoing Covenants:', 10);
      recommendation.conditions.ongoingCovenants.forEach(covenant => {
        this.addBulletPoint(covenant);
      });
    }
    
    if (recommendation.conditions.reportingRequirements.length > 0) {
      this.addText('Reporting Requirements:', 10);
      recommendation.conditions.reportingRequirements.forEach(requirement => {
        this.addBulletPoint(requirement);
      });
    }
    this.currentY += 10;
    
    // Detailed Rationale
    this.addSubsection('Detailed Rationale');
    this.addText(recommendation.detailedRationale, 10);
    this.currentY += 15;
    
    // Alternative Structures
    if (recommendation.alternativeStructures.length > 0) {
      this.addSubsection('Alternative Loan Structures');
      recommendation.alternativeStructures.forEach(alternative => {
        this.addText(`Structure: ${alternative.structure}`, 10);
        this.addText(`Terms: ${alternative.terms}`, 10, 20);
        this.addText(`Risk Profile: ${alternative.riskProfile}`, 10, 20);
        this.addText(`Suitability: ${alternative.suitability}`, 10, 20);
        this.currentY += 10;
      });
    }
  }

  generateComprehensiveReport(
    application: any,
    analyses: {
      financialAnalysis: FinancialAnalysis;
      riskAssessment: RiskAssessment;
      marketAnalysis: MarketAnalysis;
      managementAnalysis: ManagementAnalysis;
      collateralAnalysis: CollateralAnalysis;
      complianceCheck: ComplianceCheck;
      lenderRecommendation: LenderRecommendation;
    }
  ): PDFKit.PDFDocument {
    // Cover Page
    this.addHeader();
    
    // Application Info
    this.addText(`Business Name: ${application.businessName}`, 14);
    this.addText(`Industry: ${application.industry}`, 12);
    this.addText(`Loan Amount Requested: $${Number(application.loanAmount).toLocaleString()}`, 12);
    this.addText(`Report Date: ${new Date().toLocaleDateString()}`, 12);
    this.currentY += 30;
    
    // Generate all sections
    this.addExecutiveSummary(application, analyses.lenderRecommendation);
    this.addFinancialAnalysis(analyses.financialAnalysis);
    this.addRiskAssessment(analyses.riskAssessment);
    this.addMarketAnalysis(analyses.marketAnalysis);
    this.addManagementAnalysis(analyses.managementAnalysis);
    this.addCollateralAnalysis(analyses.collateralAnalysis);
    this.addRecommendation(analyses.lenderRecommendation);
    
    return this.doc;
  }
}

export const institutionalPDFGenerator = new InstitutionalPDFGenerator();