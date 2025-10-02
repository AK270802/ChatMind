import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'subtle' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md', 
    glow = false, 
    loading = false,
    icon,
    iconPosition = 'left',
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-white/20 hover:bg-white/30 text-white border border-white/30',
      subtle: 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/20',
      outline: 'bg-transparent hover:bg-white/10 text-white border border-white/30',
      ghost: 'bg-transparent hover:bg-white/10 text-white/80 border-0'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl'
    };

    const glowClasses = glow ? 'shadow-lg shadow-white/20 hover:shadow-white/30' : '';
    const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
    const loadingClasses = loading ? 'flex items-center justify-center' : '';

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'relative rounded-lg font-medium transition-all duration-300 backdrop-blur-sm',
          
          // Variant styles
          variants[variant],
          
          // Size styles
          sizes[size],
          
          // Effects
          glowClasses,
          disabledClasses,
          loadingClasses,
          
          // Custom className
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
        
        {/* Loading spinner */}
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        
        {/* Icon */}
        {icon && !loading && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        
        {/* Content */}
        <span className="relative z-10">{children}</span>
        
        {/* Icon */}
        {icon && !loading && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;
