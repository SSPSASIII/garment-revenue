
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUpIcon, BarChartIcon, DollarSignIcon, Zap, BrainCircuit, ShieldCheck, Users, Settings, BookOpen, Info } from 'lucide-react'; // Added Users, Settings, BookOpen, Info

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
          <nav className="flex items-center gap-1 md:gap-2">
            <Link href="#solutions" passHref>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 md:px-3">Solutions</Button>
            </Link>
            <Link href="#success-stories" passHref>
               <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 md:px-3">Success Stories</Button>
            </Link>
            <Link href="#resources" passHref>
               <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 md:px-3">Resources</Button>
            </Link>
            <Link href="#about-us" passHref>
               <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 md:px-3">About Us</Button>
            </Link>
            <Link href="/login" passHref>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 md:px-3">Login</Button>
            </Link>
            <Link href="/signup" passHref> {/* Assuming signup page still desired, or change to a demo link */}
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 ml-2">Book a Demo</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 bg-card border-b border-border">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.2'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
          <div className="container mx-auto px-6 text-center relative">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-primary leading-tight">
              AI-Powered Revenue Forecasting
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              Empower your Sri Lankan garment business with precise predictions.
              Navigate market dynamics, optimize strategies, and drive sustainable growth with LankaForecaster.
            </p>
            <div className="flex justify-center items-center gap-4">
              <Link href="/signup" passHref> {/* Assuming signup or direct to a demo request form */}
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/50 transition-shadow">
                  Book a Demo
                </Button>
              </Link>
            </div>
            <div className="mt-16 relative aspect-[16/7] max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border-2 border-primary/30">
              <Image
                src="https://altline.sobanco.com/wp-content/uploads/2023/04/revenue.jpg"
                alt="Garment Industry Revenue and Growth Chart"
                data-ai-hint="garment factory"
                fill={true}
                style={{ objectFit: 'cover' }}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
               <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-black/70 text-white p-2 md:p-3 rounded-lg text-xs md:text-sm shadow-md">
                LankaForecaster: Precision Forecasting Interface
              </div>
            </div>
          </div>
        </section>

        {/* Features Section (renamed to Solutions) */}
        <section id="solutions" className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">
              Our Solutions
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                Gain a competitive edge with features designed for accuracy, insight, and strategic advantage in the Sri Lankan garment sector.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { icon: BrainCircuit, title: "AI-Powered Predictions", description: "Leverage advanced machine learning models trained on vast datasets for highly accurate revenue forecasts specific to the Sri Lankan context." },
                { icon: Zap, title: "Real-Time Data Integration", description: "Stay ahead with predictions fueled by live economic indicators, market signals, and trade data relevant to the garment industry." },
                { icon: BarChartIcon, title: "Interactive Dashboard", description: "Visualize trends, analyze predictions, and understand key influencing factors through an intuitive and customizable dashboard." },
                { icon: Settings, title: "Customizable Inputs", description: "Tailor forecasts by inputting your company-specific data like production capacity, marketing spend, and lifecycle stage." },
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
        
        {/* Placeholder for Success Stories */}
        <section id="success-stories" className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Success Stories</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">Discover how LankaForecaster is empowering businesses like yours.</p>
            {/* Add placeholder cards or content here */}
            <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-background text-foreground p-6 rounded-lg shadow-lg"><CardTitle className="text-primary mb-2">Major Exporter Boosts Accuracy</CardTitle><CardDescription>Learn how Company X improved forecast accuracy by 20%.</CardDescription></Card>
                <Card className="bg-background text-foreground p-6 rounded-lg shadow-lg"><CardTitle className="text-primary mb-2">SME Optimizes Inventory</CardTitle><CardDescription>Company Y reduced excess inventory by 15% with better demand foresight.</CardDescription></Card>
                <Card className="bg-background text-foreground p-6 rounded-lg shadow-lg"><CardTitle className="text-primary mb-2">New Entrant Gains Edge</CardTitle><CardDescription>Startup Z used LankaForecaster to secure funding and plan market entry.</CardDescription></Card>
            </div>
          </div>
        </section>

        {/* Resources Section (formerly How It Works) */}
        <section id="resources" className="py-20 bg-background">
           <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">
                Resources
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
                Explore how our platform works, read industry insights, and access helpful guides.
            </p>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                { icon: BookOpen, title: "How It Works", description: "A step-by-step guide to our AI forecasting methodology and platform features." },
                { icon: BarChartIcon, title: "Market Reports", description: "Access periodic reports on Sri Lankan garment industry trends and market outlooks." },
                { icon: Info, title: "FAQ & Support", description: "Find answers to common questions and learn how to get the most out of LankaForecaster." },
              ].map((item) => (
                <Card key={item.title} className="flex flex-col items-center text-center p-6 bg-card text-card-foreground rounded-lg shadow-lg border border-border hover:shadow-primary/20 transition-shadow">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                        <item.icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-xl font-semibold mb-2 text-primary">{item.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{item.description}</CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section (Placeholder) */}
        <section id="about-us" className="py-20 bg-card border-y border-border">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">About LankaForecaster</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We are dedicated to revolutionizing the Sri Lankan garment industry through advanced AI-driven predictive analytics. Our mission is to provide businesses with the foresight needed to thrive in a dynamic global market. LankaForecaster combines deep industry expertise with cutting-edge technology to deliver actionable insights for strategic decision-making.
            </p>
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
                Book Your Demo Now
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
