import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";

export default function LoanDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = params?.id;

  const { data: application, isLoading, error } = useQuery({
    queryKey: [`/api/loan-applications/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/loan-applications/${id}`);
      if (!response.ok) throw new Error("Failed to load application");
      return response.json();
    },
    enabled: !!id,
  });

  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/loan-applications/${id}/pdf`);
      if (!response.ok) throw new Error("Failed to download PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loan-report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Failed to download PDF: " + err);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error || !application) return <div className="p-8">Application not found</div>;

  const enhancedAnalysis = application.enhancedAnalysis || {};

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">{application.businessName}</h1>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Applicants
          </Button>
        </div>

        {/* Application Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Industry</p>
              <p className="font-semibold">{application.industry}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Years in Business</p>
              <p className="font-semibold">{application.yearsInBusiness}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Annual Revenue</p>
              <p className="font-semibold">${application.annualRevenue?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Loan Amount</p>
              <p className="font-semibold">${application.loanAmount?.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Initial Score */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>LendScore Assessment</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-3xl font-bold text-blue-600">{application.score}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Grade</p>
              <p className="text-3xl font-bold text-green-600">{application.grade}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-sm text-gray-600">Status</p>
              <p className="text-xl font-bold text-purple-600">Ready</p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Analysis Results */}
        {enhancedAnalysis && Object.keys(enhancedAnalysis).length > 0 && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Enhanced AI Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded text-center">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Financial Health</p>
                    <p className="text-3xl font-bold text-blue-600">{enhancedAnalysis.financialScore}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded text-center">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Business Viability</p>
                    <p className="text-3xl font-bold text-green-600">{enhancedAnalysis.businessViabilityScore}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded text-center">
                    <p className="text-xs text-gray-600 uppercase font-semibold">Owner Credibility</p>
                    <p className="text-3xl font-bold text-purple-600">{enhancedAnalysis.credibilityScore}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm font-semibold">Overall Risk</p>
                    <p className="text-lg font-bold text-red-600">{enhancedAnalysis.overallRisk}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm font-semibold">Recommendation</p>
                    <p className="text-lg font-bold text-green-600">{enhancedAnalysis.recommendation}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm font-semibold mb-2">Analysis Summary</p>
                  <p className="text-sm text-gray-700">{enhancedAnalysis.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Scoring Details */}
        {application.scoringDetails && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Scoring Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Revenue Growth Rate: <span className="font-semibold">{application.scoringDetails.revenueGrowthRate}</span></div>
                <div>EBITDA Margin: <span className="font-semibold">{application.scoringDetails.ebitdaMargin}</span></div>
                <div>Debt Service Coverage: <span className="font-semibold">{application.scoringDetails.debtServiceCoverageRatio}</span></div>
                <div>Loan to Value: <span className="font-semibold">{application.scoringDetails.loanToValueRatio}</span></div>
                <div>Credit History: <span className="font-semibold">{application.scoringDetails.businessCreditHistory}</span></div>
                <div>Industry Risk: <span className="font-semibold">{application.scoringDetails.industryRiskAssessment}</span></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleDownloadPDF}
            className="flex-1 bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download PDF Report
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="flex-1"
          >
            Back to Applicants
          </Button>
        </div>
      </div>
    </div>
  );
}
