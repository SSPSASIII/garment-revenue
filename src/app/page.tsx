import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartIcon, DollarSignIcon, TrendingUpIcon } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-6 py-8 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          <span className="inline-block mr-2">
            <TrendingUpIcon className="w-6 h-6 inline-block align-middle" />
          </span>
          LankaForecaster
        </Link>
        <nav>
          <Link href="/signup" passHref>
            <Button variant="outline">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-secondary py-24 text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-5xl font-bold mb-6 text-primary leading-tight">
              Unlock the Future of Garment Revenue with AI-Powered Insights
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
              LankaForecaster provides cutting-edge revenue predictions for Sri Lanka's garment industry.
              Leverage historical data, market trends, and economic indicators to make strategic decisions and drive sustainable growth.
              <br />
              Our AI models are trained on vast datasets and refined by expert insights.
              
            </p>
            <Link href="/signup" passHref>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Forecasting Today
              </Button>
            </Link>
            <div className="mt-16 relative aspect-video max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl">
              <Image
                src="https://picsum.photos/1280/720"
                alt="Sri Lanka garment factory"
                layout="fill"
                objectFit="cover"
                data-ai-hint="garment factory textile industry production"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h3 className="text-4xl font-bold text-center mb-16 text-primary">
              Key Features
            </h3>
            <div className="grid md:grid-cols-3 gap-12">
              <Card className="text-center shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 text-primary rounded-full p-4 w-fit mb-5">
                    <BarChartIcon className="h-9 w-9" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Interactive Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Visualize your revenue predictions and key performance indicators (KPIs) with interactive and intuitive charts and graphs.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 text-primary rounded-full p-4 w-fit mb-5">
                    <TrendingUpIcon className="h-9 w-9" />
                  </div>
                  <CardTitle className="text-xl font-semibold">AI-Powered Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Leverage our advanced AI algorithms to generate accurate revenue forecasts based on comprehensive data analysis.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 text-primary rounded-full p-4 w-fit mb-5">
                    <DollarSignIcon className="h-9 w-9" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Custom Data Input</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Seamlessly integrate your company's data through our user-friendly interface, ensuring precise and tailored predictions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-primary text-primary-foreground py-24 text-center">
          <div className="container mx-auto px-6">
            <h3 className="text-4xl font-bold mb-6">
              Elevate Your Business Strategy with LankaForecaster
            </h3>
            <p className="text-lg mb-10">
              Ready to transform your revenue forecasting process?
            </p>
            <Link href="/signup" passHref>
              <Button size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Start Your Free Trial
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-secondary py-8 text-center text-muted-foreground border-t">
        <div className="container mx-auto px-6">
          <p>&copy; {new Date().getFullYear()} LankaForecaster. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
