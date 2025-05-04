/**
 * Represents key economic indicators for Sri Lanka.
 */
export interface EconomicIndicators {
  /**
   * The estimated or actual GDP growth rate (annualized percentage).
   */
  gdpGrowthRate: number;
  /**
   * The consumer price index (CPI) inflation rate (annualized percentage).
   */
  inflationRate: number;
  /**
   * The official unemployment rate (percentage).
   */
  unemploymentRate: number;
  /**
   * The current average USD to LKR exchange rate.
   */
  exchangeRate: number;
}

/**
 * Asynchronously retrieves Sri Lankan economic indicators.
 *
 * **Note:** This function currently returns placeholder data.
 * In a real application, this would fetch data from reliable APIs
 * (e.g., Central Bank of Sri Lanka, Department of Census and Statistics, World Bank).
 *
 * @returns A promise that resolves to an EconomicIndicators object.
 */
export async function getEconomicIndicators(): Promise<EconomicIndicators> {
  console.log("Fetching economic indicators (using placeholder data)...");
  // Simulate API call delay to mimic network latency
  await new Promise(resolve => setTimeout(resolve, 250)); // Increased delay slightly

  // More realistic (but still placeholder) values as of a hypothetical point in time.
  // These would fluctuate in reality.
  const indicators: EconomicIndicators = {
    gdpGrowthRate: -0.8,     // Example: Slight contraction or slow recovery phase
    inflationRate: 6.5,     // Example: Moderated but still elevated inflation
    unemploymentRate: 4.9,    // Example: Unemployment rate
    exchangeRate: 305.75,   // Example: USD to LKR exchange rate
  };

  console.log("Economic Indicators (Placeholders):", indicators);
  return indicators;
}
