import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanApplication } from "@/types/loan";
import { formatCurrency } from "@/lib/formatter";
import DonutChart from "@/components/donut-chart";
import CreditScoreBar from "@/components/credit-score-bar";
import { scoringComponents, gradeScales } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { DownloadIcon, UploadIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoanScoringResultsProps {
  application: LoanApplication;
}

export default function LoanScoringResults({ application }: LoanScoringResultsProps) {
  const { toast } = useToast();
  const [gradeInfo, setGradeInfo] = useState<{ grade: string; description: string }>({ 
    grade: application.grade || "C-", 
    description: "Pending evaluation." 
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const grade = gradeScales.find(g => g.grade === application.grade);
    if (grade) {
      setGradeInfo({
        grade: grade.grade,
        description: grade.description
      });
    }
  }, [application]);
  
  const downloadRationaleReport = async () => {
    try {
      setIsDownloading(true);
      
      let rationale: Record<string, string> = {};
      
      try {
        // Try to fetch detailed rationale from API
        const response = await fetch(`/api/loan-applications/${application.id}/rationale`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.rationale) {
            rationale = data.rationale;
          } else {
            console.warn('No rationale data received from API, using fallback');
          }
        } else {
          console.warn('Failed to fetch rationale from API, using fallback');
        }
      } catch (apiError) {
        console.error('Error fetching rationale:', apiError);
      }
      
      // If API failed or returned empty data, generate a basic rationale
      if (Object.keys(rationale).length === 0) {
        console.log('Using fallback rationale generation');
        rationale = {
          overall: `Overall assessment for ${application.businessName}: This application received a grade of ${application.grade} based on the financial metrics and business fundamentals presented. The score of ${application.score}/100 reflects a comprehensive evaluation of key performance indicators.`
        };
        
        // Generate basic rationales for each component
        scoringComponents.forEach(component => {
          const score = getComponentScore(component.key);
          const weight = component.weight * 100;
          const percentage = (score / weight) * 100;
          
          let evaluation = "is within acceptable range";
          if (percentage >= 75) {
            evaluation = "is strong and exceeds our requirements";
          } else if (percentage >= 50) {
            evaluation = "meets our minimum requirements";
          } else {
            evaluation = "is below our typical requirements";
          }
          
          rationale[component.key] = `The ${component.name.toLowerCase()} of ${application.businessName} ${evaluation}. This component received a score of ${score}/${weight} based on the information provided in the application.`;
        });
      }
      
      // Format the rationale into a text document
      let reportContent = `# LOAN EVALUATION RATIONALE REPORT\n\n`;
      reportContent += `## Application ID: ${application.id}\n`;
      reportContent += `## Business: ${application.businessName}\n`;
      reportContent += `## Grade: ${application.grade} (Score: ${application.score}/100)\n\n`;
      
      // Add overall assessment
      if (rationale.overall) {
        reportContent += `## OVERALL ASSESSMENT\n\n${rationale.overall}\n\n`;
      }
      
      // Add section for each scoring component
      reportContent += `## SCORING COMPONENT DETAILS\n\n`;
      
      for (const component of scoringComponents) {
        const rationaleText = rationale[component.key] || 'No specific feedback available for this component.';
        const score = getComponentScore(component.key);
        const weight = component.weight * 100;
        
        reportContent += `### ${component.name} (${score}/${weight})\n\n`;
        reportContent += `${rationaleText}\n\n`;
      }
      
      // Add document analysis section if available
      if (application.documentAnalysis && application.documentAnalysis.length > 0) {
        reportContent += `## DOCUMENT ANALYSIS\n\n`;
        application.documentAnalysis.forEach((insight, index) => {
          reportContent += `${index + 1}. ${insight}\n`;
        });
      }
      
      // Create a downloadable file
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${application.businessName.replace(/\s+/g, '_')}_loan_rationale.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Report Downloaded",
        description: "Detailed rationale report has been saved to your downloads folder.",
      });
    } catch (error) {
      console.error("Error downloading rationale report:", error);
      toast({
        title: "Failed to Download Report",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Download professionally formatted PDF report
  const downloadPdfReport = async () => {
    if (!application) return;
    
    setIsPdfDownloading(true);
    
    try {
      // Create a direct download link to the PDF endpoint
      const downloadUrl = `/api/loan-applications/${application.id}/rationale-pdf`;
      
      console.log("Starting PDF download from:", downloadUrl);
      
      // Better approach: use fetch to stream the PDF data
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a link to download the file
      const a = document.createElement('a');
      a.href = url;
      a.download = `${application.businessName.replace(/\s+/g, '_')}_loan_assessment.pdf`;
      document.body.appendChild(a);
      
      // Trigger the download
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF Report Downloaded",
        description: "Comprehensive PDF assessment report has been saved to your downloads folder.",
      });
    } catch (error) {
      console.error("Error downloading PDF report:", error);
      toast({
        title: "Failed to Download PDF Report",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    const firstChar = grade.charAt(0);
    if (firstChar === 'A') return 'bg-success-50 text-success-700';
    if (firstChar === 'B') return 'bg-warning-50 text-warning-700';
    return 'bg-danger-50 text-danger-700';
  };

  const getComponentScore = (key: string) => {
    return application.scoringDetails && application.scoringDetails[key] 
      ? application.scoringDetails[key]
      : 0;
  };

  const getComponentPercentage = (key: string, weight: number) => {
    const score = getComponentScore(key);
    // Calculate percentage based on component's max possible score (weight * 100)
    const maxPossibleScore = weight * 100;
    // Convert to a percentage between 0-100
    const percentage = (score / maxPossibleScore) * 100;
    console.log(`Component: ${key}, Score: ${score}/${maxPossibleScore}, Percentage: ${percentage.toFixed(1)}%`);
    return percentage;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-primary';
    if (percentage >= 50) return 'bg-warning-500';
    return 'bg-red-500';
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleUploadDocuments = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("documents", selectedFiles[i]);
      }
      
      const response = await fetch(`/api/loan-applications/${application.id}/documents`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Document upload failed:", errorText);
        throw new Error("Failed to upload documents");
      }
      
      const updatedApplication = await response.json();
      console.log("Application updated with documents:", updatedApplication);
      
      // Update the application in the parent component
      Object.assign(application, updatedApplication);
      
      setSelectedFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Documents Uploaded",
        description: "Your documents have been uploaded and analyzed successfully",
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-8">
      <CardHeader className="p-6 border-b border-neutral-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center">
            <i className="fas fa-chart-bar text-primary mr-2"></i>
            Loan Evaluation Results
          </CardTitle>
          
          <div className="flex gap-2">
            <Button 
              onClick={downloadRationaleReport} 
              disabled={isDownloading}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              {isDownloading ? "Generating..." : "Text Report"}
            </Button>
            
            <Button 
              onClick={downloadPdfReport} 
              disabled={isPdfDownloading}
              size="sm"
              className="flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              {isPdfDownloading ? "Generating..." : "PDF Report"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Score Summary */}
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 mb-8">
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 flex items-center space-x-6">
            {/* Score Display */}
            <div className="relative w-24 h-24">
              <DonutChart 
                percentage={
                  application.score 
                    ? Math.min(Number(application.score), 100) // Ensure it's capped at 100
                    : 0
                }
                color="#0050C8"
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-primary-600">
                  {application.score ? Math.round(Number(application.score)) : 0}
                </span>
                <span className="text-xs text-neutral-500">score</span>
              </div>
            </div>
            
            {/* Grade Display */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`grade-badge ${getGradeColor(application.grade || 'C-')} w-9 h-9 flex items-center justify-center rounded-full font-semibold`}>
                  {application.grade || "C-"}
                </div>
                <span className="text-sm text-neutral-600">Grade</span>
              </div>
              <p className="text-sm text-neutral-500 max-w-xs">
                {gradeInfo.description}
              </p>
            </div>
          </div>
          
          {/* Grade Scale */}
          <div className="flex-1 bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Grade Scale</h3>
            
            <CreditScoreBar score={
              application.score 
                ? Math.min(Number(application.score), 100) // Ensure it's capped at 100
                : 0
            } />
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-neutral-700">Score Range:</span>
                <span className="text-xs text-primary-600 font-medium">
                  {application.score ? Math.round(Number(application.score)) : 0} / 100
                </span>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 text-neutral-600">A+ (90-100)</td>
                    <td className="py-1 text-neutral-600">B+ (75-79)</td>
                    <td className="py-1 text-neutral-600">C+ (50-59)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-600">A (85-89)</td>
                    <td className="py-1 text-neutral-600">B (65-74)</td>
                    <td className="py-1 text-neutral-600">C (40-49)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-600">A- (80-84)</td>
                    <td className="py-1 text-neutral-600">B- (60-64)</td>
                    <td className="py-1 text-neutral-600">C- (Below 40)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Score Breakdown */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-neutral-800 mb-4">
            Scoring Component Breakdown
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {scoringComponents.map((component) => {
              const score = getComponentScore(component.key);
              const percentage = getComponentPercentage(component.key, component.weight);
              const weight = component.weight * 100;
              return (
                <div key={component.key} className="bg-white p-4 rounded-lg border border-neutral-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700">{component.name}</span>
                    <span className="text-sm font-semibold text-primary-600">
                      {score} / {weight}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
                    <div 
                      className={`${getScoreColor(percentage)} h-2 rounded-full`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Weight: {weight}%</span>
                    <span className="text-neutral-500">{component.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Document Analysis */}
        {application.documentAnalysis && application.documentAnalysis.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center">
              <i className="fas fa-file-alt text-primary-400 mr-2"></i>
              Document Analysis Highlights
            </h3>
            
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <ul className="space-y-3">
                {application.documentAnalysis.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <i className={`${index % 2 === 0 ? 'fas fa-check-circle text-success-500' : 'fas fa-exclamation-circle text-warning-500'} mt-0.5 mr-2`}></i>
                    <div>
                      <p className="text-sm text-neutral-700">{item}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Document Upload Section */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-file-upload text-primary-400 mr-2"></i>
              Upload Additional Documents
            </div>
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button 
                onClick={handleUploadClick} 
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <UploadIcon className="h-3.5 w-3.5" />
                Select Files
              </Button>
              <Button 
                onClick={handleUploadDocuments} 
                disabled={isUploading || !selectedFiles}
                size="sm"
                className="flex items-center gap-1"
              >
                {isUploading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <i className="fas fa-file-medical text-xs"></i>
                    Upload & Analyze
                  </>
                )}
              </Button>
            </div>
          </h3>
          
          {selectedFiles && selectedFiles.length > 0 && (
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 mb-4">
              <p className="text-sm text-neutral-700 mb-2">{selectedFiles.length} file(s) selected:</p>
              <ul className="space-y-1">
                {Array.from(selectedFiles).map((file, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                    {file.name}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-neutral-500 mt-3">
                Note: Uploading new documents will preserve existing analysis and may improve your score.
              </p>
            </div>
          )}
          
          <div className="text-sm text-neutral-600">
            <p>Upload additional financial documents to strengthen your application and potentially improve your score:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-neutral-600 text-sm ml-2">
              <li>Tax returns</li>
              <li>Financial statements</li>
              <li>Cash flow projections</li>
              <li>Business credit reports</li>
              <li>Bank statements</li>
            </ul>
          </div>
        </div>
        
        {/* Borrower Details */}
        <div>
          <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center">
            <i className="fas fa-user-tie text-primary-400 mr-2"></i>
            Borrower & Application Details
          </h3>
          
          <div className="bg-white rounded-lg border border-neutral-200">
            <div className="grid md:grid-cols-2 gap-4 p-4">
              <div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Business Name</p>
                  <p className="text-sm font-medium text-neutral-800">{application.businessName}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Industry</p>
                  <p className="text-sm font-medium text-neutral-800">{application.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Years in Business</p>
                  <p className="text-sm font-medium text-neutral-800">{application.yearsInBusiness} years</p>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Annual Revenue</p>
                  <p className="text-sm font-medium text-neutral-800">{formatCurrency(Number(application.annualRevenue))}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Requested Loan Amount</p>
                  <p className="text-sm font-medium text-neutral-800">{formatCurrency(Number(application.loanAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Contact Email</p>
                  <p className="text-sm font-medium text-neutral-800">{application.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
