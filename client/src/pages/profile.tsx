import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  tradingExperience: z.string().optional(),
  defaultPositionSize: z.number().min(0.1).max(100).optional(),
  riskTolerance: z.string().optional(),
  emailNotifications: z.boolean().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserStats {
  totalTrades: number;
  totalPnL: number;
  winRate: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/stats"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await apiRequest("PATCH", "/api/profile/password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated successfully" });
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    }
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
      tradingExperience: user?.tradingExperience || "",
      defaultPositionSize: Number(user?.defaultPositionSize) || 5,
      riskTolerance: user?.riskTolerance || "moderate",
      emailNotifications: user?.emailNotifications ?? true
    }
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register("firstName")}
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      {profileForm.formState.errors.firstName && (
                        <p className="text-sm text-red-400 mt-1">
                          {profileForm.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register("lastName")}
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      {profileForm.formState.errors.lastName && (
                        <p className="text-sm text-red-400 mt-1">
                          {profileForm.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        {...profileForm.register("username")}
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      {profileForm.formState.errors.username && (
                        <p className="text-sm text-red-400 mt-1">
                          {profileForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...profileForm.register("email")}
                        className="bg-slate-800 border-slate-600 mt-2"
                      />
                      {profileForm.formState.errors.email && (
                        <p className="text-sm text-red-400 mt-1">
                          {profileForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="tradingExperience">Trading Experience</Label>
                    <Select 
                      onValueChange={(value) => profileForm.setValue("tradingExperience", value)}
                      defaultValue={user.tradingExperience || ""}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 mt-2">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (&lt; 1 year)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                        <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-500"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Trading Preferences */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Trading Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="defaultPositionSize">Default Position Size (%)</Label>
                  <Input
                    id="defaultPositionSize"
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.1"
                    {...profileForm.register("defaultPositionSize", { valueAsNumber: true })}
                    className="bg-slate-800 border-slate-600 mt-2"
                  />
                  <p className="text-sm text-slate-400 mt-1">Percentage of portfolio per trade</p>
                </div>
                
                <div>
                  <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                  <Select 
                    onValueChange={(value) => profileForm.setValue("riskTolerance", value)}
                    defaultValue={user.riskTolerance || "moderate"}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600 mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-slate-400">Receive updates about your trades and analysis</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={profileForm.watch("emailNotifications")}
                    onCheckedChange={(checked) => profileForm.setValue("emailNotifications", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                      className="bg-slate-800 border-slate-600 mt-2"
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-400 mt-1">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword")}
                      className="bg-slate-800 border-slate-600 mt-2"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-400 mt-1">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                      className="bg-slate-800 border-slate-600 mt-2"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-400 mt-1">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-500"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Account Overview Sidebar */}
          <div className="space-y-8">
            {/* Account Overview */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan</span>
                  <Badge className="bg-blue-500/20 text-blue-400 capitalize">
                    {user.subscriptionPlan}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 capitalize">
                    {user.subscriptionStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Next Billing</span>
                  <span className="text-sm">
                    {user.subscriptionEndsAt 
                      ? new Date(user.subscriptionEndsAt).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member Since</span>
                  <span className="text-sm">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-6 border-slate-600 hover:bg-slate-700/50"
                >
                  Manage Billing
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats && Number(stats.totalPnL) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stats ? `${Number(stats.totalPnL) >= 0 ? '+' : ''}$${Number(stats.totalPnL).toLocaleString()}` : '$0'}
                  </div>
                  <div className="text-slate-400 text-sm">Total P&L</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.winRate || '0.0'}%</div>
                  <div className="text-slate-400 text-sm">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats?.totalTrades || 0}</div>
                  <div className="text-slate-400 text-sm">Total Trades</div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="glass border-white/10">
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 hover:bg-slate-700/50"
                >
                  Export Data
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 hover:bg-slate-700/50"
                >
                  Download Reports
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
