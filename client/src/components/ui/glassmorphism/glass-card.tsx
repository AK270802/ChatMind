import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'strong';
  border?: boolean;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', border = true, shadow = 'md', interactive = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white/10 backdrop-blur-md',
      subtle: 'bg-white/5 backdrop-blur-sm',
      strong: 'bg-white/20 backdrop-blur-lg'
    };

    const shadows = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    };

    const borderClasses = border ? 'border border-white/20' : '';
    const interactiveClasses = interactive ? 'hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] cursor-pointer' : '';

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          'relative rounded-xl overflow-hidden',
          
          // Glassmorphism effect
          variants[variant],
          
          // Border and shadow
          borderClasses,
          shadows[shadow],
          
          // Interactive effects
          interactiveClasses,
          
          // Custom className
          className
        )}
        {...props}
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
