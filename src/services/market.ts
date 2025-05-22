/**
 * @fileOverview Service for fetching market signals for the Sri Lankan garment industry.
 * Intended for SERVER-SIDE use.
 */
import { APIErrorHandler } from './error-handler';
// import fetch from 'node-fetch'; // Uncomment if you decide to use node-fetch

/**
 * Represents market signals relevant to the Sri Lankan garment industry.
 */
export interface MarketSignals {
  /**
   * Index representing aggregate demand for garments in key export markets (e.g., EU, US, UK).
   * A value of 1 represents average demand. > 1 indicates stronger demand, < 1 weaker demand.
   * Based on factors like retail sales, consumer confidence, and import orders in those markets.
   */
  demand: number;
  /**
   * Index representing the price trend for essential raw materials (e.g., cotton, polyester, dyes).
   * A value of 1 represents average prices. > 1 indicates higher costs, < 1 lower costs.
   * Based on commodity market prices and supply chain factors.
   */
  rawMaterialPrices: number;
  /**
   * Qualitative summary of current international trade conditions impacting exports.
   * Includes factors like tariff status (GSP+), shipping costs/disruptions, geopolitical stability,
   * and major trade agreement updates.
   */
  tradeConditions: string;
}

// Placeholder URLs - Replace with actual API endpoints and ensure they are correct
const CSE_API_ENDPOINT_MARKET_SUMMARY = process.env.CSE_API_ENDPOINT_MARKET_SUMMARY || 'https://api.cse.lk/v2/market/summary'; // Example
const CUSTOMS_API_ENDPOINT_TRADE_SUMMARY = process.env.CUSTOMS_API_ENDPOINT_TRADE_SUMMARY || 'https://api.customs.gov.lk/v1/trade/summary/garments'; // Example, specific to garments
const COMMODITY_API_ENDPOINT_COTTON = process.env.COMMODITY_API_ENDPOINT_COTTON || 'https://api.exampledata.com/v1/commodities/COTTON_FUTURE_NYMEX'; // Example for Cotton
const NEWS_API_ENDPOINT_TRADE_NEWS_LK = process.env.NEWS_API_ENDPOINT_TRADE_NEWS_LK || 'https://api.newsapi.org/v2/everything?q=Sri+Lanka+garment+exports+trade+policy&apiKey=YOUR_NEWS_API_KEY'; // Example: Replace YOUR_NEWS_API_KEY

// Default values to return in case of API failure or missing data
const defaultSignals: MarketSignals = {
    demand: 1.0, // Assuming average demand
    rawMaterialPrices: 1.0, // Assuming average material prices
    tradeConditions: 'Trade conditions information currently unavailable. Assuming stable GSP+ and moderate shipping costs.',
};


/**
 * Asynchronously retrieves market signals for the Sri Lankan garment industry by fetching
 * data from relevant APIs (e.g., Stock Exchange, Customs, Commodity Prices, News).
 * Intended for SERVER-SIDE use. Uses native `fetch`.
 *
 * @returns A promise that resolves to a MarketSignals object containing the latest data, or default values if APIs fail.
 */
export async function getMarketSignals(): Promise<MarketSignals> {
  console.log("Fetching real-time market signals (server-side)...");

  const cseApiKey = process.env.CSE_API_KEY;
  const customsApiKey = process.env.CUSTOMS_API_KEY;
  const commodityApiKey = process.env.COMMODITY_API_KEY;
  const newsApiKey = process.env.NEWS_API_KEY; // Ensure this is set if using the news API

  // --- Prepare Headers ---
  const cseHeaders: HeadersInit = { 'Content-Type': 'application/json' };
  if (cseApiKey) cseHeaders['X-API-Key'] = cseApiKey; // Or other auth scheme per CSE docs

  const customsHeaders: HeadersInit = { 'Content-Type': 'application/json' };
  if (customsApiKey) customsHeaders['Authorization'] = `Bearer ${customsApiKey}`; // Or other

  const commodityHeaders: HeadersInit = { 'Content-Type': 'application/json' };
  if (commodityApiKey) commodityHeaders['X-API-Key'] = commodityApiKey; // Or other

  // News API endpoint might need the key in the URL or headers
  const newsApiUrl = NEWS_API_ENDPOINT_TRADE_NEWS_LK?.replace('YOUR_NEWS_API_KEY', newsApiKey || '');
  const newsHeaders: HeadersInit = { 'Content-Type': 'application/json' };
  // if (newsApiKey && !NEWS_API_ENDPOINT_TRADE_NEWS_LK?.includes('apiKey=')) newsHeaders['Authorization'] = `Bearer ${newsApiKey}`;


  try {
    // --- Fetch data from multiple sources in parallel ---
    const promises = [];

    // CSE Market Summary (Optional, depends on relevance and availability)
    if (CSE_API_ENDPOINT_MARKET_SUMMARY) {
        promises.push(
            fetch(CSE_API_ENDPOINT_MARKET_SUMMARY, { headers: cseHeaders })
                .then(res => res.ok ? res.json() : Promise.reject(new Error(`CSE API Error: ${res.status} ${res.statusText} at ${CSE_API_ENDPOINT_MARKET_SUMMARY}`)))
                .catch(e => { console.warn(`CSE API fetch error: ${APIErrorHandler.handleApiError(e)}`); return null; })
        );
    } else { promises.push(Promise.resolve(null)); }

    // Customs Trade Data (Important for export volumes)
    if (CUSTOMS_API_ENDPOINT_TRADE_SUMMARY) {
        promises.push(
            fetch(CUSTOMS_API_ENDPOINT_TRADE_SUMMARY, { headers: customsHeaders })
                .then(res => res.ok ? res.json() : Promise.reject(new Error(`Customs API Error: ${res.status} ${res.statusText} at ${CUSTOMS_API_ENDPOINT_TRADE_SUMMARY}`)))
                .catch(e => { console.warn(`Customs API fetch error: ${APIErrorHandler.handleApiError(e)}`); return null; })
        );
    } else { promises.push(Promise.resolve(null)); }

    // Commodity Prices (e.g., Cotton)
    if (COMMODITY_API_ENDPOINT_COTTON) {
        promises.push(
            fetch(COMMODITY_API_ENDPOINT_COTTON, { headers: commodityHeaders })
                .then(res => res.ok ? res.json() : Promise.reject(new Error(`Commodity API Error: ${res.status} ${res.statusText} at ${COMMODITY_API_ENDPOINT_COTTON}`)))
                .catch(e => { console.warn(`Commodity API fetch error: ${APIErrorHandler.handleApiError(e)}`); return null; })
        );
    } else { promises.push(Promise.resolve(null)); }

    // Trade News (If API key is available and endpoint is set)
    if (newsApiKey && newsApiUrl && NEWS_API_ENDPOINT_TRADE_NEWS_LK) {
        promises.push(
            fetch(newsApiUrl, { headers: newsHeaders })
                .then(res => res.ok ? res.json() : Promise.reject(new Error(`News API Error: ${res.status} ${res.statusText} at ${newsApiUrl}`)))
                .catch(e => { console.warn(`News API fetch error: ${APIErrorHandler.handleApiError(e)}`); return null; })
        );
    } else { promises.push(Promise.resolve(null)); }


    const [cseData, customsData, commodityData, newsData] = await Promise.all(promises);

    // --- Process and aggregate data ---
    const calculatedDemandIndex = calculateDemandIndex(customsData, cseData); // Customs data might be more direct for demand
    const calculatedMaterialIndex = calculateMaterialIndex(commodityData);
    const summarizedTradeConditions = summarizeTradeConditions(newsData, customsData); // Customs for GSP, News for qualitative

    const signals: MarketSignals = {
      demand: calculatedDemandIndex ?? defaultSignals.demand,
      rawMaterialPrices: calculatedMaterialIndex ?? defaultSignals.rawMaterialPrices,
      tradeConditions: summarizedTradeConditions ?? defaultSignals.tradeConditions,
    };

    console.log("Market Signals (Fetched on Server):", signals);
    return signals;

  } catch (error: unknown) {
    console.error("Failed to fetch one or more real-time market signals due to an unexpected error (server-side):", APIErrorHandler.handleApiError(error));
    console.log("Falling back to default market signals due to overall error.");
    return defaultSignals;
  }
}


