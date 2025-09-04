import OpenAI from 'openai';
import * as fs from 'fs';
import pdf from 'pdf-parse';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface RealFinancialData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  expenses: {
    total: number;
    breakdown: Record<string, number>;
  };
  assets: {
    current: number;
    fixed: number;
    total: number;
  };
  liabilities: {
    current: number;
    longTerm: number;
    total: number;
  };
  ratios: {
    currentRatio: number;
    debtToEquity: number;
    profitMargin: number;
    roa: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
  };
}

export interface DocumentInsights {
  documentType: string;
  financialData: RealFinancialData;
  keyInsights: string[];
  redFlags: string[];
  strengths: string[];
  actualNumbers: Record<string, number>;
  confidence: number;
  rawText: string;
}

export class RealDocumentAnalyzer {
  
  async analyzeActualDocument(filePath: string): Promise<DocumentInsights> {
    try {
      // Read and extract actual text from PDF
      const buffer = fs.readFileSync(filePath);
      const data = await pdf(buffer);
      const actualText = data.text;
      
      if (!actualText || actualText.trim().length < 50) {
        throw new Error('Unable to extract meaningful text from document');
      }

      console.log(`Extracted ${actualText.length} characters from ${filePath}`);
      
      // Use GPT-5 to extract actual financial data
      const prompt = `You are a senior financial analyst. Analyze this ACTUAL financial document and extract REAL numbers and insights.

CRITICAL: Do not generate placeholder data. Only extract actual numbers and information present in the document.

Document content:
${actualText}

Extract the following information ONLY if present in the document:

1. ACTUAL REVENUE NUMBERS:
- Current period revenue (exact dollar amount)
- Previous period revenue (if available)
- Calculate actual growth percentage

2. ACTUAL EXPENSE BREAKDOWN:
- Total expenses
- Major expense categories with actual amounts
- Cost of goods sold, operating expenses, etc.

3. ACTUAL BALANCE SHEET DATA:
- Current assets (cash, accounts receivable, inventory)
- Fixed assets (property, equipment)
- Current liabilities (accounts payable, short-term debt)
- Long-term liabilities

4. CALCULATED RATIOS:
- Current ratio (current assets / current liabilities)
- Debt-to-equity ratio
- Profit margin percentage
- Return on assets

5. ACTUAL INSIGHTS:
- Real strengths based on actual numbers
- Actual red flags or concerns
- Specific observations about financial health

Return ONLY a JSON object with this structure:
{
  "documentType": "income_statement|balance_sheet|cash_flow|tax_return",
  "financialData": {
    "revenue": {"current": number, "previous": number, "growth": number},
    "expenses": {"total": number, "breakdown": {"category": amount}},
    "assets": {"current": number, "fixed": number, "total": number},
    "liabilities": {"current": number, "longTerm": number, "total": number},
    "ratios": {"currentRatio": number, "debtToEquity": number, "profitMargin": number, "roa": number},
    "cashFlow": {"operating": number, "investing": number, "financing": number}
  },
  "keyInsights": ["insight 1", "insight 2"],
  "redFlags": ["red flag 1 if any"],
  "strengths": ["strength 1", "strength 2"],
  "actualNumbers": {"metric_name": value},
  "confidence": percentage_based_on_data_quality
}

If you cannot extract actual numbers, set values to null and lower confidence. DO NOT make up numbers.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 3000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        documentType: analysis.documentType || 'unknown',
        financialData: analysis.financialData || this.getEmptyFinancialData(),
        keyInsights: analysis.keyInsights || [],
        redFlags: analysis.redFlags || [],
        strengths: analysis.strengths || [],
        actualNumbers: analysis.actualNumbers || {},
        confidence: analysis.confidence || 30,
        rawText: actualText.substring(0, 2000) // First 2000 chars for reference
      };
      
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  private getEmptyFinancialData(): RealFinancialData {
    return {
      revenue: { current: 0, previous: 0, growth: 0 },
      expenses: { total: 0, breakdown: {} },
      assets: { current: 0, fixed: 0, total: 0 },
      liabilities: { current: 0, longTerm: 0, total: 0 },
      ratios: { currentRatio: 0, debtToEquity: 0, profitMargin: 0, roa: 0 },
      cashFlow: { operating: 0, investing: 0, financing: 0 }
    };
  }
}

export const realDocumentAnalyzer = new RealDocumentAnalyzer();