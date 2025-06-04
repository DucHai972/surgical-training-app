import { ReactNode, useState } from 'react';
import { Card } from './ui/card';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
}

const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0, 
  hoverEffect = true 
}: AnimatedCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={`
        transform transition-all duration-500 ease-out
        ${hoverEffect ? 'hover:scale-105 hover:-translate-y-2 hover:shadow-2xl' : ''}
        ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
        animate-fade-in-up
        ${className}
      `}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'both'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Card>
  );
};

export default AnimatedCard; 