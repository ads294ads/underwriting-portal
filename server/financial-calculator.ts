export interface FinancialRatios {
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    workingCapital: number;
  };
  profitability: {
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    roa: number;
    roe: number;
  };
  leverage: {
    debtToEquity: number;
    debtToAssets: number;
    equityRatio: number;
    interestCoverage: number;
  };
  efficiency: {
    assetTurnover: number;
    receivablesTurnover: number;
    inventoryTurnover: number;
  };
}

export interface BenchmarkComparison {
  industry: string;
  currentRatioVsBenchmark: string;
  profitMarginVsBenchmark: string;
  debtToEquityVsBenchmark: string;
  assessment: string;
}

export function calculateFinancialRatios(
  revenue: number,
  netIncome: number,
  totalAssets: number,
  totalLiabilities: number,
  cashOnHand: number,
  accountsReceivable: number,
  inventory: number,
  operatingExpense: number,
  costOfGoodsSold: number,
  interestExpense: number
): FinancialRatios {
  const equity = totalAssets - totalLiabilities;
  const currentAssets = cashOnHand + accountsReceivable + inventory;
  const currentLiabilities = Math.max(totalLiabilities * 0.4, 1);
  const grossProfit = revenue - costOfGoodsSold;

  return {
    liquidity: {
      currentRatio: currentAssets / currentLiabilities,
      quickRatio: (currentAssets - inventory) / currentLiabilities,
      cashRatio: cashOnHand / currentLiabilities,
      workingCapital: currentAssets - currentLiabilities
    },
    profitability: {
      grossMargin: (grossProfit / revenue) * 100,
      operatingMargin: ((revenue - operatingExpense) / revenue) * 100,
      netMargin: (netIncome / revenue) * 100,
      roa: (netIncome / totalAssets) * 100,
      roe: equity > 0 ? (netIncome / equity) * 100 : 0
    },
    leverage: {
      debtToEquity: equity > 0 ? totalLiabilities / equity : 0,
      debtToAssets: (totalLiabilities / totalAssets) * 100,
      equityRatio: (equity / totalAssets) * 100,
      interestCoverage: interestExpense > 0 ? (revenue - costOfGoodsSold - operatingExpense) / interestExpense : 0
    },
    efficiency: {
      assetTurnover: revenue / totalAssets,
      receivablesTurnover: revenue / Math.max(accountsReceivable, 1),
      inventoryTurnover: costOfGoodsSold / Math.max(inventory, 1)
    }
  };
}

export function compareToBenchmark(ratios: FinancialRatios, industry: string): BenchmarkComparison {
  const benchmarks: { [key: string]: { currentRatio: number; netMargin: number; debtToEquity: number } } = {
    Manufacturing: { currentRatio: 1.5, netMargin: 8, debtToEquity: 1.0 },
    Retail: { currentRatio: 1.3, netMargin: 5, debtToEquity: 1.2 },
    Services: { currentRatio: 1.2, netMargin: 15, debtToEquity: 0.8 },
    Technology: { currentRatio: 2.0, netMargin: 20, debtToEquity: 0.5 },
    Construction: { currentRatio: 1.4, netMargin: 7, debtToEquity: 1.5 }
  };

  const bench = benchmarks[industry] || benchmarks.Manufacturing;
  
  const currentRatioAssess = ratios.liquidity.currentRatio >= bench.currentRatio * 0.8 ? "STRONG" : "WEAK";
  const marginAssess = ratios.profitability.netMargin >= bench.netMargin * 0.8 ? "STRONG" : "WEAK";
  const debtAssess = ratios.leverage.debtToEquity <= bench.debtToEquity * 1.2 ? "HEALTHY" : "HIGH";

  return {
    industry,
    currentRatioVsBenchmark: `${ratios.liquidity.currentRatio.toFixed(2)}x (Benchmark: ${bench.currentRatio}x) - ${currentRatioAssess}`,
    profitMarginVsBenchmark: `${ratios.profitability.netMargin.toFixed(1)}% (Benchmark: ${bench.netMargin}%) - ${marginAssess}`,
    debtToEquityVsBenchmark: `${ratios.leverage.debtToEquity.toFixed(2)}x (Benchmark: ${bench.debtToEquity}x) - ${debtAssess}`,
    assessment: `${currentRatioAssess} liquidity, ${marginAssess} profitability, ${debtAssess} leverage for ${industry} sector`
  };
}
