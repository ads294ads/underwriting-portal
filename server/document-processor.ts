import Anthropic from "@anthropic-ai/sdk";

export interface DocumentAnalysisResult {
  revenue: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  cashOnHand: number;
  accountsReceivable: number;
  inventory: number;
  accountsPayable: number;
  shortTermDebt: number;
  longTermDebt: number;
  interestExpense: number;
  taxExpense: number;
  operatingExpense: number;
  costOfGoodsSold: number;
  confidence: number;
  summary: string;
  redFlags: string[];
}

export async function analyzeDocumentsWithClaude(
  businessName: string,
  documentSummaries: string[]
): Promise<DocumentAnalysisResult> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const documentText = documentSummaries.join("\n\n");
  
  const prompt = `You are a financial analyst. Extract PRECISE financial data from these documents for: ${businessName}

DOCUMENTS:
${documentText}

Return ONLY this JSON (no markdown, no explanation):
{
  "revenue": <annual revenue as number, 0 if not found>,
  "netIncome": <net income as number, 0 if not found>,
  "totalAssets": <total assets as number, 0 if not found>,
  "totalLiabilities": <total liabilities as number, 0 if not found>,
  "cashOnHand": <cash balance as number, 0 if not found>,
  "accountsReceivable": <AR as number, 0 if not found>,
  "inventory": <inventory as number, 0 if not found>,
  "accountsPayable": <AP as number, 0 if not found>,
  "shortTermDebt": <current debt as number, 0 if not found>,
  "longTermDebt": <LT debt as number, 0 if not found>,
  "interestExpense": <interest paid as number, 0 if not found>,
  "taxExpense": <taxes paid as number, 0 if not found>,
  "operatingExpense": <opex as number, 0 if not found>,
  "costOfGoodsSold": <COGS as number, 0 if not found>,
  "confidence": <0-100 confidence score>,
  "summary": "Brief financial summary (1-2 sentences)",
  "redFlags": ["flag1", "flag2"] or []
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-1-20250805",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Claude analysis error:", error);
  }

  return getDefaultResult();
}

function getDefaultResult(): DocumentAnalysisResult {
  return {
    revenue: 0,
    netIncome: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    cashOnHand: 0,
    accountsReceivable: 0,
    inventory: 0,
    accountsPayable: 0,
    shortTermDebt: 0,
    longTermDebt: 0,
    interestExpense: 0,
    taxExpense: 0,
    operatingExpense: 0,
    costOfGoodsSold: 0,
    confidence: 0,
    summary: "No financial documents analyzed",
    redFlags: ["Missing financial documents"]
  };
}
