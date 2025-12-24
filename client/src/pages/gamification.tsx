import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import BadgeDisplay, { Badge as ComponentBadge } from "@/components/social/badge-display";
import { 
  Trophy, 
  Award, 
  Star, 
  Target, 
  TrendingUp, 
  Shield, 
  Zap, 
  Crown,
  Medal,
  Gem,
  Flame,
  CheckCircle,
  Clock,
  Lock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserBadge {
  id: string;
  badgeId: string;
  progress: Record<string, any>;
  earnedAt?: string;
  isNotified: boolean;
  isDisplayed: boolean;
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    requirements: Record<string, any>;
    points: number;
    imageUrl?: string;
  };
}

interface UserAchievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  icon?: string;
  badgeColor: string;
  criteria: Record<string, any>;
  progress: Record<string, any>;
  earnedAt: string;
  isNotified: boolean;
}

export default function GamificationPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: userBadges = [], isLoading: badgesLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/gamification/badges/user"],
  });

  const { data: userAchievements = [], isLoading: achievementsLoading } = useQuery<UserAchievement[]>({
    queryKey: ["/api/gamification/achievements"],
  });

  const { data: allBadges = [], isLoading: allBadgesLoading } = useQuery({
    queryKey: ["/api/gamification/badges"],
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "trading":
        return <TrendingUp className="h-5 w-5" />;
      case "consistency":
        return <Target className="h-5 w-5" />;
      case "skill":
        return <Zap className="h-5 w-5" />;
      case "social":
        return <Star className="h-5 w-5" />;
      case "indian":
        return <Shield className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const earnedBadges = userBadges.filter(badge => badge.earnedAt);
  const availableBadges = Array.isArray(allBadges) ? allBadges.filter(badge => 
    !userBadges.some(userBadge => userBadge.badgeId === badge.id && userBadge.earnedAt)
  ) : [];

  const filteredEarnedBadges = selectedCategory === "all" 
    ? earnedBadges 
    : earnedBadges.filter(badge => badge.badge?.category === selectedCategory);

  const filteredAvailableBadges = selectedCategory === "all"
    ? availableBadges
    : availableBadges.filter(badge => badge.category === selectedCategory);

  const totalPoints = earnedBadges.reduce((sum, badge) => sum + (badge.badge?.points || 0), 0);
  const totalBadges = earnedBadges.length;
  const totalAchievements = Array.isArray(userAchievements) ? userAchievements.length : 0;

  const mapToComponentBadge = (userBadgeOrBadge: any, isUserBadge: boolean): ComponentBadge => {
    const badgeData = isUserBadge ? userBadgeOrBadge.badge : userBadgeOrBadge;
    const progress = isUserBadge ? userBadgeOrBadge.progress : {};
    
    // Calculate progress percentage
    let progressPercentage = 0;
    if (progress && badgeData.requirements) {
       // Simple calculation: average of all requirement progress
       // This logic should ideally match backend calculation or be simplified
       // For now, let's assume 'target' is in requirements and current is in progress
       const keys = Object.keys(badgeData.requirements);
       if (keys.length > 0) {
         const total = keys.reduce((acc, key) => {
            const target = badgeData.requirements[key];
            const current = progress[key] || 0;
            return acc + Math.min((current / target), 1);
         }, 0);
         progressPercentage = (total / keys.length) * 100;
       }
    }

    // Use pre-calculated progress if available (backend logic from routes/gamification.ts calculates it? No, it just returns raw progress object)
    // Wait, the API response for user badges has 'progress' object. 
    // We need to pass a number 0-100 to the component for `progress`.
    
    return {
      id: badgeData.id,
      name: badgeData.name,
      description: badgeData.description,
      icon: badgeData.icon,
      category: badgeData.category as any,
      rarity: badgeData.rarity as any,
      requirements: [], // Placeholder as component doesn't strictly display them in list
      points: badgeData.points,
      earned: isUserBadge ? !!userBadgeOrBadge.earnedAt : false,
      earnedAt: isUserBadge && userBadgeOrBadge.earnedAt ? new Date(userBadgeOrBadge.earnedAt) : undefined,
      progress: progressPercentage
    };
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-yellow-400" />
              Gamification Center
            </h1>
            <p className="text-slate-400 mt-2">Earn badges, unlock achievements, and track your trading journey</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalPoints}</div>
                  <div className="text-sm text-slate-400">Total Points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Award className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalBadges}</div>
                  <div className="text-sm text-slate-400">Badges Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Star className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalAchievements}</div>
                  <div className="text-sm text-slate-400">Achievements</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round((totalBadges / Math.max(totalBadges + availableBadges.length, 1)) * 100)}%</div>
                  <div className="text-sm text-slate-400">Completion</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className="bg-blue-600 hover:bg-blue-500"
          >
            All Categories
          </Button>
          <Button
            variant={selectedCategory === "trading" ? "default" : "outline"}
            onClick={() => setSelectedCategory("trading")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trading
          </Button>
          <Button
            variant={selectedCategory === "consistency" ? "default" : "outline"}
            onClick={() => setSelectedCategory("consistency")}
          >
            <Target className="h-4 w-4 mr-2" />
            Consistency
          </Button>
          <Button
            variant={selectedCategory === "skill" ? "default" : "outline"}
            onClick={() => setSelectedCategory("skill")}
          >
            <Zap className="h-4 w-4 mr-2" />
            Skill
          </Button>
          <Button
            variant={selectedCategory === "social" ? "default" : "outline"}
            onClick={() => setSelectedCategory("social")}
          >
            <Star className="h-4 w-4 mr-2" />
            Social
          </Button>
          <Button
            variant={selectedCategory === "indian" ? "default" : "outline"}
            onClick={() => setSelectedCategory("indian")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Indian Market
          </Button>
        </div>

        {/* Earned Badges */}
        <Card className="glass border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-emerald-400" />
              Earned Badges ({filteredEarnedBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {badgesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 bg-slate-800/50 rounded-lg animate-pulse">
                    <div className="h-12 w-12 bg-slate-700 rounded-lg mb-3"></div>
                    <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredEarnedBadges.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEarnedBadges.map((userBadge) => (
                  <BadgeDisplay
                    key={userBadge.id}
                    badge={mapToComponentBadge(userBadge, true)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No badges earned yet</h3>
                <p className="text-slate-400">Start trading to earn your first badge!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Badges */}
        <Card className="glass border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-400" />
              Available Badges ({filteredAvailableBadges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allBadgesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 bg-slate-800/50 rounded-lg animate-pulse">
                    <div className="h-12 w-12 bg-slate-700 rounded-lg mb-3"></div>
                    <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredAvailableBadges.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailableBadges.map((badge) => {
                  // Find if user has progress for this badge
                  const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
                  const badgeWithProgress = {
                     badge: badge,
                     progress: userBadge?.progress || {}
                  };
                  // If userBadge exists but not earned, use mapToComponentBadge with isUserBadge=true (sort of)
                  // Or just construct it manually
                  
                  return (
                    <BadgeDisplay
                      key={badge.id}
                      badge={mapToComponentBadge(userBadge ? userBadge : { badge: badge, progress: {} }, !!userBadge)}
                      showProgress={true}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">All badges earned!</h3>
                <p className="text-slate-400">Congratulations! You've earned all available badges.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        {Array.isArray(userAchievements) && userAchievements.length > 0 && (
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-purple-400" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userAchievements.slice(0, 5).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg"
                  >
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <span className="text-lg">{achievement.icon || "🏆"}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-purple-400">{achievement.title}</h3>
                      <p className="text-sm text-slate-300">{achievement.description}</p>
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(achievement.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
