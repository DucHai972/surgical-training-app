import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import ReactPlayer from 'react-player';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Play, Pause, MessageSquare, Clock, User, Video, ClipboardCheck, Maximize2, Grid, Columns, Download } from 'lucide-react';

interface Video {
  title: string;
  description: string;
  video_file: string;
  duration: number;
}

interface Comment {
  name: string;
  doctor: string;
  doctor_name?: string;
  video_title: string;
  timestamp: number;
  comment_text: string;
  created_at: string;
}

interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  newComment: string;
}

interface SessionData {
  session: {
    name: string;
    title: string;
    description: string;
    session_date: string;
    status: string;
  };
  videos: Video[];
  comments: Comment[];
}

const SessionDetail = () => {
  const { sessionName } = useParams<{ sessionName: string }>();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [videoPlayerStates, setVideoPlayerStates] = useState<Map<string, VideoPlayerState>>(new Map());
  const [comments, setComments] = useState<Comment[]>([]);
  const [layout, setLayout] = useState<'single' | 'grid' | 'side-by-side'>('single');
  const [isExporting, setIsExporting] = useState(false);
  const playerRefs = useRef<Map<string, ReactPlayer | null>>(new Map());

  // Fetch session data
  const { data, error, isValidating, mutate } = useFrappeGetCall(
    'surgical_training.api.session.get_session_details',
    { session_name: sessionName }
  );

  // API for adding comments
  const { call: addComment, loading: isAddingComment } = useFrappePostCall(
    'surgical_training.api.comment.add_comment'
  );

  useEffect(() => {
    if (data && typeof data === 'object' && data.message) {
      // Handle the nested structure from Frappe API
      const responseData = data.message;
      
      // Make sure responseData has the expected format
      if (responseData && responseData.message === 'Success' && responseData.data) {
        setSessionData(responseData.data);
        setComments(Array.isArray(responseData.data.comments) ? responseData.data.comments : []);
        
        // Set first video as current if available
        if (responseData.data.videos && Array.isArray(responseData.data.videos) && responseData.data.videos.length > 0) {
          setCurrentVideo(responseData.data.videos[0]);
          
          // Initialize player states for all videos
          const initialStates = new Map<string, VideoPlayerState>();
          responseData.data.videos.forEach((video: Video) => {
            initialStates.set(video.title, {
              isPlaying: false,
              currentTime: 0,
              newComment: ''
            });
          });
          setVideoPlayerStates(initialStates);
        }
      } else {
        console.error('Unexpected API response format:', responseData);
      }
    }
    
    if (error) {
      toast.error('Failed to load session details');
      console.error('Error loading session details:', error);
    }
  }, [data, error]);

  const handleProgress = (videoTitle: string, state: { playedSeconds: number }) => {
    setVideoPlayerStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(videoTitle) || {
        isPlaying: false,
        currentTime: 0,
        newComment: ''
      };
      
      newStates.set(videoTitle, {
        ...currentState,
        currentTime: state.playedSeconds
      });
      
      return newStates;
    });
  };

  // Handle seek events from clicking on the timeline
  const handleSeek = (videoTitle: string, seconds: number) => {
    setVideoPlayerStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(videoTitle) || {
        isPlaying: false,
        currentTime: 0,
        newComment: ''
      };
      
      newStates.set(videoTitle, {
        ...currentState,
        currentTime: seconds
      });
      
      return newStates;
    });
  };

  const handlePlayPause = (videoTitle: string, playing: boolean) => {
    setVideoPlayerStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(videoTitle) || {
        isPlaying: false,
        currentTime: 0,
        newComment: ''
      };
      
      newStates.set(videoTitle, {
        ...currentState,
        isPlaying: playing
      });
      
      return newStates;
    });
  };

  const handleCommentChange = (videoTitle: string, comment: string) => {
    setVideoPlayerStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(videoTitle) || {
        isPlaying: false,
        currentTime: 0,
        newComment: ''
      };
      
      newStates.set(videoTitle, {
        ...currentState,
        newComment: comment
      });
      
      return newStates;
    });
  };

  const handleVideoChange = (video: Video) => {
    setCurrentVideo(video);
    setLayout('single');
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Format date for comment timestamps
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const handleAddComment = async (videoTitle: string) => {
    const videoState = videoPlayerStates.get(videoTitle);
    if (!videoState || !videoState.newComment.trim()) return;
    
    try {
      // Pause the video
      handlePlayPause(videoTitle, false);
      
      const response = await addComment({
        session: sessionName,
        video_title: videoTitle,
        timestamp: videoState.currentTime,
        comment_text: videoState.newComment
      });
      
      if (response && response.message) {
        const responseData = response.message;
        
        if (responseData.message === 'Success') {
          toast.success('Comment added successfully');
          // Clear comment input
          handleCommentChange(videoTitle, '');
          // Refresh comments
          mutate();
        } else if (responseData.error) {
          toast.error(`Error: ${responseData.error}`);
          console.error('API Error:', responseData.error);
        }
      } else {
        toast.error('Failed to add comment: Invalid response');
        console.error('Invalid API response:', response);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const seekToTime = (videoTitle: string, timestamp: number) => {
    const playerRef = playerRefs.current.get(videoTitle);
    if (playerRef) {
      playerRef.seekTo(timestamp);
    }
  };

  // Filter comments by video title
  const getVideoComments = (videoTitle: string) => {
    return comments
      .filter(comment => comment.video_title === videoTitle)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const changeLayout = (newLayout: 'single' | 'grid' | 'side-by-side') => {
    setLayout(newLayout);
  };

  // Function to export evaluations as JSON
  const handleExportEvaluations = async () => {
    if (!sessionName) return;
    
    setIsExporting(true);
    try {
      // Get CSRF token from window
      const csrfToken = (window as any).csrf_token || '';
      
      const response = await fetch(
        `/api/method/surgical_training.surgical_training.api.evaluation.get_session_evaluations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            session_name: sessionName
          })
        }
      );
      
      const result = await response.json();
      
      if (result && result.message && result.message.message === 'Success') {
        // Create a JSON file and download it
        const exportData = result.message.data;
        const fileName = `${sessionName.replace(/\s+/g, '_')}_evaluations.json`;
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
        
        toast.success('Evaluations exported successfully');
      } else {
        toast.error('Failed to export evaluations');
        console.error('API Error:', result);
      }
    } catch (error) {
      toast.error('Failed to export evaluations');
      console.error('Error exporting evaluations:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isValidating && !sessionData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!sessionData || !currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-xl mb-4 text-gray-700 dark:text-gray-300">Session not found or no videos available.</p>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  // Render a single video with comments
  const renderVideoPlayer = (video: Video, isFullWidth = false) => {
    const videoState = videoPlayerStates.get(video.title) || {
      isPlaying: false,
      currentTime: 0,
      newComment: ''
    };
    
    const videoComments = getVideoComments(video.title);
    
    return (
      <Card className={`bg-white dark:bg-gray-800 border-0 shadow-lg overflow-hidden mb-6 ${isFullWidth ? 'w-full' : ''}`}>
        <div className="relative aspect-video bg-black">
          <ReactPlayer
            ref={(player) => {
              if (player) {
                playerRefs.current.set(video.title, player);
              }
            }}
            url={video.video_file}
            width="100%"
            height="100%"
            controls
            playing={videoState.isPlaying}
            onProgress={(state) => handleProgress(video.title, state)}
            onSeek={(seconds) => handleSeek(video.title, seconds)}
            progressInterval={500}
            onPause={() => handlePlayPause(video.title, false)}
            onPlay={() => handlePlayPause(video.title, true)}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  disablePictureInPicture: true
                }
              }
            }}
            className="absolute top-0 left-0"
          />
        </div>

        <CardHeader>
          <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
            <Video size={18} />
            {video.title}
          </CardTitle>
          {video.description && (
            <CardDescription className="text-gray-700 dark:text-gray-300">
              {video.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 px-4 py-2 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Time: {formatTime(videoState.currentTime)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlayPause(video.title, !videoState.isPlaying)}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
            >
              {videoState.isPlaying ? (
                <><Pause size={16} className="mr-1" /> Pause</>
              ) : (
                <><Play size={16} className="mr-1" /> Play</>
              )}
            </Button>
          </div>
          
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <MessageSquare size={16} className="text-indigo-500" />
            Add Comment
          </h3>
          <div className="space-y-4">
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 text-gray-900 dark:text-gray-100"
              placeholder="Add a comment at this timestamp..."
              value={videoState.newComment}
              onChange={(e) => handleCommentChange(video.title, e.target.value)}
              disabled={isAddingComment}
            />
            <div className="flex justify-end">
              <Button
                onClick={() => handleAddComment(video.title)}
                disabled={isAddingComment || !videoState.newComment.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
              >
                <MessageSquare size={16} />
                {isAddingComment ? 'Adding...' : 'Add Comment'}
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <MessageSquare size={16} className="text-indigo-500" />
              Comments ({videoComments.length})
            </h3>
            
            {videoComments.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/20 rounded-lg">
                <MessageSquare size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No comments yet for this video.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-lg">
                {videoComments.map((comment) => (
                  <div key={comment.name} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <User size={14} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {comment.doctor_name || comment.doctor}
                            </span>
                            <button
                              onClick={() => seekToTime(video.title, comment.timestamp)}
                              className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                            >
                              <Clock size={12} />
                              {formatTime(comment.timestamp)}
                            </button>
                          </div>
                          {comment.created_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(comment.created_at)}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-sm text-gray-700 dark:text-gray-300 text-left whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ __html: comment.comment_text }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Add session title and back button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sessionData?.session.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Viewing session details and videos</p>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              onClick={handleExportEvaluations}
              disabled={isExporting}
              variant="outline" 
              className="bg-blue-600 hover:bg-blue-700 border-none text-white"
            >
              <Download size={16} className="mr-2" />
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </Button>
            
            <Button 
              asChild 
              variant="default" 
              className="bg-emerald-600 hover:bg-emerald-700 border-none text-white"
            >
              <Link to={`/evaluate/${sessionName}`} className="flex items-center gap-2">
                <ClipboardCheck size={16} />
                Evaluate Session
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
            >
              <Link to="/dashboard" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
        
        {/* View mode toggles */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Video Viewer</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={layout === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLayout('single')}
              className={`flex items-center gap-1 ${layout === 'single' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <Maximize2 size={14} />
              <span className="text-xs md:text-sm">Single Video</span>
            </Button>
            <Button
              variant={layout === 'side-by-side' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLayout('side-by-side')}
              className={`flex items-center gap-1 ${layout === 'side-by-side' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <Columns size={14} />
              <span className="text-xs md:text-sm">Side by Side</span>
            </Button>
            <Button
              variant={layout === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => changeLayout('grid')}
              className={`flex items-center gap-1 ${layout === 'grid' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <Grid size={14} />
              <span className="text-xs md:text-sm">Grid View</span>
            </Button>
          </div>
        </div>
        
        {/* Content based on layout */}
        {layout === 'single' && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {renderVideoPlayer(currentVideo, true)}
            </div>
            
            {/* Sidebar - Video List */}
            <div className="mt-8 lg:mt-0 space-y-6">
              <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
                <CardHeader className="bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Video size={16} />
                    Available Videos
                  </CardTitle>
                </CardHeader>
                <div className="max-h-[300px] overflow-y-auto">
                  {sessionData.videos.map((video) => (
                    <div
                      key={video.title}
                      onClick={() => handleVideoChange(video)}
                      className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                        currentVideo.title === video.title ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <Video size={14} className={currentVideo.title === video.title ? 'text-indigo-500' : 'text-gray-400'} />
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{video.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
        
        {layout === 'side-by-side' && sessionData.videos.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessionData.videos.slice(0, 2).map(video => (
              <div key={video.title}>
                {renderVideoPlayer(video)}
              </div>
            ))}
          </div>
        )}
        
        {layout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessionData.videos.map(video => (
              <div key={video.title}>
                {renderVideoPlayer(video)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetail; 