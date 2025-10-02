import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  Settings, 
  LogOut, 
  BarChart3, 
  BookOpen, 
  CreditCard,
  Shield,
  Moon,
  Sun,
  Trophy,
  Award,
  Users
} from "lucide-react";
import { useTheme } from "./theme-provider";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user || location === "/auth") {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/journal", label: "Trade Journal", icon: BookOpen },
    { href: "/analysis", label: "Analysis", icon: BarChart3 },
    { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
    { href: "/gamification", label: "Badges", icon: Award },
    { href: "/mentorship", label: "Mentorship", icon: Users },
    { href: "/subscription", label: "Subscription", icon: CreditCard },
  ];

  if (user.role === "admin" || user.role === "coach") {
    navItems.push({ href: "/admin", label: "Admin Panel", icon: Shield });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-blue-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            TradeFlow
          </span>
        </div>

        <nav className="flex items-center space-x-6 ml-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`flex items-center space-x-2 px-3 py-2 text-sm ${
                    isActive 
                      ? "text-blue-400 bg-blue-400/10" 
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.firstName?.charAt(0) || user.username?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">
                    {user.firstName || user.username}
                  </span>
                  <Badge 
                    className="text-xs bg-blue-500/20 text-blue-400 capitalize px-1 py-0"
                  >
                    {user.subscriptionPlan}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center space-x-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={() => logoutMutation.mutate()}
                className="flex items-center space-x-2 cursor-pointer text-red-400 focus:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}