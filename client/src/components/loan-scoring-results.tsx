import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanApplication } from "@/types/loan";
import { formatCurrency } from "@/lib/formatter";
import DonutChart from "@/components/donut-chart";
import CreditScoreBar from "@/components/credit-score-bar";
import { scoringComponents, gradeScales } from "@shared/schema";

interface LoanScoringResultsProps {
  application: LoanApplication;
}

export default function LoanScoringResults({ application }: LoanScoringResultsProps) {
  const [gradeInfo, setGradeInfo] = useState<{ grade: string; description: string }>({ 
    grade: application.grade || "C-", 
    description: "Pending evaluation." 
  });

  useEffect(() => {
    const grade = gradeScales.find(g => g.grade === application.grade);
    if (grade) {
      setGradeInfo({
        grade: grade.grade,
        description: grade.description
      });
    }
  }, [application]);

  const getGradeColor = (grade: string) => {
    const firstChar = grade.charAt(0);
    if (firstChar === 'A') return 'bg-success-50 text-success-700';
    if (firstChar === 'B') return 'bg-warning-50 text-warning-700';
    return 'bg-danger-50 text-danger-700';
  };

  const getComponentScore = (key: string) => {
    return application.scoringDetails && application.scoringDetails[key] 
      ? application.scoringDetails[key]
      : 0;
  };

  const getComponentPercentage = (key: string, weight: number) => {
    const score = getComponentScore(key);
    return (score / weight) * 100;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-primary';
    if (percentage >= 50) return 'bg-warning-500';
    return 'bg-red-500';
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-neutral-200 mb-8">
      <CardHeader className="p-6 border-b border-neutral-200">
        <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center">
          <i className="fas fa-chart-bar text-primary mr-2"></i>
          Loan Evaluation Results
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Score Summary */}
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 mb-8">
          <div className="bg-neutral-50 p-6 rounded-lg border border-neutral-200 flex items-center space-x-6">
            {/* Score Display */}
            <div className="relative w-24 h-24">
              <DonutChart 
                percentage={application.score ? Number(application.score) : 0}
                color="#0050C8"
              />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-primary-600">
                  {application.score ? Math.round(Number(application.score)) : 0}
                </span>
                <span className="text-xs text-neutral-500">score</span>
              </div>
            </div>
            
            {/* Grade Display */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`grade-badge ${getGradeColor(application.grade || 'C-')} w-9 h-9 flex items-center justify-center rounded-full font-semibold`}>
                  {application.grade || "C-"}
                </div>
                <span className="text-sm text-neutral-600">Grade</span>
              </div>
              <p className="text-sm text-neutral-500 max-w-xs">
                {gradeInfo.description}
              </p>
            </div>
          </div>
          
          {/* Grade Scale */}
          <div className="flex-1 bg-neutral-50 p-6 rounded-lg border border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Grade Scale</h3>
            
            <CreditScoreBar score={application.score ? Number(application.score) : 0} />
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-neutral-700">Score Range:</span>
                <span className="text-xs text-primary-600 font-medium">
                  {application.score ? Math.round(Number(application.score)) : 0} / 100
                </span>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  <tr>
                    <td className="py-1 text-neutral-600">A+ (90-100)</td>
                    <td className="py-1 text-neutral-600">B+ (75-79)</td>
                    <td className="py-1 text-neutral-600">C+ (50-59)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-600">A (85-89)</td>
                    <td className="py-1 text-neutral-600">B (65-74)</td>
                    <td className="py-1 text-neutral-600">C (40-49)</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-neutral-600">A- (80-84)</td>
                    <td className="py-1 text-neutral-600">B- (60-64)</td>
                    <td className="py-1 text-neutral-600">C- (Below 40)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Score Breakdown */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-neutral-800 mb-4">
            Scoring Component Breakdown
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            {scoringComponents.map((component) => {
              const score = getComponentScore(component.key);
              const percentage = getComponentPercentage(component.key, component.weight);
              const weight = component.weight * 100;
              return (
                <div key={component.key} className="bg-white p-4 rounded-lg border border-neutral-200">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-700">{component.name}</span>
                    <span className="text-sm font-semibold text-primary-600">
                      {score} / {weight}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2 mb-2">
                    <div 
                      className={`${getScoreColor(percentage)} h-2 rounded-full`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Weight: {weight}%</span>
                    <span className="text-neutral-500">{component.desc}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Document Analysis */}
        {application.documentAnalysis && application.documentAnalysis.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center">
              <i className="fas fa-file-alt text-primary-400 mr-2"></i>
              Document Analysis Highlights
            </h3>
            
            <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
              <ul className="space-y-3">
                {application.documentAnalysis.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <i className={`${index % 2 === 0 ? 'fas fa-check-circle text-success-500' : 'fas fa-exclamation-circle text-warning-500'} mt-0.5 mr-2`}></i>
                    <div>
                      <p className="text-sm text-neutral-700">{item}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* Borrower Details */}
        <div>
          <h3 className="text-base font-semibold text-neutral-800 mb-4 flex items-center">
            <i className="fas fa-user-tie text-primary-400 mr-2"></i>
            Borrower & Application Details
          </h3>
          
          <div className="bg-white rounded-lg border border-neutral-200">
            <div className="grid md:grid-cols-2 gap-4 p-4">
              <div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Business Name</p>
                  <p className="text-sm font-medium text-neutral-800">{application.businessName}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Industry</p>
                  <p className="text-sm font-medium text-neutral-800">{application.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Years in Business</p>
                  <p className="text-sm font-medium text-neutral-800">{application.yearsInBusiness} years</p>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Annual Revenue</p>
                  <p className="text-sm font-medium text-neutral-800">{formatCurrency(Number(application.annualRevenue))}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-neutral-500 mb-1">Requested Loan Amount</p>
                  <p className="text-sm font-medium text-neutral-800">{formatCurrency(Number(application.loanAmount))}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Contact Email</p>
                  <p className="text-sm font-medium text-neutral-800">{application.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
