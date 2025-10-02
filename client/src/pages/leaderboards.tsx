import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, Award, Crown, Medal, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  metrics: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    riskAdjustedScore: number;
  };
  previousRank?: number;
  change?: number;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: string;
  timeframe: string;
  entries: LeaderboardEntry[];
  userRank?: {
    rank: number;
    score: number;
    totalTrades: number;
    winRate: number;
    riskAdjustedScore: number;
  };
}

export default function LeaderboardsPage() {
  const [selectedCategory, setSelectedCategory] = useState("overall");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const { data: leaderboards = [], isLoading } = useQuery<Leaderboard[]>({
    queryKey: ["/api/leaderboards"],
  });

  const { data: dynamicLeaderboard, isLoading: dynamicLoading } = useQuery({
    queryKey: [`/api/leaderboards/dynamic/${selectedCategory}`, { period: selectedPeriod }],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-slate-400 font-bold">#{rank}</span>;
    }
  };

  const getRankChangeIcon = (change?: number) => {
    if (!change) return null;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-red-400" />;
    if (change < 0) return <TrendingUp className="h-4 w-4 text-green-400 rotate-180" />;
    return null;
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Trophy className="h-8 w-8 mr-3 text-yellow-400" />
              Trading Leaderboards
            </h1>
            <p className="text-slate-400 mt-2">Compete with traders worldwide and track your progress</p>
          </div>
        </div>

        {/* Category and Period Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === "overall" ? "default" : "outline"}
              onClick={() => setSelectedCategory("overall")}
              className="bg-blue-600 hover:bg-blue-500"
            >
              Overall Performance
            </Button>
            <Button
              variant={selectedCategory === "risk-adjusted" ? "default" : "outline"}
              onClick={() => setSelectedCategory("risk-adjusted")}
            >
              Risk-Adjusted
            </Button>
            <Button
              variant={selectedCategory === "improvement" ? "default" : "outline"}
              onClick={() => setSelectedCategory("improvement")}
            >
              Most Improved
            </Button>
            <Button
              variant={selectedCategory === "discipline" ? "default" : "outline"}
              onClick={() => setSelectedCategory("discipline")}
            >
              Discipline
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === "daily" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("daily")}
            >
              Daily
            </Button>
            <Button
              variant={selectedPeriod === "weekly" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={selectedPeriod === "monthly" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={selectedPeriod === "all-time" ? "default" : "outline"}
              onClick={() => setSelectedPeriod("all-time")}
            >
              All Time
            </Button>
          </div>
        </div>

        {/* User's Current Rank */}
        {dynamicLeaderboard?.data?.userRank && (
          <Card className="glass border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400" />
                Your Current Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getRankIcon(dynamicLeaderboard.data.userRank.rank)}
                  <div>
                    <h3 className="text-lg font-semibold">
                      Rank #{dynamicLeaderboard.data.userRank.rank}
                    </h3>
                    <p className="text-slate-400">
                      Score: {dynamicLeaderboard.data.userRank.score.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Win Rate</div>
                  <div className="text-lg font-semibold">
                    {(dynamicLeaderboard.data.userRank.winRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-400">Total Trades</div>
                  <div className="text-lg font-semibold">
                    {dynamicLeaderboard.data.userRank.totalTrades}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Leaderboard
              <Badge variant="outline" className="ml-4">
                {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dynamicLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-slate-800/50 rounded-lg animate-pulse">
                    <div className="h-8 w-8 bg-slate-700 rounded"></div>
                    <div className="h-4 w-32 bg-slate-700 rounded"></div>
                    <div className="h-4 w-24 bg-slate-700 rounded"></div>
                    <div className="h-4 w-20 bg-slate-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : dynamicLeaderboard?.data?.entries ? (
              <div className="space-y-2">
                {dynamicLeaderboard.data.entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all hover:bg-slate-800/50 ${
                      entry.rank <= 3 ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20" : "bg-slate-800/30"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(entry.rank)}
                        {entry.change && (
                          <div className="flex items-center space-x-1">
                            {getRankChangeIcon(entry.change)}
                            <span className={`text-sm ${entry.change > 0 ? "text-red-400" : "text-green-400"}`}>
                              {Math.abs(entry.change)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {entry.user.firstName?.charAt(0) || entry.user.username.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            {entry.user.firstName ? `${entry.user.firstName} ${entry.user.lastName || ''}`.trim() : entry.user.username}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Score: {entry.score.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="text-slate-400">Win Rate</div>
                        <div className="font-semibold">
                          {(entry.metrics.winRate * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400">Trades</div>
                        <div className="font-semibold">{entry.metrics.totalTrades}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400">Profit Factor</div>
                        <div className="font-semibold">{entry.metrics.profitFactor.toFixed(2)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-400">Risk Score</div>
                        <div className="font-semibold">{entry.metrics.riskAdjustedScore.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-400 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No leaderboard data available</h3>
                <p className="text-slate-400">Start trading to appear on the leaderboards!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievement Tips */}
        <Card className="glass border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-400" />
              How to Climb the Leaderboards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-emerald-400">Performance Tips</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Maintain consistent win rates above 60%</li>
                  <li>• Keep profit factors above 1.5</li>
                  <li>• Use proper risk management</li>
                  <li>• Focus on quality over quantity</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-blue-400">Risk Management</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>• Never risk more than 2% per trade</li>
                  <li>• Maintain good risk-reward ratios</li>
                  <li>• Use stop losses consistently</li>
                  <li>• Diversify your portfolio</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
