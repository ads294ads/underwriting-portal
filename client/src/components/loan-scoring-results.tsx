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
  rationale?: Record<string, string>; // Make rationale optional
}

export default function LoanScoringResults({ 
  application, 
  rationale = {} // Provide empty object as default
}: LoanScoringResultsProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isPerformingDeepResearch, setIsPerformingDeepResearch] = useState(false);
  
  // Enhanced PDF generation states
  const [isEnhancedPdfDownloading, setIsEnhancedPdfDownloading] = useState(false);
  const [showProgressIndicator, setShowProgressIndicator] = useState(false);
  const [enhancedPdfDownloadComplete, setEnhancedPdfDownloadComplete] = useState(false);
  const [enhancedPdfError, setEnhancedPdfError] = useState<string | null>(null);
  
  // Reference to the startActualDownload function for WebSocket callback
  const startActualDownloadRef = useRef<Function | null>(null);
  
  // Function to get component score with fallback to 0
  const getComponentScore = (key: string): number => {
    if (!application.scoringDetails) {
      console.log(`No scoring details available for component: ${key}`);
      return 0;
    }
    
    // Check if key exists and has a value
    const rawScore = application.scoringDetails[key];
    if (rawScore === undefined || rawScore === null) {
      console.log(`Missing score for component: ${key}`);
      return 0;
    }
    
    // Force numeric conversion and guard against NaN
    const numericScore = Number(rawScore);
    if (isNaN(numericScore)) {
      console.log(`Invalid score format for component: ${key}, value: ${rawScore}`);
      return 0;
    }
    
    return numericScore;
  };
  
  // BUGFIX: Ensure score is treated as a number regardless of how it's stored
  const scoreAsNumber = application.score ? Number(application.score) : 0;
  
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
      
      reportContent += `OVERALL SCORE: ${scoreAsNumber}/100\n`;
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
    
    // First check if the application exists in the server 
    try {
      const checkUrl = `/api/loan-applications/${application.id}/check`;
      console.log("Checking if application exists:", checkUrl);
      const checkResponse = await fetch(checkUrl);
      
      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        console.error("Application check failed:", errorData);
        toast({
          title: "Error Preparing PDF",
          description: `Cannot find application data (ID: ${application.id}). Please try submitting the form again.`,
          variant: "destructive",
        });
        setIsEnhancedPdfDownloading(false);
        setShowProgressIndicator(false);
        return;
      }
      
      const checkData = await checkResponse.json();
      console.log("Application exists check result:", checkData);
    } catch (error) {
      console.error("Error checking application:", error);
      // Continue with PDF download anyway
    }
    
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
            
            // Trigger download with a slight delay to let the PDF finalize
            setTimeout(() => {
              console.log("Executing PDF download now");
              if (startActualDownloadRef.current) {
                startActualDownloadRef.current();
              } else {
                console.error("Download function not available yet");
              }
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
      
      // Create a direct download link to the enhanced PDF endpoint with appropriate URL pattern
      const downloadUrl = `/api/loan-applications/${application.id}/enhanced-pdf`;
      console.log("Download URL:", downloadUrl, "Application ID:", application.id); // Debug the URL and ID
      console.log("Application data:", JSON.stringify({
        id: application.id,
        businessName: application.businessName,
        email: application.email
      }));
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
                console.error("Server error downloading PDF:", response.status, response.statusText, text);
                
                // Add more detailed debugging for 404 errors specifically
                if (response.status === 404) {
                  console.error("404 Not Found Error Details:");
                  console.error("- URL attempted:", downloadUrl);
                  console.error("- Application ID:", application.id);
                  console.error("- Application exists:", !!application);
                }
                
                throw new Error(`Failed to download PDF: ${response.status} - ${text || response.statusText}`);
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
        
        // Store the download function in our ref so it can be called from WebSocket callback
        startActualDownloadRef.current = startActualDownload;
        
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
                percentage={Math.min(scoreAsNumber, 100)} // Using our precomputed number value
                color="#0050C8"
              />
              <div className="absolute inset-0 flex items-center justify-center font-bold text-2xl">
                {Math.round(scoreAsNumber)}
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
                {/* Removed redundant status indicator since CreditScoreBar now includes this */}
                {/* This space intentionally left empty to maintain layout consistency */}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.creditScore ? (
                    <>
                      <p className="mb-2">{rationale.creditScore}</p>
                      <div className="mt-3 space-y-2">
                        <h5 className="text-sm font-semibold text-neutral-700">Analysis Details:</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Payment history shows {getComponentScore('creditScore') >= 15 ? 'consistent on-time payments' : getComponentScore('creditScore') >= 10 ? 'generally timely payments with occasional delays' : 'inconsistent payment patterns'}</li>
                          <li>Debt utilization is {getComponentScore('creditScore') >= 15 ? 'well-managed at under 30%' : getComponentScore('creditScore') >= 10 ? 'moderate at 30-50%' : 'high at over 50%'}</li>
                          <li>Credit history length is {getComponentScore('creditScore') >= 15 ? 'well-established' : getComponentScore('creditScore') >= 10 ? 'adequate' : 'limited'}</li>
                          <li>Recent credit inquiries: {getComponentScore('creditScore') >= 15 ? 'Few to none' : getComponentScore('creditScore') >= 10 ? 'Moderate number' : 'Multiple inquiries indicating potential credit seeking'}</li>
                        </ul>
                      </div>
                    </>
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
                {/* Removed redundant status indicator since CreditScoreBar now includes this */}
                {/* This space intentionally left empty to maintain layout consistency */}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.cashFlow ? (
                    <>
                      <p className="mb-2">{rationale.cashFlow}</p>
                      <div className="mt-3 space-y-2">
                        <h5 className="text-sm font-semibold text-neutral-700">Key Metrics:</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Debt Service Coverage Ratio: {getComponentScore('cashFlow') >= 20 ? '1.5+ (Excellent)' : getComponentScore('cashFlow') >= 15 ? '1.25-1.5 (Satisfactory)' : 'Below 1.25 (Concerning)'}</li>
                          <li>Operating Cash Flow Margin: {getComponentScore('cashFlow') >= 20 ? '15%+ (Strong)' : getComponentScore('cashFlow') >= 15 ? '8-15% (Adequate)' : 'Below 8% (Weak)'}</li>
                          <li>Cash Conversion Cycle: {getComponentScore('cashFlow') >= 20 ? 'Below 30 days (Efficient)' : getComponentScore('cashFlow') >= 15 ? '30-60 days (Average)' : 'Above 60 days (Inefficient)'}</li>
                          <li>Consistency of Revenue: {getComponentScore('cashFlow') >= 20 ? 'Highly predictable with stable growth' : getComponentScore('cashFlow') >= 15 ? 'Moderately predictable with some fluctuations' : 'Unpredictable with significant volatility'}</li>
                        </ul>
                      </div>
                    </>
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
                {/* Removed redundant status indicator since CreditScoreBar now includes this */}
                {/* This space intentionally left empty to maintain layout consistency */}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.collateral ? (
                    <>
                      <p className="mb-2">{rationale.collateral}</p>
                      <div className="mt-3 space-y-2">
                        <h5 className="text-sm font-semibold text-neutral-700">Collateral Analysis:</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Loan-to-Value Ratio: {getComponentScore('collateral') >= 12 ? 'Below 70% (Conservative)' : getComponentScore('collateral') >= 9 ? '70-80% (Acceptable)' : 'Above 80% (High Risk)'}</li>
                          <li>Asset Liquidity: {getComponentScore('collateral') >= 12 ? 'Highly liquid with established markets' : getComponentScore('collateral') >= 9 ? 'Moderately liquid with reasonable marketability' : 'Illiquid or specialized assets with limited markets'}</li>
                          <li>Collateral Quality: {getComponentScore('collateral') >= 12 ? 'Prime, well-maintained assets' : getComponentScore('collateral') >= 9 ? 'Standard quality assets' : 'Below average or deteriorating assets'}</li>
                          <li>Valuation Method: {getComponentScore('collateral') >= 12 ? 'Recent professional appraisals with conservative estimates' : getComponentScore('collateral') >= 9 ? 'Standard market valuations' : 'Self-reported or outdated valuations'}</li>
                        </ul>
                      </div>
                    </>
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
                {/* Removed redundant status indicator since CreditScoreBar now includes this */}
                {/* This space intentionally left empty to maintain layout consistency */}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-2">Key Factors</h4>
                <div className="text-sm text-neutral-600">
                  {rationale.businessStability ? (
                    <>
                      <p className="mb-2">{rationale.businessStability}</p>
                      <div className="mt-3 space-y-2">
                        <h5 className="text-sm font-semibold text-neutral-700">Stability Assessment:</h5>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Years in Operation: {getComponentScore('businessStability') >= 15 ? '7+ years with proven track record' : getComponentScore('businessStability') >= 10 ? '3-7 years with consistent operations' : 'Less than 3 years or inconsistent history'}</li>
                          <li>Management Experience: {getComponentScore('businessStability') >= 15 ? 'Seasoned leadership with industry expertise' : getComponentScore('businessStability') >= 10 ? 'Competent management with adequate experience' : 'Limited experience or high turnover'}</li>
                          <li>Industry Position: {getComponentScore('businessStability') >= 15 ? 'Strong market share with competitive advantages' : getComponentScore('businessStability') >= 10 ? 'Established position in stable industry' : 'Vulnerable position or volatile industry'}</li>
                          <li>Operational Resilience: {getComponentScore('businessStability') >= 15 ? 'Diverse revenue streams with adaptable business model' : getComponentScore('businessStability') >= 10 ? 'Some diversification with reasonable adaptability' : 'Single revenue stream or rigid business model'}</li>
                        </ul>
                      </div>
                    </>
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
