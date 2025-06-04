import { ReactNode } from 'react';
import { Button } from './ui/button';

interface FloatingActionButtonProps {
  onClick?: () => void;
  icon: ReactNode;
  label?: string;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingActionButton = ({
  onClick,
  icon,
  label,
  className = '',
  position = 'bottom-right'
}: FloatingActionButtonProps) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Button
        onClick={onClick}
        className={`
            group relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl
            bg-indigo-600 hover:bg-indigo-700
            text-white
            transition-all duration-300 transform hover:scale-110
            animate-float
            ${className}
          `}
      >
        <div className="flex items-center justify-center">
          {icon}
        </div>
        
        {label && (
          <div className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            {label}
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          </div>
        )}
      </Button>
    </div>
  );
};

export default FloatingActionButton; 