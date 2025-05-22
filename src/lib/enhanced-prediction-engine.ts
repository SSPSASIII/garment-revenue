
'use server';
// Enhanced Prediction Algorithm

import { db } from '@/lib/firebase'; // Use the initialized db instance
import { collection, doc, getDoc } from 'firebase/firestore';

// Define the structure for historical revenue data consistent with the rest of the app
export interface HistoricalRevenueDataItem {
  name: string; // Corresponds to 'date' in the engine's internal naming if needed
  revenue: number;
}

export interface EnhancedInputData {
  // Existing inputs adapted
  historicalRevenue: HistoricalRevenueDataItem[]; // Use the app's consistent naming
  productionCapacity: number;
  marketingSpend: number;
  laborCostIndex: number;
  companyLifecycleStage: string; // Renamed from lifetimeStage for clarity with engine
  naturalDisasterLikelihood: 'low' | 'medium' | 'high';

  // New enhanced inputs
  confirmedOrdersValue?: number;
  orderBacklog?: number;
  top3BuyersPercentage?: number;
  buyerRetentionRate?: number;
  firstPassQualityRate?: number;
  onTimeDeliveryRate?: number;
  currentExchangeRate?: number; // LKR per USD

  // Auto-fetched external data (this structure is internal to the engine)
  externalData?: {
    exchangeRate: number;
    rawMaterialPrices: any;
    economicIndicators: any;
  };
}

export interface EnhancedPredictionOutput {
    predictions: {
        nextMonth: number;
        nextQuarter: number;
        nextSixMonths: number;
        nextYear: number;
        confidence: number; // 0-100 scale
        adjustmentFactor: number;
    };
    insights: {
        keyDrivers: Array<{ factor: string; impact: string; strength: any }>;
        riskFactors: Array<{ risk: string; level: string; score: any }>;
    };
    accuracy: string; // e.g., "75-80%" or a numeric score string
    recommendations: string[];
}


export class EnhancedPredictionEngine {
  // Main prediction function
  static async generateEnhancedPrediction(inputData: EnhancedInputData): Promise<EnhancedPredictionOutput> {
    try {
      // Step 1: Get external data
      const externalData = await this.getExternalData();

      // Step 2: Calculate enhanced features
      const features = this.calculateEnhancedFeatures(inputData, externalData);

      // Step 3: Multi-model prediction
      const predictions = await this.runEnsemblePrediction(features);

      // Step 4: Apply industry-specific adjustments
      const adjustedPredictions = this.applyIndustryAdjustments(predictions, features);

      // Step 5: Calculate confidence and insights
      const insights = this.generateInsights(adjustedPredictions, features, inputData);

      return {
        predictions: adjustedPredictions,
        insights: insights,
        accuracy: this.calculateAccuracyScore(features),
        recommendations: this.generateRecommendations(features, inputData)
      };

    } catch (error: any) {
      console.error("Error in generateEnhancedPrediction:", error.message, error.stack);
      // Fallback to basic prediction if enhanced fails
      return this.basicPredictionFallback(inputData);
    }
  }

  // Calculate enhanced features
  private static calculateEnhancedFeatures(inputData: EnhancedInputData, externalData: any): any {
    const revenue = inputData.historicalRevenue;
    // Ensure revenue is sorted by date if necessary, though typically it's appended.
    // For calculations like growth, order matters. Assuming input is ordered.
    const latestRevenueRecord = revenue.length > 0 ? revenue[revenue.length - 1] : { revenue: 0 };
    const latestRevenue = latestRevenueRecord.revenue;
    
    return {
      baseRevenue: latestRevenue,
      revenueGrowth: this.calculateGrowthRate(revenue, 6), // Assuming 6 periods (e.g., quarters)
      revenueVolatility: this.calculateVolatility(revenue),
      seasonality: this.calculateSeasonality(revenue),

      orderPipelineStrength: this.calculateOrderPipelineStrength(inputData),
      buyerConcentrationRisk: this.calculateBuyerRisk(inputData),
      operationalEfficiency: this.calculateOperationalEfficiency(inputData),
      marketPosition: this.calculateMarketPosition(inputData),

      exchangeRateImpact: this.calculateExchangeRateImpact(inputData.currentExchangeRate || externalData.exchangeRate, latestRevenue),
      rawMaterialCostImpact: this.calculateRawMaterialImpact(externalData.rawMaterialPrices),
      economicConditions: this.assessEconomicConditions(externalData.economicIndicators),

      overallRiskScore: this.calculateOverallRisk(inputData, externalData),
      dataQualityScore: this.assessDataQuality(inputData),
      companyLifecycleStage: inputData.companyLifecycleStage,
      naturalDisasterLikelihood: inputData.naturalDisasterLikelihood,
      marketingSpend: inputData.marketingSpend,
      laborCostIndex: inputData.laborCostIndex,
      productionCapacity: inputData.productionCapacity,
    };
  }

