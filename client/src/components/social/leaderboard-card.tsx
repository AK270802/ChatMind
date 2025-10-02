import React from 'react';
import { GlassCard, GlassBadge } from '@/components/ui/glassmorphism';
import { Trophy, TrendingUp, Award, Star } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  score: number;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  riskAdjustedScore: number;
  improvementStreak: number;
  disciplineScore: number;
}

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  showRank?: boolean;
  className?: string;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  entry,
  showRank = true,
  className = ''
}) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Trophy className="w-5 h-5 text-amber-600" />;
      default:
        return <Award className="w-5 h-5 text-white/60" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400 border-yellow-400/30';
      case 2:
        return 'text-gray-300 border-gray-300/30';
      case 3:
        return 'text-amber-600 border-amber-600/30';
      default:
        return 'text-white/60 border-white/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPnlColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <GlassCard
      className={`p-4 hover:scale-[1.02] transition-all duration-300 ${className}`}
      interactive
    >
      <div className="flex items-center justify-between">
        {/* Left side - Rank and User Info */}
        <div className="flex items-center space-x-4">
          {showRank && (
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${getRankColor(entry.rank)}`}>
              {getRankIcon(entry.rank)}
              <span className="absolute text-xs font-bold">{entry.rank}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {entry.username.charAt(0).toUpperCase()}
            </div>
            
            <div>
              <h3 className="font-semibold text-white">{entry.username}</h3>
              <div className="flex items-center space-x-2 text-xs text-white/60">
                <span>{entry.totalTrades} trades</span>
                <span>•</span>
                <span>{entry.winRate.toFixed(1)}% win rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Stats */}
        <div className="flex items-center space-x-4">
          {/* Score */}
          <div className="text-right">
            <div className={`text-lg font-bold ${getScoreColor(entry.score)}`}>
              {entry.score.toFixed(0)}
            </div>
            <div className="text-xs text-white/60">Score</div>
          </div>

          {/* P&L */}
          <div className="text-right">
            <div className={`text-sm font-semibold ${getPnlColor(entry.totalPnl)}`}>
              {entry.totalPnl >= 0 ? '+' : ''}₹{entry.totalPnl.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-white/60">Total P&L</div>
          </div>

          {/* Trend */}
          {entry.improvementStreak > 0 && (
            <div className="flex items-center space-x-1 text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold">{entry.improvementStreak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-white/60">Risk: {entry.riskAdjustedScore.toFixed(0)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="w-3 h-3 text-blue-400" />
              <span className="text-white/60">Discipline: {entry.disciplineScore.toFixed(0)}</span>
            </div>
          </div>
          
          <GlassBadge variant="subtle" size="sm" color="blue">
            Rank #{entry.rank}
          </GlassBadge>
        </div>
      </div>
    </GlassCard>
  );
};

export default LeaderboardCard;
export type { LeaderboardEntry, LeaderboardCardProps };
