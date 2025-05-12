import { pgTable, text, serial, integer, boolean, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const scoringComponents = [
  { key: "revenueGrowthRate", name: "Revenue Growth Rate (3yr)", weight: 0.18, desc: "Average YoY revenue increase, indicates business expansion and demand." },
  { key: "ebitdaMargin", name: "EBITDA Margin", weight: 0.17, desc: "Earnings before interest/taxes as % of revenue, measures profitability." },
  { key: "debtServiceCoverageRatio", name: "Debt Service Coverage Ratio", weight: 0.16, desc: "Operating income to debt obligations ratio, shows payment capacity." },
  { key: "loanToValueRatio", name: "Loan-to-Value Ratio", weight: 0.12, desc: "Loan amount relative to business assets, measures secured collateral." },
  { key: "businessCreditHistory", name: "Business Credit History", weight: 0.10, desc: "Payment history, existing credit utilization, and history length." },
  { key: "industryRiskAssessment", name: "Industry Risk Assessment", weight: 0.10, desc: "Economic outlook for specific industry, market trends, and volatility." },
  { key: "timeInBusiness", name: "Time in Business", weight: 0.07, desc: "Business longevity and stability, longer history reduces risk." },
  { key: "ownerPersonalCredit", name: "Owner's Personal Credit", weight: 0.05, desc: "Owner's credit score and history, particularly important for small businesses." },
  { key: "cashReserves", name: "Cash Reserves", weight: 0.05, desc: "Liquid assets available to handle business fluctuations and emergencies." }
];

export type ScoringComponent = typeof scoringComponents[number];

export const gradeScales = [
  { grade: "A+", minScore: 90, maxScore: 100, description: "Excellent credit quality with minimal risk. Qualifies for premium loan terms." },
  { grade: "A", minScore: 85, maxScore: 89, description: "Very strong credit quality with low risk. Qualifies for favorable loan terms." },
  { grade: "A-", minScore: 80, maxScore: 84, description: "Strong credit quality with low risk. Qualifies for competitive loan terms." },
  { grade: "B+", minScore: 75, maxScore: 79, description: "Good credit quality with moderate risk. Qualifies for standard loan terms." },
  { grade: "B", minScore: 65, maxScore: 74, description: "Satisfactory credit quality with moderate risk. Qualifies for standard loan terms with potential adjustments." },
  { grade: "B-", minScore: 60, maxScore: 64, description: "Adequate credit quality with increased risk. Qualifies for standard loan terms with adjustments." },
  { grade: "C+", minScore: 50, maxScore: 59, description: "Moderate credit quality with notable risk. May qualify for loans with additional requirements." },
  { grade: "C", minScore: 40, maxScore: 49, description: "Weak credit quality with significant risk. Qualifies for limited loan options with strict terms." },
  { grade: "C-", minScore: 0, maxScore: 39, description: "Poor credit quality with high risk. Limited loan eligibility with substantial requirements." }
];

export type GradeScale = typeof gradeScales[number];

export const industries = [
  "Technology", 
  "Retail", 
  "Manufacturing", 
  "Healthcare", 
  "Financial Services", 
  "Food & Beverage",
  "Construction",
  "Real Estate",
  "Transportation",
  "Education",
  "Energy",
  "Hospitality",
  "Agriculture",
  "Entertainment",
  "Other"
];

// Define Owner type with flexible property names for ownership
export type Owner = {
  name: string;
  ownershipPercentage?: number; // Primary ownership percentage property
  ownership?: number;           // Alternative ownership property name
  title?: string;
};

// Extended Loan Application type for use with enhanced research features
export type LoanApplication = {
  id: number;
  businessName: string;
  industry: string;
  yearsInBusiness: string | number;
  annualRevenue: string | number;
  loanAmount: string | number;
  email: string;
  businessOwners?: Owner[] | null;
  owners?: Owner[]; // Alias for businessOwners for compatibility
  city?: string;
  state?: string;
  fileUploaded?: boolean | null;
  score?: string;
  grade?: string;
  scoringDetails?: Record<string, number>;
  documentAnalysis?: string[];
  deepResearchCompleted?: boolean;
  createdAt?: Date | null;
}

export const loanApplications = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  industry: text("industry").notNull(),
  yearsInBusiness: numeric("years_in_business").notNull(),
  annualRevenue: numeric("annual_revenue").notNull(),
  loanAmount: numeric("loan_amount").notNull(),
  email: text("email").notNull(),
  // Add owners information
  businessOwners: json("business_owners").$type<Owner[]>(),
  fileUploaded: boolean("file_uploaded").default(false),
  score: text("score"), // Store score as text to avoid type issues
  grade: text("grade"),
  scoringDetails: json("scoring_details").$type<Record<string, number>>(),
  documentAnalysis: json("document_analysis").$type<string[]>(),
  deepResearchCompleted: boolean("deep_research_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ownerSchema = z.object({
  name: z.string().min(1, "Owner name is required"),
  ownership: z.union([z.string(), z.number()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  ownershipPercentage: z.union([z.number(), z.undefined()]) // Add for compatibility with enhanced research
    .optional()
    .transform(val => val === undefined ? undefined : val),
  title: z.string().optional()
});

export const insertLoanApplicationSchema = createInsertSchema(loanApplications)
  .omit({
    id: true,
    createdAt: true,
    score: true,
    grade: true,
    scoringDetails: true,
    documentAnalysis: true,
    deepResearchCompleted: true,
  })
  .extend({
    // Converting numeric fields to allow both string and number inputs
    yearsInBusiness: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ),
    annualRevenue: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ),
    loanAmount: z.union([z.string(), z.number()]).transform(val => 
      typeof val === 'string' ? parseFloat(val) : val
    ),
    // Add validation for business owners
    businessOwners: z.array(ownerSchema)
      .min(1, "At least one business owner is required")
      .default([]),
  });

export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
// We're using an extended LoanApplication type defined earlier that includes the enhanced research fields
export type ScoringDetails = Record<string, number>;
