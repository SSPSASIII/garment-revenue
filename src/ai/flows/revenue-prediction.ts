
'use server';
/**
 * @fileOverview Revenue prediction flow using the EnhancedPredictionEngine.
 *
 * - predictRevenue - A function that predicts future revenue trends in LKR.
 * - RevenuePredictionInput - The input type for the predictRevenue function.
 * - RevenuePredictionOutput - The return type for the predictRevenue function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { 
  EnhancedPredictionEngine, 
  type EnhancedInputData, 
  type EnhancedPredictionOutput,
  type HistoricalRevenueDataItem
} from '@/lib/enhanced-prediction-engine'; // Updated import
import { APIErrorHandler } from '@/services/error-handler';

// Schema for individual historical revenue items (consistent with engine)
const HistoricalRevenueDataItemSchema = z.object({
  name: z.string().describe("Period name, e.g., 'Q1 23'"), // Changed 'date' to 'name'
  revenue: z.number().describe("Revenue in LKR for the period"),
});

// Match the new EnhancedInputData structure from the engine
const RevenuePredictionInputSchema = z.object({
  historicalRevenueData: z // Renamed from historicalRevenue
    .string()
    .describe(
      'Historical quarterly revenue data in LKR, as a JSON string. Example: [{"name": "Q1 23", "revenue": 1500000}, ...]' // Updated example
    )
    .refine((val) => {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) && parsed.every(item => 
            HistoricalRevenueDataItemSchema.safeParse(item).success
          );
        } catch (e) { return false; }
      }, { message: "Invalid JSON. Expected array of {name: string, revenue: number (LKR)}." }), // Updated message
  productionCapacity: z.coerce.number().positive().describe('Current production capacity in units per quarter.'),
  marketingSpend: z.coerce.number().nonnegative().describe('Marketing spend in the last quarter (LKR).'),
  laborCostIndex: z.coerce.number().positive().describe('Index representing labor cost trend (1.0 = average).'),
  companyLifecycleStage: z.enum(['startup', 'growth', 'maturity', 'decline'], { required_error: "Company lifecycle stage is required."}).describe('The current stage of the company lifecycle.'),
  naturalDisasterLikelihood: z.enum(['low', 'medium', 'high'], { required_error: "Natural disaster likelihood is required."}).describe('The likelihood of a natural disaster impacting operations in the next quarter.'),
  
  // Optional enhanced fields from the engine's input
  confirmedOrdersValue: z.coerce.number().positive().optional().describe('Total value of confirmed orders for the next period (LKR).'),
  orderBacklog: z.coerce.number().nonnegative().optional().describe('Value of pending or backlogged orders (LKR).'),
  top3BuyersPercentage: z.coerce.number().min(0).max(100).optional().describe('Percentage of revenue from top 3 buyers (0-100).'),
  buyerRetentionRate: z.coerce.number().min(0).max(100).optional().describe('Annual buyer retention rate (0-100%).'),
  firstPassQualityRate: z.coerce.number().min(0).max(100).optional().describe('First pass yield / quality rate (0-100%).'),
  onTimeDeliveryRate: z.coerce.number().min(0).max(100).optional().describe('On-time delivery performance rate (0-100%).'),
  currentExchangeRate: z.coerce.number().positive().optional().describe('Current LKR per USD exchange rate (e.g., 320.50). Overrides engine default if provided.'),
});
export type RevenuePredictionInput = z.infer<typeof RevenuePredictionInputSchema>;


// Updated output schema based on EnhancedPredictionOutput from the engine
const RevenuePredictionOutputSchema = z.object({
    predictions: z.object({
        nextMonth: z.number().describe("Predicted revenue for the next month in LKR."),
        nextQuarter: z.number().describe("Predicted revenue for the next quarter in LKR."),
        nextSixMonths: z.number().describe("Predicted revenue for the next six months in LKR."),
        nextYear: z.number().describe("Predicted revenue for the next year in LKR."),
        confidence: z.number().min(0).max(100).describe("Prediction confidence score (0-100)."),
        adjustmentFactor: z.number().describe("Factor applied for industry-specific adjustments."),
    }),
    insights: z.object({
        keyDrivers: z.array(z.object({
            factor: z.string(),
            impact: z.string(),
            strength: z.union([z.string(), z.number()]).describe("Strength of the driver, can be numeric or descriptive string."), 
        })).describe("Key drivers influencing the prediction."),
        riskFactors: z.array(z.object({
            risk: z.string(),
            level: z.string(),
            score: z.union([z.string(), z.number()]).describe("Risk score, can be numeric or descriptive string."),
        })).describe("Potential risk factors identified."),
    }),
    accuracy: z.string().describe("Estimated accuracy of the prediction model (e.g., '80-85%')."),
    recommendations: z.array(z.string()).describe("Actionable recommendations based on the prediction."),
});
export type RevenuePredictionOutput = z.infer<typeof RevenuePredictionOutputSchema>;


export async function predictRevenue(
  input: RevenuePredictionInput
): Promise<RevenuePredictionOutput> {
  // This function now directly calls the flow, which then calls the engine.
  return predictRevenueFlow(input);
}


const predictRevenueFlow = ai.defineFlow(
  {
    name: 'predictRevenueFlow',
    inputSchema: RevenuePredictionInputSchema,
    outputSchema: RevenuePredictionOutputSchema, 
  },
  async (flowInput: RevenuePredictionInput): Promise<RevenuePredictionOutput> => {
    try {
      let parsedHistoricalRevenue: HistoricalRevenueDataItem[];
      try {
        parsedHistoricalRevenue = JSON.parse(flowInput.historicalRevenueData);
        // Additional validation to ensure each item matches HistoricalRevenueDataItem structure
        if (!Array.isArray(parsedHistoricalRevenue) || 
            !parsedHistoricalRevenue.every(item => HistoricalRevenueDataItemSchema.safeParse(item).success)
           ) {
          throw new Error('Invalid historical revenue data format. Expected array of {name: string, revenue: number}.');
        }
      } catch (e: any) {
        console.error("Error parsing historicalRevenueData:", e.message);
        throw new Error(`Invalid historical revenue data JSON: ${e.message}`);
      }

      // Map the flow input to the EnhancedPredictionEngine input
      const engineInput: EnhancedInputData = {
        historicalRevenue: parsedHistoricalRevenue, // Use the parsed array
        productionCapacity: flowInput.productionCapacity,
        marketingSpend: flowInput.marketingSpend,
        laborCostIndex: flowInput.laborCostIndex,
        companyLifecycleStage: flowInput.companyLifecycleStage,
        naturalDisasterLikelihood: flowInput.naturalDisasterLikelihood, // Pass this through
        
        // Optional fields are passed as is (can be undefined if not provided by the Zod schema)
        confirmedOrdersValue: flowInput.confirmedOrdersValue,
        orderBacklog: flowInput.orderBacklog,
        top3BuyersPercentage: flowInput.top3BuyersPercentage,
        buyerRetentionRate: flowInput.buyerRetentionRate,
        firstPassQualityRate: flowInput.firstPassQualityRate,
        onTimeDeliveryRate: flowInput.onTimeDeliveryRate,
        currentExchangeRate: flowInput.currentExchangeRate,
        // externalData will be fetched by the engine
      };

      // Call the Enhanced Prediction Engine
      const result: EnhancedPredictionOutput = await EnhancedPredictionEngine.generateEnhancedPrediction(engineInput);
      
      // Validate the result against the output schema before returning
      const validationResult = RevenuePredictionOutputSchema.safeParse(result);
      if (!validationResult.success) {
        console.error("EnhancedPredictionEngine output validation failed:", validationResult.error.flatten());
        throw new Error("Prediction engine returned data in an unexpected format.");
      }
      
      return validationResult.data;

    } catch (error: unknown) {
      const errorMessage = APIErrorHandler.handleApiError(error);
      console.error("Error during predictRevenueFlow (Enhanced Engine):", errorMessage, error);
      throw new Error(`Prediction failed: ${errorMessage}`);
    }
  }
);
