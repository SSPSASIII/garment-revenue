/**
 * Represents key economic indicators for Sri Lanka.
 */
export interface EconomicIndicators {
  /**
   * The GDP growth rate (%).
   */
  gdpGrowthRate: number;
  /**
   * The inflation rate (%).
   */
  inflationRate: number;
  /**
   * The unemployment rate (%).
   */
  unemploymentRate: number;
  /**
   * The current USD to LKR exchange rate.
   */
  exchangeRate: number;
}

/**
 * Asynchronously retrieves Sri Lankan economic indicators.
 *
 * @returns A promise that resolves to an EconomicIndicators object.
 * In a real application, this would fetch data from a reliable API (e.g., Central Bank of Sri Lanka, World Bank).
 */
export async function getEconomicIndicators(): Promise<EconomicIndicators> {
  // Placeholder data - Replace with actual API calls
  console.log("Fetching economic indicators (using placeholder data)...");
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 150));

  // Example placeholder values
  return {
    gdpGrowthRate: 1.5,       // Example: 1.5% growth
    inflationRate: 9.8,       // Example: 9.8% inflation
    unemploymentRate: 5.2,    // Example: 5.2% unemployment
    exchangeRate: 315.50,     // Example: 1 USD = 315.50 LKR
  };
}
