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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { predictRevenue, type RevenuePredictionOutput } from '@/ai/flows/revenue-prediction';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, Info, Activity, AlertCircle, Percent, TrendingDown, BadgeInfo } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress"; // Import Progress component
import { Badge } from "@/components/ui/badge"; // Import Badge component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


// Dummy historical data for chart example (Updated to LKR)
const historicalData = [
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
  historicalRevenueData: z.string().min(10, {
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
  additionalContext: z.string().optional(), // Renamed from economicNotes
  lifetimeStage: z.enum(['startup', 'growth', 'maturity', 'decline'], {
    message: 'Please select the company lifecycle stage.',
  }),
  naturalDisasterLikelihood: z.enum(['low', 'medium', 'high'], {
    message: 'Please select the likelihood of a natural disaster.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function DashboardPage() {
  const { toast } = useToast();
  const [prediction, setPrediction] = React.useState<RevenuePredictionOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [chartData, setChartData] = React.useState(historicalData);
  const [currentYear, setCurrentYear] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      historicalRevenueData: JSON.stringify(historicalData.slice(-4), null, 2),
      productionCapacity: 50000, // Example capacity
      additionalContext: '',
      lifetimeStage: 'growth',
      naturalDisasterLikelihood: 'low',
    },
  });

   React.useEffect(() => {
    // Ensure this runs only on the client after hydration
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

   const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setPrediction(null);
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
         setIsLoading(false);
         return;
       }

      const result = await predictRevenue({
        historicalRevenueData: data.historicalRevenueData,
        productionCapacity: data.productionCapacity,
        additionalContext: data.additionalContext, // Pass additional context
        lifetimeStage: data.lifetimeStage,
        naturalDisasterLikelihood: data.naturalDisasterLikelihood,
      });
      setPrediction(result);

       let nextQuarterLabel = 'Next Q (Pred.)';
       const lastHistoricalPoint = parsedHistoricalData[parsedHistoricalData.length - 1];
       if (lastHistoricalPoint && lastHistoricalPoint.name) {
            const match = lastHistoricalPoint.name.match(/Q(\d)\s+(\d+)/);
            if (match) {
                let quarter = parseInt(match[1]);
                let year = parseInt(match[2]);
                if (quarter === 4) {
                    quarter = 1;
                    // Handle YY to YYYY conversion if needed, assuming YY for now
                    year = year < 50 ? 2000 + year + 1 : 1900 + year + 1; // Basic year rollover
                } else {
                    quarter += 1;
                    year = year < 50 ? 2000 + year : 1900 + year;
                }
                 // Format year back to YY for consistency, or use full year
                 const displayYear = year.toString().slice(-2);
                 nextQuarterLabel = `Q${quarter} ${displayYear} (Pred.)`;
            }
       }

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
        errorMessage = error.message.includes('API key') // More generic check
          ? 'Prediction service configuration error or quota issue. Please contact support.'
          : `Prediction failed: ${error.message.substring(0, 150)}`; // Slightly longer message
      }
      toast({
        title: 'Prediction Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-secondary">
       <header className="bg-background shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> LankaForecaster Dashboard
          </h1>
           {/* Add User Profile/Logout Button here if needed */}
           <Button variant="outline" size="sm">Logout</Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
           {/* Chart Card */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Activity className="text-primary"/>Revenue Trend</CardTitle>
               <CardDescription>Historical and Predicted Quarterly Revenue (LKR)</CardDescription>
             </CardHeader>
             <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                   <LineChart data={chartData} margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                     <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tick={{ dy: 5 }} />
                     <YAxis
                       stroke="hsl(var(--muted-foreground))"
                       fontSize={12}
                       tickFormatter={formatLKRShort} // Use short LKR format
                       width={80} // Increased width for LKR values
                      />
                     <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'hsl(var(--shadow))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--primary))' }}
                        cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                        formatter={(value: number, name: string, props: any) => {
                            const formattedValue = formatLKR(value); // Use LKR format
                            return [formattedValue, props.payload.predicted ? 'Predicted Revenue' : 'Historical Revenue'];
                        }}
                      />
                     <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} verticalAlign="top" align="right" />
                     {/* Historical Line */}
                     <Line
                       type="monotone"
                       dataKey="revenue"
                       stroke="hsl(var(--primary))"
                       strokeWidth={2}
                       dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                       activeDot={{ r: 6, strokeWidth: 1, stroke: 'hsl(var(--primary))' }}
                       name="Historical"
                       data={chartData.filter(d => !d.predicted)}
                      />
                      {/* Prediction Line - Draw only if prediction exists */}
                      {prediction && (
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
                        data={chartData.slice(-2)} // Includes last historical point and prediction point
                       />
                       )}
                   </LineChart>
                 </ResponsiveContainer>
             </CardContent>
           </Card>

           {/* Prediction Analysis Card */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><BadgeInfo className="text-primary"/>Revenue Prediction Analysis</CardTitle>
               <CardDescription>AI-generated forecast and insights for the next quarter.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
               {isLoading && (
                 <div className="flex items-center justify-center p-10 text-muted-foreground">
                   <Loader2 className="h-10 w-10 animate-spin mr-3 text-primary" />
                   <span>Generating prediction, please wait...</span>
                 </div>
               )}
                {!isLoading && !prediction && (
                 <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground border border-dashed rounded-lg">
                   <Info className="h-10 w-10 mb-3 text-primary" />
                   <span className="font-medium">Awaiting Input</span>
                   <span className="text-sm">Enter historical data (LKR), production capacity, and context, then click "Predict Revenue".</span>
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
                           <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Confidence Score</p>
                           <div className="flex items-center justify-center md:justify-end gap-2">
                             <Progress value={prediction.confidenceScore * 100} className="w-24 h-2" />
                              <Badge variant={prediction.confidenceScore > 0.7 ? "default" : prediction.confidenceScore > 0.4 ? "secondary" : "destructive"} className="text-sm">
                                { (prediction.confidenceScore * 100).toFixed(0) }%
                                {/* {prediction.confidenceScore > 0.8 ? 'High' : prediction.confidenceScore > 0.5 ? 'Medium' : 'Low'} */}
                               </Badge>
                           </div>
                      </div>
                   </div>

                   {/* Trend Analysis */}
                   <div>
                     <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/>Trend Analysis</h4>
                     <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{prediction.trendAnalysis}</p>
                   </div>

                   {/* Risk Factors */}
                   <Alert variant="destructive" className="bg-destructive/5 border-destructive/30">
                     <AlertTriangle className="h-5 w-5 text-destructive mt-1" /> {/* Align icon better */}
                     <AlertTitle className="font-semibold text-destructive">Potential Risk Factors</AlertTitle>
                     <AlertDescription className="text-destructive/90 whitespace-pre-line">
                       {prediction.riskFactors}
                     </AlertDescription>
                   </Alert>
                 </div>
               )}
             </CardContent>
           </Card>
        </div>

        {/* Right Column: Manual Input */}
        <div className="lg:col-span-1">
          <Card className="shadow-md sticky top-24">
            <CardHeader>
              <CardTitle>Prediction Input</CardTitle>
              <CardDescription>Provide data to power the AI prediction.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="historicalRevenueData"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Historical Revenue (JSON, LKR)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='[{"name": "Q1 23", "revenue": 160000000}, ...]'
                            className="min-h-[120px] font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                         <FormDescription className="text-xs flex items-start gap-1"> {/* Use items-start */}
                           <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0"/> Format: Array of {"{name: 'Qx YY', revenue: number (LKR)}"}
                         </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productionCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Production Capacity (Units/Quarter)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50000" {...field} onChange={event => field.onChange(+event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalContext" // Updated name
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Context (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Major new client onboarded, upcoming regulatory changes, factory downtime last month..." {...field} className="min-h-[80px]" />
                        </FormControl>
                         <FormDescription className="text-xs">
                           Provide relevant factors not captured above (market shifts, internal issues, etc.).
                         </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lifetimeStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Lifecycle Stage</FormLabel>
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
                        <FormLabel>Natural Disaster Likelihood</FormLabel>
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
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Predicting Revenue...
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
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
           &copy; {currentYear ?? ''} LankaForecaster. AI-Powered Revenue Insights for the Sri Lankan Garment Industry.
         </div>
      </footer>
    </div>
  );
}
