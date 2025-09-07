import { useState } from "react";
import PageHeader from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoanApplicationForm from "@/components/loan-application-form";
import LoanApplicantsTable from "@/components/loan-applicants-table";
import { LoanApplication } from "@/types/loan";
import { useLocation } from "wouter";

export default function Home() {
  const [activeTab, setActiveTab] = useState("application");
  const [currentApplication, setCurrentApplication] = useState<LoanApplication | null>(null);
  const [, setLocation] = useLocation();

  // Handle the form submission and redirect to comprehensive analysis
  const handleApplicationSubmit = (application: LoanApplication) => {
    setCurrentApplication(application);
    // Redirect to the comprehensive analysis page
    setLocation(`/loan-applications/${application.id}/comprehensive`);
  };

  // Handle viewing a specific application from the table
  const handleViewApplication = (application: LoanApplication) => {
    setCurrentApplication(application);
    setActiveTab("results");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader 
        title="Business Loan Evaluation" 
        description="Automated scoring system for loan applications" 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="border-b border-neutral-200 w-full justify-start">
          <TabsTrigger 
            value="application" 
            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-3 px-1"
          >
            Application Form
          </TabsTrigger>
          <TabsTrigger 
            value="results" 
            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-3 px-1"
          >
            Evaluation Results
          </TabsTrigger>
          <TabsTrigger 
            value="applicants" 
            className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary pb-3 px-1"
          >
            Applicants Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="application" className="mt-6">
          <LoanApplicationForm onApplicationSubmit={handleApplicationSubmit} />
        </TabsContent>
        
        <TabsContent value="results" className="mt-6">
          {currentApplication ? (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
              <p className="text-neutral-600">Application analysis complete! View detailed results in the comprehensive analysis.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8 text-center">
              <p className="text-neutral-600">Submit an application to see evaluation results</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="applicants" className="mt-6">
          <LoanApplicantsTable onViewApplication={handleViewApplication} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
