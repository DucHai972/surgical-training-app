import { Button } from '../../../../components/ui/button';
import { Maximize2, Columns } from 'lucide-react';
import { LayoutType } from '../../types/session.types';

interface LayoutToggleProps {
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({
  layout,
  onLayoutChange
}) => {
  return (
    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-200 shadow-lg">
      <Button
        variant={layout === 'single' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onLayoutChange('single')}
        className={`group flex items-center gap-2 transition-all duration-300 transform hover:scale-105 rounded-lg px-3 py-2 min-h-[36px] ${
          layout === 'single' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Maximize2 size={14} className="group-hover:scale-110 transition-transform duration-300" />
        <span className="text-sm font-medium">Single</span>
      </Button>
      <Button
        variant={layout === 'side-by-side' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onLayoutChange('side-by-side')}
        className={`group flex items-center gap-2 transition-all duration-300 transform hover:scale-105 rounded-lg px-3 py-2 min-h-[36px] ${
          layout === 'side-by-side' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Columns size={14} className="group-hover:scale-110 transition-transform duration-300" />
        <span className="text-sm font-medium">Side by Side</span>
      </Button>
    </div>
  );
};