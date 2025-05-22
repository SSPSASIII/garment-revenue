import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUpIcon, BarChartIcon, DollarSignIcon, Zap, BrainCircuit, ShieldCheck } from 'lucide-react'; // Added Zap, BrainCircuit, ShieldCheck

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <TrendingUpIcon className="w-7 h-7" />
            <span>LankaForecaster</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="#features" passHref>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">Features</Button>
            </Link>
            <Link href="#how-it-works" passHref>
               <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">How It Works</Button>
            </Link>
            <Link href="/login" passHref>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">Login</Button>
            </Link>
            <Link href="/signup" passHref>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 bg-card border-b border-border">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ff0000' fill-opacity='0.4'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
          <div className="container mx-auto px-6 text-center relative">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-primary leading-tight">
              Navigate Sri Lanka's Garment Industry with AI Precision
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              LankaForecaster leverages cutting-edge AI, real-time economic data, and market intelligence to deliver unparalleled revenue predictions.
              Empower your strategic decisions and drive sustainable growth in a dynamic market.
            </p>
            <div className="flex justify-center items-center gap-4">
              <Link href="/signup" passHref>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/50 transition-shadow">
                  Start Your Free Trial
                </Button>
              </Link>
              <Link href="#features" passHref>
                <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 shadow-lg hover:shadow-primary/30 transition-shadow">
                  Learn More
                </Button>
              </Link>
            </div>
            <div className="mt-16 relative aspect-[16/7] max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border-2 border-primary/30">
              <Image
                src="https://placehold.co/1280x560.png"
                alt="LankaForecaster Dashboard Mockup"
                layout="fill"
                objectFit="cover"
                data-ai-hint="dashboard analytics chart"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
               <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-black/70 text-white p-2 md:p-3 rounded-lg text-xs md:text-sm shadow-md">
                LankaForecaster: Advanced Revenue Prediction Interface
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">
              Why Choose LankaForecaster?
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                Gain a competitive edge with features designed for accuracy, insight, and strategic advantage in the Sri Lankan garment sector.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: BrainCircuit, title: "AI-Powered Predictions", description: "Leverage advanced machine learning models trained on vast datasets for highly accurate revenue forecasts specific to the Sri Lankan context." },
                { icon: Zap, title: "Real-Time Data Integration", description: "Stay ahead with predictions fueled by live economic indicators, market signals, and trade data relevant to the garment industry." },
                { icon: BarChartIcon, title: "Interactive Dashboard", description: "Visualize trends, analyze predictions, and understand key influencing factors through an intuitive and customizable dashboard." },
                { icon: DollarSignIcon, title: "Customizable Inputs", description: "Tailor forecasts by inputting your company-specific data like production capacity, marketing spend, and lifecycle stage." },
                { icon: ShieldCheck, title: "Risk Analysis & Confidence", description: "Understand potential risks and the confidence level of each prediction, enabling more informed decision-making." },
                { icon: TrendingUpIcon, title: "Strategic Insights", description: "Go beyond numbers. Get actionable insights and trend analysis to optimize your business strategy and mitigate challenges." },
              ].map((feature, index) => (
                <Card key={index} className="bg-card text-card-foreground shadow-xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1 border border-border hover:border-primary/50">
                  <CardHeader className="items-center text-center">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                      <feature.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-primary">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm text-center">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-card border-y border-border">
           <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">
                How LankaForecaster Works
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                Our platform simplifies complex forecasting into three straightforward steps, giving you powerful insights with ease.
            </p>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting lines (decorative) */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-10"></div>
              <div className="hidden md:block absolute top-1/2 left-1/3 h-8 w-0.5 bg-border -translate-y-1/2 -z-10"></div>
              <div className="hidden md:block absolute top-1/2 right-1/3 h-8 w-0.5 bg-border -translate-y-1/2 -z-10"></div>

              {[
                { step: "01", title: "Input Your Data", description: "Securely provide your historical revenue, production capacity, and other company-specific metrics." },
                { step: "02", title: "AI Analyzes & Predicts", description: "Our AI processes your data along with real-time economic and market signals to generate a precise forecast." },
                { step: "03", title: "Receive Actionable Insights", description: "Explore your prediction on the dashboard, understand trends, identify risks, and make data-driven decisions." },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-lg border border-border">
                    <div className="mb-4 text-4xl font-bold text-primary">{item.step}</div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Call to Action Section */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Revenue Strategy?
            </h2>
            <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Join leading garment businesses in Sri Lanka leveraging AI for smarter forecasting and sustainable growth.
              Start your free trial today and experience the power of predictive analytics.
            </p>
            <Link href="/signup" passHref>
              <Button size="lg" variant="secondary" className="bg-background text-primary hover:bg-background/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Sign Up & Forecast Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card py-12 border-t border-border">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-2 mb-4 text-xl font-bold text-primary">
            <TrendingUpIcon className="w-6 h-6" />
            <span>LankaForecaster</span>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            AI-Powered Revenue Insights for the Sri Lankan Garment Industry.
          </p>
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} LankaForecaster. All rights reserved. Built with Next.js & Firebase.
          </p>
        </div>
      </footer>
    </div>
  );
}
