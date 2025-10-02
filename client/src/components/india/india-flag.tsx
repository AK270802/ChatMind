import React from 'react';

interface IndiaFlagProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
}

const IndiaFlag: React.FC<IndiaFlagProps> = ({ 
  size = 'md', 
  className = '', 
  animated = false 
}) => {
  const sizes = {
    sm: 'w-16 h-12',
    md: 'w-24 h-18',
    lg: 'w-32 h-24',
    xl: 'w-48 h-36'
  };

  const animationClass = animated ? 'animate-pulse' : '';

  return (
    <div className={`relative ${sizes[size]} ${className} ${animationClass}`}>
      {/* Saffron (top) */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-[#FF9933] rounded-t-sm" />
      
      {/* White (middle) */}
      <div className="absolute top-1/3 left-0 right-0 h-1/3 bg-white flex items-center justify-center">
        {/* Ashoka Chakra */}
        <div className="relative w-6 h-6">
          <div className="absolute inset-0 rounded-full border-2 border-[#000080]" />
          <div className="absolute inset-1 rounded-full border border-[#000080]" />
          
          {/* 24 spokes */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-[#000080] origin-top"
              style={{
                transform: `translate(-50%, -100%) rotate(${i * 15}deg)`,
                transformOrigin: 'bottom center'
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Green (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#138808] rounded-b-sm" />
    </div>
  );
};

export default IndiaFlag;
export type { IndiaFlagProps };
