import { realDocumentAnalyzer, DocumentInsights } from './real-document-analyzer';
import { realBusinessResearch, BusinessIntelligence } from './real-business-research';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ComprehensiveLoanAssessment {
  applicationId: number;
  businessName: string;
  documentAnalysis: DocumentInsights[];
  businessResearch: BusinessIntelligence;
  financialHealthScore: number;
  riskAssessment: {
    documentRisks: string[];
    businessRisks: string[];
    ownerRisks: string[];
    overallRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  };
  lendingRecommendation: {
    decision: 'APPROVE' | 'CONDITIONAL_APPROVE' | 'DECLINE' | 'REQUEST_MORE_INFO';
    reasoning: string;
    conditions: string[];
    recommendedAmount?: number;
    recommendedTerms?: string[];
  };
  keyFindings: string[];
  confidence: number;
  analysisDate: string;
}

export class RealLoanAnalyzer {
  
  async performComprehensiveAnalysis(
    application: any,
    documentPaths: string[]
  ): Promise<ComprehensiveLoanAssessment> {
    
    console.log(`Starting real comprehensive analysis for ${application.businessName}`);
    
    // Step 1: Analyze all uploaded documents
    const documentAnalysis = await this.analyzeAllDocuments(documentPaths);
    
    // Step 2: Research the business and owners online
    const ownerNames = application.businessOwners?.map((owner: any) => owner.name) || [];
    const businessResearch = await realBusinessResearch.researchCompany(
      application.businessName,
      ownerNames,
      application.industry
    );
    
    // Step 3: Calculate financial health score based on real data
    const financialHealthScore = this.calculateFinancialHealth(documentAnalysis, application);
    
    // Step 4: Assess overall risk
    const riskAssessment = this.assessRisks(documentAnalysis, businessResearch);
    
    // Step 5: Generate lending recommendation
    const lendingRecommendation = await this.generateRecommendation(
      application,
      documentAnalysis,
      businessResearch,
      financialHealthScore,
      riskAssessment
    );
    
    // Step 6: Extract key findings
    const keyFindings = this.extractKeyFindings(documentAnalysis, businessResearch);
    
    return {
      applicationId: application.id,
      businessName: application.businessName,
      documentAnalysis,
      businessResearch,
      financialHealthScore,
      riskAssessment,
      lendingRecommendation,
      keyFindings,
      confidence: this.calculateConfidence(documentAnalysis, businessResearch),
      analysisDate: new Date().toISOString()
    };
  }
  
  private async analyzeAllDocuments(documentPaths: string[]): Promise<DocumentInsights[]> {
    const results = [];
    
    for (const path of documentPaths) {
      try {
        console.log(`Analyzing document: ${path}`);
        const analysis = await realDocumentAnalyzer.analyzeActualDocument(path);
        results.push(analysis);
      } catch (error) {
        console.error(`Failed to analyze ${path}:`, error);
        results.push({
          documentType: 'error',
          financialData: realDocumentAnalyzer['getEmptyFinancialData'](),
          keyInsights: [`Failed to analyze: ${error.message}`],
          redFlags: ['Document analysis failed'],
          strengths: [],
          actualNumbers: {},
          confidence: 0,
          rawText: ''
        });
      }
    }
    
    return results;
  }
  
