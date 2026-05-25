import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function ComprehensiveLoanApplication() {
  const [, setLocation] = useLocation();
  const [applicationId, setApplicationId] = useState<number | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Get current application from URL or session
  const { data: application, isLoading: appLoading } = useQuery({
    queryKey: ["/api/loan-applications"],
    select: (data: any[]) => data[data.length - 1], // Get latest application
  });

  // Mutation for starting enhanced analysis
  const enhancedAnalysisMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/loan-applications/${id}/enhanced-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Analysis failed");
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisStatus("success");
      setAnalysisResult(data);
      console.log("Enhanced analysis complete:", data);
    },
    onError: (error) => {
      setAnalysisStatus("error");
      console.error("Analysis error:", error);
    },
  });

  const handleStartAnalysis = async () => {
    if (!application?.id) {
      alert("No application found");
      return;
    }

    setApplicationId(application.id);
    setAnalysisStatus("loading");
    await enhancedAnalysisMutation.mutateAsync(application.id);
  };

  const handleViewResults = () => {
    if (application?.id) {
      setLocation(`/loan/${application.id}`);
    }
  };

  if (appLoading) {
    return <div className="p-8">Loading application...</div>;
  }

  if (!application) {
    return <div className="p-8">No application found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Application Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{application.businessName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Industry</p>
                <p className="font-semibold">{application.industry}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Annual Revenue</p>
                <p className="font-semibold">${application.annualRevenue?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Loan Amount</p>
                <p className="font-semibold">${application.loanAmount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Score</p>
                <p className="font-semibold">{application.score} ({application.grade})</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Institutional-Quality Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700">
              Perform comprehensive AI-driven underwriting analysis using:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Claude (Anthropic):</strong> Deep financial analysis, profitability, cash flow, liquidity, leverage, risk assessment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>GPT-4 (OpenAI):</strong> Business viability, market position, competitive advantage, growth potential, operational efficiency</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Perplexity:</strong> Owner background research, professional history, online presence, credit indicators, industry expertise</span>
              </li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-900">
                ℹ️ Analysis will examine uploaded documents, extract financial metrics, research ownership, 
                assess market conditions, and generate a comprehensive lending recommendation.
              </p>
            </div>

            {/* Status Messages */}
            {analysisStatus === "loading" && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded">
                <Loader className="animate-spin text-blue-600" size={20} />
                <span className="text-blue-900">
                  Running comprehensive analysis... This may take 30-60 seconds.
                </span>
              </div>
            )}

            {analysisStatus === "success" && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded">
                <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-green-900 font-semibold">Analysis Complete!</p>
                  <p className="text-sm text-green-800 mt-1">
                    <strong>Recommendation:</strong> {analysisResult?.recommendation}
                  </p>
                </div>
              </div>
            )}

            {analysisStatus === "error" && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-red-900 font-semibold">Analysis Failed</p>
                  <p className="text-sm text-red-800 mt-1">
                    Please check that all documents are uploaded and try again.
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Details */}
            {analysisResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Financial Health</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analysisResult.analysis?.combinedAssessment?.financialHealth?.score || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Business Viability</p>
                    <p className="text-2xl font-bold text-green-600">
                      {analysisResult.analysis?.combinedAssessment?.businessViability?.score || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Owner Credibility</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analysisResult.analysis?.combinedAssessment?.ownershipQuality?.credibility || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Financial Findings:</p>
                  <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                    {JSON.stringify(analysisResult.analysis?.financialAnalysis, null, 2)}
                  </pre>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Business Analysis:</p>
                  <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                    {JSON.stringify(analysisResult.analysis?.businessAnalysis, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {analysisStatus !== "loading" && (
                <Button
                  onClick={handleStartAnalysis}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={analysisStatus === "loading"}
                >
                  {analysisStatus === "loading" ? "Analyzing..." : "Start Enhanced Analysis"}
                </Button>
              )}

              {analysisStatus === "success" && (
                <Button
                  onClick={handleViewResults}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  View Full Report
                </Button>
              )}

              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="flex-1"
              >
                Back to Applicants
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
