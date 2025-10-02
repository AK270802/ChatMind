import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Shield, Users, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SubscriptionInfo {
  plan: string;
  status: string;
  nextBilling: string | null;
  features: {
    basic: string[];
    pro: string[];
    enterprise: string[];
  };
}

interface PricingPlan {
  id: string;
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonAction: string;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isYearly, setIsYearly] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const { data: subscription, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

  const upgradeMutation = useMutation({
    mutationFn: async (plan: string) => {
      const res = await apiRequest("POST", "/api/subscription/upgrade", { plan });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ 
        title: "Subscription updated!", 
        description: data.message 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Upgrade failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const plans: PricingPlan[] = [
    {
      id: "basic",
      name: "Basic",
      price: { monthly: 29, yearly: 24 },
      description: "Perfect for getting started",
      features: [
        "Up to 100 trades/month",
        "Basic analytics",
        "CSV import",
        "Email support",
        "Web access"
      ],
      buttonText: user?.subscriptionPlan === "basic" ? "Current Plan" : "Start Free Trial",
      buttonAction: "basic"
    },
    {
      id: "pro",
      name: "Pro",
      price: { monthly: 79, yearly: 63 },
      description: "For serious traders",
      features: [
        "Unlimited trades",
        "Advanced analytics & AI insights",
        "Auto broker sync",
        "Weekly coaching calls",
        "Priority support",
        "Mobile app access",
        "Custom indicators",
        "Risk management tools"
      ],
      popular: true,
      buttonText: user?.subscriptionPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      buttonAction: "pro"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: { monthly: 199, yearly: 159 },
      description: "For trading firms",
      features: [
        "Multi-user access",
        "Custom integrations",
        "Dedicated account manager",
        "White-label options",
        "24/7 phone support",
        "Advanced reporting",
        "API access",
        "Custom training"
      ],
      buttonText: "Contact Sales",
      buttonAction: "contact"
    }
  ];

  const faqs = [
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period, and you won't be charged for the next cycle."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, all plans come with a 14-day free trial. No credit card required to start. You can explore all features and decide which plan works best for you."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise plans."
    },
    {
      question: "Can I change plans later?",
      answer: "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee. If you're not satisfied with our service, contact us within 30 days for a full refund."
    },
    {
      question: "Is my trading data secure?",
      answer: "Yes, we use enterprise-grade security with 256-bit SSL encryption. Your data is stored securely and never shared with third parties."
    }
  ];

  const handlePlanAction = (planId: string, action: string) => {
    if (action === "contact") {
      // Open contact modal or redirect to contact page
      toast({ title: "Contact our sales team at sales@tradecoach.pro" });
      return;
    }
    
    if (user?.subscriptionPlan === planId) {
      return; // Already on this plan
    }
    
    upgradeMutation.mutate(planId);
  };

  const getPlanPrice = (plan: PricingPlan) => {
    return isYearly ? plan.price.yearly : plan.price.monthly;
  };

  const getSavingsText = (plan: PricingPlan) => {
    const monthlyCost = plan.price.monthly * 12;
    const yearlyCost = plan.price.yearly * 12;
    const savings = monthlyCost - yearlyCost;
    return `Save $${savings}/year`;
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-slate-400">Unlock advanced features and personalized coaching</p>
        </div>

        {/* Current Subscription Status */}
        {user && subscription && (
          <Card className="glass border-white/10 mb-12 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Subscription</span>
                <Badge 
                  variant="outline"
                  className={
                    subscription.status === 'active' 
                      ? 'border-emerald-500/30 text-emerald-400'
                      : 'border-yellow-500/30 text-yellow-400'
                  }
                >
                  {subscription.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold capitalize">{subscription.plan}</p>
                  <p className="text-slate-400">
                    {subscription.nextBilling 
                      ? `Next billing: ${new Date(subscription.nextBilling).toLocaleDateString()}`
                      : 'No upcoming billing'
                    }
                  </p>
                </div>
                <Button variant="outline" className="border-slate-600">
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="glass border-white/10 rounded-lg p-1 flex">
            <Button
              variant={!isYearly ? "default" : "ghost"}
              onClick={() => setIsYearly(false)}
              className={!isYearly ? "bg-blue-600" : ""}
            >
              Monthly
            </Button>
            <Button
              variant={isYearly ? "default" : "ghost"}
              onClick={() => setIsYearly(true)}
              className={isYearly ? "bg-blue-600" : ""}
            >
              Yearly
              <span className="text-emerald-400 text-sm ml-1">(-20%)</span>
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`glass border-white/10 relative ${
                plan.popular ? 'border-2 border-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <p className="text-slate-400 mb-6">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${getPlanPrice(plan)}</span>
                  <span className="text-slate-400">/{isYearly ? 'year' : 'month'}</span>
                  {isYearly && (
                    <div className="text-sm text-emerald-400 mt-1">
                      {getSavingsText(plan)}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full py-3 ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-500' 
                      : user?.subscriptionPlan === plan.id
                      ? 'bg-slate-700 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                  onClick={() => handlePlanAction(plan.id, plan.buttonAction)}
                  disabled={
                    upgradeMutation.isPending || 
                    user?.subscriptionPlan === plan.id
                  }
                >
                  {upgradeMutation.isPending ? (
                    "Processing..."
                  ) : (
                    <>
                      {plan.id === 'pro' && <Zap className="h-4 w-4 mr-2" />}
                      {plan.id === 'enterprise' && <Shield className="h-4 w-4 mr-2" />}
                      {plan.buttonText}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <Card className="glass border-white/10 mb-16">
          <CardHeader>
            <CardTitle className="text-center">Feature Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="py-3 px-4 text-slate-400">Feature</th>
                    <th className="py-3 px-4 text-center text-slate-400">Basic</th>
                    <th className="py-3 px-4 text-center text-slate-400">Pro</th>
                    <th className="py-3 px-4 text-center text-slate-400">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-semibold">Monthly Trades</td>
                    <td className="py-3 px-4 text-center">100</td>
                    <td className="py-3 px-4 text-center">Unlimited</td>
                    <td className="py-3 px-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-semibold">AI Analysis</td>
                    <td className="py-3 px-4 text-center">-</td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-semibold">Coaching Calls</td>
                    <td className="py-3 px-4 text-center">-</td>
                    <td className="py-3 px-4 text-center">Weekly</td>
                    <td className="py-3 px-4 text-center">Daily</td>
                  </tr>
                  <tr className="border-b border-slate-800">
                    <td className="py-3 px-4 font-semibold">Multi-user Access</td>
                    <td className="py-3 px-4 text-center">-</td>
                    <td className="py-3 px-4 text-center">-</td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-5 w-5 text-emerald-400 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Support</td>
                    <td className="py-3 px-4 text-center">Email</td>
                    <td className="py-3 px-4 text-center">Priority</td>
                    <td className="py-3 px-4 text-center">24/7 Phone</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass border-white/10">
                <Collapsible 
                  open={expandedFAQ === index}
                  onOpenChange={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold">{faq.question}</CardTitle>
                        {expandedFAQ === index ? (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <p className="text-slate-300">{faq.answer}</p>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
