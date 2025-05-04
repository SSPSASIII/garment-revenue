'use server';
/**
 * @fileOverview Revenue prediction flow for the Sri Lankan garment industry, enhanced with lifetime steps, natural disaster considerations, marketing spend, and labor cost index.
 *
 * - predictRevenue - A function that predicts future revenue trends in LKR.
 * - RevenuePredictionInput - The input type for the predictRevenue function.
 * - RevenuePredictionOutput - The return type for the predictRevenue function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getEconomicIndicators} from '@/services/economy';
import {getMarketSignals} from '@/services/market';
import {getApiKeys, getRateLimitStatus} from '@/services/api-manager'; // Import API related services
import { APIErrorHandler } from '@/services/error-handler'; // Import error handler


const RevenuePredictionInputSchema = z.object({
  historicalRevenueData: z
    .string()
    .describe(
      'Historical quarterly revenue data in LKR, as a JSON string. Example: [{"name": "Q1 23", "revenue": 1500000}, ...]'
    ),
  productionCapacity: z.number().positive().describe('Current production capacity in units per quarter.'),
  marketingSpend: z.number().nonnegative().describe('Marketing spend in the last quarter (LKR).'),
  laborCostIndex: z.number().positive().describe('Index representing labor cost trend (1.0 = average).'),
  additionalContext: z.string().optional().describe('Optional user-provided context, like new clients, policy changes, or operational issues.'),
  lifetimeStage: z.enum(['startup', 'growth', 'maturity', 'decline']).describe('The current stage of the company lifecycle.'),
  naturalDisasterLikelihood: z.enum(['low', 'medium', 'high']).describe('The likelihood of a natural disaster impacting operations in the next quarter.')
});
export type RevenuePredictionInput = z.infer<typeof RevenuePredictionInputSchema>;

const RevenuePredictionOutputSchema = z.object({
  predictedRevenue: z
    .number()
    .describe('The predicted revenue for the next quarter in Sri Lankan Rupees (LKR).'),
  trendAnalysis: z
    .string()
    .describe(
      'A detailed analysis of the revenue trend, explaining the key factors (historical data, economic indicators, market signals, context, lifetime stage, natural disaster likelihood, marketing, labor costs) influencing the prediction and the reasoning behind the forecast.'
    ),
  riskFactors: z
    .string()
    .describe(
      'Potential risk factors that could negatively impact the predicted revenue, such as economic downturns, supply chain disruptions, changes in trade policies, competitor actions, stage of lifecycle, natural disasters, marketing effectiveness, or labor cost surges.'
    ),
  confidenceScore: z.number().min(0).max(1).describe('A score between 0 and 1 indicating the confidence level of the prediction (0 = low, 1 = high).')
});
export type RevenuePredictionOutput = z.infer<typeof RevenuePredictionOutputSchema>;

export async function predictRevenue(
  input: RevenuePredictionInput
): Promise<RevenuePredictionOutput> {
  return predictRevenueFlow(input);
}

const prompt = ai.definePrompt({
  name: 'revenuePredictionPrompt',
  input: {
    schema: z.object({
      historicalRevenueData: z
        .string()
        .describe(
          'Historical quarterly revenue data in LKR, as a JSON string.'
        ),
      productionCapacity: z.number().describe('Current production capacity in units per quarter.'),
      marketingSpend: z.number().nonnegative().describe('Marketing spend in the last quarter (LKR).'),
      laborCostIndex: z.number().positive().describe('Index representing labor cost trend (1.0 = average).'),
      additionalContext: z.string().optional().describe('Optional user-provided context.'),
      gdpGrowthRate: z.number().describe('Sri Lankan GDP growth rate (%).'),
      inflationRate: z.number().describe('Sri Lankan inflation rate (%).'),
      unemploymentRate: z.number().describe('Sri Lankan unemployment rate (%).'),
      exchangeRate: z.number().describe('Current USD to LKR exchange rate.'),
      demand: z.number().describe('Index representing demand for garments in key export markets (e.g., EU, US). Higher value means higher demand.'),
      rawMaterialPrices: z.number().describe('Index representing price trends for raw materials like cotton and synthetic fabrics. Higher value means higher cost.'),
      tradeConditions: z.string().describe('Summary of current trade agreements, tariffs, and political stability affecting exports.'),
      lifetimeStage: z.string().describe('The current stage of the company lifecycle (startup, growth, maturity, decline).'),
      naturalDisasterLikelihood: z.string().describe('The likelihood of a natural disaster impacting operations in the next quarter (low, medium, high).'),
    }),
  },
  output: {
    schema: RevenuePredictionOutputSchema, // Use the refined output schema
  },
  prompt: `You are an expert financial analyst specializing in predicting revenue for the Sri Lankan garment industry. Your goal is to provide the most accurate forecast possible in Sri Lankan Rupees (LKR) for the next quarter.

Analyze the following company-specific data:
Historical Revenue Data (LKR): {{{historicalRevenueData}}}
Production Capacity (Units/Quarter): {{{productionCapacity}}}
Marketing Spend (Last Quarter, LKR): {{{marketingSpend}}}
Labor Cost Index (1.0 = avg): {{{laborCostIndex}}}
Company Lifecycle Stage: {{{lifetimeStage}}}
{{#if additionalContext}}
Additional Context: {{{additionalContext}}}
{{/if}}

Incorporate these macroeconomic indicators for Sri Lanka:
GDP Growth Rate: {{{gdpGrowthRate}}}%
Inflation Rate: {{{inflationRate}}}%
Unemployment Rate: {{{unemploymentRate}}}%
USD to LKR Exchange Rate: {{{exchangeRate}}}

Consider these market signals specific to the garment industry:
Export Market Demand Index: {{{demand}}}
Raw Material Price Index: {{{rawMaterialPrices}}}
Trade Conditions: {{{tradeConditions}}}

Assess the potential impact of natural disasters:
Natural Disaster Likelihood: {{{naturalDisasterLikelihood}}}

Based on a thorough analysis of all the provided information, perform the following:
1.  **Predict Revenue:** Forecast the revenue for the **next quarter** in **Sri Lankan Rupees (LKR)**.
2.  **Analyze Trend:** Provide a detailed analysis explaining the prediction. Discuss how historical trends, production capacity, marketing spend, labor costs, economic factors (GDP, inflation, unemployment, exchange rate), market signals (demand, material costs, trade), the company's lifecycle stage, the likelihood of natural disasters, and any provided context contribute to the forecast. Explain your reasoning clearly. Consider seasonality if evident in historical data.
3.  **Identify Risks:** Outline potential risk factors that could negatively impact this revenue prediction. Be specific (e.g., "A sudden increase in cotton prices by over 10%", "New import tariffs imposed by the EU", "Domestic political instability affecting production", "High chance of flooding disrupting supply chains", "Marketing campaign underperformance", "Unexpected rise in labor wages").
4.  **Estimate Confidence:** Provide a confidence score between 0.0 and 1.0 for your prediction, where 1.0 represents very high confidence. Justify this score briefly within the trend analysis.

Output ONLY the JSON object conforming to the specified output schema. Do not include any introductory text, apologies, or explanations outside the JSON structure. Ensure the predicted revenue is a number representing LKR.
`,
});

const predictRevenueFlow = ai.defineFlow<
  typeof RevenuePredictionInputSchema,
  typeof RevenuePredictionOutputSchema
>(
  {
    name: 'predictRevenueFlow',
    inputSchema: RevenuePredictionInputSchema,
    outputSchema: RevenuePredictionOutputSchema,
  },
  async (input) => {
    try {
        // Example: Check rate limits before proceeding (conceptual)
        const limitStatus = await getRateLimitStatus('central_bank'); // Assume this checks CBSL limit
        if (limitStatus && limitStatus.remaining <= 0) {
            throw new Error('Rate limit exceeded for Central Bank API. Please wait.');
        }

        // Fetch real-time or more granular data using the services
        const economicIndicators = await getEconomicIndicators();
        const marketSignals = await getMarketSignals();

        const { output } = await prompt({
          historicalRevenueData: input.historicalRevenueData,
          productionCapacity: input.productionCapacity,
          marketingSpend: input.marketingSpend,
          laborCostIndex: input.laborCostIndex,
          additionalContext: input.additionalContext,
          gdpGrowthRate: economicIndicators.gdpGrowthRate,
          inflationRate: economicIndicators.inflationRate,
          unemploymentRate: economicIndicators.unemploymentRate,
          exchangeRate: economicIndicators.exchangeRate,
          demand: marketSignals.demand,
          rawMaterialPrices: marketSignals.rawMaterialPrices,
          tradeConditions: marketSignals.tradeConditions,
          lifetimeStage: input.lifetimeStage,
          naturalDisasterLikelihood: input.naturalDisasterLikelihood,
        });

        if (!output) {
            throw new Error("AI failed to generate a prediction.");
        }

        // Basic validation (optional, as Zod schema handles structure)
        if (typeof output.predictedRevenue !== 'number' || typeof output.confidenceScore !== 'number') {
            console.error("Invalid output format from AI:", output);
            throw new Error("Received invalid prediction format from AI.");
        }

        return output;

    } catch (error: unknown) {
        // Use the central error handler
        const errorMessage = APIErrorHandler.handleApiError(error);
        console.error("Error during predictRevenueFlow:", errorMessage);
        // Re-throw a more user-friendly error or return a specific error structure
        // For now, re-throwing to be caught by the caller (e.g., the dashboard page)
        throw new Error(`Prediction failed: ${errorMessage}`);
    }
  }
);
