import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, MessageSquare, Clock, User, AlertTriangle, CheckCircle, LayoutGrid, Minus } from 'lucide-react';

interface Comment {
  name: string;
  doctor: string;
  doctor_name?: string;
  video_title: string;
  timestamp: number;
  comment_text: string;
  created_at: string;
}

interface CustomVideoPlayerProps {
  src: string;
  title: string;
  comments: Comment[];
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onSeek: (time: number) => void;
}

const CustomVideoPlayer = ({
  src,
  title,
  comments,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onPlayPause,
  onSeek
}: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isTimelineHovered, setIsTimelineHovered] = useState(false);
  const [timelineMode, setTimelineMode] = useState<'single' | 'multi'>('single');



  // Sync playing state with video element
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync currentTime prop with video element (for external seek requests)
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      // Only seek if there's a significant difference to avoid conflicts with natural playback
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Set up time update interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && videoRef.current) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const time = videoRef.current.currentTime;
          onTimeUpdate(time);
          
          // Check for active comments based on current time
          const currentComment = comments.find(comment => 
            Math.abs(comment.timestamp - time) < 2 // Within 2 seconds of timestamp
          );
          setActiveComment(currentComment || null);
        }
      }, 100); // 10fps updates for smooth timeline
    }
    return () => clearInterval(interval);
  }, [isPlaying, onTimeUpdate, comments]);

  const handleLoadedData = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onSeek(time);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (timelineRef.current && duration > 0) {
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const newTime = (clickX / rect.width) * duration;
      const clampedTime = Math.max(0, Math.min(newTime, duration));
      
      handleSeek(clampedTime);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePlaybackRateChange = () => {
    const rates = [0.25, 0.5, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (videoRef.current?.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const skipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };

  const skipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    handleSeek(newTime);
  };

  // Categorize comments for visual styling
  const getCommentType = (comment: Comment) => {
    const text = comment.comment_text.toLowerCase();
    
    // Check for critical/negative indicators first (highest priority)
    if (text.includes('❌') || text.includes('critical issue') || text.includes('critical') || 
        text.includes('error') || text.includes('wrong') || text.includes('mistake') || 
        text.includes('danger') || text.includes('unsafe') || text.includes('risk') ||
        text.includes('immediately') || text.includes('stop') || text.includes('incorrect')) {
      return 'critical';
    }
    
    // Check for positive indicators
    if (text.includes('👍') || text.includes('good') || text.includes('excellent') || 
        text.includes('perfect') || text.includes('well done') || text.includes('correct') ||
        text.includes('great') || text.includes('nice') || text.includes('proper')) {
      return 'positive';
    }
    
    // Check for warning/attention indicators
    if (text.includes('⚠️') || text.includes('attention') || text.includes('careful') || 
        text.includes('improve') || text.includes('consider') || text.includes('watch') ||
        text.includes('note') || text.includes('adjust') || text.includes('modify')) {
      return 'warning';
    }
    
    // Default to neutral for general comments
    return 'neutral';
  };

  // Get icon for comment type
  const getCommentIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle size={10} className="text-green-400" />;
      case 'warning': return <AlertTriangle size={10} className="text-yellow-400" />;
      case 'critical': return <AlertTriangle size={10} className="text-red-400" />;
      default: return <MessageSquare size={10} className="text-blue-400" />;
    }
  };

  // Get color for comment type
  const getCommentColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-500 hover:bg-green-400 border-green-400';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-400 border-yellow-400';
      case 'critical': return 'bg-red-500 hover:bg-red-400 border-red-400';
      default: return 'bg-blue-500 hover:bg-blue-400 border-blue-400';
    }
  };

  // Handle timeline drag for better scrubbing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleTimelineClick(e);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTimelineDrag = (e: React.MouseEvent) => {
    if (isDragging) {
      handleTimelineClick(e);
    }
  };

  // Render modern comment annotations on timeline
  const renderAnnotations = () => {
    if (duration === 0) return null;

    return comments.map((comment) => {
      const position = (comment.timestamp / duration) * 100;
      const commentType = getCommentType(comment);
      const colorClass = getCommentColor(commentType);
      
      return (
        <div
          key={comment.name}
          className="absolute transform -translate-x-1/2 z-30"
          style={{ left: `${position}%` }}
        >
          {/* Comment Marker */}
          <div
            className={`relative cursor-pointer transition-all duration-300 transform hover:scale-125 hover:-translate-y-1 ${colorClass} border-2 rounded-lg shadow-lg`}
            style={{
              width: '16px',
              height: '32px',
              top: '8px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleSeek(comment.timestamp);
            }}
            title={`${comment.doctor_name || comment.doctor} - ${formatTime(comment.timestamp)}: Click to jump`}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              {getCommentIcon(commentType)}
              <div className="w-1 h-1 bg-white rounded-full mt-1"></div>
            </div>
            
            {/* Pulse animation for active comments */}
            <div className={`absolute inset-0 ${colorClass.split(' ')[0]} rounded-lg animate-ping opacity-30`}></div>
            
            {/* Timeline extension line */}
            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-2 ${colorClass.split(' ')[0]}`}></div>
          </div>
        </div>
      );
    });
  };

  // Render multi-timeline view with separate timelines for each comment type
  const renderMultiTimelines = () => {
    const commentTypes = [
      { type: 'critical', label: 'Critical', color: 'bg-red-500', borderColor: 'border-red-400' },
      { type: 'warning', label: 'Attention', color: 'bg-yellow-500', borderColor: 'border-yellow-400' },
      { type: 'positive', label: 'Positive', color: 'bg-green-500', borderColor: 'border-green-400' },
      { type: 'neutral', label: 'General', color: 'bg-blue-500', borderColor: 'border-blue-400' }
    ];

    return (
      <div className="space-y-4">
        {commentTypes.map((typeInfo) => {
          const typeComments = comments.filter(c => getCommentType(c) === typeInfo.type);
          
          return (
            <div key={typeInfo.type} className="space-y-2">
              {/* Timeline Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 ${typeInfo.color} rounded-full`}></div>
                  <span className="text-white text-sm font-medium">{typeInfo.label}</span>
                  <span className="text-gray-400 text-xs">({typeComments.length})</span>
                </div>
                <div className="text-gray-400 text-xs font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Individual Timeline */}
              <div className="relative">
                <div 
                  className="relative h-8 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg shadow-inner border border-gray-600 cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    if (timelineRef.current && duration > 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      const clampedTime = Math.max(0, Math.min(newTime, duration));
                      
                      handleSeek(clampedTime);
                    }
                  }}
                  onMouseMove={(e) => {
                    if (duration > 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const time = (clickX / rect.width) * duration;
                      const clampedTime = Math.max(0, Math.min(time, duration));
                      setHoverTime(clampedTime);
                    }
                  }}
                  onMouseEnter={() => setIsTimelineHovered(true)}
                  onMouseLeave={() => {
                    setIsTimelineHovered(false);
                    setHoverTime(null);
                  }}
                >
                  {/* Progress Bar */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition-all duration-200 ease-out rounded-l-lg"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>

                  {/* Comment Markers for this type only */}
                  {typeComments.map((comment) => {
                    const position = (comment.timestamp / duration) * 100;
                    
                    return (
                      <div
                        key={comment.name}
                        className="absolute transform -translate-x-1/2 z-30"
                        style={{ left: `${position}%` }}
                      >
                        <div
                          className={`relative cursor-pointer transition-all duration-300 transform hover:scale-125 hover:-translate-y-1 ${typeInfo.color} hover:${typeInfo.color.replace('bg-', 'bg-').replace('-500', '-400')} border-2 ${typeInfo.borderColor} rounded-lg shadow-lg`}
                          style={{
                            width: '12px',
                            height: '24px',
                            top: '2px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeek(comment.timestamp);
                          }}
                          title={`${comment.doctor_name || comment.doctor} - ${formatTime(comment.timestamp)}: ${comment.comment_text.substring(0, 50)}${comment.comment_text.length > 50 ? '...' : ''}`}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            {getCommentIcon(typeInfo.type)}
                          </div>
                          
                          {/* Pulse animation */}
                          <div className={`absolute inset-0 ${typeInfo.color} rounded-lg animate-ping opacity-30`}></div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Playhead for each timeline */}
                  <div
                    className="absolute top-0 w-0.5 h-full bg-red-500 z-40 pointer-events-none transition-all duration-200 ease-out shadow-lg"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-lg border border-white">
                      <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>

                  {/* Hover time indicator */}
                  {isTimelineHovered && hoverTime !== null && (
                    <div 
                      className="absolute top-0 w-px h-full bg-white/70 z-50 pointer-events-none transition-opacity duration-200"
                      style={{ left: `${(hoverTime / duration) * 100}%` }}
                    >
                      <div className="absolute -top-8 -left-6 bg-gray-900/95 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap shadow-xl border border-gray-600 z-50">
                        {formatTime(hoverTime)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Video Container */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={src}
          onLoadedData={handleLoadedData}
          onSeeked={() => onTimeUpdate(videoRef.current?.currentTime || 0)}
          controls={false}
          className="w-full h-full object-contain"
          onClick={() => onPlayPause(!isPlaying)}
        />
        
        {/* Video Overlay Info */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-white/80">{formatTime(currentTime)} / {formatTime(duration)}</div>
        </div>

        {/* Active Comment Overlay */}
        {activeComment && (
          <div className="absolute bottom-4 left-4 right-4 bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-sm text-white p-4 rounded-xl border border-white/20 shadow-2xl animate-fade-in-up z-50">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getCommentColor(getCommentType(activeComment)).split(' ')[0]}`}></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-blue-400" />
                    <span className="font-semibold text-sm">{activeComment.doctor_name || activeComment.doctor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-300 font-mono">{formatTime(activeComment.timestamp)}</span>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    getCommentType(activeComment) === 'positive' ? 'bg-green-600/30 text-green-300' :
                    getCommentType(activeComment) === 'warning' ? 'bg-yellow-600/30 text-yellow-300' :
                    getCommentType(activeComment) === 'critical' ? 'bg-red-600/30 text-red-300' :
                    'bg-blue-600/30 text-blue-300'
                  }`}>
                    {getCommentType(activeComment) === 'positive' ? 'Positive' :
                     getCommentType(activeComment) === 'warning' ? 'Attention' :
                     getCommentType(activeComment) === 'critical' ? 'Critical' :
                     'General'}
                  </div>
                </div>
                <div className="text-sm text-gray-200 leading-relaxed">
                  {activeComment.comment_text}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveComment(null);
                }}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-white/10 z-50"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Play/Pause Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          onClick={() => onPlayPause(!isPlaying)}
        >
          <div className="bg-black/50 rounded-full p-4 backdrop-blur-sm">
            {isPlaying ? (
              <Pause size={32} className="text-white" />
            ) : (
              <Play size={32} className="text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Custom Controls */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Rewind */}
          <button
            onClick={skipBackward}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
            title="Skip backward 10s"
          >
            <SkipBack size={18} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => onPlayPause(!isPlaying)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Fast Forward */}
          <button
            onClick={skipForward}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
            title="Skip forward 10s"
          >
            <SkipForward size={18} />
          </button>

          {/* Playback Speed */}
          <button
            onClick={handlePlaybackRateChange}
            className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors duration-200"
            title="Playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Display */}
          <span className="text-white font-mono text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-gray-300" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200"
            title="Fullscreen"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {/* Modern Interactive Timeline */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-6 border-t border-gray-700">
        {/* Header with enhanced stats and timeline mode toggle */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-400" />
              <span className="text-white text-lg font-semibold">Timeline & Annotations</span>
            </div>
            <div className="h-6 w-px bg-gray-600"></div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300">{comments.filter(c => getCommentType(c) === 'neutral').length} General</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">{comments.filter(c => getCommentType(c) === 'positive').length} Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300">{comments.filter(c => getCommentType(c) === 'warning').length} Attention</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-300">{comments.filter(c => getCommentType(c) === 'critical').length} Critical</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Timeline Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-700/50 p-1 rounded-lg border border-gray-600">
              <button
                onClick={() => setTimelineMode('single')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  timelineMode === 'single'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title="Single timeline with all comments"
              >
                <Minus size={12} />
                Single
              </button>
              <button
                onClick={() => setTimelineMode('multi')}
                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  timelineMode === 'multi'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title="Separate timeline for each comment type"
              >
                <LayoutGrid size={12} />
                Multi
              </button>
            </div>
            <div className="text-gray-400 text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        </div>

        {/* Timeline Container with conditional rendering */}
        <div className="relative pt-4">
          {timelineMode === 'single' ? (
            // Single Timeline (existing implementation)
            <>
              {/* Timeline Background with gradient */}
              <div 
                ref={timelineRef}
                className="relative h-16 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-xl shadow-inner border border-gray-600 cursor-pointer transition-all duration-200"
                onClick={handleTimelineClick}
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                  handleTimelineDrag(e);
                  // Calculate hover time
                  if (timelineRef.current && duration > 0) {
                    const rect = timelineRef.current.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const time = (clickX / rect.width) * duration;
                    const clampedTime = Math.max(0, Math.min(time, duration));
                    setHoverTime(clampedTime);
                  }
                }}
                onMouseUp={handleMouseUpOrLeave}
                onMouseEnter={() => setIsTimelineHovered(true)}
                onMouseLeave={() => {
                  handleMouseUpOrLeave();
                  setIsTimelineHovered(false);
                  setHoverTime(null);
                }}
                title="Click to seek to this time"
              >
                {/* Progress Bar with gradient */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition-all duration-200 ease-out rounded-l-xl"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>

                {/* Comment Annotations */}
                {renderAnnotations()}

                {/* Enhanced Playhead */}
                <div
                  className="absolute top-0 w-1 h-full bg-red-500 z-40 pointer-events-none transition-all duration-200 ease-out shadow-lg"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                >
                  {/* Playhead handle */}
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full shadow-lg border-2 border-white">
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  
                  {/* Current time tooltip */}
                  <div className="absolute -top-12 -left-8 bg-gray-900/95 text-white px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap shadow-xl border border-gray-600">
                    {formatTime(currentTime)}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
                  </div>
                </div>

                {/* Hover time indicator */}
                {isTimelineHovered && hoverTime !== null && (
                  <div 
                    className="absolute top-0 w-px h-full bg-white/70 z-50 pointer-events-none transition-opacity duration-200"
                    style={{ left: `${(hoverTime / duration) * 100}%` }}
                  >
                    {/* Hover time tooltip */}
                    <div className="absolute -top-12 -left-8 bg-gray-900/95 text-white px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap shadow-xl border border-gray-600 z-50">
                      {formatTime(hoverTime)}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Multi Timeline View
            renderMultiTimelines()
          )}
        </div>

        {/* Interactive Help Text */}
        <div className="mt-3 text-xs text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>💡 Click timeline to seek • Hover annotations for details • Drag to scrub</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Showing {comments.length} annotation{comments.length !== 1 ? 's' : ''}</span>
            {timelineMode === 'multi' && (
              <span className="text-blue-400">• Multi-timeline view</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer; 