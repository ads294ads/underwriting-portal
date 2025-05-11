import React from 'react';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

// Define verification status levels
export type VerificationLevel = 'high' | 'moderate' | 'low' | 'unknown';

interface VerificationStatusProps {
  confidence: number;
  entity: string;
  showDetails?: boolean;
}

/**
 * Component that displays verification status with visual indicators
 * for entity verification confidence
 */
export const VerificationStatus: React.FC<VerificationStatusProps> = ({ 
  confidence, 
  entity,
  showDetails = false
}) => {
  // Convert confidence from 0-1 to 0-100 percentage
  const confidencePercent = Math.round(confidence * 100);
  
  /**
   * Get verification level based on confidence percentage
   */
  const getVerificationLevel = (): VerificationLevel => {
    if (confidencePercent >= 90) return 'high';
    if (confidencePercent >= 60) return 'moderate';
    if (confidencePercent > 0) return 'low';
    return 'unknown';
  };

  /**
   * Get color scheme based on verification level
   */
  const getColorScheme = () => {
    switch (getVerificationLevel()) {
      case 'high':
        return {
          badge: 'bg-green-100 text-green-800',
          icon: <ShieldCheck className="h-6 w-6 text-green-600" />,
          alertVariant: 'default' as const,
          progressColor: 'bg-green-500'
        };
      case 'moderate':
        return {
          badge: 'bg-amber-100 text-amber-800',
          icon: <ShieldCheck className="h-6 w-6 text-amber-600" />,
          alertVariant: 'default' as const,
          progressColor: 'bg-amber-500'
        };
      case 'low':
        return {
          badge: 'bg-red-100 text-red-800',
          icon: <ShieldAlert className="h-6 w-6 text-red-600" />,
          alertVariant: 'destructive' as const,
          progressColor: 'bg-red-500'
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800',
          icon: <ShieldQuestion className="h-6 w-6 text-gray-600" />,
          alertVariant: 'default' as const,
          progressColor: 'bg-gray-500'
        };
    }
  };

  /**
   * Get CSS class for progress bar color
   */
  const getProgressColor = () => {
    return getColorScheme().progressColor;
  };

  /**
   * Get status message based on verification level
   */
  const getStatusMessage = () => {
    switch (getVerificationLevel()) {
      case 'high':
        return `Research findings for ${entity} have high confidence. The entity has been verified through multiple reliable sources.`;
      case 'moderate':
        return `Research findings for ${entity} have moderate confidence. Additional verification may be helpful.`;
      case 'low':
        return `Research findings for ${entity} have low confidence. Verification was limited, and findings may not relate to the correct entity.`;
      default:
        return `Unable to verify ${entity}. Research findings should be treated with significant caution.`;
    }
  };

  const { icon, badge, alertVariant } = getColorScheme();

  /**
   * Minimal display when details not needed
   */
  if (!showDetails) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        {icon}
        <span>
          Verification: <span className={badge}>{confidencePercent}%</span>
        </span>
      </div>
    );
  }

  /**
   * Detailed display with full alert and progress bar
   */
  return (
    <Alert variant={alertVariant} className="mb-4">
      <div className="flex items-start space-x-2">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <AlertTitle className="flex items-center justify-between">
            {entity} Verification
            <Badge variant="outline" className={`ml-2 ${badge}`}>
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
            
            {getVerificationLevel() === 'low' && (
              <div className="mt-2 text-red-600 font-medium">
                Warning: Research findings should be manually verified before making lending decisions.
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

/**
 * Component for displaying verification status for the entire application
 */
export const ApplicationVerificationStatus: React.FC<{
  companyConfidence: number;
  ownerConfidence: number;
  overallConfidence: number;
}> = ({ companyConfidence, ownerConfidence, overallConfidence }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Verification Status</h3>
      <VerificationStatus 
        confidence={companyConfidence} 
        entity="Company" 
        showDetails={true} 
      />
      <VerificationStatus 
        confidence={ownerConfidence} 
        entity="Owner" 
        showDetails={true}
      />
      <div className="border-t pt-4 mt-4">
        <h4 className="text-md font-medium mb-2">Overall Verification</h4>
        <VerificationStatus 
          confidence={overallConfidence} 
          entity="Overall Research" 
          showDetails={true}
        />
      </div>
    </div>
  );
};

export default VerificationStatus;