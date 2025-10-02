import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
    setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/dashboard");
      },
    });
  };

  const onRegister = (data: RegisterForm) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        setLocation("/dashboard");
      },
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-2xl font-bold text-blue-400">TradeCoach Pro</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-slate-400">Access your trading analytics dashboard</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Sign In to Your Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        {...loginForm.register("email")}
                        className="bg-slate-800 border-slate-600"
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-400 mt-1">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        {...loginForm.register("password")}
                        className="bg-slate-800 border-slate-600"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-400 mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="glass border-white/10">
                <CardHeader>
                  <CardTitle>Create Your Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="register-firstName">First Name</Label>
                        <Input
                          id="register-firstName"
                          placeholder="John"
                          {...registerForm.register("firstName")}
                          className="bg-slate-800 border-slate-600"
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-400 mt-1">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="register-lastName">Last Name</Label>
                        <Input
                          id="register-lastName"
                          placeholder="Doe"
                          {...registerForm.register("lastName")}
                          className="bg-slate-800 border-slate-600"
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-400 mt-1">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        placeholder="johndoe"
                        {...registerForm.register("username")}
                        className="bg-slate-800 border-slate-600"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-400 mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        {...registerForm.register("email")}
                        className="bg-slate-800 border-slate-600"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-400 mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        {...registerForm.register("password")}
                        className="bg-slate-800 border-slate-600"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-400 mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-500"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="flex-1 relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-emerald-600">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-20" />
        </div>
        
        <div className="relative z-10 h-full flex flex-col justify-center px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">
            Transform Your Trading Journey
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Professional analytics, AI-powered insights, and expert coaching to help you become a consistently profitable trader.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Advanced trading analytics and performance tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>AI-powered coaching and personalized feedback</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>CSV import and broker integration</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
              <span>Risk management and position sizing tools</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
