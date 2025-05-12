import OpenAI from 'openai';

async function testDocumentAnalysis() {
  try {
    // Initialize the OpenAI client with the environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Testing OpenAI API for document analysis...");
    
    // Sample financial document text (simplified)
    const sampleDocText = `
ANNUAL FINANCIAL STATEMENT
AcmeCorp Inc.
Fiscal Year 2024

REVENUE
Total Revenue: $1,250,000
- Product Sales: $950,000
- Service Contracts: $300,000

EXPENSES
Cost of Goods Sold: $525,000
Operating Expenses:
- Salaries and Benefits: $325,000
- Rent and Utilities: $85,000
- Marketing and Advertising: $45,000
- Other Expenses: $50,000
Total Expenses: $1,030,000

PROFIT
Gross Profit: $725,000
Net Income: $220,000

RATIOS
Gross Margin: 58%
Net Profit Margin: 17.6%
Debt-to-Equity Ratio: 0.45
Current Ratio: 2.3
`;

    // Document analysis prompt
    const prompt = `
You are an expert financial analyst and loan underwriter with decades of experience evaluating business loan applications.
Please analyze the following financial document for a company seeking a business loan.
Provide a detailed assessment in structured JSON format with the following sections:
- keyFindings: Array of important observations
- financialMetrics: Object containing key metrics with their values and impacts
- underwritingEvaluation: Object with strengths, weaknesses, risks, and mitigating factors (each as arrays)
- overallAssessment: String with summary assessment
- impactOnScore: Number from 0-10 indicating how this document affects loan decision

Here is the document:
${sampleDocText}
`;

    // Make an API call similar to what's used in the application, with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert financial analyst and loan underwriter with decades of experience evaluating business loan applications. Analyze financial documents to assess loan risk and creditworthiness. Provide detailed, structured analysis following business loan underwriting standards."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500, // Reduced token count for faster response
        response_format: { type: "json_object" }
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }

    console.log("Document analysis test successful!");
    console.log("JSON response snippet (first 300 chars):", 
      response.choices[0].message.content.substring(0, 300) + "...");
    
    return true;
  } catch (error) {
    console.error("Error in document analysis test:", error);
    return false;
  }
}

// Run the test
testDocumentAnalysis()
  .then((success) => {
    if (success) {
      console.log("Document analysis functionality is working correctly!");
    } else {
      console.log("Document analysis test failed. Please check the error message above.");
    }
  })
  .catch((error) => {
    console.error("Unexpected error during test:", error);
  });