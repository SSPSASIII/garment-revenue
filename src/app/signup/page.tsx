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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FactoryIcon, UserIcon, PhoneIcon, UserCircleIcon, TrendingUpIcon } from 'lucide-react'; // Added TrendingUpIcon
import { useRouter } from 'next/navigation'; // Import useRouter

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
  companyName: z.string().min(1, { message: 'Company name is required.' }),
  companyAddress: z.string().optional(),
  role: z.enum(['manager', 'analyst', 'executive', 'other'], {
    required_error: 'Please select a role.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type FormValues = z.infer<typeof formSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      companyAddress: '',
      role: undefined, // Ensure role is initially undefined to show placeholder
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log('Signup data:', data);
    // TODO: Implement actual signup logic (e.g., API call, authentication)
    toast({
      title: 'Signup Successful!',
      description: 'Welcome to LankaForecaster. Redirecting to login...',
      variant: 'default',
    });
    // Redirect to login page after successful signup
     setTimeout(() => {
       router.push('/login');
     }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4"> {/* Use background color */}
      <Card className="w-full max-w-2xl shadow-lg bg-card border-border text-foreground"> {/* Use card, border, and foreground */}
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
             <TrendingUpIcon className="w-12 h-12 text-primary" /> {/* LankaForecaster Logo */}
           </div>
          <CardTitle className="text-3xl font-bold text-primary">Create Your Account</CardTitle> {/* Use primary text */}
          <CardDescription className="text-muted-foreground">Join LankaForecaster to predict your garment industry revenue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* User Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary"><UserIcon className="w-5 h-5" /> User Details</h3>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="you@company.com" {...field} className="bg-input text-foreground border-input" />
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
                          <Input type="password" placeholder="Minimum 8 characters" {...field} className="bg-input text-foreground border-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Re-enter password" {...field} className="bg-input text-foreground border-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Your Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-input text-foreground border-input">
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover text-popover-foreground border-border">
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="analyst">Analyst</SelectItem>
                              <SelectItem value="executive">Executive</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Company Details */}
                <div className="space-y-4">
                   <h3 className="text-lg font-semibold flex items-center gap-2 text-primary"><FactoryIcon className="w-5 h-5" /> Company Details</h3>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Garment Company Ltd." {...field} className="bg-input text-foreground border-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Company Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Textile Avenue, Colombo" {...field} className="bg-input text-foreground border-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-8"> {/* Added margin-top */}
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center text-sm space-y-3 pt-6 border-t border-border"> {/* Added padding-top and border */}
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
            </Link>
          </p>
          <div className="text-xs text-muted-foreground flex items-center gap-4 mt-2">
             <span className="flex items-center gap-1">
                <UserCircleIcon className="w-3 h-3"/> S.S. Paranamana
             </span>
             <span className="flex items-center gap-1">
                <PhoneIcon className="w-3 h-3"/> +94775217044
             </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
