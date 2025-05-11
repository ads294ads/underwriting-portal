import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Shield, 
  Building, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Types for verification status
export interface VerificationResults {
  isVerified: boolean;
  confidence: number;
  source?: string;
  method?: string;
  details?: string[];
}

export interface VerificationStatus {
  company?: VerificationResults;
  owner?: VerificationResults;
  overallConfidence: number;
}

export interface ApplicationVerificationStatusProps {
  companyConfidence: number;
  ownerConfidence: number;
  overallConfidence: number;
}

// Helper function to get confidence level text
const getConfidenceLevel = (confidence: number): string => {
  if (confidence >= 0.9) return "Very High";
  if (confidence >= 0.7) return "High";
  if (confidence >= 0.5) return "Moderate";
  if (confidence >= 0.3) return "Low";
  return "Very Low";
};

// Helper function to get confidence badge variant
const getConfidenceBadge = (confidence: number) => {
  let variant: "outline" | "destructive" | "secondary" | "default" = "default";
  let extraClass = "";
  
  if (confidence >= 0.9) {
    variant = "outline";
    extraClass = "bg-green-100 text-green-800";
  } else if (confidence >= 0.7) {
    variant = "outline";
    extraClass = "bg-emerald-50 text-emerald-800";
  } else if (confidence >= 0.5) {
    variant = "outline";
  } else if (confidence >= 0.3) {
    variant = "secondary";
  } else {
    variant = "destructive";
  }
  
  return (
    <Badge variant={variant} className={extraClass}>
      {getConfidenceLevel(confidence)} ({Math.round(confidence * 100)}%)
    </Badge>
  );
};

// Helper function to get verification icon
const getVerificationIcon = (confidence: number) => {
  if (confidence >= 0.7) {
    return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  } else if (confidence >= 0.4) {
    return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  } else {
    return <XCircle className="h-5 w-5 text-red-600" />;
  }
};

/**
 * Component that displays detailed verification status
 */
export const VerificationDisplay: React.FC<{name: string, icon: React.ReactNode, confidence: number}> = ({
  name,
  icon,
  confidence
}) => {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <div className="flex-shrink-0">
        {icon}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium">{name}</span>
          {getConfidenceBadge(confidence)}
        </div>
        <Progress value={confidence * 100} className="h-2" />
      </div>
      <div className="flex-shrink-0">
        {getVerificationIcon(confidence)}
      </div>
    </div>
  );
};

/**
 * Component that displays verification status for an application
 */
export const ApplicationVerificationStatus: React.FC<ApplicationVerificationStatusProps> = ({
  companyConfidence,
  ownerConfidence,
  overallConfidence
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Verification Status
        </CardTitle>
        <CardDescription>
          Confidence in the verification of entities in this application
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <VerificationDisplay 
            name="Company Verification" 
            icon={<Building className="h-5 w-5 text-blue-600" />}
            confidence={companyConfidence}
          />
          
          <VerificationDisplay 
            name="Owner Verification" 
            icon={<User className="h-5 w-5 text-indigo-600" />}
            confidence={ownerConfidence}
          />
        </div>
        
        <Separator />
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-primary">Overall Verification</span>
            {getConfidenceBadge(overallConfidence)}
          </div>
          <Progress value={overallConfidence * 100} className="h-3" />
        </div>
        
        <div className="text-sm text-gray-500 mt-4">
          {overallConfidence >= 0.7 ? (
            <p>High confidence verification means we have identified and confirmed these entities through multiple reliable sources.</p>
          ) : overallConfidence >= 0.4 ? (
            <p>Moderate confidence verification means we've found matches but with some inconsistencies or limited sources.</p>
          ) : (
            <p>Low confidence verification means we found limited or conflicting information. Further verification is recommended.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationVerificationStatus;