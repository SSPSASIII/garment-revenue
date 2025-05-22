
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
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { predictRevenue, type RevenuePredictionOutput, type RevenuePredictionInput } from '@/ai/flows/revenue-prediction';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, Info, Activity, AlertCircle, Percent, DollarSign, Globe, Factory, CloudRain, Anchor, CalendarDays, BarChart2, BrainCircuit, Megaphone, Users, CheckCircle, ShoppingCart, FileText, Star, Briefcase, Target, HelpCircle } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// Default historical data (can be overridden by user input)
const defaultHistoricalData = [
  { name: 'Q1 22', revenue: 140000000 },
  { name: 'Q2 22', revenue: 130000000 },
  { name: 'Q3 22', revenue: 155000000 },
  { name: 'Q4 22', revenue: 150000000 },
  { name: 'Q1 23', revenue: 160000000 },
  { name: 'Q2 23', revenue: 175000000 },
  { name: 'Q3 23', revenue: 180000000 },
  { name: 'Q4 23', revenue: 170000000 },
];

// Format LKR currency
const formatLKR = (value: number): string => {
  return `LKR ${value.toLocaleString('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatLKRShort = (value: number): string => {
  if (value >= 1_000_000_000) return `LKR ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `LKR ${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `LKR ${(value / 1_000).toFixed(0)}K`;
  return `LKR ${value}`;
};

// Updated form schema to include new fields for EnhancedPredictionEngine
const formSchema = z.object({
  historicalRevenueData: z
    .string()
    .min(10, { message: 'Please provide historical revenue data (JSON format, in LKR).' })
    .refine((val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'name' in item && 'revenue' in item && typeof item.revenue === 'number');
      } catch (e) { return false; }
    }, { message: "Invalid JSON. Expected array of {name: string, revenue: number (LKR)}." }),
  productionCapacity: z.coerce.number().positive({ message: 'Production capacity must be a positive number.' }),
  marketingSpend: z.coerce.number().nonnegative({ message: 'Marketing spend cannot be negative (LKR).' }),
  laborCostIndex: z.coerce.number().positive({ message: 'Labor cost index must be positive (e.g., 1.0 for average).' }),
  companyLifecycleStage: z.enum(['startup', 'growth', 'maturity', 'decline'], { required_error: 'Please select the company lifecycle stage.' }),
  naturalDisasterLikelihood: z.enum(['low', 'medium', 'high'], { required_error: 'Please select natural disaster likelihood.' }),
  
  // New enhanced input fields (all optional as per engine design, but can be made required here if desired)
  confirmedOrdersValue: z.coerce.number().positive({ message: 'Confirmed orders value must be positive.' }).optional().or(z.literal('')),
  orderBacklog: z.coerce.number().nonnegative({ message: 'Order backlog cannot be negative.' }).optional().or(z.literal('')),
  top3BuyersPercentage: z.coerce.number().min(0).max(100, { message: 'Must be between 0-100.' }).optional().or(z.literal('')),
  buyerRetentionRate: z.coerce.number().min(0).max(100, { message: 'Must be between 0-100.' }).optional().or(z.literal('')),
  firstPassQualityRate: z.coerce.number().min(0).max(100, { message: 'Must be between 0-100.' }).optional().or(z.literal('')),
  onTimeDeliveryRate: z.coerce.number().min(0).max(100, { message: 'Must be between 0-100.' }).optional().or(z.literal('')),
  currentExchangeRate: z.coerce.number().positive({ message: 'Exchange rate must be positive.' }).optional().or(z.literal('')),
  additionalContext: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DashboardPage() {
  const { toast } = useToast();
  const [prediction, setPrediction] = React.useState<RevenuePredictionOutput | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = React.useState(false);
  const [chartData, setChartData] = React.useState(defaultHistoricalData);
  const [currentYear, setCurrentYear] = React.useState<string | null>(null);
  
  // Mocked external data for display - in real app, this might be fetched and shown,
  // but EnhancedPredictionEngine fetches its own external data internally or uses fallbacks.
  const [displayExternalData, setDisplayExternalData] = React.useState({
      exchangeRate: 325.50,
      rawMaterialPrices: { cottonPriceLKR: 410, polyesterPriceLKR: 360, dyeCostIndex: 1.05 },
      economicIndicators: { gdpGrowthRate: 1.8, inflationRate: 5.5, exportGrowthRate: 4.2, unemploymentRate: 4.9 }
  });


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      historicalRevenueData: JSON.stringify(defaultHistoricalData.slice(-4), null, 2),
      productionCapacity: 50000,
      marketingSpend: 500000,
      laborCostIndex: 1.0,
      companyLifecycleStage: 'growth',
      naturalDisasterLikelihood: 'low',
      confirmedOrdersValue: '', // Optional fields start empty or with default
      orderBacklog: '',
      top3BuyersPercentage: '',
      buyerRetentionRate: '',
      firstPassQualityRate: '',
      onTimeDeliveryRate: '',
      currentExchangeRate: '',
      additionalContext: '',
    },
  });

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
    // Simulate fetching display data for the "Current Snapshot" card
    // This is separate from the engine's internal data fetching
    // For instance, you might fetch this from a different, faster source for UI display only.
    const fetchDisplayData = async () => {
        // In a real app, you might fetch fresh data here for display.
        // For now, using static defaults set in useState.
        console.log("Dashboard using pre-set displayExternalData for UI snapshot.");
    };
    fetchDisplayData();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setIsLoadingPrediction(true);
    setPrediction(null);

    // Prepare data for the prediction flow, converting empty strings to undefined for optional numbers
    const flowInput: RevenuePredictionInput = {
        ...data,
        confirmedOrdersValue: data.confirmedOrdersValue === '' ? undefined : Number(data.confirmedOrdersValue),
        orderBacklog: data.orderBacklog === '' ? undefined : Number(data.orderBacklog),
        top3BuyersPercentage: data.top3BuyersPercentage === '' ? undefined : Number(data.top3BuyersPercentage),
        buyerRetentionRate: data.buyerRetentionRate === '' ? undefined : Number(data.buyerRetentionRate),
        firstPassQualityRate: data.firstPassQualityRate === '' ? undefined : Number(data.firstPassQualityRate),
        onTimeDeliveryRate: data.onTimeDeliveryRate === '' ? undefined : Number(data.onTimeDeliveryRate),
        currentExchangeRate: data.currentExchangeRate === '' ? undefined : Number(data.currentExchangeRate),
    };
    
    try {
      let parsedHistoricalData;
      try {
        parsedHistoricalData = JSON.parse(data.historicalRevenueData);
      } catch (e) {
        toast({ title: 'Invalid Input', description: 'Historical revenue data is not valid JSON.', variant: 'destructive' });
        setIsLoadingPrediction(false); return;
      }

      console.log("Calling predictRevenue flow with input:", flowInput);
      const result = await predictRevenue(flowInput);
      console.log("Prediction result (Enhanced Engine):", result);
      setPrediction(result);

      addDoc(collection(db, "predictionsEnhanced"), {
          input: flowInput, // Save the actual input sent to the flow
          output: result,
          predictionTimestamp: new Date()
      }).then(docRef => console.log("Enhanced prediction data saved to Firestore with ID: ", docRef.id))
        .catch(e => console.error("Error saving enhanced prediction to Firestore: ", e));

      let nextQuarterLabel = 'Next Q (Pred.)';
      const lastHistoricalPoint = parsedHistoricalData[parsedHistoricalData.length - 1];
      if (lastHistoricalPoint?.name) {
        const match = lastHistoricalPoint.name.match(/Q(\d)\s+(\d+)/);
        if (match) {
          let q = parseInt(match[1]), y = parseInt(match[2]);
          let fy = y < 50 ? 2000 + y : 1900 + y;
          q === 4 ? (q = 1, fy += 1) : q += 1;
          nextQuarterLabel = `Q${q} ${fy.toString().slice(-2)} (Pred.)`;
        }
      }
      
      // Use nextQuarter prediction for the chart, consistent with previous behavior
      setChartData([...parsedHistoricalData, { name: nextQuarterLabel, revenue: result.predictions.nextQuarter, predicted: true }]);
      toast({ title: 'Prediction Generated!', description: `Next Quarter Revenue: ${formatLKR(result.predictions.nextQuarter)}` });

    } catch (error: any) {
      console.error('Prediction error (Enhanced Engine):', error);
      toast({ title: 'Prediction Error', description: error.message || 'Failed to generate prediction.', variant: 'destructive' });
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="bg-card shadow-sm sticky top-0 z-10 border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
            <TrendingUp className="w-6 h-6" /> LankaForecaster Pro
          </h1>
          <Button variant="outline" size="sm">Logout</Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
          {/* Current Indicators Snapshot Card - using static display data */}
          <Card className="shadow-md border-border">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Globe className="text-primary" />Current Snapshot (Illustrative)</CardTitle>
               <CardDescription>Key external factors. Engine uses its own data/fallbacks.</CardDescription>
             </CardHeader>
             <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" /> LKR/USD: <span className="font-medium">{displayExternalData.exchangeRate}</span></div>
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-muted-foreground" /> GDP Growth: <span className="font-medium">{displayExternalData.economicIndicators.gdpGrowthRate}%</span></div>
                <div className="flex items-center gap-2"><Percent className="w-4 h-4 text-muted-foreground" /> Inflation: <span className="font-medium">{displayExternalData.economicIndicators.inflationRate}%</span></div>
                <div className="flex items-center gap-2"><Factory className="w-4 h-4 text-muted-foreground" /> Cotton LKR: <span className="font-medium">{displayExternalData.rawMaterialPrices.cottonPriceLKR}</span></div>
                <div className="flex items-center gap-2"><Anchor className="w-4 h-4 text-muted-foreground" /> Export Growth: <span className="font-medium">{displayExternalData.economicIndicators.exportGrowthRate}%</span></div>
             </CardContent>
          </Card>

          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart2 className="text-primary" />Revenue Trend & Forecast</CardTitle>
              <CardDescription>Historical and Predicted Quarterly Revenue (LKR)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={formatLKRShort} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatLKR(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Historical" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} />
                  {prediction && chartData.find(d => d.predicted) && (
                     <Line type="monotone" dataKey="revenue" name="Prediction (Next Q)" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} data={chartData.filter(d => d.predicted || chartData.indexOf(d) === chartData.length -2 && !chartData[chartData.length-1].predicted )}/>
                   )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Enhanced Prediction Analysis Card */}
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary" />Enhanced Prediction Analysis</CardTitle>
              <CardDescription>Detailed insights from the advanced forecasting engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingPrediction && (
                <div className="flex items-center justify-center p-10 text-muted-foreground">
                  <Loader2 className="h-10 w-10 animate-spin mr-3 text-primary" /> Generating enhanced prediction...
                </div>
              )}
              {!isLoadingPrediction && !prediction && (
                <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground border border-dashed rounded-lg">
                  <Info className="h-10 w-10 mb-3 text-primary" /> Awaiting input for enhanced forecast.
                </div>
              )}
              {prediction && (
                <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">Forecasted Revenues (LKR)</AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Next Month:</strong> {formatLKR(prediction.predictions.nextMonth)}</div>
                        <div><strong>Next Quarter:</strong> {formatLKR(prediction.predictions.nextQuarter)}</div>
                        <div><strong>Next 6 Months:</strong> {formatLKR(prediction.predictions.nextSixMonths)}</div>
                        <div><strong>Next Year:</strong> {formatLKR(prediction.predictions.nextYear)}</div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">Confidence & Accuracy</AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-2">
                        <div className="flex items-center">
                            <strong className="w-32">Confidence:</strong>
                            <Progress value={prediction.predictions.confidence} className="w-40 h-2 mr-2" /> 
                            <Badge>{prediction.predictions.confidence.toFixed(0)}%</Badge>
                        </div>
                        <div><strong>Accuracy Estimate:</strong> <Badge variant="secondary">{prediction.accuracy}</Badge></div>
                        <div><strong>Adjustment Factor:</strong> <Badge variant="outline">{prediction.predictions.adjustmentFactor.toFixed(3)}</Badge></div>
                    </AccordionContent>
                  </AccordionItem>
                   <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">Key Drivers</AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-1">
                      {prediction.insights.keyDrivers.map((driver, idx) => (
                        <div key={idx} className="text-sm p-2 bg-muted/30 rounded-md">
                          <strong>{driver.factor}:</strong> Impact <Badge variant={driver.impact === 'Positive' ? 'default' : driver.impact === 'Negative' ? 'destructive' : 'secondary'}>{driver.impact}</Badge> (Strength: {driver.strength})
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">Risk Factors</AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-1">
                       {prediction.insights.riskFactors.map((risk, idx) => (
                        <div key={idx} className="text-sm p-2 bg-muted/30 rounded-md">
                          <strong>{risk.risk}:</strong> Level <Badge variant={risk.level === 'High' ? 'destructive' : risk.level === 'Low' ? 'default' : 'secondary'}>{risk.level}</Badge> (Score: {risk.score})
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-5">
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">Recommendations</AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {prediction.recommendations.map((rec, idx) => <li key={idx}>{rec}</li>)}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Manual Input */}
        <div className="lg:col-span-1">
          <Card className="shadow-md sticky top-24 border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="text-primary"/>Enhanced Prediction Input</CardTitle>
              <CardDescription>Provide detailed company data for the advanced forecast.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Core Inputs Accordion */}
                  <Accordion type="single" collapsible defaultValue="core-inputs" className="w-full">
                    <AccordionItem value="core-inputs">
                      <AccordionTrigger className="font-semibold hover:no-underline text-base">Core Financial & Operational Data</AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-4">
                        <FormField control={form.control} name="historicalRevenueData" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><CalendarDays className="w-4 h-4"/>Hist. Revenue (JSON, LKR)</FormLabel><FormControl><Textarea placeholder='[{"name": "Q1 23", "revenue": 160000000}, ...]' className="min-h-[80px] font-mono text-xs resize-y" {...field} /></FormControl><FormDescription className="text-xs flex items-start gap-1 pt-1"><AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> Array of {"{name: 'Qx YY', revenue: num}"}</FormDescription><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="productionCapacity" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Factory className="w-4 h-4"/>Production Capacity (Units/Q)</FormLabel><FormControl><Input type="number" placeholder="e.g., 50000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="marketingSpend" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Megaphone className="w-4 h-4"/>Marketing Spend (Last Q, LKR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 500000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="laborCostIndex" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Users className="w-4 h-4"/>Labor Cost Index (1.0 = avg)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 1.05" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="strategic-inputs">
                      <AccordionTrigger className="font-semibold hover:no-underline text-base">Strategic & Market Factors</AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-4">
                        <FormField control={form.control} name="companyLifecycleStage" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Anchor className="w-4 h-4"/>Company Lifecycle Stage</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger></FormControl><SelectContent><SelectItem value="startup">Startup</SelectItem><SelectItem value="growth">Growth</SelectItem><SelectItem value="maturity">Maturity</SelectItem><SelectItem value="decline">Decline</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="naturalDisasterLikelihood" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><CloudRain className="w-4 h-4"/>Nat. Disaster Likelihood (Next Q)</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select likelihood" /></SelectTrigger></FormControl><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                         <FormField control={form.control} name="currentExchangeRate" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><DollarSign className="w-4 h-4"/>Current LKR/USD Rate (Optional)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 320.50" {...field} /></FormControl><FormDescription className="text-xs">Overrides engine's default/fetched if provided.</FormDescription><FormMessage /></FormItem>)} />
                      </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="enhanced-inputs">
                      <AccordionTrigger className="font-semibold hover:no-underline text-base">Enhanced Metrics (Optional)</AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-4">
                        <FormField control={form.control} name="confirmedOrdersValue" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><ShoppingCart className="w-4 h-4"/>Confirmed Orders Value (LKR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 25000000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="orderBacklog" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><FileText className="w-4 h-4"/>Order Backlog Value (LKR)</FormLabel><FormControl><Input type="number" placeholder="e.g., 5000000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="top3BuyersPercentage" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Target className="w-4 h-4"/>Revenue % from Top 3 Buyers</FormLabel><FormControl><Input type="number" min="0" max="100" placeholder="e.g., 65" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="buyerRetentionRate" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Users className="w-4 h-4"/>Buyer Retention Rate (%)</FormLabel><FormControl><Input type="number" min="0" max="100" placeholder="e.g., 80" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="firstPassQualityRate" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><Star className="w-4 h-4"/>First Pass Quality Rate (%)</FormLabel><FormControl><Input type="number" min="0" max="100" placeholder="e.g., 92" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="onTimeDeliveryRate" render={({ field }) => (
                          <FormItem><FormLabel className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/>On-Time Delivery Rate (%)</FormLabel><FormControl><Input type="number" min="0" max="100" placeholder="e.g., 95" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <FormField control={form.control} name="additionalContext" render={({ field }) => (
                    <FormItem><FormLabel className="flex items-center gap-1"><Info className="w-4 h-4"/>Additional Context (Optional)</FormLabel><FormControl><Textarea placeholder="e.g., Major new client, regulatory changes..." {...field} className="min-h-[60px] resize-y" /></FormControl><FormMessage /></FormItem>)} />
                  
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-3" disabled={isLoadingPrediction}>
                    {isLoadingPrediction ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Predicting...</> : <><TrendingUp className="mr-2 h-5 w-5" /> Predict Revenue (Enhanced)</>}
                  </Button>
                </form>
              </Form>
            </CardContent>
             <CardFooter className="text-xs text-muted-foreground pt-4 border-t">
                 <HelpCircle className="w-4 h-4 mr-1 shrink-0"/> Provide as much detail as possible for the most accurate forecast. Optional fields use sensible defaults.
             </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="bg-card py-4 mt-12 border-t border-border">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          &copy; {currentYear ?? new Date().getFullYear()} LankaForecaster Pro. Advanced AI Revenue Insights.
        </div>
      </footer>
    </div>
  );
}

    