// --- Helper Functions (Implement robust parsing based on actual API responses) ---

function calculateDemandIndex(customsData: any, cseData?: any): number | null {
    // Prioritize customs data for garment export volumes/growth as a proxy for demand
    if (customsData?.data?.garment_export_value_yoy_growth_percentage) {
        const growth = parseFloat(customsData.data.garment_export_value_yoy_growth_percentage);
        // Normalize: e.g., 0% growth = index 1.0. +10% growth = 1.1. -5% growth = 0.95
        return parseFloat((1 + growth / 100).toFixed(2));
    }
    // Fallback or supplement with CSE apparel sector sentiment if available
    if (cseData?.market_sentiment?.apparel_sector_index) {
        const sentimentIndex = parseFloat(cseData.market_sentiment.apparel_sector_index);
        // Normalize sentiment if it's not already in a 0-2 or similar scale (e.g., if it's -100 to 100)
        return parseFloat(sentimentIndex.toFixed(2)); // Assuming it's already somewhat normalized
    }
    console.log("Demand index could not be calculated from available data.");
    return null;
}

function calculateMaterialIndex(commodityData: any): number | null {
    // Example: Cotton price index. Assume API gives current price and we have a baseline.
    if (commodityData?.data?.price_usd_per_pound) {
        const currentPrice = parseFloat(commodityData.data.price_usd_per_pound);
        const baselineCottonPrice = 1.5; // USD per pound (example, adjust based on historical average)
        return parseFloat((currentPrice / baselineCottonPrice).toFixed(2));
    }
    console.log("Material price index could not be calculated from available data.");
    return null;
}

function summarizeTradeConditions(newsData: any, customsData: any): string | null {
    let conditions = [];

    // GSP+ Status (from Customs or a dedicated source)
    if (customsData?.data?.gsp_plus_status) {
        conditions.push(`EU GSP+ Status: ${customsData.data.gsp_plus_status}.`);
    } else {
        conditions.push("EU GSP+ Status: Not explicitly available.");
    }

    // Shipping Costs/Disruptions (from news or dedicated logistics API)
    // This is highly conceptual from general news. A dedicated logistics index API would be better.
    if (newsData?.articles?.length > 0) {
        const relevantArticle = newsData.articles.find((art: any) =>
            art.title?.toLowerCase().includes('shipping') || art.title?.toLowerCase().includes('logistics') ||
            art.description?.toLowerCase().includes('freight')
        );
        if (relevantArticle) {
            conditions.push(`Logistics Note: "${relevantArticle.title.substring(0, 70)}..."`);
        }
    }

    // Major Trade Policy News
     if (newsData?.articles?.length > 0) {
        const policyArticle = newsData.articles.find((art: any) =>
            art.title?.toLowerCase().includes('trade policy') || art.title?.toLowerCase().includes('tariff')
        );
        if (policyArticle) {
            conditions.push(`Trade Policy Update: "${policyArticle.title.substring(0, 70)}..."`);
        }
    }


    if (conditions.length > 0) {
        return conditions.join(" ").trim();
    }
    console.log("Trade conditions summary could not be generated from available data.");
    return defaultSignals.tradeConditions; // Fallback to default if nothing specific found
}
