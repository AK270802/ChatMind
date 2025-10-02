import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'pink' | 'indigo' | 'gray';
  glow?: boolean;
  pulse?: boolean;
}

const GlassBadge = forwardRef<HTMLDivElement, GlassBadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    color = 'blue',
    glow = false,
    pulse = false,
    children, 
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-white/20 backdrop-blur-sm',
      subtle: 'bg-white/10 backdrop-blur-sm',
      outline: 'bg-transparent border border-white/30',
      solid: 'bg-white/90 text-gray-900'
    };

    const sizes = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base'
    };

    const colors = {
      blue: 'text-blue-300 border-blue-400/30',
      green: 'text-green-300 border-green-400/30',
      red: 'text-red-300 border-red-400/30',
      yellow: 'text-yellow-300 border-yellow-400/30',
      purple: 'text-purple-300 border-purple-400/30',
      pink: 'text-pink-300 border-pink-400/30',
      indigo: 'text-indigo-300 border-indigo-400/30',
      gray: 'text-gray-300 border-gray-400/30'
    };

    const glowColors = {
      blue: 'shadow-blue-500/20',
      green: 'shadow-green-500/20',
      red: 'shadow-red-500/20',
      yellow: 'shadow-yellow-500/20',
      purple: 'shadow-purple-500/20',
      pink: 'shadow-pink-500/20',
      indigo: 'shadow-indigo-500/20',
      gray: 'shadow-gray-500/20'
    };

    const glowClasses = glow ? `shadow-lg ${glowColors[color]}` : '';
    const pulseClasses = pulse ? 'animate-pulse' : '';

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center rounded-full font-medium transition-all duration-300',
          
          // Variant styles
          variants[variant],
          
          // Size styles
          sizes[size],
          
          // Color styles
          colors[color],
          
          // Effects
          glowClasses,
          pulseClasses,
          
          // Custom className
          className
        )}
        {...props}
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-full" />
        
        {/* Content */}
        <span className="relative z-10">{children}</span>
      </div>
    );
  }
);

GlassBadge.displayName = 'GlassBadge';

export default GlassBadge;
