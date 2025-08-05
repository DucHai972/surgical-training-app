import { Eye } from 'lucide-react';
import { SessionInfo } from '../../types/session.types';
import { LayoutToggle } from './LayoutToggle';
import { LayoutType } from '../../types/session.types';

interface SessionHeaderProps {
  session: SessionInfo;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  // session, // TODO: Use session data in header
  layout,
  onLayoutChange
}) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-3">
          <Eye size={24} className="text-blue-500" />
          Video Viewer
        </h2>
        <LayoutToggle layout={layout} onLayoutChange={onLayoutChange} />
      </div>
    </div>
  );
};