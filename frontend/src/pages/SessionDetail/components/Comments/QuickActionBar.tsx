import React from 'react';
import { Button } from '../../../../components/ui/button';
import { MessageSquare } from 'lucide-react';
import type { Video, LabelMode } from '../../types/session.types';
import { formatTime } from '../../utils/time.utils';

interface QuickActionBarProps {
  video: Video;
  currentTime: number;
  labelMode: LabelMode;
  onFloatingComment: () => void;
  onStartLabel: (videoTitle: string, comment: string, type: string) => void;
  onCommentChange: (videoTitle: string, comment: string) => void;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  video,
  currentTime,
  labelMode,
  onFloatingComment,
  onStartLabel,
  onCommentChange,
}) => {
  return (
    <div className="mx-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <MessageSquare size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Comment</h3>
            <p className="text-xs text-gray-600">
              {labelMode === 'start_end' 
                ? "Press 'C' to focus comment • Press 'E' to end latest label • Ctrl+Enter to start label"
                : "Press 'C' to focus comment • Ctrl+Enter to add comment"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white px-3 py-1 rounded-full border border-gray-200">
            <span className="text-sm font-mono text-gray-700">
              {formatTime(currentTime)}
            </span>
          </div>
          <Button
            onClick={onFloatingComment}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
          >
            <MessageSquare size={14} className="mr-1" />
            Comment
          </Button>
        </div>
      </div>
      
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-600 mr-1">Quick:</span>
        <Button
          onClick={() => {
            if (labelMode === 'start_end') {
              onStartLabel(video.title, '👍 Good technique', 'positive');
            } else {
              onCommentChange(video.title, '👍 Good technique');
              onFloatingComment();
            }
          }}
          variant="outline"
          size="sm"
          className="text-green-700 border-green-200 hover:bg-green-50 px-3 py-1 text-xs rounded-lg"
        >
          {labelMode === 'start_end' ? '🎯 Start Good' : '👍 Good'}
        </Button>
        <Button
          onClick={() => {
            if (labelMode === 'start_end') {
              onStartLabel(video.title, '⚠️ Needs attention', 'warning');
            } else {
              onCommentChange(video.title, '⚠️ Needs attention');
              onFloatingComment();
            }
          }}
          variant="outline"
          size="sm"
          className="text-yellow-700 border-yellow-200 hover:bg-yellow-50 px-3 py-1 text-xs rounded-lg"
        >
          {labelMode === 'start_end' ? '🎯 Start Attention' : '⚠️ Attention'}
        </Button>
        <Button
          onClick={() => {
            if (labelMode === 'start_end') {
              onStartLabel(video.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.', 'critical');
            } else {
              onCommentChange(video.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.');
              onFloatingComment();
            }
          }}
          variant="outline"
          size="sm"
          className="text-red-700 border-red-200 hover:bg-red-50 px-3 py-1 text-xs rounded-lg"
        >
          {labelMode === 'start_end' ? '🎯 Start Critical' : '❌ Critical'}
        </Button>
        <Button
          onClick={() => {
            onCommentChange(video.title, '');
            onFloatingComment();
          }}
          variant="outline"
          size="sm"
          className="text-blue-700 border-blue-200 hover:bg-blue-50 px-3 py-1 text-xs rounded-lg"
        >
          ✏️ Custom
        </Button>
      </div>
    </div>
  );
};