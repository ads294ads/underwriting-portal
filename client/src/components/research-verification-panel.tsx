import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { VerificationStatus, ApplicationVerificationStatus } from './verification-status';
import { Badge } from "@/components/ui/badge";
import { Search, Shield, AlertCircle, CheckCircle2, Building, User } from 'lucide-react';

interface ResearchVerificationPanelProps {
  deepResearchData: {
    companyAnalysis?: {
      overview: string;
      legalIssues: string[];
      financialRedFlags: string[];
      reputationInsights: string[];
      industryPosition?: string[];
      marketTrends?: string[];
      executiveSummary?: string;
      detailedFindings?: Record<string, string[]>;
      specificEvents?: {
        event: string;
        date: string;
        impact: string;
        source: string;
      }[];
      financialMetrics?: {
        metric: string;
        value: string;
        industryAverage: string;
        trend: string;
      }[];
      sources?: string[];
      score: number;
      highRiskFactors?: string[];
      moderateRiskFactors?: string[];
      mitigatingFactors?: string[];
    };
    ownerAnalysis?: {
      overview: string;
      legalIssues: string[];
      financialRedFlags: string[];
      reputationInsights: string[];
      managementCapabilities?: string[];
      executiveSummary?: string;
      detailedFindings?: Record<string, string[]>;
      priorBusinessHistory?: {
        companyName: string;
        role: string;
        years: string;
        outcome: string;
      }[];
      sources?: string[];
      score: number;
      highRiskFactors?: string[];
      moderateRiskFactors?: string[];
      mitigatingFactors?: string[];
    };
    verificationConfidence?: number;
    grade: string;
    combinedScore: number;
  };
}

/**
 * Component that displays deep research results and verification status
 */
