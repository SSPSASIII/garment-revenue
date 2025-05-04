'use server';
/**
 * @fileOverview Revenue prediction flow for the Sri Lankan garment industry.
 *
 * - predictRevenue - A function that predicts future revenue trends.
 * - RevenuePredictionInput - The input type for the predictRevenue function.
 * - RevenuePredictionOutput - The return type for the predictRevenue function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getEconomicIndicators} from '@/services/economy';
import {getMarketSignals} from '@/services/market';

const RevenuePredictionInputSchema = z.object({
  historicalRevenueData: z
    .string()
    .describe('Historical revenue data, as a JSON string.'),
  productionCapacity: z.number().describe('Current production capacity.'),
});
export type RevenuePredictionInput = z.infer<typeof RevenuePredictionInputSchema>;

const RevenuePredictionOutputSchema = z.object({
  predictedRevenue: z
    .number()
    .describe('The predicted revenue for the next quarter in USD.'),
  trendAnalysis: z
    .string()
    .describe(
      'An analysis of the revenue trend, including key factors influencing the prediction.'
    ),
  riskFactors: z
    .string()
    .describe(
      'Potential risk factors that could impact the predicted revenue, such as economic downturns or changes in trade policies.'
    ),
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
        .describe('Historical revenue data, as a JSON string.'),
      productionCapacity: z.number().describe('Current production capacity.'),
      gdpGrowthRate: z.number().describe('GDP growth rate.'),
      inflationRate: z.number().describe('Inflation rate.'),
      unemploymentRate: z.number().describe('Unemployment rate.'),
      demand: z.number().describe('Demand for garments in key export markets.'),
      rawMaterialPrices: z.number().describe('Price trends for raw materials.'),
      tradeConditions: z.string().describe('Trade agreements and tariffs.'),
    }),
  },
  output: {
    schema: z.object({
      predictedRevenue: z
        .number()
        .describe('The predicted revenue for the next quarter in USD.'),
      trendAnalysis: z
        .string()
        .describe(
          'An analysis of the revenue trend, including key factors influencing the prediction.'
        ),
      riskFactors: z
        .string()
        .describe(
          'Potential risk factors that could impact the predicted revenue, such as economic downturns or changes in trade policies.'
        ),
    }),
  },
  prompt: `You are an expert in predicting revenue for the Sri Lankan garment industry.\n\n  Analyze the following data to predict the revenue for the next quarter:\n  Historical Revenue Data: {{{historicalRevenueData}}}\n  Production Capacity: {{{productionCapacity}}}\n\n  Consider the following economic indicators:\n  GDP Growth Rate: {{{gdpGrowthRate}}}\n  Inflation Rate: {{{inflationRate}}}\n  Unemployment Rate: {{{unemploymentRate}}}\n\n  Also, take into account these market signals:\n  Demand for Garments: {{{demand}}}\n  Raw Material Prices: {{{rawMaterialPrices}}}\n  Trade Conditions: {{{tradeConditions}}}\n\n  Provide a predicted revenue in USD, an analysis of the trend, and potential risk factors.\n  Remember that your output MUST conform to the JSON schema. Do NOT add any additional information to the output other than what is in the schema.
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
  async input => {
    const economicIndicators = await getEconomicIndicators();
    const marketSignals = await getMarketSignals();

    const {output} = await prompt({
      ...input,
      ...economicIndicators,
      ...marketSignals,
    });
    return output!;
  }
);
