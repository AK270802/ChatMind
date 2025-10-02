import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassBadge } from '@/components/ui/glassmorphism';
import { Heart, MessageCircle, Share2, TrendingUp, TrendingDown, Eye } from 'lucide-react';

interface TradeStory {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  title: string;
  content: string;
  tradeData: {
    symbol: string;
    type: 'long' | 'short';
    entryPrice: number;
    exitPrice?: number;
    pnl?: number;
    entryDate: Date;
    exitDate?: Date;
    strategy?: string;
    tags?: string[];
  };
  insights: {
    keyLearning: string;
    emotionalState: string;
    riskManagement: string;
    marketConditions: string;
  };
  isAnonymous: boolean;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  isVerified?: boolean;
}

interface TradeStoryCardProps {
  story: TradeStory;
  onLike?: (storyId: string) => void;
  onComment?: (storyId: string) => void;
  onShare?: (storyId: string) => void;
  className?: string;
}

const TradeStoryCard: React.FC<TradeStoryCardProps> = ({
  story,
  onLike,
  onComment,
  onShare,
  className = ''
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(story.id);
  };

  const getTradeTypeColor = (type: 'long' | 'short') => {
    return type === 'long' ? 'text-green-400' : 'text-red-400';
  };

  const getTradeTypeIcon = (type: 'long' | 'short') => {
    return type === 'long' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getPnlColor = (pnl?: number) => {
    if (!pnl) return 'text-gray-400';
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
            {story.isAnonymous ? '?' : story.username.charAt(0).toUpperCase()}
          </div>
          
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">
                {story.isAnonymous ? 'Anonymous Trader' : story.username}
              </h3>
              {story.isVerified && (
                <GlassBadge variant="solid" size="sm" color="blue">
                  ✓
                </GlassBadge>
              )}
            </div>
            <p className="text-xs text-white/60">{formatDate(story.createdAt)}</p>
          </div>
        </div>

        {/* Trade Type Badge */}
        <GlassBadge 
          variant="outline" 
          size="sm" 
          color={story.tradeData.type === 'long' ? 'green' : 'red'}
        >
          <div className="flex items-center space-x-1">
            {getTradeTypeIcon(story.tradeData.type)}
            <span>{story.tradeData.type.toUpperCase()}</span>
          </div>
        </GlassBadge>
      </div>

      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-3">{story.title}</h2>

      {/* Trade Info */}
      <div className="flex items-center space-x-4 mb-4 p-3 bg-white/5 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-white/80 text-sm">Symbol:</span>
          <span className="font-semibold text-white">{story.tradeData.symbol}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-white/80 text-sm">Entry:</span>
          <span className="font-semibold text-white">{formatCurrency(story.tradeData.entryPrice)}</span>
        </div>
        
        {story.tradeData.exitPrice && (
          <div className="flex items-center space-x-2">
            <span className="text-white/80 text-sm">Exit:</span>
            <span className="font-semibold text-white">{formatCurrency(story.tradeData.exitPrice)}</span>
          </div>
        )}
        
        {story.tradeData.pnl && (
          <div className="flex items-center space-x-2">
            <span className="text-white/80 text-sm">P&L:</span>
            <span className={`font-semibold ${getPnlColor(story.tradeData.pnl)}`}>
              {story.tradeData.pnl >= 0 ? '+' : ''}{formatCurrency(story.tradeData.pnl)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-white/80 leading-relaxed">
          {showFullContent ? story.content : truncateContent(story.content)}
        </p>
        {story.content.length > 150 && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-400 text-sm hover:text-blue-300 mt-2"
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Tags */}
      {story.tradeData.tags && story.tradeData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {story.tradeData.tags.map((tag, index) => (
            <GlassBadge key={index} variant="subtle" size="sm" color="purple">
              #{tag}
            </GlassBadge>
          ))}
        </div>
      )}

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-white/5 rounded-lg">
          <h4 className="text-xs font-semibold text-white/60 mb-1">Key Learning</h4>
          <p className="text-sm text-white/80">{story.insights.keyLearning}</p>
        </div>
        
        <div className="p-3 bg-white/5 rounded-lg">
          <h4 className="text-xs font-semibold text-white/60 mb-1">Emotional State</h4>
          <p className="text-sm text-white/80">{story.insights.emotionalState}</p>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center space-x-4">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center space-x-1 ${isLiked ? 'text-red-400' : 'text-white/60'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{story.likes + (isLiked ? 1 : 0)}</span>
          </GlassButton>
          
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onComment?.(story.id)}
            className="flex items-center space-x-1 text-white/60"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{story.comments}</span>
          </GlassButton>
          
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => onShare?.(story.id)}
            className="flex items-center space-x-1 text-white/60"
          >
            <Share2 className="w-4 h-4" />
            <span>{story.shares}</span>
          </GlassButton>
        </div>

        <div className="flex items-center space-x-1 text-white/60 text-sm">
          <Eye className="w-4 h-4" />
          <span>{Math.floor(Math.random() * 1000) + 100} views</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default TradeStoryCard;
export type { TradeStory, TradeStoryCardProps };
