import React, { useEffect, useState } from 'react';
import { WebSocketManager, ProgressUpdate } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertTriangle, FileDown } from 'lucide-react';

interface ReportProgressIndicatorProps {
  applicationId: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function ReportProgressIndicator({
  applicationId,
  onComplete,
  onError
}: ReportProgressIndicatorProps) {
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('idle');
  const [message, setMessage] = useState<string>('Preparing...');
  const [detail, setDetail] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Connect to WebSocket for progress updates
    const connectToWebsocket = async () => {
      try {
        console.log(`Setting up progress tracking for application ID: ${applicationId}`);
        const wsManager = WebSocketManager.getInstance();
        const socket = await wsManager.getConnection();
        
        // Send subscribe message to server immediately
        const subscribeMsg = {
          type: 'subscribe',
          applicationId: applicationId
        };
        
        const sendSubscription = () => {
          if (socket.readyState === WebSocket.OPEN) {
            console.log("Sending subscription request to server:", subscribeMsg);
            socket.send(JSON.stringify(subscribeMsg));
            return true;
          }
          return false;
        };
        
        // Try to send immediately
        if (!sendSubscription()) {
          console.warn("WebSocket not open, couldn't send subscription. Current state:", socket.readyState);
          
          // Retry multiple times with increasing delay
          [500, 1000, 3000].forEach((delay, index) => {
            setTimeout(() => {
              if (!sendSubscription()) {
                console.warn(`Subscription attempt ${index + 1} failed, socket state: ${socket.readyState}`);
              } else {
                console.log(`Subscription successful on attempt ${index + 1}`);
              }
            }, delay);
          });
        }
        
        // Register callback for this application's progress updates
        const unsubscribe = wsManager.registerCallback(applicationId, (update: ProgressUpdate) => {
          console.log(`Progress update received for app #${applicationId}:`, update);
          
          setProgress(update.progress);
          setMessage(update.message || "Processing...");
          setDetail(update.detail || "");
          setStatus(update.stage);
          
          if (update.stage === 'error') {
            setError(update.detail || 'An error occurred');
            if (onError) onError(update.detail || 'An error occurred');
          }
          
          if (update.stage === 'complete' && update.progress === 100) {
            console.log("Progress complete signal received - report generation finished");
            console.log("Calling onComplete handler to finalize download process");
            if (onComplete) {
              // Adding a small delay to ensure PDF is fully ready
              setTimeout(() => {
                onComplete();
              }, 500);
            }
          }
        });
        
        // Cleanup on unmount
        return () => {
          console.log(`Unsubscribing from progress updates for app #${applicationId}`);
          unsubscribe();
        };
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
        setError('Failed to connect to progress update service');
        if (onError) onError('Connection error');
      }
    };
    
    // Set initial state to indicate connecting
    setStatus('connecting');
    setMessage('Initializing connection...');
    setProgress(5); // Show some initial progress
    
    // Connect to WebSocket
    connectToWebsocket();
    
    // Set a timeout to show some progess even if server is not responding yet
    const fallbackTimer = setTimeout(() => {
      if (progress <= 5) {
        setProgress(10);
        setMessage('Preparing document analysis');
        setDetail('Setting up research environment');
      }
    }, 3000);
    
    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [applicationId, onComplete, onError, progress]);
  
  // Show error state
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 mt-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
          <div className="text-red-700 font-medium">Error generating report</div>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <p className="text-sm text-red-500 mt-2">Please try again later or contact support if the issue persists.</p>
      </div>
    );
  }
  
  // Show idle/loading state
  if (status === 'idle' || status === 'connecting' || progress === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 mt-4">
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 text-gray-600 mr-2 animate-spin" />
          <div className="text-gray-700 font-medium">Connecting to report service...</div>
        </div>
        <p className="text-gray-600 mt-2">Please wait while we initialize the report generation.</p>
      </div>
    );
  }
  
  // Show complete state
  if (status === 'complete' && progress === 100) {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-4 mt-4">
        <div className="flex items-center">
          <Check className="h-5 w-5 text-green-600 mr-2" />
          <div className="text-green-700 font-medium">Report generation complete</div>
        </div>
        <p className="text-green-600 mt-2">Your report has been successfully generated.</p>
        <div className="flex items-center mt-3">
          <FileDown className="h-4 w-4 text-green-700 mr-1" />
          <p className="text-sm text-green-700">Your download should begin automatically.</p>
        </div>
      </div>
    );
  }
  
  // Show progress state
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4 mt-4">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Loader2 className={cn("h-5 w-5 mr-2", 
              status.includes('research') ? "text-purple-600" : 
              status.includes('document') ? "text-amber-600" : 
              status.includes('pdf') ? "text-green-600" : 
              "text-blue-600",
              "animate-spin")} />
            <span className="font-medium text-gray-800">{message}</span>
          </div>
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
        
        <Progress value={progress} 
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full",
            status.includes('research') ? "bg-purple-100" : 
            status.includes('document') ? "bg-amber-100" : 
            status.includes('pdf') ? "bg-green-100" : 
            "bg-blue-100"
          )} 
        >
          <div
            className={cn(
              "h-full w-full flex-1 transition-all",
              status.includes('research') ? "bg-purple-600" : 
              status.includes('document') ? "bg-amber-600" : 
              status.includes('pdf') ? "bg-green-600" : 
              "bg-blue-600"
            )}
            style={{ transform: `translateX(-${100 - progress}%)` }}
          />
        </Progress>
        
        <p className="text-sm text-gray-600">{detail}</p>
      </div>
    </div>
  );
}