import React, { useRef, useEffect, useState } from 'react';
import { MessageSquare, Clock } from 'lucide-react';

interface Comment {
  name: string;
  doctor: string;
  doctor_name?: string;
  video_title: string;
  timestamp: number;
  comment_text: string;
  created_at: string;
}

interface VideoTimelineProps {
  currentTime: number;
  duration: number;
  comments: Comment[];
  onSeek: (time: number) => void;
  zoom?: number;
}

const VideoTimeline = ({ 
  currentTime, 
  duration, 
  comments, 
  onSeek, 
  zoom = 1 
}: VideoTimelineProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  // const [timelineWidth, setTimelineWidth] = useState(0);
  const [hoveredComment, setHoveredComment] = useState<Comment | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateTimelineWidth = () => {
      if (timelineRef.current) {
        // Timeline width is now calculated directly when needed
      }
    };

    updateTimelineWidth();
    window.addEventListener('resize', updateTimelineWidth);
    return () => window.removeEventListener('resize', updateTimelineWidth);
  }, [zoom]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (timelineRef.current && duration > 0) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      onSeek(Math.max(0, Math.min(newTime, duration)));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const renderCommentAnnotations = () => {
    if (duration === 0) return null;

    return comments.map((comment) => {
      const position = (comment.timestamp / duration) * 100;
      
      return (
        <div
          key={comment.name}
          className="absolute bg-blue-500 hover:bg-blue-400 cursor-pointer rounded-sm transition-all duration-200 transform hover:scale-110"
          style={{
            left: `${position}%`,
            width: '8px',
            height: '24px',
            top: '20px'
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSeek(comment.timestamp);
          }}
          onMouseEnter={(e) => {
            setHoveredComment(comment);
            handleMouseMove(e);
          }}
          onMouseLeave={() => setHoveredComment(null)}
          onMouseMove={handleMouseMove}
        >
          <div className="w-full h-full flex items-center justify-center">
            <MessageSquare size={10} className="text-white" />
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-gray-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <span className="text-white text-sm font-medium">Timeline & Annotations</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          <span>{comments.length} comments</span>
        </div>
      </div>

      <div 
        ref={timelineRef}
        className="relative h-16 bg-gray-700 rounded-lg cursor-crosshair overflow-hidden"
        onClick={handleTimelineClick}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-blue-600/30 transition-all duration-100"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />

        {renderCommentAnnotations()}

        <div
          className="absolute top-0 w-0.5 h-full bg-red-500 z-50 pointer-events-none transition-all duration-100"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-lg">
            <div className="absolute -top-8 -left-8 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {hoveredComment && (
        <div 
          className="fixed z-[1000] bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-600 max-w-sm pointer-events-none"
          style={{ 
            left: `${mousePosition.x + 10}px`, 
            top: `${mousePosition.y - 60}px`,
            transform: mousePosition.x > window.innerWidth - 250 ? 'translateX(-100%)' : 'none'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium">{hoveredComment.doctor_name || hoveredComment.doctor}</span>
            <span className="text-xs text-gray-400">at {formatTime(hoveredComment.timestamp)}</span>
          </div>
          <div className="text-sm text-gray-200 line-clamp-3">
            {hoveredComment.comment_text.length > 100 
              ? `${hoveredComment.comment_text.substring(0, 100)}...` 
              : hoveredComment.comment_text
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoTimeline; 