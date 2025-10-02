import React from 'react';
import { GlassCard, GlassBadge } from '@/components/ui/glassmorphism';
import { Award, Star, Lock, TrendingUp } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'trading' | 'consistency' | 'skill' | 'social' | 'indian';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: BadgeRequirement[];
  points: number;
  earned?: boolean;
  earnedAt?: Date;
  progress?: number;
}

interface BadgeRequirement {
  type: 'trades' | 'win_rate' | 'pnl' | 'streak' | 'social' | 'time';
  target: number;
  description: string;
}

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
  className?: string;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'md',
  showProgress = true,
  onClick,
  className = ''
}) => {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24'
  };

  const getRarityColor = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-400 border-gray-400/30';
      case 'rare':
        return 'text-blue-400 border-blue-400/30';
      case 'epic':
        return 'text-purple-400 border-purple-400/30';
      case 'legendary':
        return 'text-yellow-400 border-yellow-400/30';
      default:
        return 'text-gray-400 border-gray-400/30';
    }
  };

  const getRarityGradient = (rarity: Badge['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'from-gray-500 to-gray-600';
      case 'rare':
        return 'from-blue-500 to-blue-600';
      case 'epic':
        return 'from-purple-500 to-purple-600';
      case 'legendary':
        return 'from-yellow-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getCategoryIcon = (category: Badge['category']) => {
    switch (category) {
      case 'trading':
        return <TrendingUp className="w-6 h-6" />;
      case 'consistency':
        return <Star className="w-6 h-6" />;
      case 'skill':
        return <Award className="w-6 h-6" />;
      case 'social':
        return <Star className="w-6 h-6" />;
      case 'indian':
        return <Award className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  const getIconEmoji = (icon: string) => {
    const iconMap: Record<string, string> = {
      'trophy': '🏆',
      'star': '⭐',
      'diamond': '💎',
      'crown': '👑',
      'fire': '🔥',
      'rocket': '🚀',
      'target': '🎯',
      'shield': '🛡️',
      'medal': '🏅',
      'gem': '💠',
      'india': '🇮🇳',
      'diya': '🪔',
      'lotus': '🪷',
      'elephant': '🐘'
    };
    return iconMap[icon] || '🏆';
  };

  const isEarned = badge.earned || false;
  const progress = badge.progress || 0;

  return (
    <GlassCard
      className={`flex flex-col items-center p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onClick}
      interactive
    >
      {/* Badge Icon */}
      <div className={`relative ${sizes[size]} mb-3`}>
        <div className={`
          absolute inset-0 rounded-full bg-gradient-to-br ${getRarityGradient(badge.rarity)}
          ${isEarned ? 'opacity-100' : 'opacity-30'}
          flex items-center justify-center text-2xl
        `}>
          {getIconEmoji(badge.icon)}
        </div>
        
        {/* Border */}
        <div className={`
          absolute inset-0 rounded-full border-2 ${getRarityColor(badge.rarity)}
          ${isEarned ? '' : 'opacity-50'}
        `} />
        
        {/* Lock overlay for unearned badges */}
        {!isEarned && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white/60" />
          </div>
        )}
        
        {/* Glow effect for earned badges */}
        {isEarned && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
        )}
      </div>

      {/* Badge Info */}
      <div className="text-center w-full">
        <h3 className={`font-semibold text-sm mb-1 ${isEarned ? 'text-white' : 'text-white/60'}`}>
          {badge.name}
        </h3>
        
        <GlassBadge 
          variant="subtle" 
          size="sm" 
          color={badge.rarity === 'legendary' ? 'yellow' : badge.rarity === 'epic' ? 'purple' : badge.rarity === 'rare' ? 'blue' : 'gray'}
          className="mb-2"
        >
          {badge.rarity.toUpperCase()}
        </GlassBadge>
        
        {showProgress && !isEarned && progress > 0 && (
          <div className="mt-2">
            <div className="w-full bg-white/10 rounded-full h-2 mb-1">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-white/60">{progress.toFixed(0)}% complete</p>
          </div>
        )}
        
        {isEarned && badge.earnedAt && (
          <p className="text-xs text-white/60 mt-1">
            Earned {new Date(badge.earnedAt).toLocaleDateString('en-IN')}
          </p>
        )}
        
        <p className="text-xs text-white/60 mt-2">
          {badge.points} points
        </p>
      </div>
    </GlassCard>
  );
};

export default BadgeDisplay;
export type { Badge, BadgeRequirement, BadgeDisplayProps };
