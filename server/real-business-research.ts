export interface BusinessIntelligence {
  companyName: string;
  foundOnline: boolean;
  website: string | null;
  socialMedia: {
    linkedin: string | null;
    facebook: string | null;
    reviews: Array<{
      platform: string;
      rating: number;
      reviewCount: number;
      recentReviews: string[];
    }>;
  };
  newsAndMedia: Array<{
    title: string;
    source: string;
    date: string;
    summary: string;
    sentiment: 'positive' | 'negative' | 'neutral';
  }>;
  riskFactors: {
    legal: string[];
    financial: string[];
    operational: string[];
    reputational: string[];
  };
  competitivePosition: {
    industry: string;
    competitors: string[];
    marketPosition: string;
  };
  ownerBackground: Array<{
    name: string;
    found: boolean;
    professionalHistory: string[];
    education: string[];
    linkedinProfile: string | null;
    publicRecords: string[];
  }>;
  overallAssessment: {
    legitimacy: 'verified' | 'questionable' | 'unverified';
    riskLevel: 'low' | 'moderate' | 'high';
    recommendedAction: string;
    confidence: number;
  };
}

export class RealBusinessResearch {
  
  async researchCompany(companyName: string, ownerNames: string[], industry: string): Promise<BusinessIntelligence> {
    try {
      console.log(`Starting real research for ${companyName}`);
      
      // Use Perplexity for actual online research
      const companyResearch = await this.searchCompanyOnline(companyName, industry);
      const ownerResearch = await this.researchOwners(ownerNames);
      
      return {
        companyName,
        foundOnline: companyResearch.found,
        website: companyResearch.website,
        socialMedia: companyResearch.socialMedia,
        newsAndMedia: companyResearch.news,
        riskFactors: companyResearch.risks,
        competitivePosition: companyResearch.competitive,
        ownerBackground: ownerResearch,
        overallAssessment: this.assessOverallRisk(companyResearch, ownerResearch)
      };
      
    } catch (error) {
      console.error('Research failed:', error);
      return this.getMinimalResearchResult(companyName, ownerNames, error.message);
    }
  }
  
