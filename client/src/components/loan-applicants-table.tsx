import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export interface LoanApplicationsTableProps {
  onViewApplication: (application: LoanApplication) => void;
}

export interface LoanApplication {
  id: number;
  businessName: string;
  industry: string;
  annualRevenue: number;
  loanAmount: number;
  score: number;
  grade: string;
}

export default function LoanApplicationsTable({ onViewApplication }: LoanApplicationsTableProps) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [, setLocation] = useLocation();

  const { data: applications, isLoading, error } = useQuery<LoanApplication[]>({
    queryKey: ["/api/loan-applications"],
  });

  useEffect(() => {
    if (applications) {
      setTotalPages(Math.ceil(applications.length / itemsPerPage));
    }
  }, [applications?.length]);

  const [totalPages, setTotalPages] = useState(1);

  const getCurrentItems = () => {
    if (!applications) return [];
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return applications.slice(startIndex, endIndex);
  };

  const currentItems = getCurrentItems();

  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );

  if (error) return <div className="text-red-600">Error loading applications</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applicant Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-3 text-left font-semibold">BUSINESS</th>
                <th className="px-3 py-3 text-left font-semibold">INDUSTRY</th>
                <th className="px-3 py-3 text-left font-semibold">REVENUE</th>
                <th className="px-3 py-3 text-left font-semibold">LOAN AMOUNT</th>
                <th className="px-3 py-3 text-left font-semibold">SCORE</th>
                <th className="px-3 py-3 text-left font-semibold">GRADE</th>
                <th className="px-3 py-3 text-left font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((application) => (
                <tr key={application.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-left">{application.businessName}</td>
                  <td className="px-3 py-3 text-sm text-left">{application.industry}</td>
                  <td className="px-3 py-3 text-sm text-left">${application.annualRevenue?.toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm text-left">${application.loanAmount?.toLocaleString()}</td>
                  <td className="px-3 py-3 text-sm text-left text-center">{application.score}</td>
                  <td className="px-3 py-3 text-sm text-left text-center">{application.grade}</td>
                  <td className="px-3 py-3 text-sm text-left">
                    <Button
                      variant="link"
                      className="text-primary-600 hover:text-primary-800 font-medium"
                      onClick={() => setLocation(`/loan/${application.id}`)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-600">
            Showing 1 to {itemsPerPage} of {applications?.length || 0} applicants
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled
              className="px-4"
            >
              {page}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect } from "react";
