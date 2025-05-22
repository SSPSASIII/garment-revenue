/**
 * @fileOverview Service for fetching Sri Lankan economic indicators.
 * Intended for SERVER-SIDE use.
 */
import { APIErrorHandler } from './error-handler';
// import fetch from 'node-fetch'; // Uncomment if you decide to use node-fetch
// Make sure to install node-fetch if you use it: npm install node-fetch @types/node-fetch

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

// Placeholder URLs - Replace with actual API endpoints from your research
const CBSL_API_ENDPOINT_INDICATORS = process.env.CBSL_API_ENDPOINT_INDICATORS || 'https://api.cbsl.gov.lk/v1/data/economic-indicators'; // Example, adjust path
const CBSL_API_ENDPOINT_EXCHANGE_RATES = process.env.CBSL_API_ENDPOINT_EXCHANGE_RATES || 'https://api.cbsl.gov.lk/v1/data/exchange-rates'; // Example, adjust path
const WORLD_BANK_API_ENDPOINT_GDP_LK = process.env.WORLD_BANK_API_ENDPOINT_GDP_LK || 'https://api.worldbank.org/v2/country/LKA/indicator/NY.GDP.MKTP.KD.ZG?format=json&mrnev=1'; // Most recent 1 value

// Default values to return in case of API failure or missing data
const defaultIndicators: EconomicIndicators = {
    gdpGrowthRate: 1.5, // Sensible default for Sri Lanka (can vary)
    inflationRate: 5.0, // Sensible default
    unemploymentRate: 4.8, // Sensible default
    exchangeRate: 300.0, // Sensible default (LKR per USD)
};

/**
 * Asynchronously retrieves Sri Lankan economic indicators by fetching data from
 * relevant APIs like the Central Bank of Sri Lanka and the World Bank.
 * Intended for SERVER-SIDE use.
 *
 * This function uses the native `fetch` API available in Node.js 18+ and modern browsers.
 *
 * @returns A promise that resolves to an EconomicIndicators object containing the latest data, or default values if APIs fail.
 */
export async function getEconomicIndicators(): Promise<EconomicIndicators> {
  console.log("Fetching real-time economic indicators (server-side)...");

  const cbslApiKey = process.env.CBSL_API_KEY; // Assuming one key for all CBSL endpoints or specific keys
  // const worldBankApiKey = process.env.WORLD_BANK_API_KEY; // World Bank public data often doesn't require a key

  // Prepare headers for CBSL API if an API key is provided
  const cbslHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (cbslApiKey) {
    cbslHeaders['Authorization'] = `Bearer ${cbslApiKey}`; // Or 'X-API-Key' or other, per CBSL docs
  }

  try {
    // --- Fetch data from Central Bank API for various indicators ---
    let cbslInflationRate = defaultIndicators.inflationRate;
    let cbslUnemploymentRate = defaultIndicators.unemploymentRate;

    // Example: Fetching general indicators (inflation, unemployment)
    // This is a conceptual endpoint; replace with actual one from CBSL documentation
    if (CBSL_API_ENDPOINT_INDICATORS) {
        try {
            const cbslIndicatorsResponse = await fetch(CBSL_API_ENDPOINT_INDICATORS, {
                method: 'GET',
                headers: cbslHeaders,
            });
            if (!cbslIndicatorsResponse.ok) {
                console.warn(`CBSL Economic Indicators API Warning: ${cbslIndicatorsResponse.status} ${cbslIndicatorsResponse.statusText}. Using defaults for some indicators.`);
            } else {
                const cbslIndicatorsData = await cbslIndicatorsResponse.json() as any; // Define specific type based on API response
                // Example parsing (ADJUST BASED ON ACTUAL API RESPONSE STRUCTURE)
                cbslInflationRate = cbslIndicatorsData?.data?.latest?.inflation_rate_ccpi_percentage ?? defaultIndicators.inflationRate;
                cbslUnemploymentRate = cbslIndicatorsData?.data?.latest?.unemployment_rate_percentage ?? defaultIndicators.unemploymentRate;
            }
        } catch (err) {
            console.warn(`Error fetching/parsing CBSL Economic Indicators: ${APIErrorHandler.handleApiError(err)}. Using defaults for some indicators.`);
        }
    }


    // --- Fetch Exchange Rate from Central Bank API ---
    let cbslExchangeRate = defaultIndicators.exchangeRate;
    if (CBSL_API_ENDPOINT_EXCHANGE_RATES) {
        try {
            const cbslExchangeResponse = await fetch(CBSL_API_ENDPOINT_EXCHANGE_RATES, { // Assuming this endpoint provides USD/LKR
                method: 'GET',
                headers: cbslHeaders,
            });
            if (!cbslExchangeResponse.ok) {
                console.warn(`CBSL Exchange Rate API Warning: ${cbslExchangeResponse.status} ${cbslExchangeResponse.statusText}. Using default exchange rate.`);
            } else {
                const cbslExchangeData = await cbslExchangeResponse.json() as any; // Define specific type
                // Example parsing (ADJUST BASED ON ACTUAL API RESPONSE STRUCTURE)
                // Look for USD to LKR average or selling rate
                const usdRate = cbslExchangeData?.data?.rates?.USD?.selling_rate ?? cbslExchangeData?.data?.rates?.USD?.average_rate;
                cbslExchangeRate = usdRate ? parseFloat(usdRate) : defaultIndicators.exchangeRate;
            }
        } catch (err) {
            console.warn(`Error fetching/parsing CBSL Exchange Rate: ${APIErrorHandler.handleApiError(err)}. Using default exchange rate.`);
        }
    }


    // --- Fetch GDP Growth Rate from World Bank API ---
    let worldBankGdpGrowth = defaultIndicators.gdpGrowthRate;
    if (WORLD_BANK_API_ENDPOINT_GDP_LK) {
        try {
            const worldBankResponse = await fetch(WORLD_BANK_API_ENDPOINT_GDP_LK);
            if (!worldBankResponse.ok) {
                console.warn(`World Bank API Warning: ${worldBankResponse.status} ${worldBankResponse.statusText}. Using default GDP growth rate.`);
            } else {
                const worldBankData = await worldBankResponse.json() as any; // Define specific type
                // World Bank API returns an array: [metadata, data_array]
                // data_array is an array of objects, latest non-null is usually first if mrnev=1
                const latestGdpDataPoint = worldBankData?.[1]?.[0];
                worldBankGdpGrowth = latestGdpDataPoint?.value !== null && latestGdpDataPoint?.value !== undefined
                                     ? parseFloat(parseFloat(latestGdpDataPoint.value).toFixed(1))
                                     : defaultIndicators.gdpGrowthRate;
            }
        } catch (err) {
            console.warn(`Error fetching/parsing World Bank GDP Growth: ${APIErrorHandler.handleApiError(err)}. Using default GDP growth rate.`);
        }
    }

    const indicators: EconomicIndicators = {
      gdpGrowthRate: worldBankGdpGrowth,
      inflationRate: cbslInflationRate,
      unemploymentRate: cbslUnemploymentRate,
      exchangeRate: cbslExchangeRate,
    };

    console.log("Economic Indicators (Fetched on Server):", indicators);
    return indicators;

  } catch (error: unknown) {
    // This outer catch is for very unexpected errors not caught by inner try-catches
    console.error("Failed to fetch real-time economic indicators due to an unexpected error (server-side):", APIErrorHandler.handleApiError(error));
    console.log("Falling back to default economic data due to overall error.");
    return defaultIndicators;
  }
}