  private async searchCompanyOnline(companyName: string, industry: string) {
    const searchPrompt = `Search for the company "${companyName}" in the ${industry} industry. Find:

1. Official website and contact information
2. LinkedIn company page and employee count
3. Recent news articles or press releases
4. Customer reviews on Google, Yelp, or industry platforms
5. Any legal issues, lawsuits, or regulatory problems
6. Financial filings or public records
7. Social media presence and activity

Provide specific, factual information with sources. If information is not found, clearly state that.`;

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            { role: "system", content: "You are a business intelligence researcher. Provide factual, verifiable information with specific details and sources." },
            { role: "user", content: searchPrompt }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API failed: ${response.status}`);
      }

      const data = await response.json();
      const researchText = data.choices[0].message.content;
      
      // Parse research results
      return this.parseCompanyResearch(researchText);
      
    } catch (error) {
      console.error('Company search failed:', error);
      return {
        found: false,
        website: null,
        socialMedia: { linkedin: null, facebook: null, reviews: [] },
        news: [],
        risks: { legal: [], financial: [], operational: [], reputational: [] },
        competitive: { industry, competitors: [], marketPosition: 'Unknown' }
      };
    }
  }
  
  private async researchOwners(ownerNames: string[]) {
    const ownerResults = [];
    
    for (const name of ownerNames) {
      const ownerPrompt = `Search for business professional "${name}". Find:

1. LinkedIn profile and professional experience
2. Previous companies and roles
3. Education background
4. Any public records, legal issues, or bankruptcies
5. Professional certifications or licenses
6. Media mentions or industry recognition

Provide factual information only. If not found, state clearly.`;

      try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              { role: "system", content: "Research business professionals factually. Provide specific, verifiable information." },
              { role: "user", content: ownerPrompt }
            ],
            max_tokens: 1500,
            temperature: 0.1
          })
        });

        if (!response.ok) {
          throw new Error(`Owner research failed: ${response.status}`);
        }

        const data = await response.json();
        const ownerInfo = this.parseOwnerResearch(name, data.choices[0].message.content);
        ownerResults.push(ownerInfo);
        
      } catch (error) {
        console.error(`Owner research failed for ${name}:`, error);
        ownerResults.push({
          name,
          found: false,
          professionalHistory: [],
          education: [],
          linkedinProfile: null,
          publicRecords: [`Research failed: ${error.message}`]
        });
      }
    }
    
    return ownerResults;
  }
  
  private parseCompanyResearch(researchText: string) {
    // Extract structured information from research text
    const found = !researchText.toLowerCase().includes('not found') && 
                  !researchText.toLowerCase().includes('no results');
                  
    // Parse website
    const websiteMatch = researchText.match(/(?:website|site|url):\s*(https?:\/\/[^\s]+)/i);
    const website = websiteMatch ? websiteMatch[1] : null;
    
    // Parse social media mentions
    const linkedinMatch = researchText.match(/linkedin[^\s]*:\s*(https?:\/\/[^\s]+)/i);
    const linkedin = linkedinMatch ? linkedinMatch[1] : null;
    
    // Parse reviews/ratings
    const reviews = [];
    const ratingMatches = researchText.match(/(\d+\.?\d*)\s*(?:\/\s*5|stars?|rating)/gi);
    if (ratingMatches) {
      reviews.push({
        platform: 'General',
        rating: parseFloat(ratingMatches[0].match(/\d+\.?\d*/)[0]),
        reviewCount: 0,
        recentReviews: []
      });
    }
    
    return {
      found,
      website,
      socialMedia: { linkedin, facebook: null, reviews },
      news: [],
      risks: {
        legal: researchText.toLowerCase().includes('lawsuit') || researchText.toLowerCase().includes('legal') ? ['Legal mentions found in research'] : [],
        financial: researchText.toLowerCase().includes('bankruptcy') || researchText.toLowerCase().includes('debt') ? ['Financial concerns mentioned'] : [],
        operational: [],
        reputational: researchText.toLowerCase().includes('complaint') || researchText.toLowerCase().includes('negative') ? ['Reputation concerns found'] : []
      },
      competitive: {
        industry: 'Technology',
        competitors: [],
        marketPosition: found ? 'Active online presence' : 'Limited online presence'
      }
    };
  }
  
  private parseOwnerResearch(name: string, researchText: string) {
    const found = !researchText.toLowerCase().includes('not found') && 
                  !researchText.toLowerCase().includes('no results');
                  
    const linkedinMatch = researchText.match(/linkedin[^\s]*:\s*(https?:\/\/[^\s]+)/i);
    const linkedinProfile = linkedinMatch ? linkedinMatch[1] : null;
    
    return {
      name,
      found,
      professionalHistory: found ? ['Professional background found'] : [],
      education: found ? ['Education information available'] : [],
      linkedinProfile,
      publicRecords: []
    };
  }
  
  private assessOverallRisk(companyResearch: any, ownerResearch: any[]) {
    let riskScore = 0;
    const factors = [];
    
    // Company legitimacy
    if (!companyResearch.found) {
      riskScore += 30;
      factors.push('Limited online presence');
    }
    
    if (!companyResearch.website) {
      riskScore += 20;
      factors.push('No official website found');
    }
    
    // Owner verification
    const foundOwners = ownerResearch.filter(owner => owner.found).length;
    if (foundOwners === 0) {
      riskScore += 25;
      factors.push('No owner information found online');
    }
    
    // Risk factors
    const totalRisks = Object.values(companyResearch.risks).flat().length;
    riskScore += totalRisks * 10;
    
    const riskLevel = riskScore > 60 ? 'high' : riskScore > 30 ? 'moderate' : 'low';
    const legitimacy = riskScore < 20 ? 'verified' : riskScore < 50 ? 'unverified' : 'questionable';
    
    return {
      legitimacy,
      riskLevel,
      recommendedAction: riskLevel === 'high' ? 'Decline or require additional verification' :
                        riskLevel === 'moderate' ? 'Approve with enhanced monitoring' :
                        'Standard approval process',
      confidence: Math.max(20, 100 - riskScore)
    };
  }
  
  private getMinimalResearchResult(companyName: string, ownerNames: string[], error: string): BusinessIntelligence {
    return {
      companyName,
      foundOnline: false,
      website: null,
      socialMedia: { linkedin: null, facebook: null, reviews: [] },
      newsAndMedia: [],
      riskFactors: {
        legal: [],
        financial: [],
        operational: [`Research error: ${error}`],
        reputational: []
      },
      competitivePosition: {
        industry: 'Unknown',
        competitors: [],
        marketPosition: 'Unknown'
      },
      ownerBackground: ownerNames.map(name => ({
        name,
        found: false,
        professionalHistory: [],
        education: [],
        linkedinProfile: null,
        publicRecords: [`Research error: ${error}`]
      })),
      overallAssessment: {
        legitimacy: 'unverified',
        riskLevel: 'high',
        recommendedAction: 'Require manual verification due to research limitations',
        confidence: 10
      }
    };
  }
}

export const realBusinessResearch = new RealBusinessResearch();