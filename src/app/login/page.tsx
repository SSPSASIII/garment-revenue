// Basic Login Page - src/app/login/page.tsx
 'use client';

 import * as React from 'react';
 import Link from 'next/link';
 import { zodResolver } from '@hookform/resolvers/zod';
 import { useForm } from 'react-hook-form';
 import * as z from 'zod';
 import { Button } from '@/components/ui/button';
 import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
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
 import { useToast } from '@/hooks/use-toast';
 import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
 import { TrendingUpIcon } from 'lucide-react';
 import { cn } from "@/lib/utils";

 const formSchema = z.object({
   email: z.string().email({ message: 'Invalid email address.' }),
   password: z.string().min(1, { message: 'Password is required.' }),
 });

 type FormValues = z.infer<typeof formSchema>;

 export default function LoginPage() {
   const { toast } = useToast();
   const router = useRouter(); // Initialize useRouter
   const form = useForm<FormValues>({
     resolver: zodResolver(formSchema),
     defaultValues: {
       email: '',
       password: '',
     },
   });

   const onSubmit = (data: FormValues) => {
     console.log('Login data:', data);
     // TODO: Implement actual login logic (e.g., API call, authentication)

     // Simulate successful login
     toast({
       title: 'Login Successful!',
       description: 'Redirecting to your dashboard...',
       variant: 'default', 
     });

     // Redirect to dashboard after a short delay
     setTimeout(() => {
       router.push('/dashboard');
     }, 1500);
   };

   return (
     <div className="flex items-center justify-center min-h-screen bg-background p-4">
       <Card className="w-full max-w-md shadow-lg bg-card border-border text-card-foreground">
         <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4">
             <TrendingUpIcon className="w-12 h-12 text-primary" /> {/* LankaForecaster Logo */}
           </div>
           <CardTitle className="text-3xl font-bold text-primary">Welcome Back!</CardTitle>
           <CardDescription className="text-muted-foreground">Log in to your LankaForecaster account.</CardDescription>
         </CardHeader>
         <CardContent>
           <Form {...form}>
             <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <FormField
                 control={form.control}
                 name="email"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel className="text-foreground">Email Address</FormLabel>
                     <FormControl>
                       <Input 
                         type="email"
                         placeholder="you@company.com"
                         {...field} 
                         className="bg-input text-foreground border-input"
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={form.control}
                 name="password"
                 render={({ field }) => (
                   <FormItem>
                     <FormLabel className="text-foreground">Password</FormLabel>
                     <FormControl>
                       <Input 
                        type="password"
                        placeholder="********"
                        {...field}
                        className="bg-input text-foreground border-input" />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                 Log In
               </Button>
             </form>
           </Form>
         </CardContent>
         <CardFooter className="flex flex-col items-center text-sm space-y-2 pt-4 border-t border-border">
           <p className="text-muted-foreground">
             Don't have an account?{' '}
             <Link href="/signup" className="text-primary hover:underline">
               Sign up
             </Link>
           </p>
         </CardFooter>
       </Card>
     </div>
   );
 }
