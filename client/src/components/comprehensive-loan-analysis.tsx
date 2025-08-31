import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  DollarSign, Building, Users, FileText, Shield, 
  BarChart3, PieChart, Target, Award, Clock
} from "lucide-react";
import { FinancialAnalysis, RiskAssessment, MarketAnalysis, ManagementAnalysis, CollateralAnalysis, ComplianceCheck, LenderRecommendation } from "@shared/enhanced-schema";

interface ComprehensiveLoanAnalysisProps {
  application: any;
  analyses: {
    financialAnalysis?: FinancialAnalysis;
    riskAssessment?: RiskAssessment;
    marketAnalysis?: MarketAnalysis;
    managementAnalysis?: ManagementAnalysis;
    collateralAnalysis?: CollateralAnalysis;
    complianceCheck?: ComplianceCheck;
    lenderRecommendation?: LenderRecommendation;
  };
  isLoading?: boolean;
  onGenerateReport?: () => void;
}

export default function ComprehensiveLoanAnalysis({ 
  application, 
  analyses, 
  isLoading = false,
  onGenerateReport 
}: ComprehensiveLoanAnalysisProps) {
  const [activeTab, setActiveTab] = useState("executive");

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "Approve": return "bg-green-100 text-green-800 border-green-200";
      case "Conditional Approval": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Decline": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-green-600";
      case "Medium-Low": return "text-green-500";
      case "Medium": return "text-yellow-600";
      case "Medium-High": return "text-orange-600";
      case "High": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Performing Comprehensive Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={33} className="w-full" />
              <p className="text-sm text-gray-600">
                Analyzing financial statements, assessing risk factors, and generating institutional-quality report...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Executive Summary Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building className="h-6 w-6 text-blue-600" />
                {application.businessName}
              </CardTitle>
              <p className="text-lg text-gray-600">{application.industry} • {application.yearsInBusiness} years in business</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Loan Request</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Number(application.loanAmount).toLocaleString()}
              </p>
            </div>
          </div>
        </CardHeader>
        
        {analyses.lenderRecommendation && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Badge className={`px-4 py-2 text-sm font-medium ${getRecommendationColor(analyses.lenderRecommendation.approvalRecommendation)}`}>
                  {analyses.lenderRecommendation.approvalRecommendation}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">Recommendation</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  ${analyses.lenderRecommendation.recommendedLoanAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Recommended Amount</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {analyses.lenderRecommendation.recommendedTerms.interestRate}
                </p>
                <p className="text-xs text-gray-500">Recommended Rate</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${getRiskColor(analyses.riskAssessment?.overallRiskProfile.riskRating || 'Medium')}`}>
                  {analyses.riskAssessment?.overallRiskProfile.riskRating || 'Assessing...'}
                </p>
                <p className="text-xs text-gray-500">Risk Rating</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="executive">Executive</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
          <TabsTrigger value="collateral">Collateral</TabsTrigger>
          <TabsTrigger value="recommendation">Decision</TabsTrigger>
        </TabsList>

        {/* Executive Summary Tab */}
        <TabsContent value="executive" className="space-y-6">
          {analyses.lenderRecommendation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-base leading-relaxed">{analyses.lenderRecommendation.executiveSummary}</p>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Strengths</h4>
                    {analyses.riskAssessment?.overallRiskProfile.riskMitigationStrategies.slice(0, 3).map((strength, index) => (
                      <div key={index} className="flex items-start gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Key Concerns</h4>
                    {analyses.riskAssessment?.overallRiskProfile.keyRiskFactors.slice(0, 3).map((concern, index) => (
                      <div key={index} className="flex items-start gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{concern}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Analysis Tab */}
        <TabsContent value="financial" className="space-y-6">
          {analyses.financialAnalysis && (
            <>
              {/* Profitability Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Profitability Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{analyses.financialAnalysis.profitabilityAnalysis.grossMargin}%</p>
                      <p className="text-sm text-gray-600">Gross Margin</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{analyses.financialAnalysis.profitabilityAnalysis.operatingMargin}%</p>
                      <p className="text-sm text-gray-600">Operating Margin</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{analyses.financialAnalysis.profitabilityAnalysis.ebitdaMargin}%</p>
                      <p className="text-sm text-gray-600">EBITDA Margin</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{analyses.financialAnalysis.profitabilityAnalysis.netMargin}%</p>
                      <p className="text-sm text-gray-600">Net Margin</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">ROI Analysis</h4>
                      <p className="text-sm text-gray-700">{analyses.financialAnalysis.profitabilityAnalysis.roiAnalysis}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Industry Comparison</h4>
                      <p className="text-sm text-gray-700">{analyses.financialAnalysis.profitabilityAnalysis.industryComparison}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Profitability Trends</h4>
                      <ul className="space-y-1">
                        {analyses.financialAnalysis.profitabilityAnalysis.profitabilityTrends.map((trend, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm text-gray-700">{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Flow Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Cash Flow Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">
                        ${analyses.financialAnalysis.cashFlowAnalysis.operatingCashFlow.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Operating Cash Flow</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">
                        ${analyses.financialAnalysis.cashFlowAnalysis.freeCashFlow.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Free Cash Flow</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">
                        {analyses.financialAnalysis.cashFlowAnalysis.cashConversionCycle} days
                      </p>
                      <p className="text-sm text-gray-600">Cash Conversion Cycle</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Seasonality Analysis</h4>
                      <p className="text-sm text-gray-700">{analyses.financialAnalysis.cashFlowAnalysis.seasonalityAnalysis}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Working Capital Analysis</h4>
                      <p className="text-sm text-gray-700">{analyses.financialAnalysis.cashFlowAnalysis.workingCapitalAnalysis}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Liquidity Ratios</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="font-bold text-blue-900">{analyses.financialAnalysis.cashFlowAnalysis.liquidityRatios.currentRatio}</p>
                          <p className="text-xs text-blue-700">Current Ratio</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="font-bold text-blue-900">{analyses.financialAnalysis.cashFlowAnalysis.liquidityRatios.quickRatio}</p>
                          <p className="text-xs text-blue-700">Quick Ratio</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <p className="font-bold text-blue-900">{analyses.financialAnalysis.cashFlowAnalysis.liquidityRatios.cashRatio}</p>
                          <p className="text-xs text-blue-700">Cash Ratio</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Debt Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    Debt Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">
                        ${analyses.financialAnalysis.debtAnalysis.totalDebt.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Debt</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{analyses.financialAnalysis.debtAnalysis.debtToEquityRatio}</p>
                      <p className="text-sm text-gray-600">Debt-to-Equity</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{analyses.financialAnalysis.debtAnalysis.debtServiceCoverageRatio}</p>
                      <p className="text-sm text-gray-600">DSCR</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{analyses.financialAnalysis.debtAnalysis.interestCoverageRatio}</p>
                      <p className="text-sm text-gray-600">Interest Coverage</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Credit Utilization</h4>
                      <p className="text-sm text-gray-700">{analyses.financialAnalysis.debtAnalysis.creditUtilization}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Debt Capacity Assessment</h4>
                      <p className="text-sm text-gray-700">{analyses.financialAnalysis.debtAnalysis.debtCapacityAssessment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="space-y-6">
          {analyses.riskAssessment && (
            <>
              {/* Overall Risk Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Overall Risk Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className={`inline-flex px-6 py-3 rounded-full text-xl font-bold ${getRiskColor(analyses.riskAssessment.overallRiskProfile.riskRating)} bg-gray-50`}>
                      {analyses.riskAssessment.overallRiskProfile.riskRating} Risk
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Risk Factors</h4>
                      <ul className="space-y-2">
                        {analyses.riskAssessment.overallRiskProfile.keyRiskFactors.map((factor, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Risk Mitigation Strategies</h4>
                      <ul className="space-y-2">
                        {analyses.riskAssessment.overallRiskProfile.riskMitigationStrategies.map((strategy, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{strategy}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Credit Risk */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Credit Risk</CardTitle>
                    <Badge className={`w-fit ${getRiskColor(analyses.riskAssessment.creditRisk.riskRating)} bg-gray-100`}>
                      {analyses.riskAssessment.creditRisk.riskRating} Risk
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Credit Score</span>
                        <span className="font-medium">{analyses.riskAssessment.creditRisk.creditScore}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Payment History</p>
                        <p className="text-sm">{analyses.riskAssessment.creditRisk.paymentHistory}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Credit Utilization</p>
                        <p className="text-sm">{analyses.riskAssessment.creditRisk.creditUtilization}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Operational Risk */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Operational Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Business Model</p>
                        <p className="text-sm">{analyses.riskAssessment.operationalRisk.businessModel}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Customer Concentration</p>
                        <p className="text-sm">{analyses.riskAssessment.operationalRisk.customerConcentration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Operational Efficiency</p>
                        <p className="text-sm">{analyses.riskAssessment.operationalRisk.operationalEfficiency}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Industry Risk */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Industry Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Growth Rate</span>
                        <span className="font-medium">{analyses.riskAssessment.industryRisk.industryGrowthRate}%</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Cyclicality Analysis</p>
                        <p className="text-sm">{analyses.riskAssessment.industryRisk.cyclicalityAnalysis}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Industry Outlook</p>
                        <p className="text-sm">{analyses.riskAssessment.industryRisk.industryOutlook}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Risk */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Liquidity Risk</p>
                        <p className="text-sm">{analyses.riskAssessment.financialRisk.liquidityRisk}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Leverage Risk</p>
                        <p className="text-sm">{analyses.riskAssessment.financialRisk.leverageRisk}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Cash Flow Volatility</p>
                        <p className="text-sm">{analyses.riskAssessment.financialRisk.cashFlowVolatility}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="market" className="space-y-6">
          {analyses.marketAnalysis && (
            <>
              {/* Industry Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Industry Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{analyses.marketAnalysis.industryOverview.industrySize}</p>
                      <p className="text-sm text-gray-600">Industry Size</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{analyses.marketAnalysis.industryOverview.growthRate}%</p>
                      <p className="text-sm text-gray-600">Growth Rate</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{analyses.marketAnalysis.industryOverview.maturityStage}</p>
                      <p className="text-sm text-gray-600">Maturity Stage</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Industry Drivers</h4>
                      <ul className="space-y-2">
                        {analyses.marketAnalysis.industryOverview.keyDrivers.map((driver, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm text-gray-700">{driver}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Industry Challenges</h4>
                      <ul className="space-y-2">
                        {analyses.marketAnalysis.industryOverview.challenges.map((challenge, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm text-gray-700">{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competitive Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Competitive Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-1">Market Share</p>
                    <p className="text-lg font-semibold">{analyses.marketAnalysis.competitivePosition.marketShare}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Competitive Advantages</h4>
                      <ul className="space-y-2">
                        {analyses.marketAnalysis.competitivePosition.competitiveAdvantages.map((advantage, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{advantage}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Competitive Threats</h4>
                      <ul className="space-y-2">
                        {analyses.marketAnalysis.competitivePosition.competitiveThreats.map((threat, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{threat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                      <ul className="space-y-1">
                        {analyses.marketAnalysis.marketOpportunity.growthOpportunities.map((opportunity, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm text-gray-700">{opportunity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Market Trends</h4>
                      <ul className="space-y-1">
                        {analyses.marketAnalysis.marketOpportunity.marketTrends.map((trend, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-sm text-gray-700">{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Management Analysis Tab */}
        <TabsContent value="management" className="space-y-6">
          {analyses.managementAnalysis && (
            <>
              {/* Leadership Team */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    Leadership Team Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analyses.managementAnalysis.leadershipTeam.keyExecutives.map((executive, index) => (
                      <div key={index} className="border-l-4 border-l-indigo-500 pl-4">
                        <h4 className="font-semibold text-gray-900">{executive.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{executive.position}</p>
                        <p className="text-sm text-gray-700 mb-2">{executive.experience}</p>
                        <p className="text-sm text-gray-700 mb-3">{executive.trackRecord}</p>
                        
                        {executive.qualifications.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900 mb-1">Qualifications:</p>
                            <ul className="text-sm text-gray-700">
                              {executive.qualifications.map((qual, qIndex) => (
                                <li key={qIndex} className="flex items-start gap-1">
                                  <span>•</span>
                                  <span>{qual}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {executive.riskFactors.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 mb-1">Risk Factors:</p>
                            <ul className="text-sm text-red-600">
                              {executive.riskFactors.map((risk, rIndex) => (
                                <li key={rIndex} className="flex items-start gap-1">
                                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Leadership Stability</h4>
                      <p className="text-sm text-gray-700">{analyses.managementAnalysis.leadershipTeam.leadershipStability}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Succession Planning</h4>
                      <p className="text-sm text-gray-700">{analyses.managementAnalysis.leadershipTeam.successionPlanning}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Management Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle>Management Capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Strategic Planning</h4>
                      <p className="text-sm text-gray-700 mb-4">{analyses.managementAnalysis.managementCapabilities.strategicPlanning}</p>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">Operational Execution</h4>
                      <p className="text-sm text-gray-700 mb-4">{analyses.managementAnalysis.managementCapabilities.operationalExecution}</p>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">Financial Management</h4>
                      <p className="text-sm text-gray-700">{analyses.managementAnalysis.managementCapabilities.financialManagement}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Risk Management</h4>
                      <p className="text-sm text-gray-700 mb-4">{analyses.managementAnalysis.managementCapabilities.riskManagement}</p>
                      
                      <h4 className="font-semibold text-gray-900 mb-2">Corporate Governance</h4>
                      <p className="text-sm text-gray-700">{analyses.managementAnalysis.managementCapabilities.corporateGovernance}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organizational Structure */}
              <Card>
                <CardHeader>
                  <CardTitle>Organizational Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Reporting Structure</h4>
                      <p className="text-sm text-gray-700">{analyses.managementAnalysis.organizationalStructure.reportingLines}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Decision Making Process</h4>
                      <p className="text-sm text-gray-700">{analyses.managementAnalysis.organizationalStructure.decisionMaking}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Cultural Assessment</h4>
                      <p className="text-sm text-gray-700">{analyses.managementAnalysis.organizationalStructure.culturalAssessment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Collateral Analysis Tab */}
        <TabsContent value="collateral" className="space-y-6">
          {analyses.collateralAnalysis && (
            <>
              {/* Overall Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-green-600" />
                    Overall Collateral Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">
                        ${analyses.collateralAnalysis.overallCollateralAssessment.totalCollateralValue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Value</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">
                        {analyses.collateralAnalysis.overallCollateralAssessment.loanToValueRatio}%
                      </p>
                      <p className="text-sm text-gray-600">LTV Ratio</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">
                        {analyses.collateralAnalysis.overallCollateralAssessment.liquidationRecoveryEstimate}%
                      </p>
                      <p className="text-sm text-gray-600">Recovery Rate</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-xl font-bold text-gray-900">
                        {analyses.collateralAnalysis.overallCollateralAssessment.collateralSufficiency}
                      </p>
                      <p className="text-sm text-gray-600">Sufficiency</p>
                    </div>
                  </div>
                  
                  {analyses.collateralAnalysis.overallCollateralAssessment.monitoringRequirements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Monitoring Requirements</h4>
                      <ul className="space-y-2">
                        {analyses.collateralAnalysis.overallCollateralAssessment.monitoringRequirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Collateral Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Real Estate */}
                {analyses.collateralAnalysis.realEstate.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Real Estate Collateral</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyses.collateralAnalysis.realEstate.map((property, index) => (
                          <div key={index} className="border-l-4 border-l-green-500 pl-4">
                            <h5 className="font-semibold text-gray-900">{property.propertyType}</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                              <div>
                                <span className="text-gray-600">Market Value:</span>
                                <span className="font-medium ml-1">${property.marketValue.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Liquidation Value:</span>
                                <span className="font-medium ml-1">${property.liquidationValue.toLocaleString()}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">{property.conditionAssessment}</p>
                            <p className="text-sm text-gray-600 mt-1">Lien Status: {property.lienStatus}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Equipment */}
                {analyses.collateralAnalysis.equipment.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Equipment Collateral</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analyses.collateralAnalysis.equipment.map((equipment, index) => (
                          <div key={index} className="border-l-4 border-l-blue-500 pl-4">
                            <h5 className="font-semibold text-gray-900">{equipment.equipmentType}</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                              <div>
                                <span className="text-gray-600">Market Value:</span>
                                <span className="font-medium ml-1">${equipment.marketValue.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Liquidation Value:</span>
                                <span className="font-medium ml-1">${equipment.liquidationValue.toLocaleString()}</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-2">Age/Condition: {equipment.ageCondition}</p>
                            <p className="text-sm text-gray-600 mt-1">Obsolescence Risk: {equipment.obsolescenceRisk}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Personal Guarantees */}
              {analyses.collateralAnalysis.personalGuarantees.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Guarantees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Guarantor</th>
                            <th className="text-right py-2">Net Worth</th>
                            <th className="text-right py-2">Liquid Assets</th>
                            <th className="text-right py-2">Credit Score</th>
                            <th className="text-right py-2">Guarantee Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyses.collateralAnalysis.personalGuarantees.map((guarantee, index) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 font-medium">{guarantee.guarantorName}</td>
                              <td className="py-2 text-right">${guarantee.netWorth.toLocaleString()}</td>
                              <td className="py-2 text-right">${guarantee.liquidAssets.toLocaleString()}</td>
                              <td className="py-2 text-right">{guarantee.creditScore}</td>
                              <td className="py-2 text-right">${guarantee.guaranteeAmount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Recommendation Tab */}
        <TabsContent value="recommendation" className="space-y-6">
          {analyses.lenderRecommendation && (
            <>
              {/* Primary Recommendation */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Lending Decision
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <Badge className={`px-6 py-3 text-lg font-bold ${getRecommendationColor(analyses.lenderRecommendation.approvalRecommendation)}`}>
                      {analyses.lenderRecommendation.approvalRecommendation}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        ${analyses.lenderRecommendation.recommendedLoanAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Recommended Amount</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {analyses.lenderRecommendation.recommendedTerms.interestRate}
                      </p>
                      <p className="text-sm text-gray-600">Recommended Rate</p>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <p className="text-base leading-relaxed">{analyses.lenderRecommendation.detailedRationale}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Terms & Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Loan Terms</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest Rate:</span>
                          <span className="font-medium">{analyses.lenderRecommendation.recommendedTerms.interestRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Loan Term:</span>
                          <span className="font-medium">{analyses.lenderRecommendation.recommendedTerms.loanTerm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Frequency:</span>
                          <span className="font-medium">{analyses.lenderRecommendation.recommendedTerms.paymentFrequency}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Security Requirements</h4>
                      {analyses.lenderRecommendation.recommendedTerms.collateralRequirements.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Collateral Requirements:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analyses.lenderRecommendation.recommendedTerms.collateralRequirements.map((requirement, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{requirement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {analyses.lenderRecommendation.recommendedTerms.personalGuarantees.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Personal Guarantees:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {analyses.lenderRecommendation.recommendedTerms.personalGuarantees.map((guarantee, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{guarantee}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {analyses.lenderRecommendation.recommendedTerms.financialCovenants.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Financial Covenants</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        {analyses.lenderRecommendation.recommendedTerms.financialCovenants.map((covenant, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{covenant}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conditions & Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Conditions & Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Pre-Closing Conditions</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        {analyses.lenderRecommendation.conditions.preClosingConditions.map((condition, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Ongoing Covenants</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        {analyses.lenderRecommendation.conditions.ongoingCovenants.map((covenant, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{covenant}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Reporting Requirements</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {analyses.lenderRecommendation.conditions.reportingRequirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Monitoring Schedule</h4>
                      <p className="text-sm text-gray-600">{analyses.lenderRecommendation.conditions.monitoringSchedule}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Structures */}
              {analyses.lenderRecommendation.alternativeStructures.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Alternative Loan Structures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyses.lenderRecommendation.alternativeStructures.map((alternative, index) => (
                        <div key={index} className="border-l-4 border-l-gray-300 pl-4">
                          <h4 className="font-semibold text-gray-900">{alternative.structure}</h4>
                          <p className="text-sm text-gray-700 mt-1">{alternative.terms}</p>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-gray-600">Risk Profile: </span>
                              <span className="text-sm font-medium">{alternative.riskProfile}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Suitability: </span>
                              <span className="text-sm font-medium">{alternative.suitability}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate Report Button */}
      {onGenerateReport && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Button 
                onClick={onGenerateReport} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                size="lg"
              >
                <FileText className="h-5 w-5 mr-2" />
                Generate Comprehensive PDF Report
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Generate a detailed institutional-quality report with all analysis findings
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}