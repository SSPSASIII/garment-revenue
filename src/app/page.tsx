import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">LankaForecaster</h1>
        <nav>
          <Link href="/signup" passHref>
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-secondary py-20 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-4 text-primary">
              Predict Your Garment Industry Revenue with Confidence
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              LankaForecaster leverages AI to analyze historical data and market signals, providing accurate revenue predictions for Sri Lanka's garment sector. Make informed decisions and drive growth.
            </p>
            <Link href="/signup" passHref>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Sign Up for Free Trial
              </Button>
            </Link>
            <div className="mt-12 relative aspect-video max-w-4xl mx-auto rounded-lg overflow-hidden shadow-xl">
               <Image
                src="https://picsum.photos/1200/675"
                alt="Sri Lanka garment factory"
                layout="fill"
                objectFit="cover"
                data-ai-hint="garment factory textile industry"
              />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">
              Features Designed for Growth
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
                    <BarChartIcon className="h-8 w-8" />
                  </div>
                  <CardTitle>Interactive Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Visualize revenue predictions and KPIs with interactive charts and graphs for easy understanding.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                   <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
                     <TrendingUpIcon className="h-8 w-8" />
                   </div>
                  <CardTitle>AI Revenue Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Get accurate future revenue forecasts based on historical data, market trends, and economic indicators.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                   <div className="mx-auto bg-primary/10 text-primary rounded-full p-3 w-fit mb-4">
                     <DollarSignIcon className="h-8 w-8" />
                   </div>
                  <CardTitle>Manual Data Input</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Easily input your company's revenue, production, and other relevant data through a user-friendly interface.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-primary text-primary-foreground py-16 text-center">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Forecast Your Success?
            </h3>
            <p className="text-lg mb-8">
              Join LankaForecaster today and gain the insights you need to navigate the dynamic garment industry.
            </p>
            <Link href="/signup" passHref>
              <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Start Your Free Trial Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-secondary py-6 text-center text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>&copy; {new Date().getFullYear()} LankaForecaster. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
