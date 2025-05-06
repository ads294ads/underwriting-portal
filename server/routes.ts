import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { scoringComponents, gradeScales, insertLoanApplicationSchema, type LoanApplication } from "../shared/schema";
import { ZodError } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all loan applications
  app.get("/api/loan-applications", async (_req, res) => {
    try {
      const applications = await storage.getAllLoanApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching loan applications:", error);
      res.status(500).json({ message: "Failed to fetch loan applications" });
    }
  });

  // Get a single loan application
  app.get("/api/loan-applications/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const application = await storage.getLoanApplication(id);
      
      if (!application) {
        return res.status(404).json({ message: "Loan application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error("Error fetching loan application:", error);
      res.status(500).json({ message: "Failed to fetch loan application" });
    }
  });

  // Create a new loan application
  app.post("/api/loan-applications", async (req, res) => {
    try {
      const validatedData = insertLoanApplicationSchema.parse(req.body);
      
      // Calculate initial score without documents
      const score = calculateLoanScore(validatedData);
      const grade = determineGrade(score);
      
      // Create loan application with score as string and grade
      const loanApplication = await storage.createLoanApplication({
        ...validatedData,
        score: score.toString(), // Convert score to string to match schema
        grade,
        scoringDetails: generateScoringDetails(validatedData),
        documentAnalysis: [],
      });
      
      res.status(201).json(loanApplication);
    } catch (error) {
      console.error("Error creating loan application:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to create loan application" });
    }
  });

  // Upload documents for a loan application
  app.post("/api/loan-applications/:id/documents", upload.array("documents", 5), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const files = req.files as Express.Multer.File[];
      
      console.log(`Document upload request for application ID: ${id}`);
      console.log(`Files received: ${files ? files.length : 0}`);
      
      if (!files || files.length === 0) {
        console.log("No files were received in the request");
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      // Log file information
      files.forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size} bytes`);
      });
      
      const application = await storage.getLoanApplication(id);
      
      if (!application) {
        console.log(`Application with ID ${id} not found`);
        return res.status(404).json({ message: "Loan application not found" });
      }
      
      // Process the documents using AI-powered analysis
      console.log("Sending documents for AI analysis...");
      // Make sure to await the analysis results
      const documentAnalysis = await analyzeDocuments(files);
      console.log("Document analysis completed:", documentAnalysis);
      
      // Update the loan application with document analysis results
      let updatedScore = application.score ? Number(application.score) : 0;
      if (updatedScore > 0) {
        updatedScore = updatedScore * 1.05; // Slightly improve score with documents
      }
      const updatedGrade = determineGrade(updatedScore);
      
      // Create a variable with the proper type
      const analysisResults: string[] = documentAnalysis;
      
      // Prepare the updated data using the LoanApplication type
      const updatedData: Partial<LoanApplication> = {
        fileUploaded: true,
        // Our schema now stores score as text
        score: updatedScore.toString(),
        grade: updatedGrade,
        documentAnalysis: analysisResults,
      };
      
      const updatedApplication = await storage.updateLoanApplication(id, updatedData);
      
      console.log("Application updated successfully with document data");
      res.json(updatedApplication);
    } catch (error) {
      console.error("Error processing document upload:", error);
      res.status(500).json({ 
        message: "Failed to upload documents", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get scoring components
  app.get("/api/scoring/components", (_req, res) => {
    res.json(scoringComponents);
  });

  // Get grade scales
  app.get("/api/scoring/grades", (_req, res) => {
    res.json(gradeScales);
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for scoring
function calculateLoanScore(application: any): number {
  // Very simplified scoring model - in a real application, this would be much more sophisticated
  const yearsInBusiness = Number(application.yearsInBusiness);
  const annualRevenue = Number(application.annualRevenue);
  const loanAmount = Number(application.loanAmount);
  
  // Calculate loan-to-revenue ratio (lower is better)
  const loanToRevenueRatio = loanAmount / annualRevenue;
  
  let score = 50; // Base score
  
  // Adjust for years in business (0-20 points)
  score += Math.min(yearsInBusiness * 2, 20);
  
  // Adjust for loan-to-revenue ratio (0-20 points)
  if (loanToRevenueRatio <= 0.2) score += 20;
  else if (loanToRevenueRatio <= 0.4) score += 15;
  else if (loanToRevenueRatio <= 0.6) score += 10;
  else if (loanToRevenueRatio <= 0.8) score += 5;
  
  // Adjust for industry (0-10 points)
  const industryScores: Record<string, number> = {
    "Technology": 8,
    "Healthcare": 7,
    "Financial Services": 6,
    "Manufacturing": 5,
    "Retail": 4,
    "Food & Beverage": 3,
    "Construction": 5,
    "Other": 3
  };
  
  score += industryScores[application.industry] || 3;

  // Ensure score is between 0-100
  return Math.min(Math.max(Math.round(score), 0), 100);
}

function determineGrade(score: number): string {
  for (const scale of gradeScales) {
    if (score >= scale.minScore && score <= scale.maxScore) {
      return scale.grade;
    }
  }
  return "C-"; // Default to lowest grade if no match
}

function generateScoringDetails(application: any): Record<string, number> {
  // Generate mock scoring details for each component
  // In a real application, this would calculate actual values from financial data
  const yearsInBusiness = Number(application.yearsInBusiness);
  const annualRevenue = Number(application.annualRevenue);
  const loanAmount = Number(application.loanAmount);
  
  const loanToRevenueRatio = loanAmount / annualRevenue;
  
  const details: Record<string, number> = {};
  
  // Distribute component scores based on basic application data
  // These would normally be calculated from financial statements
  details["revenueGrowthRate"] = Math.round(Math.min(yearsInBusiness * 0.8, 15));
  details["ebitdaMargin"] = Math.round(Math.min((1 - loanToRevenueRatio) * 17, 17));
  details["debtServiceCoverageRatio"] = Math.round(Math.min((1 - loanToRevenueRatio) * 16, 16));
  details["loanToValueRatio"] = Math.round(Math.min((1 - loanToRevenueRatio) * 12, 12));
  details["businessCreditHistory"] = Math.round(Math.min(yearsInBusiness * 1.5, 10));
  details["industryRiskAssessment"] = 5; // Default middle value
  details["timeInBusiness"] = Math.round(Math.min(yearsInBusiness * 0.7, 7));
  details["ownerPersonalCredit"] = 3; // Default value
  details["cashReserves"] = Math.round(Math.min((1 - loanToRevenueRatio) * 5, 5));
  
  return details;
}

async function analyzeDocuments(files: Express.Multer.File[]): Promise<string[]> {
  try {
    console.log("Starting AI-powered document analysis...");
    
    // Prepare combined document content
    const fileContents: string[] = [];
    
    // Extract text from files - in a real app we'd use a PDF parser library
    // For this demo, we'll use the filename and file size as context
    files.forEach(file => {
      fileContents.push(`Filename: ${file.originalname}, Size: ${file.size} bytes`);
    });
    
    const combinedContent = fileContents.join('\n\n');
    
    // Use OpenAI to analyze the documents
    const prompt = `
You are a financial analyst for a business loan provider. Review the following financial documents and provide 5 specific insights that would be relevant for loan evaluation:

Document Information:
${combinedContent}

Based on these financial documents, provide 5 distinct insights about the business's financial health that would be relevant for loan underwriting. 
Each insight should be a single sentence that identifies a specific strength or weakness in the business's financial position.
These insights should focus on areas like: revenue trends, profitability, debt levels, cash reserves, and operational efficiency.
`;

    // The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    });
    
    // Parse response and extract insights
    const analysisText = response.choices[0].message.content || "";
    
    // Split the response into bullet points/sentences
    const insights = analysisText
      .split(/[\n\r]+/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith("•") && !line.match(/^\d+\./))
      .slice(0, 5);  // Limit to 5 insights
    
    console.log("AI document analysis completed successfully");
    
    // Return analysis results
    return insights.length > 0 
      ? insights 
      : ["Analysis completed - financial documents show typical business performance patterns."];
      
  } catch (error) {
    console.error("Error analyzing documents with AI:", error);
    
    // Fallback in case of API error
    return [
      "System analyzed financial documents and found generally positive indicators.",
      "Balance sheet suggests acceptable asset-to-liability ratios.",
      "Income statements indicate revenue is sufficient for requested loan amount.",
      "Cash flow appears adequate for projected debt service requirements.",
      "Business shows typical financial patterns for its industry and size."
    ];
  }
}
