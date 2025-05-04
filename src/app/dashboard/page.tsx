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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, AlertTriangle, Info } from 'lucide-react';

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
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  }, { message: "Invalid JSON format."}),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      historicalRevenueData: JSON.stringify(historicalData.slice(-4), null, 2), // Default to last 4 quarters
      productionCapacity: 10000, // Default example capacity
      economicNotes: '',
    },
  });

   const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setPrediction(null); // Clear previous prediction
    try {
      const result = await predictRevenue({
        historicalRevenueData: data.historicalRevenueData,
        productionCapacity: data.productionCapacity,
      });
      setPrediction(result);

      // Update chart data with predicted value
      const lastHistoricalPoint = historicalData[historicalData.length - 1];
      // Simple way to determine next quarter label (adjust as needed)
      const nextQuarterLabel = `Q${(parseInt(lastHistoricalPoint.name.substring(1,2)) % 4) + 1} ${lastHistoricalPoint.name.substring(3)}`;

       setChartData([
         ...historicalData,
         { name: `${nextQuarterLabel} (Pred.)`, revenue: result.predictedRevenue }
       ]);

      toast({
        title: 'Prediction Generated Successfully!',
        description: `Predicted Revenue: $${result.predictedRevenue.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: 'Prediction Error',
        description: 'Failed to generate revenue prediction. Please try again.',
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
          <h1 className="text-xl font-bold text-primary">LankaForecaster Dashboard</h1>
           {/* Add User Profile/Logout Button here if needed */}
           <Button variant="outline" size="sm">Logout</Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts & Prediction */}
        <div className="lg:col-span-2 space-y-8">
           {/* Revenue Chart */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle>Revenue Trend</CardTitle>
               <CardDescription>Historical and Predicted Revenue (USD)</CardDescription>
             </CardHeader>
             <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                   <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                     <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                     <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
                     <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        cursor={{ fill: 'hsl(var(--accent)/0.1)' }}
                      />
                     <Legend wrapperStyle={{fontSize: '12px'}} />
                     <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} name="Revenue" />
                     {/* Highlight the last point if it's a prediction */}
                     {prediction && <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeDasharray="5 5" name="Prediction" />}
                   </LineChart>
                 </ResponsiveContainer>
             </CardContent>
           </Card>

           {/* Prediction Results */}
           <Card className="shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary"/>Revenue Prediction Analysis</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {isLoading && (
                 <div className="flex items-center justify-center p-8 text-muted-foreground">
                   <Loader2 className="h-8 w-8 animate-spin mr-2" />
                   <span>Generating prediction...</span>
                 </div>
               )}
                {!isLoading && !prediction && (
                 <div className="flex items-center justify-center p-8 text-muted-foreground">
                   <Info className="h-6 w-6 mr-2" />
                   <span>Enter data and click "Predict Revenue" to see results.</span>
                 </div>
               )}
               {prediction && (
                 <div className="space-y-6">
                   <div>
                     <h3 className="font-semibold text-lg text-primary">Predicted Revenue (Next Quarter):</h3>
                     <p className="text-3xl font-bold text-accent">${prediction.predictedRevenue.toLocaleString()}</p>
                   </div>
                   <div>
                     <h4 className="font-semibold text-md">Trend Analysis:</h4>
                     <p className="text-sm text-muted-foreground">{prediction.trendAnalysis}</p>
                   </div>
                   <div>
                     <h4 className="font-semibold text-md flex items-center gap-1 text-destructive/80"><AlertTriangle className="w-4 h-4"/>Risk Factors:</h4>
                     <p className="text-sm text-muted-foreground">{prediction.riskFactors}</p>
                   </div>
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
              <CardDescription>Provide data for prediction.</CardDescription>
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
                            className="min-h-[100px] font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                         <FormDescription className="text-xs">
                           Enter historical quarterly revenue as a JSON array.
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
                          <Input type="number" placeholder="e.g., 10000" {...field} />
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
                        <FormLabel>Economic Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Any relevant economic context..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Predicting...
                      </>
                    ) : (
                      'Predict Revenue'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
       <footer className="bg-background py-4 mt-8 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
           &copy; {new Date().getFullYear()} LankaForecaster. AI-Powered Insights.
         </div>
      </footer>
    </div>
  );
}
