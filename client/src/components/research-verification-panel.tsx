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
              {/* High Risk Factors */}
              {highRiskFactors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium flex items-center text-red-700">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    High Risk Factors
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {highRiskFactors.slice(0, 5).map((factor, i) => (
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
                    {moderateRiskFactors.slice(0, 5).map((factor, i) => (
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
                    {mitigatingFactors.slice(0, 5).map((factor, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {highRiskFactors.length === 0 && moderateRiskFactors.length === 0 && mitigatingFactors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No specific risk or mitigating factors were identified in the deep research.
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