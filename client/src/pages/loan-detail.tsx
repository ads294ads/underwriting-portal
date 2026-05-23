import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";

export default function LoanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: application, isLoading, error } = useQuery({
    queryKey: [`/api/loan-applications/${id}`],
  });

  const downloadPDF = async () => {
    try {
      const response = await fetch(`/api/loan-applications/${id}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loan-report-${id}.pdf`;
      a.click();
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error loading application</div>;
  if (!application) return <div className="p-8">Application not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{application.businessName}</h1>
          <Button onClick={downloadPDF} className="flex items-center gap-2">
            <Download size={20} />
            Download PDF Report
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-3xl font-bold text-blue-600">{application.score}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grade</p>
                <p className="text-2xl font-bold">{application.grade}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {application.financialAnalysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Financial Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(application.financialAnalysis, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {application.riskAssessment && (
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(application.riskAssessment, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
