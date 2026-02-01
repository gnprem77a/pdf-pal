import { Link } from "react-router-dom";
import { Check, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Free",
    description: "Perfect for occasional use",
    price: "$0",
    period: "forever",
    icon: Zap,
    features: [
      "All 20 PDF tools",
      "Up to 10 MB per file",
      "5 files per day",
      "Basic compression",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    description: "For power users and professionals",
    price: "$9",
    period: "per month",
    icon: Crown,
    features: [
      "All 20 PDF tools",
      "Up to 100 MB per file",
      "Unlimited files",
      "Maximum compression",
      "Batch processing",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <div className="container">
            <Badge variant="secondary" className="mb-4">
              Simple Pricing
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
              Choose your plan
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Start for free and upgrade when you need more. All plans include access to our complete PDF toolkit.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
              {plans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`relative flex flex-col ${
                    plan.popular 
                      ? "border-primary shadow-lg scale-105" 
                      : "border-border"
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <plan.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="mb-6 text-center">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">/{plan.period}</span>
                    </div>
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    {plan.name === "Free" ? (
                      <Link to="/signup" className="w-full">
                        <Button className="w-full" variant="outline">
                          {plan.cta}
                        </Button>
                      </Link>
                    ) : (
                      <Link to={`/checkout?plan=${plan.name.toLowerCase()}-monthly`} className="w-full">
                        <Button 
                          className="w-full" 
                          variant={plan.popular ? "default" : "outline"}
                        >
                          {plan.cta}
                        </Button>
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
              Frequently Asked Questions
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">Can I cancel anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">Is my data secure?</h3>
                <p className="text-sm text-muted-foreground">
                  Absolutely. All file processing happens in your browser. We never upload or store your files on our servers.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">What payment methods do you accept?</h3>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards, PayPal, and bank transfers for annual business plans.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 font-semibold text-foreground">Do you offer refunds?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
