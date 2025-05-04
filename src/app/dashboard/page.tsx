'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { predictRevenue, type RevenuePredictionOutput } from '@/ai/flows/revenue-prediction';
import { type EconomicIndicators, getEconomicIndicators } from '@/services/economy';
import { type MarketSignals, getMarketSignals } from '@/services/market';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, Info, Activity, AlertCircle, Percent, DollarSign, Globe, Factory, CloudRain, Anchor, CalendarDays, BarChart, BrainCircuit, Megaphone, Users } from 'lucide-react'; // Added Megaphone, Users
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from "@/lib/utils";
import { db } from '@/lib/firebase'; // Import Firebase
import { collection, addDoc } from 'firebase/firestore'; // Import Firestore functions


// Default historical data (can be overridden by user input)
const defaultHistoricalData = [
  { name: 'Q1 22', revenue: 140000000 },
  { name: 'Q2 22', revenue: 130000000 },
  { name: 'Q3 22', revenue: 155000000 },
  { name: 'Q4 22', revenue: 150000000 },
  { name: 'Q1 23', revenue: 160000000 },
  { name: 'Q2 23', revenue: 175000000 },
];

// Format LKR currency
const formatLKR = (value: number): string => {
  return `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Format large LKR numbers for Y-axis
const formatLKRShort = (value: number): string => {
  if (value >= 1_000_000_000) {
    return `LKR ${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `LKR ${(value / 1_000_000).toFixed(0)}M`;
  }
  if (value >= 1_000) {
    return `LKR ${(value / 1_000).toFixed(0)}K`;
  }
  return `LKR ${value}`;
};


