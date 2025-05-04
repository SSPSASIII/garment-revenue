import fetch from 'node-fetch'; // Use node-fetch for server-side requests

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

// Placeholder URLs - Replace with actual API endpoints
const CBSL_API_ENDPOINT = 'https://api.cbsl.gov.lk/v1/indicators'; // Example
const WORLD_BANK_API_ENDPOINT = 'https://api.worldbank.org/v2/country/LK/indicator/NY.GDP.MKTP.KD.ZG?format=json'; // Example GDP Growth

// Default values to return in case of API failure
const defaultIndicators: EconomicIndicators = {
    gdpGrowthRate: 1.0, // Provide sensible defaults
    inflationRate: 10.0,
    unemploymentRate: 5.0,
    exchangeRate: 310.0,
};

/**
 * Asynchronously retrieves Sri Lankan economic indicators by fetching data from
 * relevant APIs like the Central Bank of Sri Lanka and the World Bank.
 *
 * **Note:** This function requires API keys to be set in environment variables:
 * - `CBSL_API_KEY`: For the Central Bank API.
 * - `WORLD_BANK_API_KEY`: For the World Bank API (if needed, some WB data is public).
 *
 * Replace placeholder API endpoints with actual URLs.
 *
 * @returns A promise that resolves to an EconomicIndicators object containing the latest data, or default values if APIs fail.
 */
export async function getEconomicIndicators(): Promise<EconomicIndicators> {
  console.log("Fetching real-time economic indicators...");

  const cbslApiKey = process.env.CBSL_API_KEY;
  // const worldBankApiKey = process.env.WORLD_BANK_API_KEY; // May not be needed depending on endpoint

  if (!cbslApiKey) {
    console.warn("CBSL_API_KEY environment variable not set. Using default economic data.");
    return defaultIndicators;
  }

  try {
    // --- Fetch data from Central Bank API ---
    // Note: Adjust endpoint and headers based on actual CBSL API documentation
    const cbslResponse = await fetch(CBSL_API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cbslApiKey}`, // Adjust auth scheme if needed
        'Content-Type': 'application/json',
      },
      // Add timeout if needed: signal: AbortSignal.timeout(5000) // 5 seconds
    });

    if (!cbslResponse.ok) {
      throw new Error(`Central Bank API Error: ${cbslResponse.status} ${cbslResponse.statusText}`);
    }
    const cbslData = await cbslResponse.json() as any; // Cast to 'any' or define a specific type

    // --- Fetch additional data (e.g., GDP from World Bank) ---
    // Note: World Bank API might not need a key for some indicators. Check their docs.
    const worldBankResponse = await fetch(WORLD_BANK_API_ENDPOINT);
    if (!worldBankResponse.ok) {
        console.warn(`World Bank API Error: ${worldBankResponse.status} ${worldBankResponse.statusText}. GDP data might be missing.`);
        // Decide whether to throw error or continue with partial data
    }
    const worldBankData = worldBankResponse.ok ? await worldBankResponse.json() : null;

    // --- Parse and Combine Data ---
    // This part heavily depends on the actual structure of the API responses
    // Example parsing (replace with actual logic):
    const latestWorldBankGDP = worldBankData?.[1]?.[0]?.value; // Example path to latest value

    const indicators: EconomicIndicators = {
      // Use CBSL data preferentially, fallback where needed
      gdpGrowthRate: typeof latestWorldBankGDP === 'number' ? parseFloat(latestWorldBankGDP.toFixed(1)) : (cbslData?.gdp_growth_latest ?? defaultIndicators.gdpGrowthRate),
      inflationRate: cbslData?.inflation_rate_ccpi ?? defaultIndicators.inflationRate,
      unemploymentRate: cbslData?.unemployment_rate ?? defaultIndicators.unemploymentRate,
      exchangeRate: cbslData?.exchange_rate_usd_lkr_avg ?? defaultIndicators.exchangeRate,
    };

    console.log("Economic Indicators (Fetched):", indicators);
    return indicators;

  } catch (error: unknown) {
    console.error("Failed to fetch real-time economic indicators:", error instanceof Error ? error.message : String(error));
    console.log("Falling back to default economic data due to error.");
    return defaultIndicators;
  }
}