  // Multi-model ensemble prediction
  private static async runEnsemblePrediction(features: any): Promise<any> {
    const trendPrediction = this.trendBasedPrediction(features);
    const pipelinePrediction = this.pipelineBasedPrediction(features);
    const seasonalPrediction = this.seasonalAdjustedPrediction(features);

    const ensemblePrediction = (
      trendPrediction * 0.40 +
      pipelinePrediction * 0.35 +
      seasonalPrediction * 0.25
    );

    return {
      nextMonth: ensemblePrediction * 0.33, // Assuming quarterly base, so 1/3 for a month
      nextQuarter: ensemblePrediction,
      nextSixMonths: ensemblePrediction * 2,
      nextYear: ensemblePrediction * 4,
      confidence: this.calculatePredictionConfidence(features)
    };
  }

  // Industry-specific adjustments
  private static applyIndustryAdjustments(predictions: any, features: any): any {
    let adjustmentFactor = 1.0;

    const currentMonth = new Date().getMonth() + 1; // 1-12
    if (currentMonth >= 6 && currentMonth <= 9) { // June-September Monsoon
      adjustmentFactor *= 0.95;
    }

    if (this.isRamadanPeriod()) { // Simplified Ramadan check
      adjustmentFactor *= 0.92;
    }
    
    // Lifecycle stage adjustments (example)
    if (features.companyLifecycleStage === 'startup') adjustmentFactor *= 1.1; // Potential high growth
    if (features.companyLifecycleStage === 'decline') adjustmentFactor *= 0.9; // Potential decline

    // Natural disaster likelihood
    if (features.naturalDisasterLikelihood === 'high') adjustmentFactor *= 0.85;
    else if (features.naturalDisasterLikelihood === 'medium') adjustmentFactor *= 0.95;


    if (features.exchangeRateImpact > 0.1) { // If exchange rate volatility is high
      adjustmentFactor *= 0.97; // Slight caution for high volatility
    }

    if (features.operationalEfficiency > 90) {
      adjustmentFactor *= 1.05;
    } else if (features.operationalEfficiency < 75) {
      adjustmentFactor *= 0.95;
    }

    // GSP+ trade benefits (example for Sri Lanka)
    adjustmentFactor *= 1.03;

    // Marketing spend effectiveness (conceptual)
    if (features.marketingSpend > 1000000) adjustmentFactor *= 1.02; // Basic impact

    // Labor cost index impact
    if (features.laborCostIndex > 1.1) adjustmentFactor *= 0.98; // Higher labor costs
    
    // Production capacity constraint (if prediction exceeds capacity significantly)
    // This is a complex factor, simplified here. If predicted units based on revenue far exceed capacity, cap or adjust.
    // For now, this is a general factor.

    return {
      nextMonth: Math.max(0, Math.round(predictions.nextMonth * adjustmentFactor)),
      nextQuarter: Math.max(0, Math.round(predictions.nextQuarter * adjustmentFactor)),
      nextSixMonths: Math.max(0, Math.round(predictions.nextSixMonths * adjustmentFactor)),
      nextYear: Math.max(0, Math.round(predictions.nextYear * adjustmentFactor)),
      confidence: predictions.confidence,
      adjustmentFactor: parseFloat(adjustmentFactor.toFixed(4))
    };
  }

  // Helper functions
  private static calculateOrderPipelineStrength(inputData: EnhancedInputData): number {
    if (!inputData.confirmedOrdersValue || inputData.confirmedOrdersValue <= 0) return 50;
    if (inputData.historicalRevenue.length === 0) return 50;

    const avgRevenue = inputData.historicalRevenue.reduce((acc, r) => acc + r.revenue, 0) / inputData.historicalRevenue.length;
    if (avgRevenue <= 0) return 50;
    
    return Math.max(0, Math.min((inputData.confirmedOrdersValue / avgRevenue) * 100, 200));
  }