// Schema for the manual data input form
const formSchema = z.object({
  historicalRevenueData: z
    .string()
    .min(10, {
      message: 'Please provide historical revenue data (JSON format, in LKR).',
    }).refine((val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'name' in item && 'revenue' in item && typeof item.revenue === 'number');
      } catch (e) {
        return false;
      }
    }, { message: "Invalid JSON format or structure. Expected array of {name: string, revenue: number (LKR)}." }),
  productionCapacity: z.coerce.number().positive({
    message: 'Production capacity must be a positive number.',
  }),
  marketingSpend: z.coerce.number().nonnegative({
    message: 'Marketing spend cannot be negative (LKR).',
  }),
  laborCostIndex: z.coerce.number().positive({
    message: 'Labor cost index must be a positive number (e.g., 1.0 for average).',
  }),
  additionalContext: z.string().optional(),
  lifetimeStage: z.enum(['startup', 'growth', 'maturity', 'decline'], {
    required_error: 'Please select the company lifecycle stage.',
  }),
  naturalDisasterLikelihood: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select the likelihood of a natural disaster.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function DashboardPage() {
  const { toast } = useToast();
  const [prediction, setPrediction] = React.useState<RevenuePredictionOutput | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = React.useState(false);
  const [isLoadingIndicators, setIsLoadingIndicators] = React.useState(true);
  const [hasFetchError, setHasFetchError] = React.useState(false); // Track if fetching failed
  const [economicData, setEconomicData] = React.useState<EconomicIndicators | null>(null);
  const [marketData, setMarketData] = React.useState<MarketSignals | null>(null);
  const [chartData, setChartData] = React.useState(defaultHistoricalData);
  const [currentYear, setCurrentYear] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      historicalRevenueData: JSON.stringify(defaultHistoricalData.slice(-4), null, 2), // Show recent data by default
      productionCapacity: 50000, // Example capacity
      marketingSpend: 500000, // Example marketing spend
      laborCostIndex: 1.0, // Example labor cost index
      additionalContext: '',
      lifetimeStage: 'growth',
      naturalDisasterLikelihood: 'low',
    },
  });

  // Fetch initial data effect
  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());

    const fetchData = async () => {
      setIsLoadingIndicators(true);
      setHasFetchError(false);
      try {
        console.log("Attempting to fetch initial real-time economic and market data...");
        // Call services that might use node-fetch or similar *server-side*
        const [ecoData, mktData] = await Promise.all([
          getEconomicIndicators(),
          getMarketSignals(),
        ]);
        console.log("Fetched initial data:", { ecoData, mktData });

        setEconomicData(ecoData);
        setMarketData(mktData);

      } catch (error) {
        console.error("Failed to fetch initial real-time indicator data:", error);
        setHasFetchError(true);
        toast({
          title: 'Data Fetch Error',
          description: 'Could not load latest economic or market indicators. Using default display values. Check API keys and service status.',
          variant: 'destructive',
        });
        // Set defaults if fetch fails, allowing UI to render
        setEconomicData({ gdpGrowthRate: 1.0, inflationRate: 10.0, unemploymentRate: 5.0, exchangeRate: 310 });
        setMarketData({ demand: 1.0, rawMaterialPrices: 1.0, tradeConditions: 'Unavailable - Using default assumptions.' });
      } finally {
        setIsLoadingIndicators(false);
      }
    };
    fetchData();
  }, [toast]);

  const onSubmit = async (data: FormValues) => {
    setIsLoadingPrediction(true);
    setPrediction(null); // Clear previous prediction

    // Ensure economic and market data are loaded (or defaulted after error) before proceeding
    if (isLoadingIndicators) {
        toast({ title: "Please wait", description: "Economic data is still loading.", variant: "default" });
        setIsLoadingPrediction(false);
        return;
    }
    if (!economicData || !marketData) {
        toast({ title: "Missing Data", description: "Cannot predict without economic indicators. Fetching may have failed.", variant: "destructive"});
        setIsLoadingPrediction(false);
        return;
    }


    try {
      let parsedHistoricalData;
      try {
        parsedHistoricalData = JSON.parse(data.historicalRevenueData);
        if (!Array.isArray(parsedHistoricalData) || !parsedHistoricalData.every(item => typeof item === 'object' && item !== null && 'name' in item && 'revenue' in item && typeof item.revenue === 'number')) {
          throw new Error('Invalid historical data structure.');
        }
      } catch (e) {
        toast({
          title: 'Invalid Input Data',
          description: 'Historical revenue data is not valid JSON or does not match the expected format (LKR amounts).',
          variant: 'destructive',
        });
        setIsLoadingPrediction(false);
        return;
      }

      // The AI flow internally calls getEconomicIndicators and getMarketSignals again if needed,
      // or we can pass the fetched data if the flow structure is adjusted.
      // The current flow calls them internally.
      console.log("Calling predictRevenue flow with input:", data);
      const result = await predictRevenue({
        historicalRevenueData: data.historicalRevenueData,
        productionCapacity: data.productionCapacity,
        marketingSpend: data.marketingSpend, // Pass new field
        laborCostIndex: data.laborCostIndex, // Pass new field
        additionalContext: data.additionalContext,
        lifetimeStage: data.lifetimeStage,
        naturalDisasterLikelihood: data.naturalDisasterLikelihood,
      });
      console.log("Prediction result:", result);
      setPrediction(result);

      // Save prediction to Firestore (async, no need to await unless critical)
      addDoc(collection(db, "predictions"), {
          ...data, // Include all form inputs
          predictedRevenue: result.predictedRevenue,
          trendAnalysis: result.trendAnalysis,
          riskFactors: result.riskFactors,
          confidenceScore: result.confidenceScore,
          economicIndicatorsUsed: economicData, // Capture the indicators used for this prediction
          marketSignalsUsed: marketData,        // Capture the signals used
          predictionTimestamp: new Date()
      }).then(docRef => {
          console.log("Prediction data saved to Firestore with ID: ", docRef.id);
      }).catch(e => {
          console.error("Error saving prediction to Firestore: ", e);
          // Optional: Show a non-critical toast message about save failure
          // toast({ title: "Save Warning", description: "Could not save prediction details.", variant: "default" });
      });


      // Generate next quarter label dynamically
      let nextQuarterLabel = 'Next Q (Pred.)';
      const lastHistoricalPoint = parsedHistoricalData[parsedHistoricalData.length - 1];
      if (lastHistoricalPoint && lastHistoricalPoint.name) {
        const match = lastHistoricalPoint.name.match(/Q(\d)\s+(\d+)/);
        if (match) {
          let quarter = parseInt(match[1]);
          let year = parseInt(match[2]);
          let fullYear = year < 50 ? 2000 + year : 1900 + year;
          if (quarter === 4) {
            quarter = 1;
            fullYear += 1;
          } else {
            quarter += 1;
          }
          const displayYear = fullYear.toString().slice(-2);
          nextQuarterLabel = `Q${quarter} ${displayYear} (Pred.)`;
        }
      }

      // Update chart data including the new prediction point
      setChartData([
        ...parsedHistoricalData,
        { name: nextQuarterLabel, revenue: result.predictedRevenue, predicted: true }
      ]);

      toast({
        title: 'Prediction Generated Successfully!',
        description: `Predicted Revenue: ${formatLKR(result.predictedRevenue)}`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      let errorMessage = 'Failed to generate revenue prediction. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message.includes('API key') || error.message.includes('quota') || error.message.includes('Rate limit')
          ? 'Prediction service configuration error, quota issue, or rate limit reached. Please contact support or try later.'
          : `Prediction failed: ${error.message.substring(0, 150)}`;
      }
      toast({
        title: 'Prediction Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground"> {/* Use background and foreground directly */}
      <header className="bg-card shadow-sm sticky top-0 z-10 border-b border-border"> {/* Use card and border */}
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> LankaForecaster Dashboard
          </h1>
          <Button variant="outline" size="sm">Logout</Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Charts and Analysis */}
        <div className="lg:col-span-2 space-y-8">

          {/* Current Indicators Card */}
          <Card className="shadow-md border-border"> {/* Use border */}
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Globe className="text-primary" />Current Economic & Market Snapshot</CardTitle>
               <CardDescription>
                 Key indicators influencing the forecast.
                 {isLoadingIndicators ? " Loading latest data..." : hasFetchError ? " Using defaults due to fetch error." : " (Data loaded)"}
               </CardDescription>
             </CardHeader>
             <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
               {isLoadingIndicators ? (
                 <>
                   <Skeleton className="h-6 w-3/4 bg-muted" /> {/* Use muted for skeleton */}
                   <Skeleton className="h-6 w-2/3 bg-muted" />
                   <Skeleton className="h-6 w-3/4 bg-muted" />
                   <Skeleton className="h-6 w-2/3 bg-muted" />
                   <Skeleton className="h-6 w-3/4 bg-muted" />
                   <Skeleton className="h-6 w-full col-span-2 md:col-span-1 bg-muted" />
                 </>
               ) : (
                 <>
                   <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /> GDP Growth: <span className="font-medium">{economicData?.gdpGrowthRate ?? 'N/A'}%</span></div>
                   <div className="flex items-center gap-2"><Percent className="w-4 h-4 text-muted-foreground" /> Inflation: <span className="font-medium">{economicData?.inflationRate ?? 'N/A'}%</span></div>
                   <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /> USD/LKR: <span className="font-medium">{economicData?.exchangeRate ?? 'N/A'}</span></div>
                   <div className="flex items-center gap-2"><Anchor className="w-4 h-4 text-muted-foreground" /> Market Demand: <span className="font-medium">{marketData?.demand?.toFixed(2) ?? 'N/A'}</span></div>
                   <div className="flex items-center gap-2"><Factory className="w-4 h-4 text-muted-foreground" /> Material Costs: <span className="font-medium">{marketData?.rawMaterialPrices?.toFixed(2) ?? 'N/A'}</span></div>
                   <p className="text-xs text-muted-foreground col-span-2 md:col-span-3 pt-2 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0"/>Trade Conditions: {marketData?.tradeConditions ?? 'N/A'}</p>
                 </>
               )}
             </CardContent>
          </Card>

          {/* Revenue Trend Chart Card */}
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart className="text-primary" />Revenue Trend</CardTitle>
              <CardDescription>Historical and Predicted Quarterly Revenue (LKR)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tick={{ dy: 5 }} interval="preserveStartEnd"/>
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={formatLKRShort}
                    width={80}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: '0 2px 10px hsl(var(--shadow))', color: 'hsl(var(--foreground))' }} /* Adjusted tooltip style */
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--primary))' }}
                    cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                    formatter={(value: number, name: string, props: any) => {
                      const formattedValue = formatLKR(value);
                      const isPredicted = props.payload.predicted || name.includes('(Pred.)');
                      return [formattedValue, isPredicted ? 'Predicted Revenue' : 'Historical Revenue'];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} verticalAlign="top" align="right" />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6, strokeWidth: 1, stroke: 'hsl(var(--primary))' }}
                    name="Historical"
                    data={chartData.filter(d => !d.predicted)}
                    isAnimationActive={false}
                  />
                  {prediction && chartData.some(d => d.predicted) && (
                     <Line
                       type="monotone"
                       dataKey="revenue"
                       stroke="hsl(var(--accent))" // Use accent color for prediction line
                       strokeWidth={2}
                       strokeDasharray="5 5"
                       dot={{ r: 4, fill: 'hsl(var(--accent))' }}
                       activeDot={{ r: 6, strokeWidth: 1, stroke: 'hsl(var(--accent))' }}
                       name="Prediction"
                       // Ensure connection: include last historical + predicted
                       data={chartData.filter((d, i, arr) => (!arr[i-1]?.predicted && !d.predicted) || d.predicted )}
                       isAnimationActive={false}
                     />
                   )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Prediction Analysis Card */}
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary" />Revenue Prediction Analysis</CardTitle>
              <CardDescription>AI-generated forecast and insights for the next quarter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingPrediction && (
                <div className="flex items-center justify-center p-10 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin mr-3 text-primary" />
                  <span>Generating prediction, please wait...</span>
                </div>
              )}
              {!isLoadingPrediction && !prediction && (
                <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground border border-dashed rounded-lg border-border"> {/* Use border */}
                  <Info className="h-10 w-10 mb-3 text-primary" />
                  <span className="font-medium">Awaiting Input</span>
                  <span className="text-sm">Enter/confirm your data and click "Predict Revenue".</span>
                </div>
              )}
              {prediction && (
                <div className="space-y-6">
                  {/* Predicted Revenue & Confidence Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-6 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10"> {/* Subtle gradient */}
                    <div className="text-center md:text-left">
                      <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Predicted Revenue (Next Quarter)</p>
                      <p className="text-3xl md:text-4xl font-bold text-primary">{formatLKR(prediction.predictedRevenue)}</p> {/* Use primary for predicted */}
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Prediction Confidence</p>
                      <div className="flex items-center justify-center md:justify-end gap-2">
                         <Progress value={prediction.confidenceScore * 100} className={cn("w-24 h-2 bg-muted",
                            prediction.confidenceScore > 0.7 ? 'progress-high' : prediction.confidenceScore > 0.4 ? 'progress-medium' : 'progress-low'
                         )} />
                        <Badge variant={prediction.confidenceScore > 0.7 ? "default" : prediction.confidenceScore > 0.4 ? "secondary" : "destructive"} className="text-sm min-w-[60px] text-center justify-center">
                          {(prediction.confidenceScore * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Trend Analysis */}
                  <div>
                    <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Trend Analysis</h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-card p-4 rounded-md border border-border"> {/* Use card bg */}
                        {prediction.trendAnalysis || "No analysis provided."}
                    </p>
                  </div>

                  {/* Risk Factors */}
                  <Alert variant="destructive" className="bg-destructive/5 border-destructive/30">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-1" />
                    <AlertTitle className="font-semibold text-destructive">Potential Risk Factors</AlertTitle>
                    <AlertDescription className="text-destructive/90 whitespace-pre-line">
                      {prediction.riskFactors || "No specific risks identified."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Manual Input */}
        <div className="lg:col-span-1">
          <Card className="shadow-md sticky top-24 border-border bg-card"> {/* Use card and border */}
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Factory className="text-primary"/>Prediction Input</CardTitle>
              <CardDescription>Provide company data to power the prediction.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="historicalRevenueData"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/>Historical Revenue (JSON, LKR)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='[{"name": "Q1 23", "revenue": 160000000}, ...]'
                            className="min-h-[100px] font-mono text-xs resize-y bg-input text-foreground border-border" /* Adjusted styles */
                            {...field}
                          />
                        </FormControl>
                         <p className="text-xs text-muted-foreground flex items-start gap-1 pt-1">
                            <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Format: Array of {"{name: 'Qx YY', revenue: number (LKR)}"}
                         </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productionCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Factory className="w-4 h-4"/>Production Capacity (Units/Q)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50000" {...field} onChange={event => field.onChange(+event.target.value)} className="bg-input text-foreground border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="marketingSpend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Megaphone className="w-4 h-4"/>Marketing Spend (Last Q, LKR)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 500000" {...field} onChange={event => field.onChange(+event.target.value)} className="bg-input text-foreground border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="laborCostIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Users className="w-4 h-4"/>Labor Cost Index (1.0 = avg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 1.05" {...field} onChange={event => field.onChange(+event.target.value)} className="bg-input text-foreground border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="lifetimeStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Anchor className="w-4 h-4"/>Company Lifecycle Stage</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-input text-foreground border-border"> {/* Style trigger */}
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover text-popover-foreground border-border"> {/* Style content */}
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="growth">Growth</SelectItem>
                            <SelectItem value="maturity">Maturity</SelectItem>
                            <SelectItem value="decline">Decline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="naturalDisasterLikelihood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><CloudRain className="w-4 h-4"/>Natural Disaster Likelihood (Next Q)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                           <SelectTrigger className="bg-input text-foreground border-border"> {/* Style trigger */}
                              <SelectValue placeholder="Select likelihood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover text-popover-foreground border-border"> {/* Style content */}
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1"><Info className="w-4 h-4"/>Additional Context (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Major new client, regulatory changes, factory downtime..." {...field} className="min-h-[80px] resize-y bg-input text-foreground border-border" />
                        </FormControl>
                         <p className="text-xs text-muted-foreground pt-1">
                            Relevant factors not captured elsewhere (market shifts, internal issues).
                         </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoadingPrediction || isLoadingIndicators}>
                    {isLoadingPrediction ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Prediction...
                      </>
                    ) : isLoadingIndicators ? (
                       <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         Loading Indicators...
                       </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" /> Predict Revenue
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card py-4 mt-12 border-t border-border"> {/* Use card and border */}
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          &copy; {currentYear ?? new Date().getFullYear()} LankaForecaster. AI-Powered Revenue Insights for the Sri Lankan Garment Industry.
        </div>
      </footer>
    </div>
  );
}

// Inject styles for progress bar colors (runs client-side)
const progressStyles = `
  .progress-high .bg-primary { background-color: hsl(140, 60%, 45%); } /* Greenish */
  .progress-medium .bg-primary { background-color: hsl(45, 90%, 50%); } /* Yellowish */
  .progress-low .bg-primary { background-color: hsl(var(--destructive)); } /* Use theme destructive */

  .dark .progress-high .bg-primary { background-color: hsl(140, 50%, 55%); }
  .dark .progress-medium .bg-primary { background-color: hsl(45, 85%, 55%); }
  .dark .progress-low .bg-primary { background-color: hsl(var(--destructive)); }
`;

if (typeof window !== 'undefined') {
  const styleId = 'progress-color-styles';
  if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement("style");
      styleSheet.id = styleId;
      styleSheet.innerText = progressStyles;
      document.head.appendChild(styleSheet);
  }
}