  private calculateFinancialHealth(documentAnalysis: DocumentInsights[], application: any): number {
    let score = 50; // Base score
    
    for (const doc of documentAnalysis) {
      if (doc.confidence === 0) continue; // Skip failed analyses
      
      const data = doc.financialData;
      
      // Revenue growth
      if (data.revenue.growth > 10) score += 15;
      else if (data.revenue.growth > 5) score += 10;
      else if (data.revenue.growth < -5) score -= 15;
      
      // Profit margin
      if (data.ratios.profitMargin > 15) score += 10;
      else if (data.ratios.profitMargin > 5) score += 5;
      else if (data.ratios.profitMargin < 0) score -= 20;
      
      // Current ratio (liquidity)
      if (data.ratios.currentRatio > 1.5) score += 10;
      else if (data.ratios.currentRatio > 1.0) score += 5;
      else if (data.ratios.currentRatio < 0.8) score -= 15;
      
      // Debt management
      if (data.ratios.debtToEquity < 0.5) score += 10;
      else if (data.ratios.debtToEquity > 2.0) score -= 15;
      
      // Red flags impact
      score -= doc.redFlags.length * 10;
      
      // Strengths bonus
      score += doc.strengths.length * 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  private assessRisks(
    documentAnalysis: DocumentInsights[], 
    businessResearch: BusinessIntelligence
  ) {
    const documentRisks = [];
    const businessRisks = [];
    const ownerRisks = [];
    
    // Document-based risks
    for (const doc of documentAnalysis) {
      documentRisks.push(...doc.redFlags);
      
      // Financial ratio risks
      const ratios = doc.financialData.ratios;
      if (ratios.currentRatio < 1.0) {
        documentRisks.push('Poor liquidity - current ratio below 1.0');
      }
      if (ratios.debtToEquity > 2.0) {
        documentRisks.push('High leverage - debt-to-equity ratio above 2.0');
      }
      if (ratios.profitMargin < 0) {
        documentRisks.push('Operating at a loss');
      }
    }
    
    // Business research risks
    businessRisks.push(...businessResearch.riskFactors.legal);
    businessRisks.push(...businessResearch.riskFactors.financial);
    businessRisks.push(...businessResearch.riskFactors.operational);
    businessRisks.push(...businessResearch.riskFactors.reputational);
    
    if (!businessResearch.foundOnline) {
      businessRisks.push('No significant online presence found');
    }
    
    // Owner risks
    const verifiedOwners = businessResearch.ownerBackground.filter(owner => owner.found).length;
    if (verifiedOwners === 0) {
      ownerRisks.push('No owner background verification possible');
    }
    
    // Calculate overall risk
    const totalRiskFactors = documentRisks.length + businessRisks.length + ownerRisks.length;
    let overallRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    
    if (businessResearch.overallAssessment.riskLevel === 'high' || totalRiskFactors > 8) {
      overallRisk = 'VERY_HIGH';
    } else if (totalRiskFactors > 5) {
      overallRisk = 'HIGH';
    } else if (totalRiskFactors > 2) {
      overallRisk = 'MODERATE';
    } else {
      overallRisk = 'LOW';
    }
    
    return {
      documentRisks,
      businessRisks,
      ownerRisks,
      overallRisk
    };
  }
  
  private async generateRecommendation(
    application: any,
    documentAnalysis: DocumentInsights[],
    businessResearch: BusinessIntelligence,
    financialHealthScore: number,
    riskAssessment: any
  ) {
    
    // Create comprehensive prompt for AI recommendation
    const analysisPrompt = `As a senior loan officer, provide a lending recommendation based on this comprehensive analysis:

COMPANY: ${application.businessName}
INDUSTRY: ${application.industry}
YEARS IN BUSINESS: ${application.yearsInBusiness}
ANNUAL REVENUE: $${Number(application.annualRevenue).toLocaleString()}
REQUESTED AMOUNT: $${Number(application.loanAmount).toLocaleString()}

DOCUMENT ANALYSIS RESULTS:
${documentAnalysis.map(doc => `
- Document Type: ${doc.documentType}
- Key Insights: ${doc.keyInsights.join('; ')}
- Red Flags: ${doc.redFlags.join('; ') || 'None'}
- Strengths: ${doc.strengths.join('; ') || 'None'}
- Confidence: ${doc.confidence}%
`).join('\n')}

BUSINESS RESEARCH:
- Found Online: ${businessResearch.foundOnline}
- Website: ${businessResearch.website || 'None'}
- Overall Risk Level: ${businessResearch.overallAssessment.riskLevel}
- Legitimacy: ${businessResearch.overallAssessment.legitimacy}

FINANCIAL HEALTH SCORE: ${financialHealthScore}/100

RISK ASSESSMENT: ${riskAssessment.overallRisk}
- Document Risks: ${riskAssessment.documentRisks.join('; ') || 'None'}
- Business Risks: ${riskAssessment.businessRisks.join('; ') || 'None'}
- Owner Risks: ${riskAssessment.ownerRisks.join('; ') || 'None'}

Provide your recommendation in JSON format:
{
  "decision": "APPROVE|CONDITIONAL_APPROVE|DECLINE|REQUEST_MORE_INFO",
  "reasoning": "Detailed explanation of decision",
  "conditions": ["condition1", "condition2"] or [],
  "recommendedAmount": number or null,
  "recommendedTerms": ["term1", "term2"] or []
}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500
      });

      const recommendation = JSON.parse(response.choices[0].message.content);
      
      return {
        decision: recommendation.decision || 'REQUEST_MORE_INFO',
        reasoning: recommendation.reasoning || 'Analysis completed with limited data',
        conditions: recommendation.conditions || [],
        recommendedAmount: recommendation.recommendedAmount,
        recommendedTerms: recommendation.recommendedTerms || []
      };
      
    } catch (error) {
      console.error('Error generating recommendation:', error);
      return {
        decision: 'REQUEST_MORE_INFO' as const,
        reasoning: 'Unable to generate recommendation due to analysis limitations',
        conditions: ['Manual review required'],
        recommendedAmount: null,
        recommendedTerms: []
      };
    }
  }
  
  private extractKeyFindings(
    documentAnalysis: DocumentInsights[], 
    businessResearch: BusinessIntelligence
  ): string[] {
    const findings = [];
    
    // Document findings
    for (const doc of documentAnalysis) {
      if (doc.confidence > 50) {
        findings.push(...doc.keyInsights);
      }
    }
    
    // Business research findings
    if (businessResearch.foundOnline) {
      findings.push(`Company has verified online presence with website: ${businessResearch.website}`);
    } else {
      findings.push('Limited online presence - may indicate newer or smaller business');
    }
    
    if (businessResearch.socialMedia.reviews.length > 0) {
      const avgRating = businessResearch.socialMedia.reviews.reduce((sum, review) => sum + review.rating, 0) / businessResearch.socialMedia.reviews.length;
      findings.push(`Average customer rating: ${avgRating.toFixed(1)}/5.0`);
    }
    
    // Owner verification
    const verifiedOwners = businessResearch.ownerBackground.filter(owner => owner.found).length;
    if (verifiedOwners > 0) {
      findings.push(`${verifiedOwners} of ${businessResearch.ownerBackground.length} owners verified online`);
    }
    
    return findings.slice(0, 10); // Top 10 findings
  }
  
  private calculateConfidence(
    documentAnalysis: DocumentInsights[], 
    businessResearch: BusinessIntelligence
  ): number {
    // Average document confidence
    const docConfidences = documentAnalysis.map(doc => doc.confidence);
    const avgDocConfidence = docConfidences.length > 0 ? 
      docConfidences.reduce((sum, conf) => sum + conf, 0) / docConfidences.length : 0;
    
    // Business research confidence
    const researchConfidence = businessResearch.overallAssessment.confidence;
    
    // Overall confidence (weighted average)
    return Math.round((avgDocConfidence * 0.6) + (researchConfidence * 0.4));
  }
}

export const realLoanAnalyzer = new RealLoanAnalyzer();