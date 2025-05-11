import React from 'react';
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from '@/components/ui/alert';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  AlertCircle,
  Info,
  Check
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface VerificationStatusProps {
  verificationConfidence?: number;
  entityType: 'company' | 'owner' | 'overall';
  verifiedName?: string;
  originalName?: string;
}

export function VerificationStatus({ 
  verificationConfidence = 0, 
  entityType,
  verifiedName,
  originalName
}: VerificationStatusProps) {
  // Calculate percentage for display
  const confidencePercent = Math.round(verificationConfidence * 100);
  
  // Determine status level
  const getStatusLevel = () => {
    if (confidencePercent >= 90) return 'high';
    if (confidencePercent >= 75) return 'good';
    if (confidencePercent >= 50) return 'moderate';
    return 'low';
  };
  
  const status = getStatusLevel();
  
  // Get appropriate icon
  const getIcon = () => {
    switch (status) {
      case 'high':
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      case 'good':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'moderate':
        return <ShieldAlert className="h-5 w-5 text-amber-600" />;
      case 'low':
        return <ShieldX className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };
  
  // Get appropriate color for progress bar
  const getProgressColor = () => {
    switch (status) {
      case 'high':
        return 'bg-green-600';
      case 'good':
        return 'bg-blue-600';
      case 'moderate':
        return 'bg-amber-600';
      case 'low':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };
  
  // Get appropriate color for badge
  const getBadgeColor = () => {
    switch (status) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  // Get entity type label
  const getEntityLabel = () => {
    switch (entityType) {
      case 'company':
        return 'Company Verification';
      case 'owner':
        return 'Owner Verification';
      case 'overall':
        return 'Overall Verification';
      default:
        return 'Entity Verification';
    }
  };
  
  // Get status message
  const getStatusMessage = () => {
    const entityLabel = entityType === 'company' ? 'company' : 
                       entityType === 'owner' ? 'owner' : 'entity';
    
    switch (status) {
      case 'high':
        return `High confidence in ${entityLabel} identity. Research findings highly reliable.`;
      case 'good':
        return `Good confidence in ${entityLabel} identity. Research findings generally reliable.`;
      case 'moderate':
        return `Moderate confidence in ${entityLabel} identity. Research findings should be verified.`;
      case 'low':
        return `Low confidence in ${entityLabel} identity. Research findings may not be accurate.`;
      default:
        return `Unable to verify ${entityLabel} identity. Research findings unreliable.`;
    }
  };
  
  // Show entity name match if provided
  const showNameMatch = verifiedName && originalName && verifiedName !== originalName;
  
  return (
    <Alert className="my-4 border-2" variant={status === 'low' ? 'destructive' : 'default'}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle className="flex items-center justify-between">
            <span>{getEntityLabel()}</span>
            <Badge className={`ml-2 ${getBadgeColor()}`}>
              {confidencePercent}% Confidence
            </Badge>
          </AlertTitle>
          <div className="mt-2 mb-1">
            <Progress 
              value={confidencePercent} 
              className={`h-2 ${getProgressColor()}`}
            />
          </div>
          <AlertDescription className="mt-2">
            {getStatusMessage()}
            
            {showNameMatch && (
              <div className="mt-2 text-sm flex items-start gap-1">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>
                  Entity name discrepancy found: 
                  <span className="font-semibold ml-1">{originalName}</span> (application) vs 
                  <span className="font-semibold ml-1">{verifiedName}</span> (verified)
                </span>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

// Component to show combined verification status with detailed breakdown
export function VerificationDetailPanel({
  verificationResults,
  applicationData
}: {
  verificationResults: {
    overallConfidence: number;
    companyConfidence?: number;
    ownerConfidence?: number;
    verifiedCompanyName?: string;
    verifiedOwnerName?: string;
  };
  applicationData: {
    companyName: string;
    ownerName?: string;
  };
}) {
  return (
    <div className="space-y-3 mt-4">
      <VerificationStatus 
        verificationConfidence={verificationResults.overallConfidence}
        entityType="overall"
      />
      
      {verificationResults.companyConfidence !== undefined && (
        <VerificationStatus 
          verificationConfidence={verificationResults.companyConfidence}
          entityType="company"
          verifiedName={verificationResults.verifiedCompanyName}
          originalName={applicationData.companyName}
        />
      )}
      
      {verificationResults.ownerConfidence !== undefined && applicationData.ownerName && (
        <VerificationStatus 
          verificationConfidence={verificationResults.ownerConfidence}
          entityType="owner"
          verifiedName={verificationResults.verifiedOwnerName}
          originalName={applicationData.ownerName}
        />
      )}
    </div>
  );
}