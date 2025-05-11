import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  User,
  Building2,
  GraduationCap,
  Award,
  Newspaper,
  AlertTriangle,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Briefcase,
  Calendar,
  Twitter,
  Linkedin,
  Globe,
  Instagram
} from 'lucide-react';

// Types matching the owner-research.ts server file
interface OwnerSocialProfile {
  platform: string;
  url?: string;
  username?: string;
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
  lastActivity?: string;
  followerCount?: number;
  connectionCount?: number;
}

interface OwnerBusinessAssociation {
  companyName: string;
  role: string;
  period: string;
  relationship: 'current' | 'former' | 'unknown';
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
}

interface OwnerEducation {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  year?: string;
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
}

interface ProfessionalLicense {
  type: string;
  issuingAuthority: string;
  status: 'active' | 'inactive' | 'expired' | 'revoked' | 'unknown';
  expirationDate?: string;
  verificationStatus: 'verified' | 'likely' | 'possible' | 'unverified';
}

interface OwnerMediaMention {
  source: string;
  date: string;
  title: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  url?: string;
  summary: string;
}

interface OwnerLegalRecord {
  type: string;
  date: string;
  jurisdiction: string;
  status: 'pending' | 'resolved' | 'dismissed' | 'unknown';
  description: string;
  outcome?: string;
  source?: string;
  severity: 'high' | 'medium' | 'low';
}

interface OwnerFinancialRecord {
  type: string;
  date: string;
  status: string;
  amount?: string;
  description: string;
  source?: string;
  impact: 'high' | 'medium' | 'low';
}

interface OwnerReview {
  platform: string;
  rating?: number;
  comment?: string;
  date?: string;
  verified: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface EnhancedOwnerProfile {
  ownerName: string;
  verifiedName?: string;
  verificationConfidence: number;
  socialProfiles: OwnerSocialProfile[];
  businessAssociations: OwnerBusinessAssociation[];
  education: OwnerEducation[];
  licenses: ProfessionalLicense[];
  mediaMentions: OwnerMediaMention[];
  legalRecords: OwnerLegalRecord[];
  financialRecords: OwnerFinancialRecord[];
  reviews: OwnerReview[];
  riskScore: number;
  riskFactors: string[];
  strengthFactors: string[];
  summary: string;
}

interface OwnerResearchPanelProps {
  ownerProfile: EnhancedOwnerProfile;
}

/**
 * Component that displays detailed owner research findings
 */
export const OwnerResearchPanel: React.FC<OwnerResearchPanelProps> = ({ 
  ownerProfile
}) => {
  // Function to get platform icon
  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('linkedin')) return <Linkedin className="h-4 w-4" />;
    if (platformLower.includes('twitter') || platformLower.includes('x')) return <Twitter className="h-4 w-4" />;
    if (platformLower.includes('instagram')) return <Instagram className="h-4 w-4" />;
    return <Globe className="h-4 w-4" />;
  };
  
  // Function to get verification badge variant
  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Verified</Badge>;
      case 'likely':
        return <Badge variant="outline">Likely</Badge>;
      case 'possible':
        return <Badge variant="secondary">Possible</Badge>;
      default:
        return <Badge variant="destructive">Unverified</Badge>;
    }
  };
  
  // Function to get severity badge
  const getSeverityBadge = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="outline">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
    }
  };
  
  // Function to get sentiment badge
  const getSentimentBadge = (sentiment: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-800">Positive</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-800">Negative</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Neutral</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Owner Background Research
            </CardTitle>
            <CardDescription>
              Comprehensive background check on {ownerProfile.verifiedName || ownerProfile.ownerName}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1 font-semibold">
            Risk Score: {ownerProfile.riskScore}/100
          </Badge>
        </div>
        
        {/* Verification Badge */}
        {ownerProfile.verificationConfidence > 0 && (
          <div className="mt-2">
            <Badge 
              variant={ownerProfile.verificationConfidence >= 0.8 ? "outline" : 
                     ownerProfile.verificationConfidence >= 0.5 ? "outline" : 
                     "destructive"}
              className={`flex items-center ${
                ownerProfile.verificationConfidence >= 0.8 ? "bg-green-100 text-green-800" : 
                ownerProfile.verificationConfidence >= 0.5 ? "" : ""
              }`}
            >
              {Math.round(ownerProfile.verificationConfidence * 100)}% Verification Confidence
            </Badge>
            
            {ownerProfile.verifiedName && ownerProfile.verifiedName !== ownerProfile.ownerName && (
              <Badge variant="secondary" className="ml-2">
                Verified as: {ownerProfile.verifiedName}
              </Badge>
            )}
          </div>
        )}
        
        {/* Summary */}
        <p className="mt-4 text-gray-700">{ownerProfile.summary}</p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="experience">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="experience" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="background" className="flex items-center">
              <GraduationCap className="mr-2 h-4 w-4" />
              Background
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Records
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Online Presence
            </TabsTrigger>
          </TabsList>
          
          {/* Experience Tab */}
          <TabsContent value="experience" className="pt-4">
            <div className="space-y-6">
              <h3 className="text-lg font-medium flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Business Associations
              </h3>
              
              {ownerProfile.businessAssociations.length > 0 ? (
                <div className="space-y-4">
                  {ownerProfile.businessAssociations.map((business, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{business.companyName}</CardTitle>
                          <Badge 
                            variant={business.relationship === 'current' ? "outline" : "secondary"}
                          >
                            {business.relationship}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 flex items-center">
                          <span className="font-medium mr-2">{business.role}</span>
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>{business.period}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-gray-500">
                          Verification: {business.verificationStatus}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No business associations found.
                </div>
              )}
              
              {/* Key Factors */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strength Factors */}
                <div>
                  <h4 className="text-base font-medium flex items-center text-green-700 mb-2">
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Strength Factors
                  </h4>
                  {ownerProfile.strengthFactors.length > 0 ? (
                    <ul className="space-y-1">
                      {ownerProfile.strengthFactors.map((factor, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-600 mr-1">•</span>
                          <span className="text-sm">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No strength factors identified.</p>
                  )}
                </div>
                
                {/* Risk Factors */}
                <div>
                  <h4 className="text-base font-medium flex items-center text-red-700 mb-2">
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Risk Factors
                  </h4>
                  {ownerProfile.riskFactors.length > 0 ? (
                    <ul className="space-y-1">
                      {ownerProfile.riskFactors.map((factor, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-red-600 mr-1">•</span>
                          <span className="text-sm">{factor}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No risk factors identified.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Background Tab */}
          <TabsContent value="background" className="pt-4">
            <div className="space-y-6">
              {/* Education */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Education
                </h3>
                
                {ownerProfile.education.length > 0 ? (
                  <div className="space-y-3">
                    {ownerProfile.education.map((edu, index) => (
                      <div key={index} className="flex justify-between pb-2 border-b">
                        <div>
                          <div className="font-medium">{edu.institution}</div>
                          <div className="text-sm">
                            {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''} 
                            {edu.year ? ` (${edu.year})` : ''}
                          </div>
                        </div>
                        <div>
                          {getVerificationBadge(edu.verificationStatus)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No education history found.
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Professional Licenses */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <Award className="mr-2 h-5 w-5" />
                  Professional Licenses
                </h3>
                
                {ownerProfile.licenses.length > 0 ? (
                  <div className="space-y-3">
                    {ownerProfile.licenses.map((license, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{license.type}</CardTitle>
                            <Badge 
                              variant={
                                license.status === 'active' ? "outline" : 
                                license.status === 'inactive' || license.status === 'expired' ? "secondary" : 
                                "destructive"
                              }
                              className={license.status === 'active' ? "bg-green-100 text-green-800" : ""}
                            >
                              {license.status}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            Issued by: {license.issuingAuthority}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex justify-between text-sm">
                            <div>
                              {license.expirationDate && 
                                <span>Expires: {license.expirationDate}</span>
                              }
                            </div>
                            <div>
                              {getVerificationBadge(license.verificationStatus)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No professional licenses found.
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Media Mentions */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <Newspaper className="mr-2 h-5 w-5" />
                  Media Mentions
                </h3>
                
                {ownerProfile.mediaMentions.length > 0 ? (
                  <div className="space-y-3">
                    {ownerProfile.mediaMentions.map((mention, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{mention.title}</CardTitle>
                            {getSentimentBadge(mention.sentiment)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {mention.source} • {mention.date}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{mention.summary}</p>
                          {mention.url && (
                            <div className="mt-1 text-xs text-blue-600">
                              {mention.url}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No media mentions found.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Records Tab */}
          <TabsContent value="records" className="pt-4">
            <div className="space-y-6">
              {/* Legal Records */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Legal Records
                </h3>
                
                {ownerProfile.legalRecords.length > 0 ? (
                  <div className="space-y-3">
                    {ownerProfile.legalRecords.map((record, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{record.type}</CardTitle>
                            <div className="flex space-x-2">
                              {getSeverityBadge(record.severity)}
                              <Badge 
                                variant={
                                  record.status === 'resolved' || record.status === 'dismissed' ? "outline" : 
                                  "destructive"
                                }
                              >
                                {record.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {record.date} • {record.jurisdiction}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{record.description}</p>
                          {record.outcome && (
                            <div className="mt-2">
                              <span className="text-sm font-medium">Outcome:</span>
                              <p className="text-sm text-gray-700">{record.outcome}</p>
                            </div>
                          )}
                          {record.source && (
                            <div className="mt-1 text-xs text-gray-500">
                              Source: {record.source}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No legal records found.
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Financial Records */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Financial Records
                </h3>
                
                {ownerProfile.financialRecords.length > 0 ? (
                  <div className="space-y-3">
                    {ownerProfile.financialRecords.map((record, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{record.type}</CardTitle>
                            {getSeverityBadge(record.impact)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {record.date} • {record.status}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{record.description}</p>
                          {record.amount && (
                            <div className="mt-1 text-sm font-medium">
                              Amount: {record.amount}
                            </div>
                          )}
                          {record.source && (
                            <div className="mt-1 text-xs text-gray-500">
                              Source: {record.source}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No financial records found.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Online Presence Tab */}
          <TabsContent value="online" className="pt-4">
            <div className="space-y-6">
              {/* Social Profiles */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <Globe className="mr-2 h-5 w-5" />
                  Social & Professional Profiles
                </h3>
                
                {ownerProfile.socialProfiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ownerProfile.socialProfiles.map((profile, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base flex items-center">
                              {getPlatformIcon(profile.platform)}
                              <span className="ml-2">{profile.platform}</span>
                            </CardTitle>
                            {getVerificationBadge(profile.verificationStatus)}
                          </div>
                          {profile.username && (
                            <div className="text-sm text-gray-600">
                              {profile.username}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-y-1 text-sm">
                            {profile.lastActivity && (
                              <div className="col-span-2">
                                <span className="text-gray-500">Last Activity:</span> {profile.lastActivity}
                              </div>
                            )}
                            {profile.followerCount !== undefined && (
                              <div>
                                <span className="text-gray-500">Followers:</span> {profile.followerCount.toLocaleString()}
                              </div>
                            )}
                            {profile.connectionCount !== undefined && (
                              <div>
                                <span className="text-gray-500">Connections:</span> {profile.connectionCount.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No social profiles found.
                  </div>
                )}
              </div>
              
              <Separator />
              
              {/* Reviews */}
              <div>
                <h3 className="text-lg font-medium flex items-center mb-3">
                  <Star className="mr-2 h-5 w-5" />
                  Reviews & Ratings
                </h3>
                
                {ownerProfile.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {ownerProfile.reviews.map((review, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{review.platform}</CardTitle>
                            <div className="flex items-center">
                              {review.rating && (
                                <div className="flex items-center mr-2">
                                  <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                  <span>{review.rating}</span>
                                </div>
                              )}
                              {getSentimentBadge(review.sentiment)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 flex items-center">
                            {review.date || "No date"}
                            {review.verified && (
                              <Badge variant="outline" className="ml-2">
                                Verified
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        {review.comment && (
                          <CardContent>
                            <p className="text-sm">{review.comment}</p>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No reviews found.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OwnerResearchPanel;