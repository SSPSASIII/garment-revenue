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
  // FormDescription, // Removed this import as it's causing issues
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
import { Loader2, TrendingUp, AlertTriangle, Info, Activity, AlertCircle, Percent, DollarSign, Globe, Factory, CloudRain, Anchor, CalendarDays, BarChart, BrainCircuit } from 'lucide-react';
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
  const [isLoadingIndicators, setIsLoadingIndicators] = React.useState(true); // Start as true until data is fetched
  const [economicData, setEconomicData] = React.useState<EconomicIndicators | null>(null);
  const [marketData, setMarketData] = React.useState<MarketSignals | null>(null);
  const [chartData, setChartData] = React.useState(defaultHistoricalData);
  const [currentYear, setCurrentYear] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      historicalRevenueData: JSON.stringify(defaultHistoricalData.slice(-4), null, 2), // Show recent data by default
      productionCapacity: 50000, // Example capacity
      additionalContext: '',
      lifetimeStage: 'growth',
      naturalDisasterLikelihood: 'low',
    },
  });

  React.useEffect(() => {
    // Ensure this runs only on the client after hydration
    setCurrentYear(new Date().getFullYear().toString());

    // Fetch economic and market data on component mount
    const fetchData = async () => {
      setIsLoadingIndicators(true);
      try {
        // ** TO USE REAL-TIME DATA: **
        // 1. Ensure `getEconomicIndicators` and `getMarketSignals` in `src/services/`
        //    are implemented to fetch data from actual APIs.
        // 2. Remove the placeholder logic within those service functions.
        // 3. The code below will then call your real-time data fetching functions.

        console.log("Attempting to fetch initial economic and market data...");
        const [ecoData, mktData] = await Promise.all([
          getEconomicIndicators(), // Calls the function in src/services/economy.ts
          getMarketSignals(),    // Calls the function in src/services/market.ts
        ]);
        console.log("Fetched initial data:", { ecoData, mktData });

        setEconomicData(ecoData);
        setMarketData(mktData);

      } catch (error) {
        console.error("Failed to fetch initial indicator data:", error);
        toast({
          title: 'Data Fetch Error',
          description: 'Could not load latest economic or market indicators. Using placeholder display values.',
          variant: 'destructive',
        });
        // Set placeholders if fetch fails, allowing UI to render
        setEconomicData({ gdpGrowthRate: 1.0, inflationRate: 10.0, unemploymentRate: 5.0, exchangeRate: 310 });
        setMarketData({ demand: 1.0, rawMaterialPrices: 1.0, tradeConditions: 'Unavailable - Using default assumptions.' });
      } finally {
        setIsLoadingIndicators(false);
      }
    };
    fetchData();
  }, [toast]); // Add toast to dependency array

  const onSubmit = async (data: FormValues) => {
    setIsLoadingPrediction(true);
    setPrediction(null); // Clear previous prediction
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

      // ** OPTIONAL: Refetch indicators just before prediction for maximum freshness **
      // If keeping the data fetched on mount is acceptable, you can comment out or remove this block.
      // Ensure your service functions are implemented for real-time data if you uncomment this.
      /*
      try {
        setIsLoadingIndicators(true);
        console.log("Refetching indicators before prediction...");
        const [ecoData, mktData] = await Promise.all([
          getEconomicIndicators(),
          getMarketSignals(),
        ]);
         console.log("Refetched data:", { ecoData, mktData });
        setEconomicData(ecoData);
        setMarketData(mktData);
      } catch (error) {
         console.error("Failed to fetch real-time data before prediction:", error);
         toast({
          title: 'Data Fetch Warning',
          description: 'Could not load latest indicators before prediction. Using previously loaded or default data.',
          variant: 'default', // Less severe than destructive
        });
         // Ensure we have *some* data to proceed, even if it's the older fetched data or defaults
         if (!economicData || !marketData) {
            console.log("Falling back to existing or default indicators for prediction.");
            setEconomicData(economicData ?? { gdpGrowthRate: 1.0, inflationRate: 10.0, unemploymentRate: 5.0, exchangeRate: 310 });
            setMarketData(marketData ?? { demand: 1.0, rawMaterialPrices: 1.0, tradeConditions: 'Unavailable - Using default assumptions.' });
         }
      } finally {
          setIsLoadingIndicators(false);
      }
      */
      // ** End of optional refetch block **

      // Ensure economic and market data are available before calling predictRevenue
      // Use the state values which hold either fetched data or defaults/fallbacks.
      if (!economicData || !marketData) {
          toast({
              title: "Missing Data",
              description: "Cannot generate prediction without economic and market indicators.",
              variant: "destructive",
          });
          setIsLoadingPrediction(false);
          return;
      }

      console.log("Calling predictRevenue with input:", data);
      const result = await predictRevenue({
        historicalRevenueData: data.historicalRevenueData,
        productionCapacity: data.productionCapacity,
        additionalContext: data.additionalContext,
        lifetimeStage: data.lifetimeStage,
        naturalDisasterLikelihood: data.naturalDisasterLikelihood,
        // Note: The flow internally calls getEconomicIndicators and getMarketSignals again.
        // If you refetched above, you might consider passing the fetched data directly
        // to the flow if you modify the flow's signature, or rely on the flow's internal fetch.
        // Current implementation relies on the flow's internal fetch using the latest from services.
      });
      console.log("Prediction result:", result);
      setPrediction(result);

      // Generate next quarter label dynamically
      let nextQuarterLabel = 'Next Q (Pred.)';
      const lastHistoricalPoint = parsedHistoricalData[parsedHistoricalData.length - 1];
      if (lastHistoricalPoint && lastHistoricalPoint.name) {
        const match = lastHistoricalPoint.name.match(/Q(\d)\s+(\d+)/);
        if (match) {
          let quarter = parseInt(match[1]);
          let year = parseInt(match[2]);
          // Simple year handling: assumes YY format < 50 is 20xx, >= 50 is 19xx
          let fullYear = year < 50 ? 2000 + year : 1900 + year;
          if (quarter === 4) {
            quarter = 1;
            fullYear += 1;
          } else {
            quarter += 1;
          }
          // Format year back to YY for consistency in the chart label
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
        errorMessage = error.message.includes('API key') || error.message.includes('quota')
          ? 'Prediction service configuration error or quota issue. Please contact support.'
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
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <header className="bg-background shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> LankaForecaster Dashboard
          </h1>
          {/* Add User Profile/Logout Button here if needed */}
          <Button variant="outline" size="sm">Logout</Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Charts and Analysis */}
        <div className="lg:col-span-2 space-y-8">

          {/* Current Indicators Card */}
          <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Globe className="text-primary" />Current Economic & Market Snapshot</CardTitle>
               <CardDescription>
                 Key indicators influencing the forecast.
                 {isLoadingIndicators ? " Loading latest data..." : " (Data loaded)"}
                 {(!isLoadingIndicators && (!economicData || !marketData)) ? " Using placeholders." : ""}
               </CardDescription>
             </CardHeader>
             <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
               {isLoadingIndicators ? (
                 <>
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-6 w-2/3" />
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-6 w-2/3" />
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-6 w-full col-span-2 md:col-span-1" />
                 </>
               ) : (
                 <>
                   <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /> GDP Growth: <span className="font-medium">{economicData?.gdpGrowthRate ?? 'N/A'}%</span></div>
                   <div className="flex items-center gap-2"><Percent className="w-4 h-4 text-muted-foreground" /> Inflation: <span className="font-medium">{economicData?.inflationRate ?? 'N/A'}%</span></div>
                   <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /> USD/LKR: <span className="font-medium">{economicData?.exchangeRate ?? 'N/A'}</span></div>
                   <div className="flex items-center gap-2"><Anchor className="w-4 h-4 text-muted-foreground" /> Market Demand: <span className="font-medium">{marketData?.demand ?? 'N/A'}</span></div>
                   <div className="flex items-center gap-2"><Factory className="w-4 h-4 text-muted-foreground" /> Material Costs: <span className="font-medium">{marketData?.rawMaterialPrices ?? 'N/A'}</span></div>
                   <p className="text-xs text-muted-foreground col-span-2 md:col-span-3 pt-2 flex items-start gap-1"><Info className="w-3 h-3 mt-0.5 shrink-0"/>Trade Conditions: {marketData?.tradeConditions ?? 'N/A'}</p>
                 </>
               )}
             </CardContent>
          </Card>

          {/* Revenue Trend Chart Card */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart className="text-primary" />Revenue Trend</CardTitle>
              <CardDescription>Historical and Predicted Quarterly Revenue (LKR)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 40, bottom: 5 }}> {/* Adjusted margins */}
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tick={{ dy: 5 }} interval="preserveStartEnd"/>
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={formatLKRShort}
                    width={80} // Keep increased width for LKR values
                    domain={['auto', 'auto']} // Let recharts determine domain or set manually e.g., [0, 'dataMax + 50000000']
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'hsl(var(--shadow))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--primary))' }}
                    cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                    formatter={(value: number, name: string, props: any) => {
                      const formattedValue = formatLKR(value);
                      // Check if the point is predicted based on the custom flag or its position
                      const isPredicted = props.payload.predicted || name.includes('(Pred.)');
                      return [formattedValue, isPredicted ? 'Predicted Revenue' : 'Historical Revenue'];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} verticalAlign="top" align="right" />
                  {/* Historical Line */}
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6, strokeWidth: 1, stroke: 'hsl(var(--primary))' }}
                    name="Historical"
                    data={chartData.filter(d => !d.predicted)} // Filter data explicitly marked as not predicted
                    isAnimationActive={false} // Optional: disable animation if causing issues
                  />
                  {/* Prediction Line - Draw only if prediction exists */}
                  {prediction && chartData.some(d => d.predicted) && ( // Check if prediction exists and is in chartData
                     <Line
                       type="monotone"
                       dataKey="revenue"
                       stroke="hsl(var(--accent))"
                       strokeWidth={2}
                       strokeDasharray="5 5"
                       dot={{ r: 4, fill: 'hsl(var(--accent))' }}
                       activeDot={{ r: 6, strokeWidth: 1, stroke: 'hsl(var(--accent))' }}
                       name="Prediction"
                       // Connect prediction line smoothly from the last historical point
                       // Ensure data includes the last *actual* historical point and the first predicted point
                       data={chartData.filter((d, i, arr) => !arr[i-1]?.predicted && !d.predicted || d.predicted )} // Get last historical + all predicted
                       isAnimationActive={false} // Optional: disable animation
                     />
                   )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Prediction Analysis Card */}
          <Card className="shadow-md">
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
                <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground border border-dashed rounded-lg">
                  <Info className="h-10 w-10 mb-3 text-primary" />
                  <span className="font-medium">Awaiting Input</span>
                  <span className="text-sm">Enter/confirm your data and click "Predict Revenue".</span>
                </div>
              )}
              {prediction && (
                <div className="space-y-6">
                  {/* Predicted Revenue & Confidence Score */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-6 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <div className="text-center md:text-left">
                      <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Predicted Revenue (Next Quarter)</p>
                      <p className="text-3xl md:text-4xl font-bold text-accent">{formatLKR(prediction.predictedRevenue)}</p>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Prediction Confidence</p>
                      <div className="flex items-center justify-center md:justify-end gap-2">
                         <Progress value={prediction.confidenceScore * 100} className={cn("w-24 h-2 bg-muted",
                            prediction.confidenceScore > 0.7 ? 'progress-high' : prediction.confidenceScore > 0.4 ? 'progress-medium' : 'progress-low' // Use CSS classes for color
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
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line bg-muted/30 p-4 rounded-md border border-border">
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
          <Card className="shadow-md sticky top-24"> {/* Make input card sticky */}
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
                            className="min-h-[120px] font-mono text-xs resize-y" // Allow vertical resize
                            {...field}
                          />
                        </FormControl>
                        {/* Re-add FormDescription correctly if needed, ensuring it's imported and defined */}
                         {/* <FormDescription className="text-xs flex items-start gap-1">
                           <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> Format: Array of {"{name: 'Qx YY', revenue: number (LKR)}"}
                         </FormDescription> */}
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
                        <FormLabel className="flex items-center gap-1"><Factory className="w-4 h-4"/>Production Capacity (Units/Quarter)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50000" {...field} onChange={event => field.onChange(+event.target.value)} />
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select likelihood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                          <Textarea placeholder="e.g., Major new client, regulatory changes, factory downtime..." {...field} className="min-h-[80px] resize-y" />
                        </FormControl>
                         {/* <FormDescription className="text-xs">
                           Relevant factors not captured elsewhere (market shifts, internal issues).
                         </FormDescription> */}
                         <p className="text-xs text-muted-foreground pt-1">
                            Relevant factors not captured elsewhere (market shifts, internal issues).
                         </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoadingPrediction || isLoadingIndicators}>
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
      <footer className="bg-background py-4 mt-12 border-t">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          &copy; {currentYear ?? new Date().getFullYear()} LankaForecaster. AI-Powered Revenue Insights for the Sri Lankan Garment Industry.
        </div>
      </footer>
    </div>
  );
}

// Note: The custom Progress component definition was removed previously to fix an error.
// Ensure the standard ShadCN Progress component is used with appropriate Tailwind classes or CSS variables for styling.
// Adding some basic styles for progress bar color based on confidence:
const progressStyles = `
  .progress-high .bg-primary { background-color: hsl(120, 60%, 40%); } /* Green */
  .progress-medium .bg-primary { background-color: hsl(40, 95%, 55%); } /* Yellow-Gold */
  .progress-low .bg-primary { background-color: hsl(0, 70%, 55%); } /* Soft Red */

  .dark .progress-high .bg-primary { background-color: hsl(120, 50%, 50%); } /* Brighter Green */
  .dark .progress-medium .bg-primary { background-color: hsl(40, 90%, 60%); } /* Brighter Gold */
  .dark .progress-low .bg-primary { background-color: hsl(0, 60%, 60%); } /* Brighter Soft Red */
`;

// Inject styles (use appropriate method in Next.js, e.g., global CSS or styled-jsx)
if (typeof window !== 'undefined') { // Ensure this runs client-side
  const styleSheet = document.createElement("style");
  styleSheet.innerText = progressStyles;
  document.head.appendChild(styleSheet);
}
