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
 import { useRouter } from 'next/navigation';
 import { TrendingUpIcon, Loader2 } from 'lucide-react';
 import { cn } from "@/lib/utils";
 import { useAuth } from '@/context/AuthContext';
 import { auth } from '@/lib/firebase'; // Import auth directly for signInWithEmailAndPassword

 const formSchema = z.object({
   email: z.string().email({ message: 'Invalid email address.' }),
   password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
 });

 type FormValues = z.infer<typeof formSchema>;

 export default function LoginPage() {
   const { toast } = useToast();
   const router = useRouter();
   const { signIn, loading: authLoading, error: authError, setError: setAuthError, user } = useAuth();
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   const form = useForm<FormValues>({
     resolver: zodResolver(formSchema),
     defaultValues: {
       email: '',
       password: '',
     },
   });

   React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
   }, [user, router]);

   React.useEffect(() => {
    if (authError) {
      let friendlyMessage = "Login failed. Please check your credentials.";
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        friendlyMessage = "Invalid email or password.";
      } else if (authError.code === 'auth/invalid-email') {
        friendlyMessage = "The email address is not valid.";
      } else if (authError.code === 'auth/too-many-requests') {
        friendlyMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
      }
      toast({
        title: 'Login Error',
        description: friendlyMessage,
        variant: 'destructive',
      });
      setAuthError(null); // Clear the error after displaying
    }
   }, [authError, toast, setAuthError]);

   const onSubmit = async (data: FormValues) => {
     setIsSubmitting(true);
     setAuthError(null);
     try {
       await signIn(auth, data.email, data.password);
       // onAuthStateChanged in AuthContext will handle redirect
       toast({
         title: 'Login Successful!',
         description: 'Redirecting to your dashboard...',
       });
       // router.push('/dashboard'); // Moved to useEffect based on user state
     } catch (e: any) {
       // Error is now handled by the useEffect hook monitoring authError
       console.error('Login submit error:', e);
     } finally {
       setIsSubmitting(false);
     }
   };

   if (authLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
   }


   return (
     <div className="flex items-center justify-center min-h-screen bg-background p-4">
       <Card className="w-full max-w-md shadow-lg bg-card border-border text-card-foreground">
         <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4">
             <TrendingUpIcon className="w-12 h-12 text-primary" />
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
                         disabled={isSubmitting}
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
                        className="bg-input text-foreground border-input"
                        disabled={isSubmitting}
                       />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSubmitting || authLoading}>
                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
