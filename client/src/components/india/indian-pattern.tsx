import React from 'react';

interface IndianPatternProps {
  variant?: 'mandala' | 'paisley' | 'floral' | 'geometric';
  density?: 'low' | 'medium' | 'high';
  color?: string;
  opacity?: number;
  className?: string;
}

const IndianPattern: React.FC<IndianPatternProps> = ({
  variant = 'mandala',
  density = 'medium',
  color = '#FF9933',
  opacity = 0.1,
  className = ''
}) => {
  const densityMap = {
    low: 8,
    medium: 12,
    high: 16
  };

  const patternCount = densityMap[density];

  const renderMandala = () => (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="mandala-pattern"
          x="0"
          y="0"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <g transform="translate(25, 25)">
            {/* Outer circle */}
            <circle
              cx="0"
              cy="0"
              r="20"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={opacity}
            />
            
            {/* Inner circles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <circle
                key={i}
                cx={Math.cos((i * Math.PI) / 4) * 10}
                cy={Math.sin((i * Math.PI) / 4) * 10}
                r="3"
                fill={color}
                opacity={opacity}
              />
            ))}
            
            {/* Petals */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const x1 = Math.cos(angle) * 8;
              const y1 = Math.sin(angle) * 8;
              const x2 = Math.cos(angle) * 18;
              const y2 = Math.sin(angle) * 18;
              
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} Q ${(x1 + x2) / 2 + 2} ${(y1 + y2) / 2} ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="0.3"
                  opacity={opacity}
                />
              );
            })}
            
            {/* Center dot */}
            <circle cx="0" cy="0" r="2" fill={color} opacity={opacity} />
          </g>
        </pattern>
      </defs>
      
      <rect width="100" height="100" fill="url(#mandala-pattern)" />
    </svg>
  );

  const renderPaisley = () => (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="paisley-pattern"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <g transform="translate(20, 20)">
            {/* Paisley shape */}
            <path
              d="M 0,-15 C -8,-15 -12,-8 -12,0 C -12,8 -8,12 0,12 C 8,12 12,8 12,0 C 12,-8 8,-15 0,-15 Z"
              fill={color}
              opacity={opacity}
            />
            
            {/* Inner curve */}
            <path
              d="M 0,-10 C -5,-10 -8,-5 -8,0 C -8,5 -5,8 0,8"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={opacity}
            />
            
            {/* Decorative dots */}
            <circle cx="-5" cy="-5" r="1" fill={color} opacity={opacity} />
            <circle cx="5" cy="-5" r="1" fill={color} opacity={opacity} />
            <circle cx="-5" cy="5" r="1" fill={color} opacity={opacity} />
            <circle cx="5" cy="5" r="1" fill={color} opacity={opacity} />
          </g>
        </pattern>
      </defs>
      
      <rect width="100" height="100" fill="url(#paisley-pattern)" />
    </svg>
  );

  const renderFloral = () => (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="floral-pattern"
          x="0"
          y="0"
          width="45"
          height="45"
          patternUnits="userSpaceOnUse"
        >
          <g transform="translate(22.5, 22.5)">
            {/* Flower petals */}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 6;
              const x = Math.cos(angle) * 8;
              const y = Math.sin(angle) * 8;
              
              return (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx="4"
                  ry="6"
                  fill={color}
                  opacity={opacity}
                  transform={`rotate(${(angle * 180) / Math.PI} ${x} ${y})`}
                />
              );
            })}
            
            {/* Flower center */}
            <circle cx="0" cy="0" r="4" fill={color} opacity={opacity} />
            
            {/* Small decorative elements */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const x = Math.cos(angle) * 15;
              const y = Math.sin(angle) * 15;
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1"
                  fill={color}
                  opacity={opacity * 0.5}
                />
              );
            })}
          </g>
        </pattern>
      </defs>
      
      <rect width="100" height="100" fill="url(#floral-pattern)" />
    </svg>
  );

  const renderGeometric = () => (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="geometric-pattern"
          x="0"
          y="0"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <g>
            {/* Diamond shape */}
            <path
              d="M 15,5 L 25,15 L 15,25 L 5,15 Z"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={opacity}
            />
            
            {/* Inner diamond */}
            <path
              d="M 15,10 L 20,15 L 15,20 L 10,15 Z"
              fill={color}
              opacity={opacity * 0.3}
            />
            
            {/* Corner dots */}
            <circle cx="5" cy="5" r="1" fill={color} opacity={opacity} />
            <circle cx="25" cy="5" r="1" fill={color} opacity={opacity} />
            <circle cx="5" cy="25" r="1" fill={color} opacity={opacity} />
            <circle cx="25" cy="25" r="1" fill={color} opacity={opacity} />
          </g>
        </pattern>
      </defs>
      
      <rect width="100" height="100" fill="url(#geometric-pattern)" />
    </svg>
  );

  switch (variant) {
    case 'mandala':
      return renderMandala();
    case 'paisley':
      return renderPaisley();
    case 'floral':
      return renderFloral();
    case 'geometric':
      return renderGeometric();
    default:
      return renderMandala();
  }
};

export default IndianPattern;
export type { IndianPatternProps };
