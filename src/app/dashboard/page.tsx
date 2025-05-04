// Main Dashboard Page - src/app/dashboard/page.tsx
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
import { Loader2, TrendingUp, AlertTriangle, Info, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components


// Dummy historical data for chart example
const historicalData = [
  { name: 'Q1 22', revenue: 4000 },
  { name: 'Q2 22', revenue: 3000 },
  { name: 'Q3 22', revenue: 5000 },
  { name: 'Q4 22', revenue: 4500 },
  { name: 'Q1 23', revenue: 5500 },
  { name: 'Q2 23', revenue: 6000 },
];

// Schema for the manual data input form
const formSchema = z.object({
  historicalRevenueData: z.string().min(10, { // Assuming JSON string input
    message: 'Please provide historical revenue data (JSON format).',
  }).refine((val) => {
    try {
      const parsed = JSON.parse(val);
      // Basic check: is it an array of objects with name and revenue?
      return Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'name' in item && 'revenue' in item && typeof item.revenue === 'number');
    } catch (e) {
      return false;
    }
  }, { message: "Invalid JSON format or structure. Expected array of {name: string, revenue: number}." }),
  productionCapacity: z.coerce.number().positive({ // Coerce to number and ensure positive
    message: 'Production capacity must be a positive number.',
  }),
  economicNotes: z.string().optional(), // Example extra field
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
      historicalRevenueData: JSON.stringify(historicalData.slice(-4), null, 2), // Default to last 4 quarters
      productionCapacity: 10000, // Default example capacity
      economicNotes: '',
    },
  });

   // Effect to set current year on client-side mount
   React.useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

   const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setPrediction(null); // Clear previous prediction
    try {
      // Validate JSON structure again before sending (though zod refine helps)
       let parsedHistoricalData;
       try {
         parsedHistoricalData = JSON.parse(data.historicalRevenueData);
         if (!Array.isArray(parsedHistoricalData) || !parsedHistoricalData.every(item => typeof item === 'object' && item !== null && 'name' in item && 'revenue' in item && typeof item.revenue === 'number')) {
           throw new Error('Invalid historical data structure.');
         }
       } catch (e) {
         toast({
           title: 'Invalid Input Data',
           description: 'Historical revenue data is not valid JSON or does not match the expected format.',
           variant: 'destructive',
         });
         setIsLoading(false);
         return;
       }


      const result = await predictRevenue({
        historicalRevenueData: data.historicalRevenueData, // Send the original string
        productionCapacity: data.productionCapacity,
      });
      setPrediction(result);

      // Update chart data with predicted value
      const lastHistoricalPoint = parsedHistoricalData[parsedHistoricalData.length - 1];
       // Robust way to determine next quarter label
       let nextQuarterLabel = 'Next Q (Pred.)';
       if (lastHistoricalPoint && lastHistoricalPoint.name) {
            const match = lastHistoricalPoint.name.match(/Q(\d)\s+(\d+)/);
            if (match) {
                let quarter = parseInt(match[1]);
                let year = parseInt(match[2]);
                if (quarter === 4) {
                    quarter = 1;
                    year += 1;
                } else {
                    quarter += 1;
                }
                nextQuarterLabel = `Q${quarter} ${year} (Pred.)`;
            }
       }


       // Use the parsed historical data for the chart
       setChartData([
         ...parsedHistoricalData,
         { name: nextQuarterLabel, revenue: result.predictedRevenue, predicted: true } // Add a flag
       ]);

      toast({
        title: 'Prediction Generated Successfully!',
        description: `Predicted Revenue: $${result.predictedRevenue.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      let errorMessage = 'Failed to generate revenue prediction. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message.includes('API key not valid')
          ? 'Prediction service configuration error. Please contact support.'
          : `Prediction failed: ${error.message.substring(0, 100)}`; // Shorten potentially long messages
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
            <TrendingUpIcon className="w-5 h-5" /> LankaForecaster Dashboard
          </h1>
           {/* Add User Profile/Logout Button here if needed */}
           <Button variant="outline" size="sm">Logout</Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"> {/* Use items-start */}
        {/* Left Column: Charts & Prediction */}
        <div className="lg:col-span-2 space-y-8">
           {/* Revenue Chart */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><Activity className="text-primary"/>Revenue Trend</CardTitle>
               <CardDescription>Historical and Predicted Quarterly Revenue (USD)</CardDescription>
             </CardHeader>
             <CardContent>
                <ResponsiveContainer width="100%" height={350}> {/* Increased height */}
                   <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}> {/* Adjusted margins */}
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                     <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tick={{ dy: 5 }} />
                     <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} width={60} /> {/* Adjusted width */}
                     <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', boxShadow: 'hsl(var(--shadow))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: 'hsl(var(--primary))' }}
                        cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                        formatter={(value: number, name: string, props: any) => {
                            const formattedValue = `$${value.toLocaleString()}`;
                            return [formattedValue, props.payload.predicted ? 'Predicted Revenue' : 'Historical Revenue'];
                        }}
                      />
                     <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} verticalAlign="top" align="right" /> {/* Moved legend */}
                     <Line
                       type="monotone"
                       dataKey="revenue"
                       stroke="hsl(var(--primary))"
                       strokeWidth={2}
                       dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                       activeDot={{ r: 6, strokeWidth: 1, stroke: 'hsl(var(--primary))' }}
                       name="Historical"
                       // Filter out the predicted point for this line
                       data={chartData.filter(d => !d.predicted)}
                      />
                      {/* Line specifically for the prediction */}
                       <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4, fill: 'hsl(var(--accent))' }}
                        activeDot={{ r: 6, strokeWidth: 1, stroke: 'hsl(var(--accent))' }}
                        name="Prediction"
                        // Filter to only include the prediction point and the last historical point to connect them
                        data={chartData.filter((d, i, arr) => d.predicted || i === arr.length - 2)}
                       />
                   </LineChart>
                 </ResponsiveContainer>
             </CardContent>
           </Card>

           {/* Prediction Results */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><DollarSign className="text-primary"/>Revenue Prediction Analysis</CardTitle>
               <CardDescription>AI-generated forecast for the next quarter.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6"> {/* Increased spacing */}
               {isLoading && (
                 <div className="flex items-center justify-center p-10 text-muted-foreground"> {/* Increased padding */}
                   <Loader2 className="h-10 w-10 animate-spin mr-3 text-primary" /> {/* Made loader bigger and primary color */}
                   <span>Generating prediction, please wait...</span>
                 </div>
               )}
                {!isLoading && !prediction && (
                 <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground border border-dashed rounded-lg"> {/* Added border */}
                   <Info className="h-10 w-10 mb-3 text-primary" /> {/* Made icon bigger */}
                   <span className="font-medium">Awaiting Input</span>
                   <span className="text-sm">Enter historical data and production capacity, then click "Predict Revenue" to generate insights.</span>
                 </div>
               )}
               {prediction && (
                 <div className="space-y-6">
                   {/* Predicted Revenue Box */}
                   <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-center">
                      <p className="text-sm font-medium text-primary uppercase tracking-wider mb-1">Predicted Revenue (Next Quarter)</p>
                     <p className="text-4xl font-bold text-accent">${prediction.predictedRevenue.toLocaleString()}</p>
                   </div>

                   {/* Trend Analysis */}
                   <div>
                     <h4 className="font-semibold text-lg mb-2 flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/>Trend Analysis</h4>
                     <p className="text-sm text-foreground leading-relaxed">{prediction.trendAnalysis}</p>
                   </div>

                   {/* Risk Factors using Alert */}
                   <Alert variant="destructive" className="bg-destructive/5 border-destructive/30">
                     <AlertTriangle className="h-5 w-5 text-destructive" /> {/* Adjusted size */}
                     <AlertTitle className="font-semibold text-destructive">Potential Risk Factors</AlertTitle>
                     <AlertDescription className="text-destructive/90">
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
          <Card className="shadow-md sticky top-24"> {/* Sticky positioning */}
            <CardHeader>
              <CardTitle>Manual Data Input</CardTitle>
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
                        <FormLabel>Historical Revenue (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='[{"name": "Q1 23", "revenue": 5500}, ...]'
                            className="min-h-[120px] font-mono text-xs" // Increased height
                            {...field}
                          />
                        </FormControl>
                         <FormDescription className="text-xs flex items-center gap-1">
                           <AlertCircle className="w-3 h-3"/> Format: Array of objects like {"{name: 'Qx YY', revenue: number}"}
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
                          <Input type="number" placeholder="e.g., 10000" {...field} onChange={event => field.onChange(+event.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="economicNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contextual Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Major new client onboarded, upcoming regulatory changes..." {...field} />
                        </FormControl>
                         <FormDescription className="text-xs">
                           Provide any additional context for the AI.
                         </FormDescription>
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
                        <TrendingUpIcon className="mr-2 h-4 w-4" /> Predict Revenue
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
       <footer className="bg-background py-4 mt-12 border-t"> {/* Increased margin-top */}
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
           &copy; {currentYear ?? ''} LankaForecaster. AI-Powered Insights for the Garment Industry.
         </div>
      </footer>
    </div>
  );
}