export const ResearchVerificationPanel: React.FC<ResearchVerificationPanelProps> = ({ 
  deepResearchData
}) => {
  // Calculate confidence values, using default if not available
  const overallConfidence = deepResearchData.verificationConfidence || 0.5;
  const companyConfidence = overallConfidence * 1.1; // Just a slight variation for example
  const ownerConfidence = overallConfidence * 0.9; // Just a slight variation for example
  
  // Get the company and owner analysis from deep research data
  const companyAnalysis = deepResearchData.companyAnalysis || {
    overview: "Company analysis not available.",
    legalIssues: [],
    financialRedFlags: [],
    reputationInsights: [],
    score: 0,
    highRiskFactors: [],
    moderateRiskFactors: [],
    mitigatingFactors: []
  };
  
  const ownerAnalysis = deepResearchData.ownerAnalysis || {
    overview: "Owner analysis not available.",
    legalIssues: [],
    financialRedFlags: [],
    reputationInsights: [],
    score: 0,
    highRiskFactors: [],
    moderateRiskFactors: [],
    mitigatingFactors: []
  };
  
  // Prepare risk factors from both analyses
  const highRiskFactors = [
    ...(companyAnalysis.highRiskFactors || []),
    ...(ownerAnalysis.highRiskFactors || [])
  ];
  
  const moderateRiskFactors = [
    ...(companyAnalysis.moderateRiskFactors || []),
    ...(ownerAnalysis.moderateRiskFactors || [])
  ];
  
  const mitigatingFactors = [
    ...(companyAnalysis.mitigatingFactors || []),
    ...(ownerAnalysis.mitigatingFactors || [])
  ];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Search className="mr-2 h-5 w-5" />
              Deep Research Results
            </CardTitle>
            <CardDescription>
              AI-powered verification and research on the company and owners
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1 font-semibold">
            Grade: {deepResearchData.grade}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="verification">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verification" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="findings" className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Key Findings
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center">
              <Search className="mr-2 h-4 w-4" />
              Detailed Analysis
            </TabsTrigger>
          </TabsList>
          
          {/* Verification Tab */}
          <TabsContent value="verification" className="pt-4">
            <ApplicationVerificationStatus
              companyConfidence={companyConfidence}
              ownerConfidence={ownerConfidence}
              overallConfidence={overallConfidence}
            />
          </TabsContent>
          
          {/* Key Findings Tab */}
          <TabsContent value="findings" className="pt-4">
            <div className="space-y-6">
              {/* Key Summary Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold mb-2">Research Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Company Overview</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{companyAnalysis.overview}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Owner Overview</h4>
                    <p className="text-sm text-gray-600 line-clamp-3">{ownerAnalysis.overview}</p>
                  </div>
                </div>
              </div>
              
              {/* Specific Notable Events Section - New! */}
              {companyAnalysis.specificEvents && companyAnalysis.specificEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center text-indigo-700">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Notable Events
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {companyAnalysis.specificEvents.slice(0, 3).map((event, i) => (
                      <div key={i} className="bg-indigo-50 p-3 rounded-md border border-indigo-100">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-indigo-900">{event.event}</p>
                          <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded">{event.date}</span>
                        </div>
                        <p className="text-sm text-indigo-700 mt-1">Impact: {event.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Key Financial Metrics - New! */}
              {companyAnalysis.financialMetrics && companyAnalysis.financialMetrics.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center text-emerald-700">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Key Financial Metrics
                  </h3>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {companyAnalysis.financialMetrics.slice(0, 4).map((metric, i) => (
                      <div key={i} className="bg-emerald-50 p-3 rounded-md border border-emerald-100">
                        <p className="font-medium text-emerald-900">{metric.metric}</p>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-emerald-700">
                            <span className="font-medium">Value:</span> {metric.value}
                          </p>
                          <p className="text-sm text-emerald-700">
                            <span className="font-medium">Industry Avg:</span> {metric.industryAverage}
                          </p>
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">Trend: {metric.trend}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Prior Business History - New! */}
              {ownerAnalysis.priorBusinessHistory && ownerAnalysis.priorBusinessHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center text-purple-700">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Owner Business History
                  </h3>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {ownerAnalysis.priorBusinessHistory.slice(0, 2).map((history, i) => (
                      <div key={i} className="bg-purple-50 p-3 rounded-md border border-purple-100">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-purple-900">{history.companyName}</p>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">{history.years}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <p className="text-sm text-purple-700">Role: {history.role}</p>
                          <p className="text-sm text-purple-700">Outcome: {history.outcome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* High Risk Factors */}
              {highRiskFactors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center text-red-700">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    High Risk Factors
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {highRiskFactors.map((factor, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Moderate Risk Factors */}
              {moderateRiskFactors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center text-amber-700">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Moderate Risk Factors
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {moderateRiskFactors.map((factor, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-amber-600 mr-2">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Mitigating Factors */}
              {mitigatingFactors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center text-green-700">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Mitigating Factors
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {mitigatingFactors.map((factor, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* No data fallback */}
              {highRiskFactors.length === 0 && moderateRiskFactors.length === 0 && mitigatingFactors.length === 0 && 
               !companyAnalysis.specificEvents && !companyAnalysis.financialMetrics && !ownerAnalysis.priorBusinessHistory && (
                <div className="text-center py-8 text-gray-500">
                  No specific findings were identified in the deep research.
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Detailed Analysis Tab */}
          <TabsContent value="details" className="pt-4">
            <div className="space-y-6">
              {/* Company Analysis */}
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Company Analysis
                  <Badge variant="outline" className="ml-2">
                    Score: {companyAnalysis.score}/100
                  </Badge>
                </h3>
                <p className="mt-2 text-gray-700">{companyAnalysis.overview}</p>
                
                <div className="mt-4 space-y-4">
                  {/* Executive Summary */}
                  {companyAnalysis.executiveSummary && (
                    <div>
                      <h4 className="text-md font-medium text-gray-800">Executive Summary</h4>
                      <p className="mt-1 text-gray-700">{companyAnalysis.executiveSummary}</p>
                    </div>
                  )}
                
                  {/* Industry Position */}
                  {companyAnalysis.industryPosition && companyAnalysis.industryPosition.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-purple-700">Industry Position</h4>
                      <ul className="mt-1 space-y-1">
                        {companyAnalysis.industryPosition.map((position, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-purple-600 mr-2">•</span>
                            <span>{position}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Market Trends */}
                  {companyAnalysis.marketTrends && companyAnalysis.marketTrends.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-blue-700">Market Trends</h4>
                      <ul className="mt-1 space-y-1">
                        {companyAnalysis.marketTrends.map((trend, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Specific Events */}
                  {companyAnalysis.specificEvents && companyAnalysis.specificEvents.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-indigo-700">Notable Events</h4>
                      <div className="mt-2 space-y-2">
                        {companyAnalysis.specificEvents.map((event, i) => (
                          <div key={i} className="bg-gray-50 rounded-md p-2 border border-gray-200">
                            <p className="font-medium text-gray-800">{event.event}</p>
                            <div className="flex flex-wrap gap-x-4 text-sm mt-1">
                              <span className="text-gray-600">Date: {event.date}</span>
                              <span className="text-gray-600">Impact: {event.impact}</span>
                              {event.source && <span className="text-gray-500 text-xs">Source: {event.source}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Financial Metrics */}
                  {companyAnalysis.financialMetrics && companyAnalysis.financialMetrics.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-emerald-700">Financial Metrics</h4>
                      <div className="mt-2 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Industry Avg</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {companyAnalysis.financialMetrics.map((metric, i) => (
                              <tr key={i}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{metric.metric}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{metric.value}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{metric.industryAverage}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{metric.trend}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Legal Issues */}
                  {companyAnalysis.legalIssues.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-red-700">Legal Issues</h4>
                      <ul className="mt-1 space-y-1">
                        {companyAnalysis.legalIssues.map((issue, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-red-600 mr-2">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Financial Red Flags */}
                  {companyAnalysis.financialRedFlags.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-red-700">Financial Red Flags</h4>
                      <ul className="mt-1 space-y-1">
                        {companyAnalysis.financialRedFlags.map((flag, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-red-600 mr-2">•</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Reputation Insights */}
                  {companyAnalysis.reputationInsights.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-blue-700">Reputation Insights</h4>
                      <ul className="mt-1 space-y-1">
                        {companyAnalysis.reputationInsights.map((insight, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Sources if available */}
                  {companyAnalysis.sources && companyAnalysis.sources.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500">Sources</h4>
                      <ul className="mt-1 space-y-1 text-xs text-gray-500">
                        {companyAnalysis.sources.map((source, i) => (
                          <li key={i}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Owner Analysis */}
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Owner Analysis
                  <Badge variant="outline" className="ml-2">
                    Score: {ownerAnalysis.score}/100
                  </Badge>
                </h3>
                <p className="mt-2 text-gray-700">{ownerAnalysis.overview}</p>
                
                <div className="mt-4 space-y-4">
                  {/* Executive Summary */}
                  {ownerAnalysis.executiveSummary && (
                    <div>
                      <h4 className="text-md font-medium text-gray-800">Executive Summary</h4>
                      <p className="mt-1 text-gray-700">{ownerAnalysis.executiveSummary}</p>
                    </div>
                  )}
                
                  {/* Management Capabilities */}
                  {ownerAnalysis.managementCapabilities && ownerAnalysis.managementCapabilities.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-green-700">Management Capabilities</h4>
                      <ul className="mt-1 space-y-1">
                        {ownerAnalysis.managementCapabilities.map((capability, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            <span>{capability}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Prior Business History */}
                  {ownerAnalysis.priorBusinessHistory && ownerAnalysis.priorBusinessHistory.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-indigo-700">Prior Business History</h4>
                      <div className="mt-2 space-y-2">
                        {ownerAnalysis.priorBusinessHistory.map((history, i) => (
                          <div key={i} className="bg-gray-50 rounded-md p-2 border border-gray-200">
                            <p className="font-medium text-gray-800">{history.companyName}</p>
                            <div className="flex flex-wrap gap-x-4 text-sm mt-1">
                              <span className="text-gray-600">Role: {history.role}</span>
                              <span className="text-gray-600">Years: {history.years}</span>
                              <span className="text-gray-600">Outcome: {history.outcome}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                
                  {/* Legal Issues */}
                  {ownerAnalysis.legalIssues.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-red-700">Legal Issues</h4>
                      <ul className="mt-1 space-y-1">
                        {ownerAnalysis.legalIssues.map((issue, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-red-600 mr-2">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Financial Red Flags */}
                  {ownerAnalysis.financialRedFlags.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-red-700">Financial Red Flags</h4>
                      <ul className="mt-1 space-y-1">
                        {ownerAnalysis.financialRedFlags.map((flag, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-red-600 mr-2">•</span>
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Reputation Insights */}
                  {ownerAnalysis.reputationInsights.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-blue-700">Reputation Insights</h4>
                      <ul className="mt-1 space-y-1">
                        {ownerAnalysis.reputationInsights.map((insight, i) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Sources if available */}
                  {ownerAnalysis.sources && ownerAnalysis.sources.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500">Sources</h4>
                      <ul className="mt-1 space-y-1 text-xs text-gray-500">
                        {ownerAnalysis.sources.map((source, i) => (
                          <li key={i}>{source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResearchVerificationPanel;