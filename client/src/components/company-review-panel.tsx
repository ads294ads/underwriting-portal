import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertCircle,
  MessageSquare,
  Building2,
  Instagram,
  Twitter,
  Linkedin,
  Facebook
} from 'lucide-react';

// Types matching what's in the company-reviews.ts server file
interface CompanyReview {
  platform: string;
  rating: number;
  reviewCount: number;
  positiveHighlights: string[];
  negativeHighlights: string[];
  recentTrend: "improving" | "stable" | "declining";
  verificationStatus: "verified" | "likely" | "possible" | "unverified";
}

interface CompanyComplaint {
  platform: string;
  date: string;
  category: string;
  description: string;
  resolution?: string;
  status: "resolved" | "pending" | "escalated" | "unknown";
  severity: "high" | "medium" | "low";
}

interface SocialMediaPresence {
  platform: string;
  followerCount?: number;
  engagementRate?: number;
  lastActivityDate?: string;
  overallSentiment: "positive" | "neutral" | "negative" | "mixed";
  activityLevel: "high" | "moderate" | "low" | "inactive";
  verificationStatus: "verified" | "unverified";
}

interface CompanyReviewData {
  verificationConfidence: number;
  verifiedBusinessName?: string;
  reviewPlatforms: CompanyReview[];
  complaints: CompanyComplaint[];
  socialMedia: SocialMediaPresence[];
  reputationScore: number;
  topPositives: string[];
  topNegatives: string[];
  reputationTrend: "improving" | "stable" | "declining";
  summary: string;
}

interface CompanyReviewPanelProps {
  reviewData: CompanyReviewData;
}

/**
 * Component that displays detailed company review analytics
 */
export const CompanyReviewPanel: React.FC<CompanyReviewPanelProps> = ({ 
  reviewData
}) => {
  // Function to render stars for ratings
  const renderStars = (rating: number) => {
    // Round to nearest 0.5
    const roundedRating = Math.round(rating * 2) / 2;
    const fullStars = Math.floor(roundedRating);
    const halfStar = roundedRating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {halfStar && (
          <Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400 opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };
  
  // Function to render trend icon
  const renderTrendIcon = (trend: "improving" | "stable" | "declining") => {
    switch(trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Function to get social media icon
  const getSocialIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return <Instagram className="h-4 w-4" />;
    if (platformLower.includes('twitter') || platformLower.includes('x')) return <Twitter className="h-4 w-4" />;
    if (platformLower.includes('linkedin')) return <Linkedin className="h-4 w-4" />;
    if (platformLower.includes('facebook')) return <Facebook className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };
  
  // Function to format numbers with commas
  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Company Reviews & Reputation
            </CardTitle>
            <CardDescription>
              Analysis of reviews, complaints, and social media presence
            </CardDescription>
          </div>
          <Badge 
            variant={reviewData.reputationScore >= 80 ? "outline" : 
                   reviewData.reputationScore >= 60 ? "secondary" : "destructive"} 
            className={`text-lg px-3 py-1 font-semibold ${
              reviewData.reputationScore >= 80 ? "bg-green-100 text-green-800" : 
              reviewData.reputationScore >= 60 ? "" : ""
            }`}>
            Reputation Score: {reviewData.reputationScore}/100
          </Badge>
        </div>
        
        {/* Trend Badge */}
        <div className="flex items-center mt-2">
          <Badge variant="outline" className="flex items-center">
            {renderTrendIcon(reviewData.reputationTrend)}
            <span className="ml-1 capitalize">{reviewData.reputationTrend} Trend</span>
          </Badge>
          
          {reviewData.verifiedBusinessName && (
            <Badge variant="secondary" className="ml-2">
              Verified as: {reviewData.verifiedBusinessName}
            </Badge>
          )}
        </div>
        
        {/* Summary */}
        <p className="mt-4 text-gray-700">{reviewData.summary}</p>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="reviews">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reviews" className="flex items-center">
              <Star className="mr-2 h-4 w-4" />
              Reviews
            </TabsTrigger>
            <TabsTrigger value="complaints" className="flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center">
              <Building2 className="mr-2 h-4 w-4" />
              Social Media
            </TabsTrigger>
          </TabsList>
          
          {/* Reviews Tab */}
          <TabsContent value="reviews" className="pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Review Platforms</h3>
              
              {reviewData.reviewPlatforms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewData.reviewPlatforms.map((platform, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{platform.platform}</CardTitle>
                          <Badge variant="outline">
                            {platform.verificationStatus}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            {renderStars(platform.rating)}
                            <span className="ml-2 font-medium">{platform.rating.toFixed(1)}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {platform.reviewCount} reviews
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          Trend: 
                          <span className="flex items-center ml-1">
                            {renderTrendIcon(platform.recentTrend)}
                            <span className="ml-1 capitalize">{platform.recentTrend}</span>
                          </span>
                        </div>
                        
                        {/* Positives */}
                        {platform.positiveHighlights.length > 0 && (
                          <div className="mb-2">
                            <div className="flex items-center text-green-600 font-medium text-sm mb-1">
                              <ThumbsUp className="mr-1 h-4 w-4" />
                              Positives
                            </div>
                            <ul className="text-sm space-y-1">
                              {platform.positiveHighlights.slice(0, 3).map((highlight, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-green-600 mr-1">•</span>
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Negatives */}
                        {platform.negativeHighlights.length > 0 && (
                          <div>
                            <div className="flex items-center text-red-600 font-medium text-sm mb-1">
                              <ThumbsDown className="mr-1 h-4 w-4" />
                              Negatives
                            </div>
                            <ul className="text-sm space-y-1">
                              {platform.negativeHighlights.slice(0, 3).map((highlight, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="text-red-600 mr-1">•</span>
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No review platform data available.
                </div>
              )}
              
              {/* Top Positives/Negatives */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Positives */}
                <div>
                  <h4 className="text-base font-medium flex items-center text-green-700 mb-2">
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Top Positives
                  </h4>
                  {reviewData.topPositives.length > 0 ? (
                    <ul className="space-y-1">
                      {reviewData.topPositives.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-600 mr-1">•</span>
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No top positives available.</p>
                  )}
                </div>
                
                {/* Top Negatives */}
                <div>
                  <h4 className="text-base font-medium flex items-center text-red-700 mb-2">
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Top Negatives
                  </h4>
                  {reviewData.topNegatives.length > 0 ? (
                    <ul className="space-y-1">
                      {reviewData.topNegatives.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-red-600 mr-1">•</span>
                          <span className="text-sm">{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No top negatives available.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Complaints Tab */}
          <TabsContent value="complaints" className="pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Formal Complaints</h3>
              
              {reviewData.complaints.length > 0 ? (
                <div className="space-y-4">
                  {reviewData.complaints.map((complaint, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{complaint.platform}</CardTitle>
                          <div className="flex space-x-2">
                            <Badge 
                              variant={
                                complaint.severity === "high" ? "destructive" : 
                                complaint.severity === "medium" ? "outline" : 
                                "secondary"
                              }
                            >
                              {complaint.severity} severity
                            </Badge>
                            <Badge 
                              variant={
                                complaint.status === "resolved" ? "outline" : 
                                complaint.status === "pending" ? "secondary" : 
                                "destructive"
                              }
                            >
                              {complaint.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {complaint.date} • {complaint.category}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{complaint.description}</p>
                        {complaint.resolution && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Resolution:</span>
                            <p className="text-sm text-gray-700">{complaint.resolution}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No formal complaints found.
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Social Media Tab */}
          <TabsContent value="social" className="pt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Media Presence</h3>
              
              {reviewData.socialMedia.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviewData.socialMedia.map((social, index) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center">
                            {getSocialIcon(social.platform)}
                            <span className="ml-2">{social.platform}</span>
                          </CardTitle>
                          <Badge variant={social.verificationStatus === "verified" ? "outline" : "secondary"}>
                            {social.verificationStatus}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">Followers:</span> {formatNumber(social.followerCount)}
                          </div>
                          <div>
                            <span className="text-gray-500">Engagement:</span> {social.engagementRate ? `${social.engagementRate.toFixed(1)}%` : 'N/A'}
                          </div>
                          <div>
                            <span className="text-gray-500">Activity:</span> {social.activityLevel}
                          </div>
                          <div>
                            <span className="text-gray-500">Last Activity:</span> {social.lastActivityDate || 'Unknown'}
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Sentiment:</span> 
                            <Badge 
                              variant="outline" 
                              className={`ml-1 ${
                                social.overallSentiment === "positive" ? "bg-green-50 text-green-800" : 
                                social.overallSentiment === "negative" ? "bg-red-50 text-red-800" : 
                                social.overallSentiment === "mixed" ? "bg-amber-50 text-amber-800" : 
                                "bg-gray-50 text-gray-800"
                              }`}
                            >
                              {social.overallSentiment}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No social media presence found.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompanyReviewPanel;