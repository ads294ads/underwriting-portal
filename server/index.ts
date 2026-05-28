import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

import { performComprehensiveUnderwriting } from "./underwriting-engine";
import "./document-processor";
import "./financial-calculator";
import "./background-researcher";
import "./risk-scorer";
import "./report-generator";

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// COMPREHENSIVE UNDERWRITING ENDPOINT - Direct Claude calls
app.post("/api/loan-applications/:id/comprehensive-underwriting", async (req: Request, res: Response) => {
  try {
    const applicationId = parseInt(req.params.id);
    const applications = await storage.getAllLoanApplications();
    const application = applications.find(app => app.id === applicationId);
    
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // STEP 1: Financial Analysis
    const financialPrompt = `Analyze this business loan application for ${application.businessName} in ${application.industry}.

Stated Information:
- Annual Revenue: $${application.annualRevenue}
- Loan Request: $${application.loanAmount}
- Years in Business: ${application.yearsInBusiness}
- Business Owner(s): ${application.businessOwners?.map(o => o.name).join(", ") || "Not specified"}

Documents Uploaded: ${application.documentAnalysis?.join(", ") || "None"}

Based on typical financial metrics for ${application.industry}, provide:
1. Financial Health Score (0-100)
2. Key financial ratios (current ratio, debt-to-equity, profit margin estimates)
3. Revenue-to-loan ratio assessment
4. Cash flow viability
5. Financial red flags or concerns

Return as JSON: { financialScore, ratios, assessment, redFlags: [], strengths: [] }`;

    const financialResponse = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1000,
      messages: [{ role: "user", content: financialPrompt }]
    });

    let financialData = { financialScore: 70, ratios: {}, assessment: "", redFlags: [], strengths: [] };
    try {
      const match = (financialResponse.content[0].type === 'text' ? financialResponse.content[0].text : '').match(/\{[\s\S]*\}/);
      if (match) financialData = JSON.parse(match[0]);
    } catch (e) {}

    // STEP 2: Business Viability & Risk
    const businessPrompt = `Evaluate business viability and risk for ${application.businessName}:

Business: ${application.businessName}
Industry: ${application.industry}
Years Operating: ${application.yearsInBusiness}
Loan Request: $${application.loanAmount} (${((application.loanAmount / application.annualRevenue) * 100).toFixed(1)}% of revenue)

Assess:
1. Business Viability Score (0-100) - likelihood of success
2. Industry risk level (LOW/MODERATE/HIGH)
3. Owner credibility based on experience level
4. Operational risk factors
5. Market risk assessment
6. Overall lending recommendation

Return JSON: { viabilityScore, industryRisk, ownerCredibility, operationalRisks: [], marketRisks: [], recommendation: "APPROVE|REVIEW|DECLINE", reasoning: "" }`;

    const businessResponse = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1000,
      messages: [{ role: "user", content: businessPrompt }]
    });

    let businessData = { viabilityScore: 70, industryRisk: "MODERATE", ownerCredibility: 70, operationalRisks: [], marketRisks: [], recommendation: "REVIEW", reasoning: "" };
    try {
      const match = (businessResponse.content[0].type === 'text' ? businessResponse.content[0].text : '').match(/\{[\s\S]*\}/);
      if (match) businessData = JSON.parse(match[0]);
    } catch (e) {}

    // STEP 3: Final Underwriting Decision
    const decisionPrompt = `Based on this analysis, provide final underwriting decision:

Financial Score: ${financialData.financialScore}
Business Viability: ${businessData.viabilityScore}
Industry Risk: ${businessData.industryRisk}
Loan Amount: $${application.loanAmount}
Annual Revenue: $${application.annualRevenue}

Provide:
1. Final recommendation (APPROVE/REVIEW/DECLINE)
2. Overall risk score (0-100, where 0 is lowest risk)
3. Key conditions if approved
4. Next steps
5. Executive summary (2-3 sentences)

Return JSON: { finalRecommendation, overallRisk, conditions: [], nextSteps: [], summary: "" }`;

    const decisionResponse = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 500,
      messages: [{ role: "user", content: decisionPrompt }]
    });

    let decisionData = { finalRecommendation: "REVIEW", overallRisk: 50, conditions: [], nextSteps: [], summary: "" };
    try {
      const match = (decisionResponse.content[0].type === 'text' ? decisionResponse.content[0].text : '').match(/\{[\s\S]*\}/);
      if (match) decisionData = JSON.parse(match[0]);
    } catch (e) {}

    // Build comprehensive report
    const report = {
      executiveSummary: {
        recommendation: decisionData.finalRecommendation,
        overallRisk: decisionData.overallRisk,
        summary: decisionData.summary,
        keyMetrics: {
          financialScore: financialData.financialScore,
          businessViability: businessData.viabilityScore,
          ownerCredibility: businessData.ownerCredibility,
          loanToRevenue: `${((application.loanAmount / application.annualRevenue) * 100).toFixed(1)}%`
        }
      },
      financialAnalysis: {
        score: financialData.financialScore,
        ratios: financialData.ratios,
        assessment: financialData.assessment,
        strengths: financialData.strengths,
        redFlags: financialData.redFlags
      },
      businessAnalysis: {
        viabilityScore: businessData.viabilityScore,
        industryRisk: businessData.industryRisk,
        ownerCredibility: businessData.ownerCredibility,
        operationalRisks: businessData.operationalRisks,
        marketRisks: businessData.marketRisks,
        reasoning: businessData.reasoning
      },
      underwritingDecision: {
        recommendation: decisionData.finalRecommendation,
        riskScore: decisionData.overallRisk,
        conditions: decisionData.conditions,
        nextSteps: decisionData.nextSteps
      },
      generatedAt: new Date().toISOString()
    };

    // Save to database
    await storage.updateLoanApplication(applicationId, {
      ...application,
      comprehensiveUnderwritingReport: report
    });

    res.json({ success: true, report });

  } catch (error: any) {
    console.error("[UNDERWRITING] Error:", error.message);
    res.status(500).json({ error: "Failed to perform comprehensive underwriting", details: error.message });
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
