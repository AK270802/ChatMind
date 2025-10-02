import React from 'react';

interface IndianOrnamentProps {
  type?: 'diya' | 'lotus' | 'om' | 'swastik' | 'trishul' | 'kalash';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  animated?: boolean;
}

const IndianOrnament: React.FC<IndianOrnamentProps> = ({
  type = 'lotus',
  size = 'md',
  color = '#FF9933',
  className = '',
  animated = false
}) => {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const animationClass = animated ? 'animate-pulse' : '';

  const renderDiya = () => (
    <svg
      className={`${sizes[size]} ${className} ${animationClass}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Diya bowl */}
      <path
        d="M 30 60 Q 30 80 50 80 Q 70 80 70 60 L 65 40 Q 50 35 35 40 Z"
        fill={color}
        opacity="0.8"
      />
      
      {/* Diya rim */}
      <ellipse cx="50" cy="60" rx="20" ry="3" fill={color} />
      
      {/* Flame */}
      <path
        d="M 50 40 Q 45 20 50 10 Q 55 20 50 40"
        fill="#FF6B35"
        opacity="0.9"
      />
      
      {/* Flame glow */}
      <circle cx="50" cy="25" r="8" fill="#FFD700" opacity="0.3" />
    </svg>
  );

  const renderLotus = () => (
    <svg
      className={`${sizes[size]} ${className} ${animationClass}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lotus petals - outer layer */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 8;
        const x = 50 + Math.cos(angle) * 25;
        const y = 50 + Math.sin(angle) * 25;
        
        return (
          <ellipse
            key={`outer-${i}`}
            cx={x}
            cy={y}
            rx="8"
            ry="15"
            fill={color}
            opacity="0.7"
            transform={`rotate(${(angle * 180) / Math.PI + 45} ${x} ${y})`}
          />
        );
      })}
      
      {/* Lotus petals - middle layer */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 6;
        const x = 50 + Math.cos(angle) * 15;
        const y = 50 + Math.sin(angle) * 15;
        
        return (
          <ellipse
            key={`middle-${i}`}
            cx={x}
            cy={y}
            rx="6"
            ry="12"
            fill={color}
            opacity="0.8"
            transform={`rotate(${(angle * 180) / Math.PI + 45} ${x} ${y})`}
          />
        );
      })}
      
      {/* Lotus center */}
      <circle cx="50" cy="50" r="8" fill={color} opacity="0.9" />
      
      {/* Center details */}
      <circle cx="50" cy="50" r="3" fill="#FFD700" />
    </svg>
  );

  const renderOm = () => (
    <svg
      className={`${sizes[size]} ${className} ${animationClass}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Om symbol */}
      <path
        d="M 30 30 Q 30 20 40 20 L 60 20 Q 70 20 70 30 Q 70 40 60 40 L 50 40"
        stroke={color}
        strokeWidth="4"
        fill="none"
      />
      
      <path
        d="M 50 40 Q 40 40 40 50 Q 40 60 50 60 L 60 60 Q 70 60 70 70 Q 70 80 60 80 L 40 80"
        stroke={color}
        strokeWidth="4"
        fill="none"
      />
      
      <circle cx="35" cy="30" r="3" fill={color} />
      
      {/* Decorative dots */}
      <circle cx="75" cy="25" r="2" fill={color} opacity="0.6" />
      <circle cx="25" cy="75" r="2" fill={color} opacity="0.6" />
    </svg>
  );

  const renderSwastik = () => (
    <svg
      className={`${sizes[size]} ${className} ${animationClass}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Swastik symbol */}
      <g stroke={color} strokeWidth="4" fill="none">
        {/* Vertical line */}
        <line x1="50" y1="20" x2="50" y2="80" />
        
        {/* Horizontal line */}
        <line x1="20" y1="50" x2="80" y2="50" />
        
        {/* Top right arm */}
        <path d="M 50 20 L 70 20 L 70 40" />
        
        {/* Top left arm */}
        <path d="M 50 20 L 30 20 L 30 40" />
        
        {/* Bottom right arm */}
        <path d="M 50 80 L 70 80 L 70 60" />
        
        {/* Bottom left arm */}
        <path d="M 50 80 L 30 80 L 30 60" />
      </g>
      
      {/* Center dot */}
      <circle cx="50" cy="50" r="3" fill={color} />
    </svg>
  );

  const renderTrishul = () => (
    <svg
      className={`${sizes[size]} ${className} ${animationClass}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Trishul - three prongs */}
      <g stroke={color} strokeWidth="3" fill="none">
        {/* Central prong */}
        <line x1="50" y1="20" x2="50" y2="80" />
        
        {/* Left prong */}
        <line x1="50" y1="30" x2="35" y2="20" />
        
        {/* Right prong */}
        <line x1="50" y1="30" x2="65" y2="20" />
        
        {/* Horizontal bars */}
        <line x1="40" y1="40" x2="60" y2="40" />
        <line x1="42" y1="55" x2="58" y2="55" />
      </g>
      
      {/* Decorative elements */}
      <circle cx="50" cy="20" r="2" fill={color} />
      <circle cx="35" cy="20" r="2" fill={color} />
      <circle cx="65" cy="20" r="2" fill={color} />
    </svg>
  );

  const renderKalash = () => (
    <svg
      className={`${sizes[size]} ${className} ${animationClass}`}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Kalash pot */}
      <path
        d="M 30 60 Q 30 75 50 75 Q 70 75 70 60 L 65 45 Q 50 40 35 45 Z"
        fill={color}
        opacity="0.8"
      />
      
      {/* Pot rim */}
      <ellipse cx="50" cy="60" rx="20" ry="3" fill={color} />
      
      {/* Pot neck */}
      <rect x="45" y="35" width="10" height="15" fill={color} />
      
      {/* Coconut on top */}
      <ellipse cx="50" cy="30" rx="8" ry="6" fill={color} opacity="0.9" />
      
      {/* Mango leaves */}
      <path
        d="M 42 25 Q 35 20 30 25"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M 58 25 Q 65 20 70 25"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      
      {/* Water drops */}
      <circle cx="45" cy="65" r="1" fill="#4FC3F7" opacity="0.7" />
      <circle cx="55" cy="68" r="1" fill="#4FC3F7" opacity="0.7" />
      <circle cx="50" cy="70" r="1" fill="#4FC3F7" opacity="0.7" />
    </svg>
  );

  switch (type) {
    case 'diya':
      return renderDiya();
    case 'lotus':
      return renderLotus();
    case 'om':
      return renderOm();
    case 'swastik':
      return renderSwastik();
    case 'trishul':
      return renderTrishul();
    case 'kalash':
      return renderKalash();
    default:
      return renderLotus();
  }
};

export default IndianOrnament;
export type { IndianOrnamentProps };
