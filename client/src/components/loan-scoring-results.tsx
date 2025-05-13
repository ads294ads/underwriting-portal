import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanApplication } from "@/types/loan";
import { formatCurrency } from "@/lib/formatter";
import DonutChart from "@/components/donut-chart";
import CreditScoreBar from "@/components/credit-score-bar";
import { scoringComponents, gradeScales } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { DownloadIcon, UploadIcon, SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportProgressIndicator } from "@/components/report-progress-indicator";
import { WebSocketManager, ProgressUpdate } from "@/lib/queryClient";

interface LoanScoringResultsProps {
  application: LoanApplication;
  rationale: Record<string, string>;
}

export function LoanScoringResults({ application, rationale }: LoanScoringResultsProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isPerformingDeepResearch, setIsPerformingDeepResearch] = useState(false);
  
  // Enhanced PDF generation states
  const [isEnhancedPdfDownloading, setIsEnhancedPdfDownloading] = useState(false);
  const [showProgressIndicator, setShowProgressIndicator] = useState(false);
  const [enhancedPdfDownloadComplete, setEnhancedPdfDownloadComplete] = useState(false);
  const [enhancedPdfError, setEnhancedPdfError] = useState<string | null>(null);
  
  // Function to get component score with fallback to 0
  const getComponentScore = (key: string): number => {
    if (!application.scoringDetails || !application.scoringDetails[key]) {
      return 0;
    }
    return Number(application.scoringDetails[key]);
  };
  
  // Download plain text rationale report
  const downloadRationaleReport = async () => {
    if (!application) return;
    
    setIsDownloading(true);
    
    try {
      // Generate a formatted text report
      let reportContent = `# LOAN APPLICATION ASSESSMENT REPORT\n\n`;
      reportContent += `Business Name: ${application.businessName}\n`;
      reportContent += `Industry: ${application.industry}\n`;
      reportContent += `Years in Business: ${application.yearsInBusiness}\n`;
      reportContent += `Annual Revenue: ${formatCurrency(Number(application.annualRevenue))}\n`;
      reportContent += `Loan Amount: ${formatCurrency(Number(application.loanAmount))}\n\n`;
      
      reportContent += `OVERALL SCORE: ${application.score}/100\n`;
      reportContent += `GRADE: ${application.grade}\n\n`;
      
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
  
  // Generic PDF download handler with retry
  const handlePdfDownload = async (
    url: string,
    filename: string,
    onSuccess: (message: string) => void,
    onError: (error: Error) => void
  ): Promise<void> => {
    const maxRetries = 3;
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        
        onSuccess(`Report has been downloaded as ${filename}`);
        return;
      } catch (error) {
        console.error(`PDF download attempt ${retries + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;
        
        // Wait a bit longer between retries (exponential backoff)
        if (retries < maxRetries) {
          const waitTime = 1000 * Math.pow(2, retries); // 2s, 4s, 8s
          console.log(`Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we got here, all retries failed
    if (lastError) {
      onError(lastError);
    } else {
      onError(new Error("Failed to download PDF after multiple attempts"));
    }
  };
  
  // Download professionally formatted PDF report
  const downloadPdfReport = async () => {
    if (!application) return;
    
    setIsPdfDownloading(true);
    
    try {
      // Create a direct download link to the PDF endpoint
      const downloadUrl = `/api/loan-applications/${application.id}/rationale-pdf`;
      const filename = `${application.businessName.replace(/\s+/g, '_')}_loan_assessment.pdf`;
      
      await handlePdfDownload(
        downloadUrl,
        filename,
        (message) => {
          toast({
            title: "PDF Report Downloaded",
            description: message,
          });
        },
        (error) => {
          toast({
            title: "Failed to Download PDF Report",
            description: error.message,
            variant: "destructive",
          });
        }
      );
    } catch (error) {
      console.error("Unhandled error in PDF download process:", error);
      toast({
        title: "Failed to Download PDF Report",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPdfDownloading(false);
    }
  };
  
  // Download enhanced multi-agent PDF report with real-time progress
  const downloadEnhancedPdfReport = async () => {
    if (!application) return;
    
    // Reset states and show progress immediately
    setIsEnhancedPdfDownloading(true);
    setShowProgressIndicator(true);
    setEnhancedPdfDownloadComplete(false);
    setEnhancedPdfError(null);
    
    // Create a tracking variable we can access in callbacks
    const downloadState = {
      downloadStarted: false,
      downloadCompleted: false,
      hasError: false
    };
    
    try {
      console.log("Starting enhanced PDF download process for application ID:", application.id);
      
      // Initialize WebSocket connection immediately to ensure it's ready
      const wsManager = WebSocketManager.getInstance();
      let unsubscribe = () => {}; // Default empty function
      
      try {
        // Connect to WebSocket first to ensure we have a connection
        await wsManager.getConnection();
        console.log("WebSocket connected, ready to receive progress updates");
        
        // Register callback for this application's progress updates with improved visibility
        unsubscribe = wsManager.registerCallback(application.id, (update: ProgressUpdate) => {
          console.log(`Progress update received: ${update.stage} - ${update.progress}%`, update);
          
          // Provide detailed console logging for each stage
          if (update.stage === 'document_analysis' || update.stage === 'document_processing') {
            console.log(`Document analysis in progress: ${update.detail}`);
          } else if (update.stage === 'analyzing_company') {
            console.log(`Company analysis in progress: ${update.detail}`);
          } else if (update.stage === 'analyzing_financials') {
            console.log(`Financial analysis in progress: ${update.detail}`);
          } else if (update.stage === 'analyzing_owners') {
            console.log(`Owner analysis in progress: ${update.detail}`);
          } else if (update.stage === 'analyzing_risk') {
            console.log(`Risk assessment in progress: ${update.detail}`);
          } else if (update.stage === 'finalizing') {
            console.log(`Finalizing report: ${update.detail}`);
          }
          
          // When complete (90% or more), trigger the download if it hasn't started yet
          // Reduced from 95% to 90% to start download earlier
          if (update.progress >= 90 && !downloadState.downloadStarted) {
            console.log("Report generation at 90%+, initiating download");
            downloadState.downloadStarted = true;
            
            // Create direct shortcut function for actual download
            (window as any).startActualDownload = startActualDownload;
            
            // Trigger download with a slight delay to let the PDF finalize
            setTimeout(() => {
              console.log("Executing PDF download now");
              startActualDownload();
            }, 1500); // Reduced from 2000ms to 1500ms
          }
          
          // When fully complete (100%), mark as complete
          if (update.stage === 'complete' && update.progress === 100) {
            console.log("Report generation complete signal received");
            downloadState.downloadCompleted = true;
            setEnhancedPdfDownloadComplete(true);
          }
          
          if (update.stage === 'error') {
            console.error("Error in report generation:", update.detail);
            downloadState.hasError = true;
            setEnhancedPdfError(update.detail || "Unknown error occurred");
          }
        });
        
        // Clean up subscription after completion or error
        setTimeout(() => unsubscribe(), 180000); // Max 3 minutes
      } catch (wsError) {
        console.error("Failed to connect to WebSocket:", wsError);
        // Continue anyway - the PDF will still be generated
      }
      
      // Create a direct download link to the enhanced PDF endpoint
      const downloadUrl = `/api/loan-applications/${application.id}/enhanced-pdf`;
      const filename = `${application.businessName.replace(/\s+/g, '_')}_Enhanced_Assessment.pdf`;
      
      // Send a message to the user to let them know the process has started
      toast({
        title: "Generating Enhanced Report",
        description: "This may take 1-2 minutes. Progress will be shown below.",
      });
      
      // Set up the download promise with backup timeout
      let backupTimeout: NodeJS.Timeout;
      const downloadPromise = new Promise<void>((resolve, reject) => {
        // Enhanced function to reliably start the PDF download with retries
        const startActualDownload = async () => {
          console.log("Starting PDF download from:", downloadUrl);
          
          // Define max retries and counter
          const maxRetries = 3;
          let retryCount = 0;
          let success = false;
          
          while (retryCount < maxRetries && !success && !downloadState.hasError) {
            try {
              // Show attempt number on retry
              if (retryCount > 0) {
                console.log(`PDF download attempt ${retryCount + 1}/${maxRetries}`);
              }
              
              // Start the download process with timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
              
              const response = await fetch(downloadUrl, { 
                signal: controller.signal,
                headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                }
              });
              
              clearTimeout(timeoutId);
              
              // If the response is successful, this means the PDF was generated
              if (response.ok) {
                console.log("PDF downloaded successfully, creating blob URL");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Validate that we got a PDF and not an error page
                if (blob.type === 'application/pdf' || blob.size > 10000) {
                  // Create an anchor element to trigger the download
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  
                  console.log("Triggering download click");
                  a.click();
                  
                  // Clean up
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  
                  // Mark as complete
                  clearTimeout(backupTimeout);
                  downloadState.downloadCompleted = true;
                  setEnhancedPdfDownloadComplete(true);
                  success = true;
                  resolve();
                  break;
                } else {
                  console.warn("Response was successful but content doesn't appear to be a valid PDF");
                  window.URL.revokeObjectURL(url);
                  throw new Error("Invalid PDF content received");
                }
              } else {
                // If there was an error response, parse and show it
                const text = await response.text();
                console.error("Server error downloading PDF:", text);
                throw new Error(`Server error: ${text}`);
              }
            } catch (error) {
              console.error(`Download attempt ${retryCount + 1} failed:`, error);
              
              // Only continue retrying if this wasn't already marked as completed/errored via WebSocket
              if (downloadState.downloadCompleted) {
                console.log("Download already completed via another method");
                success = true;
                resolve();
                break;
              }
              
              if (downloadState.hasError) {
                console.log("Error already reported via WebSocket");
                reject(error);
                break;
              }
              
              // Increment retry counter
              retryCount++;
              
              // Wait before retrying with exponential backoff
              if (retryCount < maxRetries) {
                const waitTime = 1000 * Math.pow(2, retryCount); // 2s, 4s, 8s
                console.log(`Waiting ${waitTime/1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
          }
          
          // If all retries failed and we haven't resolved/rejected yet
          if (!success && !downloadState.downloadCompleted && !downloadState.hasError) {
            downloadState.hasError = true;
            reject(new Error("Failed to download PDF after multiple attempts"));
          }
        };
        
        // Expose the download function globally so it can be called from WebSocket callback
        (window as any).startActualDownload = startActualDownload;
        
        // Set backup timeout to attempt download even if WebSocket fails
        backupTimeout = setTimeout(() => {
          console.log("Backup timeout triggered, attempting download");
          if (!downloadState.downloadStarted) {
            downloadState.downloadStarted = true;
            startActualDownload();
          }
        }, 30000); // 30 second backup timeout
      });
      
      await downloadPromise;
      
      // Success toast only if no error occurred
      if (!enhancedPdfError) {
        toast({
          title: "Enhanced Report Downloaded",
          description: "Multi-agent detailed analysis report has been saved to your downloads folder.",
        });
      }
    } catch (error) {
      console.error("Unhandled error in enhanced PDF download process:", error);
      
      // Only show the toast if there was a real error (not just a user cancellation)
      if (error instanceof Error && !error.message.includes('cancelled')) {
        setEnhancedPdfError(error.message);
        toast({
          title: "Failed to Download Enhanced PDF",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      // Keep the progress indicator visible even after download completes
      // The user will see the success state through the progress indicator
      setTimeout(() => {
        setIsEnhancedPdfDownloading(false);
        
        // Keep the progress indicator visible for 5 seconds after completion
        // so the user can see the success state
        if (enhancedPdfDownloadComplete && !enhancedPdfError) {
          setTimeout(() => {
            setShowProgressIndicator(false);
          }, 5000);
        }
      }, 1000);
    }
  };
  
  // Perform deep research on the application
  const performDeepResearch = async () => {
    if (!application) return;
    
    setIsPerformingDeepResearch(true);
    
    try {
      // Call the deep research endpoint
      const response = await fetch(`/api/loan-applications/${application.id}/deep-research`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Deep research failed:", errorText);
        throw new Error("Failed to perform deep research");
      }
      
      const updatedApplication = await response.json();
      console.log("Application updated with deep research:", updatedApplication);
      
      // Update the application in the parent component
      Object.assign(application, updatedApplication);
      
      toast({
        title: "Deep Research Completed",
        description: "Advanced company and owner research has been performed and incorporated into assessment",
      });
      
      // Automatically trigger PDF generation with updated deep research
      await downloadPdfReport();
      
    } catch (error) {
      console.error("Error performing deep research:", error);
      toast({
        title: "Deep Research Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPerformingDeepResearch(false);
    }
  };

  if (!application) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle className="text-xl font-bold">Loan Application Assessment</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={downloadRationaleReport} 
              disabled={isDownloading}
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <DownloadIcon className="h-4 w-4" />
              {isDownloading ? "Downloading..." : "Report"}
            </Button>
            
            <Button 
              onClick={downloadPdfReport} 
              disabled={isPdfDownloading}
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <DownloadIcon className="h-4 w-4" />
              {isPdfDownloading ? "Generating..." : "PDF Report"}
            </Button>
            
            <Button 
              onClick={downloadEnhancedPdfReport} 
              disabled={isEnhancedPdfDownloading}
              size="sm"
              className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800"
            >
              <DownloadIcon className="h-4 w-4" />
              {isEnhancedPdfDownloading ? "Generating..." : "Enhanced Report"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Real-time progress indicator for enhanced report generation */}
      {showProgressIndicator && (
        <div className="px-6 pt-2 pb-0">
          <ReportProgressIndicator 
            applicationId={application.id}
            onComplete={() => {
              setEnhancedPdfDownloadComplete(true);
              console.log("Report generation complete - download should begin automatically");
            }}
            onError={(error) => {
              setEnhancedPdfError(error);
              console.error("Error during report generation:", error);
            }}
          />
        </div>
      )}
      
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
              <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl">
                {application.score ? Math.round(Number(application.score)) : 0}
              </div>
            </div>
            
            {/* Grade and Metadata */}
            <div>
              <h3 className="font-bold text-lg text-neutral-900 mb-1">
                Grade: <span className="text-primary-700">{application.grade || "Pending"}</span>
              </h3>
              <p className="text-sm text-neutral-500 mb-2">{application.businessName}</p>
              <p className="text-sm font-medium">
                {formatCurrency(Number(application.loanAmount))} loan request
              </p>
            </div>
          </div>
          
          {/* Deep Research Section */}
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 flex-1">
            <h3 className="font-bold text-lg text-neutral-900 mb-3 flex justify-between items-center">
              <span>Deep Research</span>
              <div>
                <Button 
                  onClick={performDeepResearch} 
                  disabled={isPerformingDeepResearch}
                  size="sm"
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {isPerformingDeepResearch ? (
                    <>Researching...</>
                  ) : (
                    <>
                      <SearchIcon className="h-3.5 w-3.5" />
                      Perform Deep Research
                    </>
                  )}
                </Button>
              </div>
            </h3>
            
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <div className="flex items-start mb-3">
                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                  <SearchIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-neutral-800 mb-1">
                    Enhanced Due Diligence
                  </h4>
                  <p className="text-sm text-neutral-600">
                    Our Deep Research feature performs comprehensive background checks on both the business and its owners. 
                    This includes analyzing legal records, financial standings, market reputation, and potential red flags.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white p-3 rounded-md border border-indigo-100">
                  <h5 className="text-xs font-semibold text-indigo-700 uppercase mb-2">Company Research</h5>
                  <ul className="text-xs text-neutral-600 list-disc pl-4 space-y-1">
                    <li>Business verification</li>
                    <li>Legal records analysis</li>
                    <li>Financial stability assessment</li>
                    <li>Market reputation evaluation</li>
                  </ul>
                </div>
                <div className="flex-1 bg-white p-3 rounded-md border border-indigo-100">
                  <h5 className="text-xs font-semibold text-indigo-700 uppercase mb-2">Owner Background</h5>
                  <ul className="text-xs text-neutral-600 list-disc pl-4 space-y-1">
                    <li>Identity verification</li>
                    <li>Management history</li>
                    <li>Professional reputation</li>
                    <li>Prior business outcomes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Component Scores */}
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-neutral-900 mb-4">Scoring Components</h3>
          
          {/* Credit Score */}
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Credit Score Rating</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Evaluation of creditworthiness based on credit history, payment patterns, and financial obligations.
                </p>
                <CreditScoreBar 
                  score={getComponentScore('creditScore')}
                  maxScore={20}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.creditScore ? (
                    <p>{rationale.creditScore}</p>
                  ) : (
                    <p>Credit score assessment pending.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Cash Flow */}
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Cash Flow Assessment</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Analysis of business cash inflows and outflows demonstrating ability to sustain operations and service debt.
                </p>
                <CreditScoreBar 
                  score={getComponentScore('cashFlow')}
                  maxScore={25}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.cashFlow ? (
                    <p>{rationale.cashFlow}</p>
                  ) : (
                    <p>Cash flow assessment pending.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Collateral */}
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Collateral Evaluation</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Assessment of assets available to secure the loan, considering liquidity, value, and marketability.
                </p>
                <CreditScoreBar 
                  score={getComponentScore('collateral')}
                  maxScore={15}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.collateral ? (
                    <p>{rationale.collateral}</p>
                  ) : (
                    <p>Collateral assessment pending.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Business Stability */}
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Business Stability</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Evaluation of business longevity, industry position, management experience, and operational resilience.
                </p>
                <CreditScoreBar 
                  score={getComponentScore('businessStability')}
                  maxScore={20}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.businessStability ? (
                    <p>{rationale.businessStability}</p>
                  ) : (
                    <p>Business stability assessment pending.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Industry Outlook */}
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Industry Outlook</h4>
                <p className="text-sm text-neutral-600 mb-4">
                  Analysis of industry trends, growth projections, competitive landscape, and regulatory environment.
                </p>
                <CreditScoreBar 
                  score={getComponentScore('industryOutlook')}
                  maxScore={10}
                />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.industryOutlook ? (
                    <p>{rationale.industryOutlook}</p>
                  ) : (
                    <p>Industry outlook assessment pending.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Deep Research - conditionally displayed */}
          {application.scoringDetails?.deepResearch !== undefined && (
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-2 flex items-center">
                    <SearchIcon className="h-4 w-4 mr-1 text-indigo-600" />
                    <span>Deep Research</span>
                  </h4>
                  <p className="text-sm text-neutral-600 mb-4">
                    Comprehensive analysis of business and owner background, including legal records, market reputation, and risk factors.
                  </p>
                  <CreditScoreBar 
                    score={getComponentScore('deepResearch')}
                    maxScore={10}
                    barColor="#4F46E5"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base mb-2">Key Findings</h4>
                  <div className="text-sm text-neutral-600">
                    {rationale.deepResearch ? (
                      <p>{rationale.deepResearch}</p>
                    ) : (
                      <p>Advanced deep research assessment pending. Click "Perform Deep Research" to initiate analysis.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Document Upload Section */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-8">
            <h4 className="font-semibold text-base mb-2 flex items-center">
              <UploadIcon className="h-4 w-4 mr-1 text-blue-600" />
              <span>Document Analysis</span>
            </h4>
            <p className="text-sm text-neutral-600 mb-4">
              Upload additional financial documents to strengthen your application and potentially improve your score:
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
