import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoanApplication } from "@/types/loan";
import { formatCurrency } from "@/lib/formatter";

interface LoanApplicantsTableProps {
  onViewApplication: (application: LoanApplication) => void;
}

export default function LoanApplicantsTable({ onViewApplication }: LoanApplicantsTableProps) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 5;

  const { data: applications, isLoading, error } = useQuery<LoanApplication[]>({
    queryKey: ["/api/loan-applications"],
  });

  useEffect(() => {
    if (applications) {
      setTotalPages(Math.ceil(applications.length / itemsPerPage));
    }
  }, [applications]);

  const getGradeBadgeColor = (grade: string | undefined) => {
    if (!grade) return 'bg-danger-50 text-danger-700';
    const firstChar = grade.charAt(0);
    if (firstChar === 'A') return 'bg-success-50 text-success-700';
    if (firstChar === 'B') return 'bg-warning-50 text-warning-700';
    return 'bg-danger-50 text-danger-700';
  };

  // Pagination controls
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  // Get current page items
  const getCurrentItems = () => {
    if (!applications) return [];
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return applications.slice(startIndex, endIndex);
  };

  const currentItems = getCurrentItems();

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-8">
      <CardHeader className="p-6 border-b border-neutral-200">
        <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center">
          <i className="fas fa-table text-primary mr-2"></i>
          Applicant Overview
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Business</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Loan Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Grade</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></td>
                    <td className="px-4 py-3 text-center"><Skeleton className="h-8 w-8 rounded-full mx-auto" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-6 w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                    Error loading applicants. Please try again.
                  </td>
                </tr>
              ) : applications && applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-neutral-600">
                    No loan applications found.
                  </td>
                </tr>
              ) : (
                currentItems.map((application) => (
                  <tr key={application.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-800">
                      <div className="font-medium">{application.businessName}</div>
                      <div className="text-xs text-neutral-500">{application.yearsInBusiness} years</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{application.industry}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{formatCurrency(Number(application.annualRevenue))}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{formatCurrency(Number(application.loanAmount))}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-700 font-medium">
                        {application.score ? Math.round(Number(application.score)) : 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getGradeBadgeColor(application.grade)} font-medium`}>
                        {application.grade || "C-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Button 
                        variant="link"
                        className="text-primary-600 hover:text-primary-800 font-medium"
                        onClick={() => onViewApplication(application)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {applications && applications.length > 0 && (
          <div className="p-4 flex items-center justify-between border-t border-neutral-200 bg-neutral-50">
            <div className="text-xs text-neutral-500">
              Showing {Math.min((page - 1) * itemsPerPage + 1, applications.length)} to {Math.min(page * itemsPerPage, applications.length)} of {applications.length} applicants
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePreviousPage}
                disabled={page <= 1}
                className="px-3 py-1 border border-neutral-300 rounded text-neutral-500 bg-white hover:bg-neutral-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              
              {[...Array(totalPages)].map((_, index) => (
                <Button
                  key={index}
                  variant={page === index + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(index + 1)}
                  className={`px-3 py-1 border border-neutral-300 rounded text-sm ${
                    page === index + 1 
                      ? 'text-white bg-primary hover:bg-primary-600' 
                      : 'text-neutral-700 bg-white hover:bg-neutral-50'
                  }`}
                >
                  {index + 1}
                </Button>
              ))}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleNextPage}
                disabled={page >= totalPages}
                className="px-3 py-1 border border-neutral-300 rounded text-neutral-500 bg-white hover:bg-neutral-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
// Make sure the View button uses this onClick handler:
// onClick={() => navigate(`/loan/${application.id}`)}
