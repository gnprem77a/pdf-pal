import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Crown, Loader2, CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "pro-monthly",
    name: "Pro Monthly",
    price: 9,
    period: "month",
    features: ["Unlimited files", "100 MB per file", "No watermarks", "Batch processing"],
  },
  {
    id: "pro-yearly",
    name: "Pro Yearly",
    price: 90,
    period: "year",
    savings: "Save $18",
    features: ["Unlimited files", "100 MB per file", "No watermarks", "Batch processing"],
  },
];

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get("plan") || "pro-monthly";
  const [selectedPlan, setSelectedPlan] = useState(planFromUrl);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const plan = plans.find((p) => p.id === selectedPlan) || plans[0];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to subscribe.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!cardNumber || !expiryDate || !cvc || !cardName) {
      toast({
        title: "Missing information",
        description: "Please fill in all card details.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // TODO: Replace with actual Stripe payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Subscription activated!",
      description: `You are now on the ${plan.name} plan.`,
    });
    
    setIsProcessing(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Complete your purchase</h1>
            <p className="text-muted-foreground mt-2">Secure payment powered by Stripe</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Plan Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select a plan</CardTitle>
                  <CardDescription>Choose the plan that works for you</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                    <div className="space-y-3">
                      {plans.map((p) => (
                        <div key={p.id}>
                          <RadioGroupItem
                            value={p.id}
                            id={p.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={p.id}
                            className="flex items-center justify-between rounded-lg border p-4 cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 transition-colors"
                          >
                            <div>
                              <div className="font-medium">{p.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {p.features.slice(0, 2).join(" • ")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">${p.price}</div>
                              <div className="text-xs text-muted-foreground">/{p.period}</div>
                              {p.savings && (
                                <div className="text-xs text-green-600 font-medium">{p.savings}</div>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    {plan.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  <span className="flex items-center gap-1 text-green-600">
                    <Lock className="h-3 w-3" />
                    Secure SSL encryption
                  </span>
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on card</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      disabled={isProcessing}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                        maxLength={5}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <div className="flex justify-between text-sm">
                      <span>{plan.name}</span>
                      <span>${plan.price}/{plan.period}</span>
                    </div>
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                      <span>Total</span>
                      <span>${plan.price}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                  <Button type="submit" className="w-full" size="lg" disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Pay ${plan.price}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    By subscribing, you agree to our Terms of Service and Privacy Policy.
                    Cancel anytime.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Checkout;
