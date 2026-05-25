import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function LoanDetail() {
  const params = useParams() as { id?: string };
  const id = params?.id;
  const [location, setLocation] = useLocation();

  const { data: application, isLoading, error } = useQuery({
    queryKey: [`/api/loan-applications/${id}`],
    enabled: !!id,
  });

  const handleBack = () => {
    setLocation("/");
  };

  if (!id) return <div className="p-8">Loading...</div>;
  if (isLoading) return <div className="p-8">Loading application...</div>;
  if (error) return <div className="p-8 text-red-600">Error loading application</div>;
  if (!application) return <div className="p-8">Application not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Applications
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{application.businessName}</h1>
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
              <div>
                <p className="text-sm text-gray-600">Years in Business</p>
                <p className="font-semibold">{application.yearsInBusiness || 'N/A'}</p>
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

        {application.scoringDetails && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Scoring Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(application.scoringDetails).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {application.documentAnalysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(application.documentAnalysis) && application.documentAnalysis.map((doc: string, i: number) => (
                  <p key={i} className="text-sm text-gray-700">{doc}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
