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
        const wsManager = WebSocketManager.getInstance();
        await wsManager.getConnection();
        
        // Register callback for this application's progress updates
        const unsubscribe = wsManager.registerCallback(applicationId, (update: ProgressUpdate) => {
          setProgress(update.progress);
          setMessage(update.message);
          setDetail(update.detail);
          setStatus(update.stage);
          
          if (update.stage === 'error') {
            setError(update.detail || 'An error occurred');
            if (onError) onError(update.detail);
          }
          
          if (update.stage === 'complete' && update.progress === 100) {
            if (onComplete) onComplete();
          }
        });
        
        // Cleanup on unmount
        return () => {
          unsubscribe();
        };
      } catch (err) {
        console.error('Failed to connect to WebSocket:', err);
        setError('Failed to connect to progress update service');
        if (onError) onError('Connection error');
      }
    };
    
    connectToWebsocket();
    
    // Set initial state to indicate connecting
    setStatus('connecting');
    setMessage('Initializing connection...');
    
  }, [applicationId, onComplete, onError]);
  
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