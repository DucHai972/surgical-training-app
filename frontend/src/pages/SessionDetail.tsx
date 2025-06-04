import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import ReactPlayer from 'react-player';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import VideoList from '../components/VideoList';
import { ArrowLeft, Play, Pause, MessageSquare, Clock, User, Video, ClipboardCheck, Maximize2, Grid, Columns, Download, Send, Eye, Calendar, Users } from 'lucide-react';

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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isValidating && !sessionData) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  if (!sessionData || !currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center mb-6">
            <Video size={40} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Session Not Found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
            The requested session could not be found or no videos are available for viewing.
          </p>
          <Button asChild className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl">
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </Button>
        </div>
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
      <Card className={`group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden mb-6 ${isFullWidth ? 'w-full' : ''}`}>
        <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black rounded-t-lg overflow-hidden">
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
          <div className="absolute top-4 right-4">
            <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              <Eye size={14} className="inline mr-1" />
              Live
            </span>
          </div>
        </div>

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
              <Video size={18} className="text-indigo-500" />
              {video.title}
            </CardTitle>
          </div>
          {video.description && (
            <CardDescription className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {video.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Video Controls */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-indigo-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Time: <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{formatTime(videoState.currentTime)}</span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePlayPause(video.title, !videoState.isPlaying)}
              className="group bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-300 transform hover:scale-105"
            >
              {videoState.isPlaying ? (
                <><Pause size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" /> Pause</>
              ) : (
                <><Play size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" /> Play</>
              )}
            </Button>
          </div>
          
          {/* Comment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-500" />
              Add Comment
            </h3>
            
            <div className="space-y-4">
              <textarea
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                placeholder="Share your thoughts about this moment in the video..."
                value={videoState.newComment}
                onChange={(e) => handleCommentChange(video.title, e.target.value)}
                disabled={isAddingComment}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => handleAddComment(video.title)}
                  disabled={isAddingComment || !videoState.newComment.trim()}
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2 rounded-xl"
                >
                  <Send size={16} className="mr-2 group-hover:translate-x-1 transition-transform duration-300" />
                  {isAddingComment ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Comments Display */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-500" />
              Comments 
              <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full text-sm font-medium">
                {videoComments.length}
              </span>
            </h3>
            
            {videoComments.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Comments Yet</h4>
                <p className="text-gray-500 dark:text-gray-400">Be the first to share your thoughts on this video.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 p-4">
                {videoComments.map((comment, index) => (
                  <div 
                    key={comment.name} 
                    className="group p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <User size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {comment.doctor_name || comment.doctor}
                            </span>
                            <button
                              onClick={() => seekToTime(video.title, comment.timestamp)}
                              className="group/btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                            >
                              <Clock size={12} className="group-hover/btn:scale-110 transition-transform duration-300" />
                              {formatTime(comment.timestamp)}
                            </button>
                          </div>
                          {comment.created_at && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {formatDate(comment.created_at)}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Video size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {sessionData?.session.title}
                  </h1>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar size={14} />
                      <span className="text-sm">
                        {new Date(sessionData?.session.session_date || '').toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sessionData?.session.status || '')}`}>
                      {sessionData?.session.status || 'Active'}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users size={14} />
                      <span className="text-sm">{sessionData?.videos.length || 0} videos</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                {sessionData?.session.description || 'Viewing session details and training videos with interactive features.'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleExportEvaluations}
                disabled={isExporting}
                variant="outline" 
                className="group bg-blue-500/10 hover:bg-blue-500 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Download size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                {isExporting ? 'Exporting...' : 'Export JSON'}
              </Button>
              
              <Button 
                asChild 
                className="group bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Link to={`/evaluate/${sessionName}`} className="flex items-center gap-2">
                  <ClipboardCheck size={16} className="group-hover:scale-110 transition-transform duration-300" />
                  Evaluate Session
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                className="group border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Link to="/dashboard" className="flex items-center gap-2">
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Enhanced View Mode Toggles */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye size={20} className="text-indigo-500" />
              Video Viewer
            </h2>
            <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <Button
                variant={layout === 'single' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeLayout('single')}
                className={`group flex items-center gap-2 transition-all duration-300 transform hover:scale-105 rounded-lg ${
                  layout === 'single' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Maximize2 size={14} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs md:text-sm font-medium">Single</span>
              </Button>
              <Button
                variant={layout === 'side-by-side' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeLayout('side-by-side')}
                className={`group flex items-center gap-2 transition-all duration-300 transform hover:scale-105 rounded-lg ${
                  layout === 'side-by-side' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Columns size={14} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs md:text-sm font-medium">Side by Side</span>
              </Button>
              <Button
                variant={layout === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changeLayout('grid')}
                className={`group flex items-center gap-2 transition-all duration-300 transform hover:scale-105 rounded-lg ${
                  layout === 'grid' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Grid size={14} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs md:text-sm font-medium">Grid</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content based on layout */}
        {layout === 'single' && (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {renderVideoPlayer(currentVideo, true)}
            </div>
            
            {/* Enhanced Sidebar - Video List */}
            <div className="mt-8 lg:mt-0">
              <VideoList
                videos={sessionData.videos}
                currentVideo={currentVideo}
                onVideoChange={handleVideoChange}
                getVideoComments={getVideoComments}
              />
            </div>
          </div>
        )}
        
        {layout === 'side-by-side' && sessionData.videos.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sessionData.videos.slice(0, 2).map((video, index) => (
              <div key={video.title} style={{ animationDelay: `${index * 200}ms` }} className="animate-fade-in-up">
                {renderVideoPlayer(video)}
              </div>
            ))}
          </div>
        )}
        
        {layout === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sessionData.videos.map((video, index) => (
              <div key={video.title} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
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