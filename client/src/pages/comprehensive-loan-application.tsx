import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Building2, FileText, TrendingUp, Shield, Users, Target, 
  CheckCircle, AlertTriangle, DollarSign, Clock, RefreshCcw,
  Download, ArrowLeft
} from "lucide-react";
import ComprehensiveLoanAnalysis from "@/components/comprehensive-loan-analysis";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ProgressUpdate {
  stage: string;
  message: string;
  progress: number;
  detail?: string;
  applicationId: number;
}

export default function ComprehensiveLoanApplication() {
  const [match, params] = useRoute("/loan-applications/:id/comprehensive");
  const [progressData, setProgressData] = useState<ProgressUpdate | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  const applicationId = params?.id ? parseInt(params.id) : null;

  // Fetch application data
  const { data: application, isLoading: isLoadingApp } = useQuery({
    queryKey: ['/api/loan-applications', applicationId],
    enabled: !!applicationId,
  });

  // Check if comprehensive analysis has already been performed
  const hasComprehensiveAnalysis = application && 'financialAnalysis' in application && 
    application.financialAnalysis && 'lenderRecommendation' in application && application.lenderRecommendation;

  // Set up WebSocket for real-time progress updates
  useEffect(() => {
    if (!applicationId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log("Connected to WebSocket for progress updates");
        setWebsocket(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress' && data.applicationId === applicationId) {
            setProgressData(data);
            
            if (data.progress === 100 && data.stage === 'complete') {
              setAnalysisComplete(true);
              // Refetch application data to get the new analysis results
              queryClient.invalidateQueries({ queryKey: ['/api/loan-applications', applicationId] });
            }
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      ws.onclose = () => {
        console.log("WebSocket connection closed");
        setWebsocket(null);
      };
      
      return () => {
        ws.close();
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [applicationId]);

  // Mutation to perform comprehensive analysis
  const comprehensiveAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/loan-applications/${applicationId}/comprehensive-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to perform comprehensive analysis');
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Comprehensive analysis completed:", data);
      queryClient.invalidateQueries({ queryKey: ['/api/loan-applications', applicationId] });
      setAnalysisComplete(true);
      toast({
        title: "Analysis Complete",
        description: "Comprehensive business analysis has been completed successfully.",
      });
    },
    onError: (error) => {
      console.error("Comprehensive analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to complete comprehensive analysis. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Function to start comprehensive analysis
  const startComprehensiveAnalysis = () => {
    setProgressData(null);
    setAnalysisComplete(false);
    comprehensiveAnalysisMutation.mutate();
  };

  // Function to download institutional PDF
  const downloadInstitutionalPDF = async () => {
    try {
      const response = await fetch(`/api/loan-applications/${applicationId}/institutional-pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF report');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${(application as any)?.businessName || 'Business'}_Institutional_Analysis.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Downloaded",
        description: "Institutional-quality PDF report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("PDF download failed:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoadingApp) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <Clock className="h-8 w-8 animate-spin text-blue-600 mr-3" />
              <span className="text-lg">Loading application data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
            <p className="text-gray-600 mb-4">The requested loan application could not be found.</p>
            <Link href="/loan-applications">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/loan-applications">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Comprehensive Analysis
          </h1>
          <p className="text-lg text-gray-600">{(application as any)?.businessName || 'Business Name'}</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500 mb-1">Loan Request</p>
          <p className="text-2xl font-bold text-gray-900">
            ${Number((application as any)?.loanAmount || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Analysis Status Card */}
      {!hasComprehensiveAnalysis && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Institutional-Quality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Perform comprehensive business analysis with advanced financial metrics, risk assessment, 
              market analysis, and detailed reporting that meets institutional lending standards.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Financial Analysis</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <Shield className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Risk Assessment</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Management Review</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Detailed Report</p>
              </div>
            </div>
            
            <Button 
              onClick={startComprehensiveAnalysis}
              disabled={comprehensiveAnalysisMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {comprehensiveAnalysisMutation.isPending ? (
                <RefreshCcw className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Target className="h-5 w-5 mr-2" />
              )}
              Start Comprehensive Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress Card (shown during analysis) */}
      {progressData && !analysisComplete && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-orange-600 animate-spin" />
              Analysis in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{progressData.message}</span>
                  <span className="text-sm text-gray-500">{progressData.progress}%</span>
                </div>
                <Progress value={progressData.progress} className="w-full" />
              </div>
              
              {progressData.detail && (
                <p className="text-sm text-gray-600">{progressData.detail}</p>
              )}
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {progressData.stage.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Analysis Results */}
      {hasComprehensiveAnalysis && (
        <>
          {/* Success Banner */}
          <Card className="border-l-4 border-l-green-500 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Comprehensive analysis complete - Institutional-quality report ready
                  </span>
                </div>
                <Button 
                  onClick={downloadInstitutionalPDF}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Comprehensive Analysis Component */}
          <ComprehensiveLoanAnalysis
            application={application}
            analyses={{
              financialAnalysis: (application as any)?.financialAnalysis,
              riskAssessment: (application as any)?.riskAssessment,
              marketAnalysis: (application as any)?.marketAnalysis,
              managementAnalysis: (application as any)?.managementAnalysis,
              collateralAnalysis: (application as any)?.collateralAnalysis,
              complianceCheck: (application as any)?.complianceCheck,
              lenderRecommendation: (application as any)?.lenderRecommendation
            }}
            onGenerateReport={downloadInstitutionalPDF}
          />
        </>
      )}

      {/* Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/loan-applications">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
              </Link>
              
              {hasComprehensiveAnalysis && (
                <Button 
                  onClick={startComprehensiveAnalysis}
                  variant="outline"
                  disabled={comprehensiveAnalysisMutation.isPending}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Re-run Analysis
                </Button>
              )}
            </div>
            
            {hasComprehensiveAnalysis && (
              <Button 
                onClick={downloadInstitutionalPDF}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Institutional Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}