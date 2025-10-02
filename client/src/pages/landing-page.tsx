import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bot, Upload, TrendingUp, Users, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        {/* Professional trading floor background with overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent">
                Master Your Trading Journey
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              Professional trade journaling, AI-powered analysis, and expert coaching to elevate your trading performance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-lg font-semibold transform hover:scale-105 transition-all">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth">
                    <Button size="lg" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-lg font-semibold transform hover:scale-105 transition-all">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="px-8 py-4 glass border-white/20 hover:bg-slate-700/50 text-lg font-semibold transition-all"
                  >
                    View Demo
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-800/50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Powerful Trading Tools</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass border-white/10 hover:bg-slate-700/20 transition-all group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/30 transition-colors">
                  <BarChart className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Advanced Analytics</h3>
                <p className="text-slate-300">
                  Deep insights into your trading patterns, performance metrics, and risk analysis with comprehensive charts and reports
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass border-white/10 hover:bg-slate-700/20 transition-all group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/30 transition-colors">
                  <Bot className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI-Powered Coaching</h3>
                <p className="text-slate-300">
                  Get personalized feedback and improvement suggestions from our AI coach analyzing your trading behavior
                </p>
              </CardContent>
            </Card>
            
            <Card className="glass border-white/10 hover:bg-slate-700/20 transition-all group">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/30 transition-colors">
                  <Upload className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Easy Import</h3>
                <p className="text-slate-300">
                  Upload trades from CSV/Excel files or connect with your broker for automatic trade synchronization
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Everything You Need to Succeed</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Performance Tracking</h3>
                <p className="text-slate-400">Monitor your progress with detailed P&L charts, win rates, and risk metrics</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Expert Coaching</h3>
                <p className="text-slate-400">Connect with professional traders for personalized guidance and feedback</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Risk Management</h3>
                <p className="text-slate-400">Advanced tools to help you manage risk and protect your capital</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have improved their performance with TradeCoach Pro
          </p>
          {!user && (
            <Link href="/auth">
              <Button size="lg" variant="secondary" className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 text-lg font-semibold">
                Get Started Free
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