  private static calculateBuyerRisk(inputData: EnhancedInputData): number {
    if (!inputData.top3BuyersPercentage) return 50;
    const percentage = inputData.top3BuyersPercentage;
    if (percentage > 80) return 90;
    if (percentage > 60) return 70;
    if (percentage > 40) return 50;
    return 30;
  }

  private static calculateOperationalEfficiency(inputData: EnhancedInputData): number {
    let efficiency = 70;
    if (inputData.firstPassQualityRate) {
      efficiency += (inputData.firstPassQualityRate - 85) * 0.5;
    }
    if (inputData.onTimeDeliveryRate) {
      efficiency += (inputData.onTimeDeliveryRate - 90) * 0.3;
    }
    const historicalRevenues = inputData.historicalRevenue.map(item => item.revenue);
    const averageHistoricalRevenue = historicalRevenues.length > 0 ? historicalRevenues.reduce((a, b) => a + b, 0) / historicalRevenues.length : 1;
    // Conceptual: estimate units from revenue if not directly available. Here, we use capacity as a proxy.
    const maxPossibleRevenueAtCapacity = inputData.productionCapacity * (averageHistoricalRevenue / (inputData.productionCapacity || 1) * 0.5); // very rough estimate
    const utilizationRate = inputData.productionCapacity > 0 && averageHistoricalRevenue > 0 ? Math.min( (averageHistoricalRevenue / maxPossibleRevenueAtCapacity) * 100, 100) : 70;

    efficiency += (utilizationRate - 70) * 0.2;
    return Math.max(0, Math.min(100, parseFloat(efficiency.toFixed(2)) ) );
  }

  private static calculateExchangeRateImpact(currentRate: number | undefined, revenue: number): number {
    const effectiveRate = currentRate || 320; // Use provided or default
    const baselineRate = 320; // USD/LKR baseline, should be configurable or dynamic
    const rateChange = (effectiveRate - baselineRate) / baselineRate;
    return parseFloat(Math.abs(rateChange).toFixed(4));
  }

  private static calculateGrowthRate(revenueData: HistoricalRevenueDataItem[], periods: number): number {
    if (revenueData.length < periods + 1) return 0;
    const current = revenueData[revenueData.length - 1]?.revenue || 0;
    const previous = revenueData[revenueData.length - periods - 1]?.revenue;
    if (previous === undefined || previous === 0) return 0; // Avoid division by zero or meaningless high growth
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }

  private static calculateVolatility(revenueData: HistoricalRevenueDataItem[]): number {
    if (revenueData.length < 3) return 0;
    const values = revenueData.map(r => r.revenue);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return parseFloat(((Math.sqrt(variance) / mean) * 100).toFixed(2));
  }

  private static trendBasedPrediction(features: any): number {
    const growth = features.revenueGrowth / 100;
    return features.baseRevenue * (1 + growth);
  }

  private static pipelineBasedPrediction(features: any): number {
    const pipelineMultiplier = features.orderPipelineStrength / 100;
    return features.baseRevenue * pipelineMultiplier;
  }

  private static seasonalAdjustedPrediction(features: any): number {
    const seasonalFactor = this.getSeasonalFactor();
    return features.baseRevenue * seasonalFactor;
  }

  private static getSeasonalFactor(): number {
    const month = new Date().getMonth() + 1;
    const seasonalMap: { [key: number]: number } = {
      1: 0.9, 2: 0.95, 3: 1.1, 4: 1.15, 5: 1.1, 6: 0.95,
      7: 0.9, 8: 0.9, 9: 1.0, 10: 1.2, 11: 1.3, 12: 1.1
    };
    return seasonalMap[month] || 1.0;
  }

  private static isRamadanPeriod(): boolean {
    const now = new Date();
    const year = now.getFullYear();
    // These are very rough approximations for 2024-2025. 
    // Real implementation needs accurate Hijri conversion.
    // Example: Ramadan 2024: Mar 10 - Apr 9. Ramadan 2025: Feb 28 - Mar 29
    const ramadanStart2024 = new Date(year, 2, 10); // Mar 10
    const ramadanEnd2024 = new Date(year, 3, 9);   // Apr 9
    const ramadanStart2025 = new Date(year, 1, 28); // Feb 28
    const ramadanEnd2025 = new Date(year, 2, 29);   // Mar 29

    if (year === 2024 && now >= ramadanStart2024 && now <= ramadanEnd2024) return true;
    if (year === 2025 && now >= ramadanStart2025 && now <= ramadanEnd2025) return true;
    // Add more years or use a library
    return false;
  }

