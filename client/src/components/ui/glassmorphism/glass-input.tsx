import React, { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, Mail, Lock, User } from 'lucide-react';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'subtle' | 'search';
  icon?: 'search' | 'email' | 'password' | 'user' | React.ReactNode;
  error?: string;
  helperText?: string;
  label?: string;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ 
    className, 
    variant = 'default', 
    icon,
    error,
    helperText,
    label,
    type = 'text',
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const variants = {
      default: 'bg-white/10 border-white/20',
      subtle: 'bg-white/5 border-white/10',
      search: 'bg-white/15 border-white/25'
    };

    const getIcon = () => {
      if (typeof icon === 'object') return icon;
      
      switch (icon) {
        case 'search':
          return <Search className="h-4 w-4 text-white/60" />;
        case 'email':
          return <Mail className="h-4 w-4 text-white/60" />;
        case 'password':
          return <Lock className="h-4 w-4 text-white/60" />;
        case 'user':
          return <User className="h-4 w-4 text-white/60" />;
        default:
          return null;
      }
    };

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-white/80">
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Glass input container */}
          <div className={cn(
            'relative rounded-lg backdrop-blur-sm border transition-all duration-300',
            variants[variant],
            isFocused ? 'border-white/40 bg-white/20' : 'border-white/20',
            error ? 'border-red-400/50' : '',
            className
          )}>
            
            {/* Icon */}
            {icon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                {getIcon()}
              </div>
            )}
            
            {/* Input field */}
            <input
              ref={ref}
              type={inputType}
              className={cn(
                'w-full bg-transparent border-0 text-white placeholder-white/50',
                'focus:outline-none focus:ring-0',
                icon ? 'pl-10 pr-4' : 'px-4',
                'py-2.5 text-sm',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              onFocus={(e) => {
                setIsFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                props.onBlur?.(e);
              }}
              {...props}
            />
            
            {/* Password toggle */}
            {type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            )}
            
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent pointer-events-none rounded-lg" />
          </div>
          
          {/* Error message */}
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
          
          {/* Helper text */}
          {helperText && !error && (
            <p className="text-xs text-white/60 mt-1">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export default GlassInput;
