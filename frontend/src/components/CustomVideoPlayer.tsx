import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, MessageSquare, Clock, AlertTriangle, CheckCircle, Minus, BarChart, ZoomIn, ZoomOut, RotateCcw, Scissors, Edit, Trash2 } from 'lucide-react';

interface Comment {
  name: string;
  doctor: string;
  doctor_name?: string;
  video_title: string;
  timestamp: number;
  comment_text: string;
  created_at: string;
  duration?: number; // Individual duration for each comment (in seconds)
}

interface TimelineSegment {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  color: string;
  description?: string;
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
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isTimelineHovered, setIsTimelineHovered] = useState(false);

  // Zoom functionality state
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = no zoom, 2 = 2x zoom, etc.
  const [viewportStart, setViewportStart] = useState<number>(0); // Start time of visible range
  const [isPanning, setIsPanning] = useState(false);
  const [panStartX, setPanStartX] = useState<number>(0);
  const [panStartViewport, setPanStartViewport] = useState<number>(0);

  // Calculate the duration of the visible viewport based on zoom
  const getViewportDuration = () => {
    return duration / zoomLevel;
  };

  // Calculate the end time of the visible viewport
  const getViewportEnd = () => {
    return Math.min(viewportStart + getViewportDuration(), duration);
  };

  // Ensure viewport stays within bounds
  const clampViewport = (newStart: number) => {
    const viewportDuration = getViewportDuration();
    const maxStart = Math.max(0, duration - viewportDuration);
    return Math.max(0, Math.min(newStart, maxStart));
  };

  // Auto-center viewport on current time when zooming
  useEffect(() => {
    if (zoomLevel > 1) {
      const viewportDuration = getViewportDuration();
      const newStart = Math.max(0, currentTime - viewportDuration / 2);
      setViewportStart(clampViewport(newStart));
    }
  }, [zoomLevel, duration]);

  // Auto-pan to keep current time visible
  useEffect(() => {
    if (zoomLevel > 1) {
      const viewportEnd = getViewportEnd();
      if (currentTime < viewportStart || currentTime > viewportEnd) {
        const viewportDuration = getViewportDuration();
        const newStart = Math.max(0, currentTime - viewportDuration / 2);
        setViewportStart(clampViewport(newStart));
      }
    }
  }, [currentTime, zoomLevel]);

  // Convert timeline position to time (accounting for zoom)
  const timelinePositionToTime = (position: number, rect: DOMRect) => {
    const clickX = position - rect.left;
    const percentage = clickX / rect.width;
    const viewportDuration = getViewportDuration();
    return viewportStart + (percentage * viewportDuration);
  };

  // Convert time to timeline position (accounting for zoom)
  const timeToTimelinePosition = (time: number) => {
    if (zoomLevel === 1) {
      return (time / duration) * 100;
    }
    const viewportDuration = getViewportDuration();
    return ((time - viewportStart) / viewportDuration) * 100;
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (zoomLevel < 20) { // Max 20x zoom
      setZoomLevel(prev => Math.min(20, prev * 1.5));
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1) {
      setZoomLevel(prev => Math.max(1, prev / 1.5));
      if (zoomLevel <= 1.5) {
        setZoomLevel(1);
        setViewportStart(0);
      }
    }
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
    setViewportStart(0);
  };

  // Handle pan start
  const handlePanStart = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStartX(e.clientX);
      setPanStartViewport(viewportStart);
    }
  };

  // Handle pan move
  const handlePanMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1 && timelineRef.current) {
      const deltaX = e.clientX - panStartX;
      const rect = timelineRef.current.getBoundingClientRect();
      const deltaTime = -(deltaX / rect.width) * getViewportDuration();
      const newStart = panStartViewport + deltaTime;
      setViewportStart(clampViewport(newStart));
    }
  };

  // Handle pan end
  const handlePanEnd = () => {
    setIsPanning(false);
  };

  // Handle scroll wheel zoom
  const handleTimelineWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Get mouse position on timeline for zoom focus
      const mouseTime = timelinePositionToTime(e.clientX, rect);
      
      if (e.deltaY < 0) {
        // Zoom in
        if (zoomLevel < 20) {
          const newZoomLevel = Math.min(20, zoomLevel * 1.2);
          setZoomLevel(newZoomLevel);
          
          // Center viewport on mouse position
          const newViewportDuration = duration / newZoomLevel;
          const newStart = Math.max(0, mouseTime - newViewportDuration / 2);
          setViewportStart(clampViewport(newStart));
        }
      } else {
        // Zoom out
        if (zoomLevel > 1) {
          const newZoomLevel = Math.max(1, zoomLevel / 1.2);
          setZoomLevel(newZoomLevel);
          
          if (newZoomLevel <= 1) {
            setViewportStart(0);
          } else {
            // Center viewport on mouse position
            const newViewportDuration = duration / newZoomLevel;
            const newStart = Math.max(0, mouseTime - newViewportDuration / 2);
            setViewportStart(clampViewport(newStart));
          }
        }
      }
    }
  };

  // Calculate the currently active comment based on duration spans
  const getCurrentActiveComment = () => {
    const commentDurations = getCommentDurations();
    return commentDurations.find(
      comment => currentTime >= comment.startTime && currentTime <= comment.endTime
    ) || null;
  };
  const [timelineMode, setTimelineMode] = useState<'single' | 'multi'>('single');

  // Timeline Segmentation state
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([]);
  const [showSegmentManager, setShowSegmentManager] = useState(false);
  const [editingSegment, setEditingSegment] = useState<TimelineSegment | null>(null);
  const [newSegment, setNewSegment] = useState({
    name: '',
    startTime: 0,
    endTime: 300, // Default 5 minutes
    color: 'blue',
    description: ''
  });

  // Predefined segment templates
  const segmentTemplates = [
    { name: 'Pre-Session', color: 'gray', description: 'Preparation and setup' },
    { name: 'Main Session', color: 'blue', description: 'Primary surgical procedure' },
    { name: 'Post-Session', color: 'green', description: 'Cleanup and debriefing' },
    { name: 'Critical Phase', color: 'red', description: 'High-intensity procedure' },
    { name: 'Teaching Moment', color: 'yellow', description: 'Educational discussion' },
    { name: 'Break', color: 'purple', description: 'Pause or break period' }
  ];

  // Generate unique ID for segments
  const generateSegmentId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Get segment color classes
  const getSegmentColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 border-blue-400 text-blue-100',
      green: 'bg-green-500 border-green-400 text-green-100',
      red: 'bg-red-500 border-red-400 text-red-100',
      yellow: 'bg-yellow-500 border-yellow-400 text-yellow-100',
      purple: 'bg-purple-500 border-purple-400 text-purple-100',
      gray: 'bg-gray-500 border-gray-400 text-gray-100',
      orange: 'bg-orange-500 border-orange-400 text-orange-100',
      indigo: 'bg-indigo-500 border-indigo-400 text-indigo-100'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  // Add new segment
  const handleAddSegment = () => {
    if (!newSegment.name || newSegment.startTime >= newSegment.endTime) return;
    
    const segment: TimelineSegment = {
      id: generateSegmentId(),
      name: newSegment.name,
      startTime: newSegment.startTime,
      endTime: Math.min(newSegment.endTime, duration),
      color: newSegment.color,
      description: newSegment.description
    };

    setTimelineSegments(prev => [...prev, segment].sort((a, b) => a.startTime - b.startTime));
    setNewSegment({
      name: '',
      startTime: currentTime,
      endTime: Math.min(currentTime + 300, duration), // Default 5 minutes
      color: 'blue',
      description: ''
    });
  };

  // Edit segment
  const handleEditSegment = (segment: TimelineSegment) => {
    setEditingSegment(segment);
    setNewSegment({
      name: segment.name,
      startTime: segment.startTime,
      endTime: segment.endTime,
      color: segment.color,
      description: segment.description || ''
    });
  };

  // Save edited segment
  const handleSaveSegment = () => {
    if (!editingSegment || !newSegment.name || newSegment.startTime >= newSegment.endTime) return;

    setTimelineSegments(prev => 
      prev.map(segment => 
        segment.id === editingSegment.id 
          ? {
              ...segment,
              name: newSegment.name,
              startTime: newSegment.startTime,
              endTime: Math.min(newSegment.endTime, duration),
              color: newSegment.color,
              description: newSegment.description
            }
          : segment
      ).sort((a, b) => a.startTime - b.startTime)
    );

    setEditingSegment(null);
    setNewSegment({
      name: '',
      startTime: currentTime,
      endTime: Math.min(currentTime + 300, duration),
      color: 'blue',
      description: ''
    });
  };

  // Delete segment
  const handleDeleteSegment = (segmentId: string) => {
    setTimelineSegments(prev => prev.filter(segment => segment.id !== segmentId));
  };

  // Navigate to segment
  const handleNavigateToSegment = (segment: TimelineSegment) => {
    onSeek(segment.startTime);
    
    // Auto-adjust zoom to show the segment
    if (zoomLevel === 1) {
      const segmentDuration = segment.endTime - segment.startTime;
      if (segmentDuration < duration / 4) {
        const newZoomLevel = Math.min(10, duration / segmentDuration);
        setZoomLevel(newZoomLevel);
        const newViewportDuration = duration / newZoomLevel;
        const newStart = Math.max(0, segment.startTime - newViewportDuration * 0.1);
        setViewportStart(clampViewport(newStart));
      }
    }
  };

  // Quick add segment at current time
  const handleQuickAddSegment = (template: typeof segmentTemplates[0]) => {
    const startTime = currentTime;
    const endTime = Math.min(currentTime + 300, duration); // Default 5 minutes

    const segment: TimelineSegment = {
      id: generateSegmentId(),
      name: template.name,
      startTime,
      endTime,
      color: template.color,
      description: template.description
    };

    setTimelineSegments(prev => [...prev, segment].sort((a, b) => a.startTime - b.startTime));
  };

  // Get current active segment
  const getCurrentActiveSegment = () => {
    return timelineSegments.find(
      segment => currentTime >= segment.startTime && currentTime <= segment.endTime
    ) || null;
  };

  // Update newSegment defaults when duration or current time changes
  useEffect(() => {
    if (duration > 0 && !editingSegment) {
      setNewSegment(prev => ({
        ...prev,
        startTime: currentTime,
        endTime: Math.min(currentTime + 300, duration)
      }));
    }
  }, [duration, currentTime, editingSegment]);

  // Render timeline segments
  const renderTimelineSegments = () => {
    if (duration === 0 || timelineSegments.length === 0) return null;

    const viewportEnd = getViewportEnd();

    return timelineSegments
      .filter(segment => {
        // Only show segments that are visible in current viewport
        if (zoomLevel === 1) return true;
        return segment.endTime >= viewportStart && segment.startTime <= viewportEnd;
      })
      .map((segment) => {
        const startPosition = timeToTimelinePosition(segment.startTime);
        const endPosition = timeToTimelinePosition(segment.endTime);
        const segmentWidth = Math.max(0, endPosition - startPosition);
        const isActive = currentTime >= segment.startTime && currentTime <= segment.endTime;
        const colorClasses = getSegmentColorClasses(segment.color);
        
        return (
          <div
            key={segment.id}
            className="absolute z-10"
            style={{ 
              left: `${startPosition}%`,
              width: `${segmentWidth}%`,
              top: '-20px',
              height: '16px'
            }}
          >
            <div
              className={`relative cursor-pointer transition-all duration-300 ${colorClasses} border-2 rounded-lg shadow-lg overflow-hidden group ${
                isActive ? 'ring-2 ring-white ring-opacity-60' : ''
              }`}
              style={{
                height: '16px',
                minWidth: '20px',
                opacity: 0.8
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToSegment(segment);
              }}
              title={`${segment.name} (${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}): ${segment.description || 'Click to navigate'}`}
            >
              {/* Segment content */}
              <div className="w-full h-full flex items-center justify-center px-1">
                {segmentWidth > 8 && ( // Only show text if segment is wide enough
                  <span className="text-xs font-medium truncate">
                    {segment.name}
                  </span>
                )}
              </div>
              
              {/* Active pulse animation */}
              {isActive && (
                <div className={`absolute inset-0 ${colorClasses.split(' ')[0]} rounded-lg animate-pulse opacity-40`}></div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-200 rounded-lg"></div>
            </div>
            
            {/* Segment tooltip on hover */}
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg text-xs max-w-48 text-center shadow-xl border border-gray-600">
                <div className="font-semibold mb-1">{segment.name}</div>
                <div className="text-gray-300 mb-1">
                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                </div>
                {segment.description && (
                  <div className="text-gray-200 text-left">
                    {segment.description}
                  </div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
              </div>
            </div>
          </div>
        );
      });
  };

  // For API endpoints, use the URL as-is to avoid double encoding
  const encodedSrc = React.useMemo(() => {
    // If it's an API endpoint, don't encode it
    if (src.includes('/api/method/')) {
      return src;
    }
    
    // For regular file paths, apply encoding as before
    try {
      const lastSlash = src.lastIndexOf('/');
      if (lastSlash === -1) return encodeURI(src);
      const basePath = src.substring(0, lastSlash + 1); // include slash
      const fileName = src.substring(lastSlash + 1);
      return basePath + encodeURIComponent(fileName);
    } catch {
      return encodeURI(src);
    }
  }, [src]);

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
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle video source changes
  useEffect(() => {
    // Reset duration when src changes
    setDuration(0);
    setVideoError(null); // Clear any previous errors
    if (videoRef.current) {
      videoRef.current.load(); // Force reload the video
    }
  }, [src]);

  // Set up time update interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && videoRef.current) {
      interval = setInterval(() => {
        if (videoRef.current) {
          const time = videoRef.current.currentTime;
          onTimeUpdate(time);
          
          // Check for active comments based on current time (handled by getCurrentActiveComment)
        }
      }, 100); // 10fps updates for smooth timeline
    }
    return () => clearInterval(interval);
  }, [isPlaying, onTimeUpdate, comments]);

  const handleLoadedData = () => {
    if (!videoRef.current) return;

    let videoDuration = videoRef.current.duration;



    // Some video sources (e.g. streams) may report Infinity or 0. Attempt to derive a usable
    // duration from the seekable range instead.
    if (!videoDuration || !isFinite(videoDuration)) {
      try {
        const seekable = videoRef.current.seekable;
        if (seekable && seekable.length > 0) {
          videoDuration = seekable.end(seekable.length - 1);
        }
      } catch (err) {
        console.warn('Error getting seekable range:', err);
      }
    }

    if (videoDuration && isFinite(videoDuration) && videoDuration > 0) {
      setDuration(videoDuration);
    } else {
      console.warn('Invalid duration detected:', videoDuration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      const video = videoRef.current;
      video.currentTime = time;
      onSeek(time);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    // Use the validated duration state instead of the raw element duration to avoid Infinity/0 issues
    if (!duration || !isFinite(duration)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = timelinePositionToTime(e.clientX, rect);
    const clampedTime = Math.max(0, Math.min(newTime, duration));

    // Only seek if the computed time is finite
    if (isFinite(clampedTime)) {
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
    e.preventDefault();
    if (zoomLevel > 1 && e.shiftKey) {
      // Shift+click to pan
      handlePanStart(e);
    } else {
      setIsDragging(true);
      handleTimelineClick(e);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    handlePanEnd();
  };

  const handleTimelineDrag = (e: React.MouseEvent) => {
    if (isPanning) {
      handlePanMove(e);
    } else if (isDragging) {
      handleTimelineClick(e);
    }
  };

  // Calculate duration spans for comments using individual comment durations - ALLOW OVERLAPS
  const getCommentDurations = () => {
    if (comments.length === 0) return [];
    
    // Sort comments by timestamp
    const sortedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp);
    
    return sortedComments.map((comment) => {
      const startTime = comment.timestamp;
      const commentDuration = comment.duration || 30; // Use comment's individual duration, fallback to 30s
      
      // Always use full duration - allow overlaps
      const endTime = Math.min(startTime + commentDuration, duration);
      
      return {
        ...comment,
        startTime,
        endTime,
        duration: endTime - startTime
      };
    });
  };



  // Render modern duration-based annotations on timeline with overlap support
  const renderAnnotations = () => {
    if (duration === 0) return null;

    const commentDurations = getCommentDurations();
    const viewportEnd = getViewportEnd();

    return commentDurations
      .filter(comment => {
        // Only show annotations that are visible in current viewport
        if (zoomLevel === 1) return true;
        return comment.endTime >= viewportStart && comment.startTime <= viewportEnd;
      })
      .map((comment) => {
        const startPosition = timeToTimelinePosition(comment.startTime);
        const endPosition = timeToTimelinePosition(comment.endTime);
        const spanWidth = Math.max(0, endPosition - startPosition);
        const commentType = getCommentType(comment);
        const colorClass = getCommentColor(commentType);
        const isActive = currentTime >= comment.startTime && currentTime <= comment.endTime;
        
        return (
          <div
            key={comment.name}
            className="absolute z-30"
            style={{ 
              left: `${startPosition}%`,
              width: `${spanWidth}%`,
              top: '8px'
            }}
          >
          {/* Compact Duration Bar */}
          <div
            className={`relative cursor-pointer transition-all duration-300 ${colorClass} border rounded shadow-sm overflow-hidden group ${
              isActive ? 'ring-1 ring-white ring-opacity-60' : ''
            }`}
            style={{
              height: '18px',
              minWidth: '12px'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleSeek(comment.startTime);
            }}
            title={`${comment.doctor_name || comment.doctor} - ${formatTime(comment.startTime)} to ${formatTime(comment.endTime)}`}
          >
            {/* Compact Content */}
            <div className="w-full h-full flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                {spanWidth > 15 && getCommentIcon(commentType)}
                {spanWidth > 25 && (
                  <span className="text-white text-xs font-medium truncate max-w-16">
                    {comment.doctor_name?.split(' ')[0] || comment.doctor.split('-')[0]}
                  </span>
                )}
              </div>
              {spanWidth > 20 && (
                <span className="text-white text-xs">
                  {Math.round(comment.endTime - comment.startTime)}s
                </span>
              )}
            </div>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-200"
                style={{ 
                  width: `${((currentTime - comment.startTime) / (comment.endTime - comment.startTime)) * 100}%`
                }}
              ></div>
            )}
          </div>
          
          {/* Compact Tooltip */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            <div className="bg-gray-900/95 text-white px-2 py-1 rounded text-xs max-w-48 text-center shadow-lg border border-gray-600">
              <div className="font-medium">{comment.doctor_name || comment.doctor}</div>
              <div className="text-gray-300 text-xs">
                {formatTime(comment.startTime)}-{formatTime(comment.endTime)}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
            </div>
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
      <div className="space-y-2">
        {commentTypes.map((typeInfo) => {
          const typeComments = comments.filter(c => getCommentType(c) === typeInfo.type);
          
          return (
            <div key={typeInfo.type} className="space-y-1">
              {/* Compact Timeline Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${typeInfo.color} rounded-full`}></div>
                  <span className="text-white text-xs font-medium">{typeInfo.label}</span>
                  <span className="text-gray-400 text-xs">({typeComments.length})</span>
                </div>
              </div>

              {/* Compact Individual Timeline */}
              <div className="relative">
                <div 
                  className="relative h-6 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded shadow-inner border border-gray-600 cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    if (duration > 0 && isFinite(duration)) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      const clampedTime = Math.max(0, Math.min(newTime, duration));
                      
                      // Only seek if the computed time is finite
                      if (isFinite(clampedTime)) {
                        handleSeek(clampedTime);
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                    if (duration > 0 && isFinite(duration)) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      const clampedTime = Math.max(0, Math.min(newTime, duration));
                      
                      if (isFinite(clampedTime)) {
                        handleSeek(clampedTime);
                      }
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
                    // Handle dragging
                    if (isDragging && duration > 0 && isFinite(duration)) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const newTime = (clickX / rect.width) * duration;
                      const clampedTime = Math.max(0, Math.min(newTime, duration));
                      
                      if (isFinite(clampedTime)) {
                        handleSeek(clampedTime);
                      }
                    }
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseEnter={() => setIsTimelineHovered(true)}
                  onMouseLeave={() => {
                    setIsTimelineHovered(false);
                    setHoverTime(null);
                    setIsDragging(false);
                  }}
                >
                  {/* Progress Bar */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition-all duration-200 ease-out rounded-l-lg"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>

                  {/* Duration-based Comment Markers for this type only */}
                  {getCommentDurations()
                    .filter(c => getCommentType(c) === typeInfo.type)
                    .map((comment) => {
                      const startPosition = (comment.startTime / duration) * 100;
                      const spanWidth = ((comment.endTime - comment.startTime) / duration) * 100;
                      const isActive = currentTime >= comment.startTime && currentTime <= comment.endTime;
                      
                      return (
                        <div
                          key={comment.name}
                          className="absolute z-30"
                          style={{ 
                            left: `${startPosition}%`,
                            width: `${spanWidth}%`,
                            top: '2px'
                          }}
                        >
                          <div
                            className={`relative cursor-pointer transition-all duration-300 ${typeInfo.color} border ${typeInfo.borderColor} rounded shadow-sm overflow-hidden group ${
                              isActive ? 'ring-1 ring-white ring-opacity-60' : ''
                            }`}
                            style={{
                              height: '16px',
                              minWidth: '8px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isFinite(comment.startTime)) {
                                handleSeek(comment.startTime);
                              }
                            }}
                            title={`${comment.doctor_name || comment.doctor} - ${formatTime(comment.startTime)} to ${formatTime(comment.endTime)}`}
                          >
                            {/* Compact Content for multi-timeline */}
                            <div className="w-full h-full flex items-center justify-between px-1">
                              <div className="flex items-center">
                                {spanWidth > 8 && getCommentIcon(typeInfo.type)}
                                {spanWidth > 15 && (
                                  <span className="text-white text-xs font-medium truncate ml-1 max-w-12">
                                    {comment.doctor_name?.split(' ')[0] || comment.doctor.split('-')[0]}
                                  </span>
                                )}
                              </div>
                              {spanWidth > 20 && (
                                <span className="text-white text-xs">
                                  {Math.round(comment.endTime - comment.startTime)}s
                                </span>
                              )}
                            </div>
                            
                            {/* Active indicator */}
                            {isActive && (
                              <div 
                                className="absolute bottom-0 left-0 h-0.5 bg-white transition-all duration-200"
                                style={{ 
                                  width: `${((currentTime - comment.startTime) / (comment.endTime - comment.startTime)) * 100}%`
                                }}
                              ></div>
                            )}
                          </div>
                          
                          {/* Compact tooltip for multi-timeline */}
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                            <div className="bg-gray-900/95 text-white px-2 py-1 rounded text-xs max-w-32 text-center shadow-lg border border-gray-600">
                              <div className="font-medium text-xs">{comment.doctor_name || comment.doctor}</div>
                              <div className="text-gray-300 text-xs">
                                {formatTime(comment.startTime)}-{formatTime(comment.endTime)}
                              </div>
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
                            </div>
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
                    style={{ left: `${timeToTimelinePosition(hoverTime)}%` }}
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
          key={src}
          onLoadedData={handleLoadedData}
          onLoadedMetadata={handleLoadedData}
          onCanPlay={handleLoadedData}
          onDurationChange={handleLoadedData}
          onError={(e) => {
            console.error('CustomVideoPlayer - Video error:', {
              title,
              src,
              error: e.currentTarget.error,
              readyState: e.currentTarget.readyState,
              networkState: e.currentTarget.networkState,
              errorCode: e.currentTarget.error?.code,
              errorMessage: e.currentTarget.error?.message
            });
            
            // Show user-friendly error message with specific guidance
            let errorMessage = 'Failed to load video';
            let errorDetails = '';
            
            if (e.currentTarget.error?.code === 4) {
              errorMessage = 'Video format not supported or file corrupted';
              errorDetails = 'This video file cannot be played. Please check the file format or upload a new video.';
            } else if (e.currentTarget.networkState === 3) {
              errorMessage = 'Network error loading video - Check if video API is accessible';
              errorDetails = 'Unable to connect to the video server. Please check your internet connection.';
            } else if (e.currentTarget.error?.code === 3) {
              errorMessage = 'Video file not found or access denied';
              errorDetails = 'The video file does not exist on the server. This may be due to a missing upload or incorrect filename in the session configuration.';
            }
            
            // Check if this is a missing file based on the src URL
            if (src.includes('6660998144676.mp4') || src.includes('.mp4')) {
              const filename = src.split('filename=')[1] || src.split('/').pop();
              errorMessage = 'Video file not found on server';
              errorDetails = `The video file "${filename}" does not exist. Please upload the video file or contact your administrator to fix the session configuration.`;
            }
            
            setVideoError(errorMessage + (errorDetails ? `\n${errorDetails}` : ''));
          }}

          controls={false}
          crossOrigin="anonymous"
          preload="metadata"
          playsInline
          muted={false}
          autoPlay={false}
          loop={false}
          className="w-full h-full object-contain"
          onClick={() => onPlayPause(!isPlaying)}
          style={{ 
            objectFit: 'contain',
            backgroundColor: 'black'
          }}
        >
          <source src={encodedSrc} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
          <source src={encodedSrc} type="video/mp4" />
          <source src={encodedSrc} type="video/webm; codecs=vp8,vorbis" />
          <source src={encodedSrc} type="video/webm" />
          <source src={encodedSrc} type="video/ogg; codecs=theora,vorbis" />
          <source src={encodedSrc} type="video/avi" />
          <source src={encodedSrc} type="video/quicktime" />
          <p className="text-white text-center p-4">
            Your browser doesn't support HTML5 video. Here is a{' '}
            <a href={encodedSrc} className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">
              link to the video
            </a>{' '}
            instead.
          </p>
        </video>
        
        {/* Error Overlay */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
            <div className="text-center p-8 max-w-lg">
              <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Video Load Error</h3>
              <div className="text-gray-300 mb-4 space-y-2">
                {videoError.split('\n').map((line, index) => (
                  <p key={index} className={index === 0 ? 'font-medium' : 'text-sm'}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400 font-mono break-all">
                  Source: {src}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Video: {title}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setVideoError(null);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Retry
              </button>
                {src.includes('6660998144676.mp4') && (
                  <button
                    onClick={() => {
                      // Suggest fallback to Camera 1
                      const fallbackSrc = src.replace('6660998144676.mp4', 'Compressed_cam1.mp4');
                      console.log('🔄 Attempting fallback to:', fallbackSrc);
                      if (videoRef.current) {
                        videoRef.current.src = fallbackSrc;
                        videoRef.current.load();
                        setVideoError(null);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Use Fallback Video
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Seeking Overlay */}
        {/* Removed seeking overlay as per edit hint */}
        
        {/* Video Overlay Info */}
        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md backdrop-blur-sm">
          <div className="text-xs font-medium">{title}</div>
          <div className="text-xs text-white/80">{formatTime(currentTime)} / {formatTime(duration)}</div>
        </div>

        {/* Compact Active Comment Overlay */}
        {(() => {
          const currentActiveComment = getCurrentActiveComment();
          if (!currentActiveComment) return null;
          
          const commentType = getCommentType(currentActiveComment);
          const progress = ((currentTime - currentActiveComment.startTime) / (currentActiveComment.endTime - currentActiveComment.startTime)) * 100;
          
          return (
            <div className="absolute bottom-1 left-1 right-1 bg-black/90 backdrop-blur-sm text-white p-1.5 rounded-md border border-white/20 shadow-lg z-50">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getCommentColor(commentType).split(' ')[0]}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-xs truncate">{currentActiveComment.doctor_name || currentActiveComment.doctor}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatTime(currentActiveComment.startTime)}-{formatTime(currentActiveComment.endTime)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round((currentActiveComment.endTime - currentTime))}s
                    </span>
                  </div>
                  <div className="text-xs text-gray-200 mb-0.5 line-clamp-1">
                    {currentActiveComment.comment_text}
                  </div>
                  {/* Compact progress bar */}
                  <div className="w-full bg-gray-700/50 rounded-full h-0.5">
                    <div 
                      className={`h-0.5 rounded-full transition-all duration-300 ${getCommentColor(commentType).split(' ')[0]}`}
                      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeek(currentActiveComment.endTime);
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-0.5 rounded hover:bg-white/10"
                  title="Skip"
                >
                  <SkipForward size={10} />
                </button>
              </div>
            </div>
          );
        })()}

        {/* Play/Pause Overlay */}
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          onClick={() => onPlayPause(!isPlaying)}
        >
          <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
            {isPlaying ? (
              <Pause size={24} className="text-white" />
            ) : (
              <Play size={24} className="text-white" />
            )}
          </div>
        </div>
      </div>

      {/* Custom Controls */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Rewind */}
          <button
            onClick={skipBackward}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Skip backward 10s"
          >
            <SkipBack size={16} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => onPlayPause(!isPlaying)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Fast Forward */}
          <button
            onClick={skipForward}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Skip forward 10s"
          >
            <SkipForward size={16} />
          </button>

          {/* Playback Speed */}
          <button
            onClick={handlePlaybackRateChange}
            className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors duration-200 min-h-[36px] flex items-center justify-center"
            title="Playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Display */}
          <span className="text-white font-mono text-sm font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-gray-300" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer touch-manipulation"
              style={{
                WebkitAppearance: 'none',
                height: '6px',
              }}
            />
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Fullscreen"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Modern Interactive Timeline - REDESIGNED FOR COMPACT VIEW */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-2 border-t border-gray-700">
        {/* Compact Header */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-400" />
              <span className="text-white text-sm font-medium">Timeline</span>
            </div>
            {/* Compact Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                {comments.filter(c => getCommentType(c) === 'neutral').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {comments.filter(c => getCommentType(c) === 'positive').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                {comments.filter(c => getCommentType(c) === 'warning').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                {comments.filter(c => getCommentType(c) === 'critical').length}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Compact Zoom Controls */}
            <div className="flex items-center gap-1 bg-gray-700/50 p-1 rounded-lg">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className={`p-1.5 rounded text-xs transition-colors ${
                  zoomLevel <= 1 ? 'text-gray-500' : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title="Zoom out"
              >
                <ZoomOut size={12} />
              </button>
              <span className="text-white text-xs font-mono px-2 min-w-[32px] text-center">
                {zoomLevel === 1 ? '1x' : `${zoomLevel.toFixed(1)}x`}
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 20}
                className={`p-1.5 rounded text-xs transition-colors ${
                  zoomLevel >= 20 ? 'text-gray-500' : 'text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
                title="Zoom in"
              >
                <ZoomIn size={12} />
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={handleZoomReset}
                  className="p-1.5 rounded text-xs text-yellow-400 hover:text-yellow-300 hover:bg-gray-600 transition-colors"
                  title="Reset"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>

            {/* Compact Segments Toggle */}
            <button
              onClick={() => setShowSegmentManager(!showSegmentManager)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                showSegmentManager ? 'bg-green-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:text-white'
              }`}
              title="Segments"
            >
              <Scissors size={12} />
              {timelineSegments.length > 0 && <span>{timelineSegments.length}</span>}
            </button>

            {/* Compact Timeline Mode Toggle */}
            <div className="flex bg-gray-700/50 rounded-lg overflow-hidden">
              <button
                onClick={() => setTimelineMode('single')}
                className={`px-2 py-1.5 text-xs transition-colors ${
                  timelineMode === 'single' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
                title="Single"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => setTimelineMode('multi')}
                className={`px-2 py-1.5 text-xs transition-colors ${
                  timelineMode === 'multi' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
                title="Multi"
              >
                <BarChart size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Segment Manager Panel */}
        {showSegmentManager && (
          <div className="mb-3 bg-gray-800/50 rounded-lg border border-gray-600 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-white flex items-center gap-1">
                <Scissors size={14} className="text-green-400" />
                Segments
              </h3>
            </div>

            {/* Compact Quick Add */}
            <div className="mb-2">
              <div className="flex flex-wrap gap-1 mb-2">
                {segmentTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleQuickAddSegment(template)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${getSegmentColorClasses(template.color)} hover:opacity-90`}
                    title={template.description}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Custom Form */}
            <div className="p-2 bg-gray-700/30 rounded border border-gray-600 mb-2">
              <div className="grid grid-cols-5 gap-2 mb-2">
                <input
                  type="text"
                  value={newSegment.name}
                  onChange={(e) => setNewSegment(prev => ({...prev, name: e.target.value}))}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                  placeholder="Name"
                />
                <input
                  type="number"
                  value={newSegment.startTime}
                  onChange={(e) => setNewSegment(prev => ({...prev, startTime: parseInt(e.target.value) || 0}))}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                  placeholder="Start"
                  min="0"
                  max={duration}
                />
                <input
                  type="number"
                  value={newSegment.endTime}
                  onChange={(e) => setNewSegment(prev => ({...prev, endTime: parseInt(e.target.value) || 0}))}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                  placeholder="End"
                  min={newSegment.startTime + 1}
                  max={duration}
                />
                <select
                  value={newSegment.color}
                  onChange={(e) => setNewSegment(prev => ({...prev, color: e.target.value}))}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="purple">Purple</option>
                  <option value="gray">Gray</option>
                  <option value="orange">Orange</option>
                  <option value="indigo">Indigo</option>
                </select>
                {editingSegment ? (
                  <button
                    onClick={handleSaveSegment}
                    disabled={!newSegment.name || newSegment.startTime >= newSegment.endTime}
                    className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={handleAddSegment}
                    disabled={!newSegment.name || newSegment.startTime >= newSegment.endTime}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded text-xs transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
              <input
                type="text"
                value={newSegment.description}
                onChange={(e) => setNewSegment(prev => ({...prev, description: e.target.value}))}
                className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
                placeholder="Description (optional)"
              />
            </div>

            {/* Compact Segments List */}
            {timelineSegments.length > 0 && (
              <div className="max-h-24 overflow-y-auto">
                <div className="space-y-1">
                  {timelineSegments.map((segment) => {
                    const isActive = currentTime >= segment.startTime && currentTime <= segment.endTime;
                    return (
                      <div
                        key={segment.id}
                        className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-all ${
                          isActive ? 'bg-gray-700/50 border-blue-500' : 'bg-gray-800/30 hover:bg-gray-700/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${getSegmentColorClasses(segment.color).split(' ')[0]}`}></div>
                          <span className="text-white font-medium truncate">{segment.name}</span>
                          <span className="text-gray-400 text-xs">
                            {formatTime(segment.startTime)}-{formatTime(segment.endTime)}
                          </span>
                          {isActive && <span className="px-1 bg-blue-600 text-blue-100 text-xs rounded">●</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleNavigateToSegment(segment)}
                            className="p-1 text-gray-400 hover:text-blue-400 rounded transition-colors"
                            title="Go"
                          >
                            <Play size={10} />
                          </button>
                          <button
                            onClick={() => handleEditSegment(segment)}
                            className="p-1 text-gray-400 hover:text-yellow-400 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={10} />
                          </button>
                          <button
                            onClick={() => handleDeleteSegment(segment.id)}
                            className="p-1 text-gray-400 hover:text-red-400 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact Timeline Container */}
        <div className="relative pt-2">
          {timelineMode === 'single' ? (
            // Compact Single Timeline
            <>
              {/* Compact Timeline Background */}
              <div 
                ref={timelineRef}
                className={`relative h-8 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg shadow-inner border border-gray-600 transition-all duration-200 ${
                  zoomLevel > 1 && !isDragging && !isPanning ? 'cursor-grab' : 'cursor-pointer'
                } ${isPanning ? 'cursor-grabbing' : ''}`}
                onClick={handleTimelineClick}
                onMouseDown={handleMouseDown}
                onMouseMove={(e) => {
                  handleTimelineDrag(e);
                  // Calculate hover time
                  if (duration > 0) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const time = timelinePositionToTime(e.clientX, rect);
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
                onWheel={handleTimelineWheel}
                title={zoomLevel > 1 ? "Ctrl+scroll to zoom • Shift+drag to pan • Click to seek" : "Click to seek • Ctrl+scroll to zoom"}
              >
                {/* Progress Bar with gradient */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 transition-all duration-200 ease-out rounded-l-xl"
                  style={{ width: `${timeToTimelinePosition(currentTime)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>

                {/* Timeline Segments */}
                {renderTimelineSegments()}

                {/* Comment Annotations */}
                {renderAnnotations()}

                {/* Compact Playhead */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-red-500 z-40 pointer-events-none transition-all duration-200 ease-out shadow-sm"
                  style={{ left: `${timeToTimelinePosition(currentTime)}%` }}
                >
                  {/* Compact playhead handle */}
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-sm border border-white">
                    <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                  
                  {/* Compact current time tooltip */}
                  <div className="absolute -top-8 -left-6 bg-gray-900/95 text-white px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap shadow-lg border border-gray-600">
                    {formatTime(currentTime)}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-gray-900/95"></div>
                  </div>
                </div>

                {/* Compact hover time indicator */}
                {isTimelineHovered && hoverTime !== null && (
                  <div 
                    className="absolute top-0 w-px h-full bg-white/70 z-50 pointer-events-none transition-opacity duration-200"
                    style={{ left: `${timeToTimelinePosition(hoverTime)}%` }}
                  >
                    {/* Compact hover time tooltip */}
                    <div className="absolute -top-8 -left-6 bg-gray-900/95 text-white px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap shadow-lg border border-gray-600 z-50">
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

        {/* Compact Active Segment Indicator */}
        {(() => {
          const activeSegment = getCurrentActiveSegment();
          if (!activeSegment) return null;
          
          return (
            <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-600">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getSegmentColorClasses(activeSegment.color).split(' ')[0]}`}></div>
                  <span className="text-white font-medium">{activeSegment.name}</span>
                  <span className="text-gray-400">
                    ({formatTime(activeSegment.startTime)}-{formatTime(activeSegment.endTime)})
                  </span>
                </div>
                <span className="text-gray-400">
                  {Math.round(activeSegment.endTime - currentTime)}s left
                </span>
              </div>
            </div>
          );
        })()}

        {/* Compact Help Text */}
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>Click to seek • Hover for details • Ctrl+scroll to zoom</span>
          <div className="flex items-center gap-2">
            <span>{comments.length} annotations</span>
            {timelineSegments.length > 0 && (
              <span>• {timelineSegments.length} segments</span>
            )}
            {zoomLevel > 1 && (
              <span>• {zoomLevel.toFixed(1)}x zoom</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;