  private static calculatePredictionConfidence(features: any): number {
    let confidence = 85;
    confidence += (features.dataQualityScore - 70) * 0.3;
    confidence -= Math.min(features.revenueVolatility / 2, 15);
    confidence -= (features.overallRiskScore || 0) * 0.1; // Adjusted weight for overallRiskScore
    return Math.max(60, Math.min(95, Math.round(confidence))); // Min confidence 60
  }

  private static generateInsights(predictions: any, features: any, inputData: EnhancedInputData): EnhancedPredictionOutput["insights"] {
    return {
      keyDrivers: [
        { factor: 'Order Pipeline Strength', impact: features.orderPipelineStrength > 100 ? 'Positive' : (features.orderPipelineStrength < 60 ? 'Negative' : 'Neutral'), strength: features.orderPipelineStrength.toFixed(1) + '%' },
        { factor: 'Operational Efficiency', impact: features.operationalEfficiency > 80 ? 'Positive' : (features.operationalEfficiency < 70 ? 'Needs Improvement' : 'Average'), strength: features.operationalEfficiency.toFixed(1) + '%' },
        { factor: 'Recent Revenue Growth', impact: features.revenueGrowth > 5 ? 'Positive' : (features.revenueGrowth < 0 ? 'Negative' : 'Stable'), strength: features.revenueGrowth.toFixed(1) + '%' },
        { factor: 'Market Conditions', impact: features.economicConditions > 60 ? 'Favorable' : 'Challenging', strength: features.economicConditions.toFixed(1) + '/100' }
      ],
      riskFactors: [
        { risk: 'Buyer Concentration', level: features.buyerConcentrationRisk > 70 ? 'High' : (features.buyerConcentrationRisk < 40 ? 'Low' : 'Medium'), score: features.buyerConcentrationRisk + '/100' },
        { risk: 'Exchange Rate Volatility Impact', level: features.exchangeRateImpact > 0.05 ? 'High' : 'Low', score: (features.exchangeRateImpact * 100).toFixed(1) + '%' },
        { risk: 'Revenue Volatility', level: features.revenueVolatility > 15 ? 'High' : (features.revenueVolatility < 5 ? 'Low' : 'Medium'), score: features.revenueVolatility.toFixed(1) + '%' }
      ]
    };
  }

  private static generateRecommendations(features: any, inputData: EnhancedInputData): string[] {
    const recommendations: string[] = [];
    if (features.buyerConcentrationRisk > 60) recommendations.push('Diversify buyer base to mitigate revenue dependency on a few key clients.');
    if (features.operationalEfficiency < 75) recommendations.push('Invest in operational improvements: enhance first-pass quality and on-time delivery rates.');
    if (features.orderPipelineStrength < 80) recommendations.push('Strengthen sales and marketing efforts to build a more robust order pipeline.');
    if (features.exchangeRateImpact > 0.05) recommendations.push('Evaluate currency hedging strategies to manage risks from LKR exchange rate fluctuations.');
    if (features.dataQualityScore < 70) recommendations.push('Improve data collection for more accurate forecasting; ensure all key metrics are regularly updated.');
    if (features.companyLifecycleStage === 'startup' && features.revenueGrowth < 10) recommendations.push('Focus on aggressive market penetration and customer acquisition strategies.');
    if (features.naturalDisasterLikelihood === 'high') recommendations.push('Develop and test business continuity plans for potential natural disasters.');

    return recommendations.length > 0 ? recommendations : ['Maintain current strategies; review key metrics regularly.'];
  }

  private static assessDataQuality(inputData: EnhancedInputData): number {
    let score = 50;
    if (inputData.historicalRevenue.length >= 12) score += 10;
    if (inputData.historicalRevenue.length >= 24) score += 5; // Reduced points for very long history
    if (inputData.confirmedOrdersValue && inputData.confirmedOrdersValue > 0) score += 10;
    if (inputData.firstPassQualityRate && inputData.firstPassQualityRate > 0) score += 5;
    if (inputData.onTimeDeliveryRate && inputData.onTimeDeliveryRate > 0) score += 5;
    if (inputData.buyerRetentionRate && inputData.buyerRetentionRate > 0) score += 5;
    if (inputData.currentExchangeRate && inputData.currentExchangeRate > 0) score += 5;
    return Math.min(100, score);
  }

