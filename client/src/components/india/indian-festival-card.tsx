import React from 'react';
import { GlassCard } from '@/components/ui/glassmorphism';
import IndianPattern from './indian-pattern';
import IndianOrnament from './indian-ornament';

interface IndianFestivalCardProps {
  festival: {
    name: string;
    date: string;
    description: string;
    significance: string;
    color: string;
    ornament: 'diya' | 'lotus' | 'om' | 'swastik' | 'trishul' | 'kalash';
    pattern: 'mandala' | 'paisley' | 'floral' | 'geometric';
  };
  className?: string;
  onClick?: () => void;
}

const IndianFestivalCard: React.FC<IndianFestivalCardProps> = ({
  festival,
  className = '',
  onClick
}) => {
  return (
    <GlassCard
      className={`relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onClick}
      interactive
    >
      {/* Background pattern */}
      <IndianPattern
        variant={festival.pattern}
        color={festival.color}
        opacity={0.05}
        className="absolute inset-0"
      />
      
      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <IndianOrnament
              type={festival.ornament}
              size="md"
              color={festival.color}
            />
            <div>
              <h3 className="text-lg font-bold text-white">
                {festival.name}
              </h3>
              <p className="text-sm text-white/70">
                {festival.date}
              </p>
            </div>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-white/80 text-sm mb-3 leading-relaxed">
          {festival.description}
        </p>
        
        {/* Significance */}
        <div className="flex items-start space-x-2">
          <div className="w-2 h-2 rounded-full bg-white/50 mt-2 flex-shrink-0" />
          <p className="text-white/60 text-xs leading-relaxed">
            {festival.significance}
          </p>
        </div>
        
        {/* Decorative border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </GlassCard>
  );
};

// Predefined festival data
export const indianFestivals = [
  {
    name: 'Diwali',
    date: 'November 12, 2024',
    description: 'The festival of lights celebrating the victory of light over darkness and good over evil.',
    significance: 'Traders believe Diwali brings prosperity and new beginnings. Many start new investment portfolios on this auspicious day.',
    color: '#FF9933',
    ornament: 'diya' as const,
    pattern: 'mandala' as const
  },
  {
    name: 'Dussehra',
    date: 'October 24, 2024',
    description: 'Celebrates the victory of Lord Rama over Ravana, symbolizing the triumph of good over evil.',
    significance: 'Considered an auspicious time for new investments and business ventures. Markets often show positive sentiment.',
    color: '#FF6B35',
    ornament: 'trishul' as const,
    pattern: 'geometric' as const
  },
  {
    name: 'Akshaya Tritiya',
    date: 'May 10, 2024',
    description: 'An auspicious day for new beginnings and investments, believed to bring eternal prosperity.',
    significance: 'One of the most favorable days for gold investments and starting new financial ventures in Indian culture.',
    color: '#FFD700',
    ornament: 'kalash' as const,
    pattern: 'floral' as const
  },
  {
    name: 'Gudi Padwa',
    date: 'April 9, 2024',
    description: 'Marathi New Year marking the beginning of the lunar new year.',
    significance: 'Considered highly auspicious for new investments, especially in real estate and stock markets.',
    color: '#138808',
    ornament: 'lotus' as const,
    pattern: 'paisley' as const
  },
  {
    name: 'Navratri',
    date: 'October 3-11, 2024',
    description: 'Nine-night festival celebrating the divine feminine energy.',
    significance: 'Each day represents different forms of wealth and prosperity. Many traders perform special rituals for financial success.',
    color: '#E91E63',
    ornament: 'om' as const,
    pattern: 'mandala' as const
  }
];

export default IndianFestivalCard;
export type { IndianFestivalCardProps };