  private static calculateOverallRisk(inputData: EnhancedInputData, externalData: any): number {
    const buyerRisk = inputData.top3BuyersPercentage ? inputData.top3BuyersPercentage / 100 : 0.5;
    const qualityRisk = inputData.firstPassQualityRate ? (100 - inputData.firstPassQualityRate) / 100 : 0.15;
    const exchangeRisk = externalData.exchangeRate ? Math.abs(externalData.exchangeRate - 320) / 320 : 0.05; // Assuming 320 is baseline
    // Normalize and combine. Max risk score is 100.
    let riskScore = (buyerRisk * 40) + (qualityRisk * 30) + (exchangeRisk * 30);
    return parseFloat(Math.min(100, Math.max(0, riskScore)).toFixed(2));
  }

  private static calculateMarketPosition(inputData: EnhancedInputData): number {
    const retentionRate = inputData.buyerRetentionRate || 70;
    const qualityRate = inputData.firstPassQualityRate || 85;
    const deliveryRate = inputData.onTimeDeliveryRate || 90;
    return parseFloat(((retentionRate * 0.4) + (qualityRate * 0.3) + (deliveryRate * 0.3)).toFixed(2));
  }

  private static calculateRawMaterialImpact(rawMaterialPrices: any): number {
    // Example: if cotton price is 20% above baseline, impact is 1.2
    const baselineCottonLKR = 350; // Example baseline
    const currentCottonLKR = rawMaterialPrices?.cottonPriceLKR || baselineCottonLKR;
    return parseFloat((currentCottonLKR / baselineCottonLKR).toFixed(2));
  }

  private static assessEconomicConditions(economicIndicators: any): number {
    if (!economicIndicators) return 60; // Neutral-ish default
    let score = 50; // Base
    // Example: GDP growth of 2% adds 10 points. Inflation of 5% subtracts 10.
    score += (economicIndicators.gdpGrowthRate || 0) * 5;
    score -= (economicIndicators.inflationRate || 0) * 2;
    score += (economicIndicators.exportGrowthRate || 0) * 3; // Export growth is positive
    return parseFloat(Math.max(0, Math.min(100, score)).toFixed(2));
  }

  private static calculateSeasonality(revenueData: HistoricalRevenueDataItem[]): number {
    // This is simplified. Real seasonality requires more data and complex analysis (e.g., decomposition).
    if (revenueData.length < 12) return 1.0; // Not enough data for seasonality
    return this.getSeasonalFactor(); // Use general garment industry factors
  }

  private static async getExternalData(): Promise<any> {
    try {
      const externalDataRef = doc(db, 'externalData', 'current');
      const docSnap = await getDoc(externalDataRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.warn("External data document 'externalData/current' not found in Firestore. Using fallback data.");
        return this.getFallbackExternalData();
      }
    } catch (error) {
      console.error("Error fetching external data from Firestore:", error);
      return this.getFallbackExternalData();
    }
  }

  private static getFallbackExternalData(): any {
    return {
      exchangeRate: 325.50, // LKR per USD
      rawMaterialPrices: { cottonPriceLKR: 410, polyesterPriceLKR: 360, dyeCostIndex: 1.05 },
      economicIndicators: { gdpGrowthRate: 1.8, inflationRate: 5.5, exportGrowthRate: 4.2, unemploymentRate: 4.9 }
    };
  }

  private static basicPredictionFallback(inputData: EnhancedInputData): EnhancedPredictionOutput {
    const revenue = inputData.historicalRevenue;
    const latestRevenue = revenue.length > 0 ? revenue[revenue.length - 1]?.revenue || 0 : 0;
    const growth = this.calculateGrowthRate(revenue, 6); // 6 periods (quarters)

    const basicPrediction = latestRevenue * (1 + growth / 100);

    return {
      predictions: {
        nextMonth: Math.max(0,Math.round(basicPrediction * 0.33)),
        nextQuarter: Math.max(0,Math.round(basicPrediction)),
        nextSixMonths: Math.max(0,Math.round(basicPrediction * 2)),
        nextYear: Math.max(0,Math.round(basicPrediction * 4)),
        confidence: 70, // Lower confidence for fallback
        adjustmentFactor: 1.0
      },
      insights: {
        keyDrivers: [{ factor: 'Historical Trend (Fallback)', impact: growth > 0 ? 'Positive' : 'Negative', strength: growth.toFixed(1) + '%' }],
        riskFactors: [{ risk: 'Data Limitation / Prediction Fallback', level: 'High', score: 'N/A' }]
      },
      accuracy: '65-75%',
      recommendations: ['Enhanced prediction engine encountered an issue. Providing basic trend-based forecast. Review inputs or system logs.']
    };
  }
}

    