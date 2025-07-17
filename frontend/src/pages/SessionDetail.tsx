import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappePostCall, useFrappeAuth } from 'frappe-react-sdk';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import VideoList from '../components/VideoList';
import CustomVideoPlayer from '../components/CustomVideoPlayer';

import { ArrowLeft, MessageSquare, Clock, User, Video, Download, Send, Eye, Calendar, Users, FileText, Mic, Zap, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, Trash2, Edit3, Save, X, ClipboardCheck, Target, Maximize2, Columns, Grid } from 'lucide-react';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onstart: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

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
  duration?: number;
  comment_type?: string;
  comment_text: string;
  created_at: string;
}

interface CustomTemplate {
  name: string;
  title: string;
  content: string;
  color: string;
  emoji: string;
  created: string;
  modified: string;
}

interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  newComment: string;
}

interface SessionInfo {
    name: string;
    title: string;
    description: string;
    session_date: string;
    status: string;
}

interface SessionData {
  session: SessionInfo;
  videos: Video[];
  comments: Comment[];
}

interface EvaluationData {
  identification: string;
  situation: string;
  history: string;
  examination: string;
  assessment: string;
  recommendation: string;
  grs: string;
  comment: string;
}

const SessionDetail = () => {
  const { sessionName } = useParams<{ sessionName?: string }>();
  
  // Show error if no sessionName is provided
  if (!sessionName) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Session Not Found</h2>
          <p className="text-gray-600">The session you're looking for doesn't exist or the URL is invalid.</p>
          <Link to="/">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [videoPlayerStates, setVideoPlayerStates] = useState<Map<string, VideoPlayerState>>(new Map());
  const [comments, setComments] = useState<Comment[]>([]);
  const [layout, setLayout] = useState<'single' | 'grid' | 'side-by-side'>('single');
  const [isExporting, setIsExporting] = useState(false);
  const [showQuickComment, setShowQuickComment] = useState(false);
  const [quickCommentTimestamp] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [microphonePermission, setMicrophonePermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFloatingComment, setShowFloatingComment] = useState(false);
  const [floatingCommentTimestamp, setFloatingCommentTimestamp] = useState(0);
  const [annotationDuration, setAnnotationDuration] = useState(30); // Duration in seconds
  const [annotationCommentType, setAnnotationCommentType] = useState<'auto' | 'positive' | 'warning' | 'critical' | 'neutral'>('auto');
  const [commentToDelete, setCommentToDelete] = useState<{name: string, text: string} | null>(null);
  const [editingComment, setEditingComment] = useState<{name: string, text: string} | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingDuration, setEditingDuration] = useState<{commentName: string, duration: number} | null>(null);
  const [isUpdatingDuration, setIsUpdatingDuration] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    content: '',
    color: 'blue',
    emoji: '💬'
  });
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'comment' | 'evaluation'>('comment');
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({
    identification: '',
    situation: '',
    history: '',
    examination: '',
    assessment: '',
    recommendation: '',
    grs: '',
    comment: ''
  });
  const [evaluationExpanded, setEvaluationExpanded] = useState<{[key: string]: boolean}>({});
  const videoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());

  // Get current user info
  const { currentUser: authUser } = useFrappeAuth();

  // Helper function to check if user can delete a comment
  const canDeleteComment = (_comment: Comment): boolean => {
    if (!authUser) return false;
    
    // For now, we'll use a simpler approach - allow deletion if user is logged in
    // The backend will handle the actual permission checking
    // This is just for UI display purposes
    return true; // Show delete button for all comments, backend will validate permissions
  };

  // Helper function to check if user can edit a comment
  const canEditComment = (_comment: Comment): boolean => {
    if (!authUser) return false;
    
    // For now, we'll use a simpler approach - allow editing if user is logged in
    // The backend will handle the actual permission checking
    // This is just for UI display purposes
    return true; // Show edit button for all comments, backend will validate permissions
  };

  // Check user permissions for this session
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const isAdmin = authUser === 'administrator@gmail.com';

  // Check session access
  useEffect(() => {
    const checkAccess = async () => {
      if (!authUser || !sessionName) {
        setHasAccess(false);
        return;
      }

      // Admin always has access
      if (isAdmin) {
        setHasAccess(true);
        return;
      }

      try {
        // Check if user has assigned sessions that include this one
        const response = await fetch('/api/method/surgical_training.api.session_assignment.get_user_assigned_sessions', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        
        if (result && result.message && result.message.message === 'Success') {
          const assignedSessions = result.message.data;
          const hasSessionAccess = assignedSessions.some((session: SessionInfo) => session.name === sessionName);
          setHasAccess(hasSessionAccess);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking session access:', error);
        setHasAccess(false);
      }
    };

    checkAccess();
  }, [authUser, sessionName, isAdmin]);

  // Fetch session data
  const { 
    data: apiResponse, 
    error: apiError, 
    isLoading: isLoadingSession,
    mutate: refreshSession
  } = useFrappeGetCall(
    'surgical_training.api.session.get_session_details',
    { session_name: sessionName },
    undefined,
    {
      errorRetryCount: 1, // Reduce retry attempts
      onError: (error) => {
        console.error('Error loading session details:', error);
        
        // Enhanced debugging - log all error details
        console.log('=== SESSION ERROR DETAILS ===');
        console.log('HTTP Status:', error?.httpStatus);
        console.log('Exception:', error?.exception);
        console.log('Exc Type:', error?.exc_type);
        console.log('Server Messages:', error?._server_messages);
        console.log('Full Error Object:', JSON.stringify(error, null, 2));
        
        // Try to parse server messages for more details
        if (error?._server_messages) {
          try {
            const messages = JSON.parse(error._server_messages);
            console.log('Parsed Server Messages:', messages);
            
            // Look for the specific file error
            messages.forEach((msg: any, index: number) => {
              if (typeof msg === 'string') {
                const parsedMsg = JSON.parse(msg);
                console.log(`Message ${index}:`, parsedMsg);
                if (parsedMsg.message?.includes('does not exist')) {
                  console.log('🔍 FOUND FILE ERROR:', parsedMsg.message);
                }
              }
            });
          } catch (e) {
            console.log('Could not parse server messages:', e);
          }
        }
        
        // Handle specific error types with more detailed messages
        if (error?.httpStatus === 417) {
          // Check if it's specifically a file not found issue
          if (error?._server_messages?.includes('does not exist')) {
            setError('Session videos cannot be loaded because some video files are missing from the server. Please check that all video files are properly uploaded.');
          } else {
            setError('Session data could not be loaded due to server configuration issues. The API method may not be properly configured or whitelisted.');
          }
        } else if (error?.exception?.includes('CharacterLengthExceededError')) {
          setError('The server encountered an error while logging issues with this session. This is typically caused by very long file paths or error messages. Please contact your administrator.');
        } else if (error?.exception?.includes('not whitelisted')) {
          setError('Access denied. This API method is not whitelisted. Please contact your administrator.');
        } else {
          setError('Failed to load session data. Please try again or contact support if the problem persists.');
        }
      }
    }
  );

  // API for adding comments
  const { call: addComment, loading: isAddingComment } = useFrappePostCall(
    'surgical_training.api.comment.add_comment'
  );

  // API for deleting comments
  const { call: deleteComment, loading: isDeletingComment } = useFrappePostCall(
    'surgical_training.api.comment.delete_comment'
  );

  // API for updating comments
  const { call: updateComment, loading: isUpdatingComment } = useFrappePostCall(
    'surgical_training.api.comment.update_comment'
  );

  // API for custom templates
  const { data: templatesData, mutate: mutateTemplates, error: templatesError } = useFrappeGetCall(
    'surgical_training.api.comment.get_custom_templates'
  );

  const { call: createTemplate /*, loading: isCreatingTemplate*/ } = useFrappePostCall(
    'surgical_training.api.comment.create_custom_template'
  );

  const { call: updateTemplateAPI /*, loading: isUpdatingTemplate*/ } = useFrappePostCall(
    'surgical_training.api.comment.update_custom_template'
  );

  const { call: deleteTemplate /*, loading: isDeletingTemplate*/ } = useFrappePostCall(
    'surgical_training.api.comment.delete_custom_template'
  );

  // Initialize speech recognition
  useEffect(() => {
    const initializeSpeechRecognition = () => {
      // Check for browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Configure speech recognition
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        // Handle results
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setVoiceTranscript(finalTranscript + interimTranscript);
          
          // Update the current video's comment with the transcript
          if (currentVideo && finalTranscript) {
            const currentComment = videoPlayerStates.get(currentVideo.title)?.newComment || '';
            const newComment = currentComment ? `${currentComment} ${finalTranscript}` : finalTranscript;
            handleCommentChange(currentVideo.title, newComment);
          }
        };
        
        // Handle errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          switch (event.error) {
            case 'network':
              toast.error('Network error during speech recognition');
              break;
            case 'not-allowed':
              toast.error('Microphone access denied. Please allow microphone access and try again.');
              setMicrophonePermission('denied');
              break;
            case 'no-speech':
              toast('No speech detected. Try speaking closer to the microphone.');
              break;
            case 'audio-capture':
              toast.error('No microphone found or audio capture failed');
              break;
            default:
              toast.error(`Speech recognition error: ${event.error}`);
          }
        };
        
        // Handle start
        recognition.onstart = () => {
          setIsListening(true);
          setVoiceTranscript('');
          toast.success('🎤 Listening... Speak now');
        };
        
        // Handle end
        recognition.onend = () => {
          setIsListening(false);
          setVoiceTranscript('');
        };
        
        setSpeechRecognition(recognition);
        setIsVoiceSupported(true);
      } else {
        setIsVoiceSupported(false);
        console.warn('Speech recognition not supported in this browser');
      }
    };
    
    initializeSpeechRecognition();
    
    // Check microphone permission
    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then((result) => {
        setMicrophonePermission(result.state as 'prompt' | 'granted' | 'denied');
        
        result.onchange = () => {
          setMicrophonePermission(result.state as 'prompt' | 'granted' | 'denied');
        };
      })
      .catch(() => {
        // Permissions API not supported, assume prompt
        setMicrophonePermission('prompt');
      });
  }, [currentVideo, videoPlayerStates]);

  // Voice recording functionality
  const toggleVoiceRecording = async () => {
    if (!isVoiceSupported) {
      toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (!speechRecognition) {
      toast.error('Speech recognition not initialized');
      return;
    }
    
    if (isListening) {
      // Stop recording
      speechRecognition.stop();
      setIsListening(false);
      toast('🛑 Voice recording stopped');
    } else {
      try {
        // Request microphone permission if needed
        if (microphonePermission !== 'granted') {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setMicrophonePermission('granted');
          } catch (error) {
            toast.error('Microphone access required for voice comments. Please allow access and try again.');
            setMicrophonePermission('denied');
            return;
          }
        }
        
        // Start recording
        speechRecognition.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start voice recording. Please check your microphone and try again.');
      }
    }
  };

  // Clear voice transcript
  const clearVoiceTranscript = () => {
    setVoiceTranscript('');
    if (speechRecognition && isListening) {
      speechRecognition.stop();
    }
  };

  // Insert voice transcript into comment
  const insertVoiceTranscript = () => {
    if (currentVideo && voiceTranscript.trim()) {
      const currentComment = videoPlayerStates.get(currentVideo.title)?.newComment || '';
      const newComment = currentComment ? `${currentComment} ${voiceTranscript.trim()}` : voiceTranscript.trim();
      handleCommentChange(currentVideo.title, newComment);
      setVoiceTranscript('');
      toast.success('Voice transcript added to comment');
    }
  };

  // Keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'c':
          // Don't show comment popup if Ctrl+C is pressed (user wants to copy)
          if (e.ctrlKey || e.metaKey) return;
          
          e.preventDefault();
          // Toggle comment popup - show if hidden, hide if shown
          if (showFloatingComment) {
            setShowFloatingComment(false);
          } else {
            handleFloatingComment();
          }
          break;
        case ' ':
          if (currentVideo) {
            e.preventDefault();
            const videoState = videoPlayerStates.get(currentVideo.title);
            if (videoState) {
              handlePlayPause(currentVideo.title, !videoState.isPlaying);
            }
          }
          break;
        case 'escape':
          setShowQuickComment(false);
          setShowFloatingComment(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideo, videoPlayerStates, showFloatingComment]);

  useEffect(() => {
    if (apiResponse && typeof apiResponse === 'object' && apiResponse.message) {
      // Handle the nested structure from Frappe API
      const responseData = apiResponse.message;
      
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
    
    if (apiError) {
      toast.error('Failed to load session details');
      console.error('Error loading session details:', apiError);
    }
  }, [apiResponse, apiError]);

  // Load custom templates
  useEffect(() => {
    if (templatesError) {
      console.warn('Error loading custom templates:', templatesError);
      setCustomTemplates([]); // Fallback to empty array on error
      return;
    }
    
    if (templatesData) {
      // Handle different response structures
      if (Array.isArray(templatesData)) {
        setCustomTemplates(templatesData);
      } else if (templatesData.message && Array.isArray(templatesData.message)) {
        setCustomTemplates(templatesData.message);
      } else if (templatesData.data && Array.isArray(templatesData.data)) {
        setCustomTemplates(templatesData.data);
      } else {
        console.warn('Unexpected templates data structure:', templatesData);
        setCustomTemplates([]); // Fallback to empty array
      }
    }
  }, [templatesData, templatesError]);

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

  // Floating comment functionality
  const handleFloatingComment = (timestamp?: number) => {
    if (currentVideo) {
      const videoState = videoPlayerStates.get(currentVideo.title);
      if (videoState) {
        setFloatingCommentTimestamp(timestamp || videoState.currentTime);
        // Reset annotation settings to defaults
        setAnnotationDuration(30);
        setAnnotationCommentType('auto');
        setShowFloatingComment(true);
        // Pause video for commenting
        handlePlayPause(currentVideo.title, false);
      }
    }
  };

  const handleAddComment = async (videoTitle: string, customTimestamp?: number, customDuration?: number, customCommentType?: string) => {
    const videoState = videoPlayerStates.get(videoTitle);
    if (!videoState || !videoState.newComment.trim()) return;
    
    try {
      // Store current time before adding comment
      const currentTime = customTimestamp !== undefined ? customTimestamp : videoState.currentTime;
      
      // Pause the video
      handlePlayPause(videoTitle, false);
      
      // Prepare comment data with duration and type if provided
      const commentData: any = {
        session: sessionName,
        video_title: videoTitle,
        timestamp: currentTime,
        comment_text: videoState.newComment
      };
      
      // Add duration if provided
      if (customDuration !== undefined) {
        commentData.duration = customDuration;
      }
      
      // Add comment type if provided (not auto-detect)
      if (customCommentType && customCommentType !== 'auto') {
        commentData.comment_type = customCommentType;
      }
      
      const response = await addComment(commentData);
      
      if (response && response.message) {
        const responseData = response.message;
        
        if (responseData.message === 'Success') {
          toast.success('Comment added successfully');
          // Clear comment input
          handleCommentChange(videoTitle, '');
          // Refresh comments
          await refreshSession();
          
          // Restore video position after comment is added
          setVideoPlayerStates(prevStates => {
            const newStates = new Map(prevStates);
            const currentState = newStates.get(videoTitle) || {
              isPlaying: false,
              currentTime: 0,
              newComment: ''
            };
            
            newStates.set(videoTitle, {
              ...currentState,
              currentTime: currentTime
            });
            
            return newStates;
          });
          
          // Update video position
          const videoRef = videoRefs.current.get(videoTitle);
          if (videoRef) {
            videoRef.currentTime = currentTime;
          }
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

  const handleDeleteComment = async (commentName: string, _commentText: string) => {
    // Store current time before deleting
    let currentTime = 0;
    if (currentVideo) {
      const videoState = videoPlayerStates.get(currentVideo.title);
      if (videoState) currentTime = videoState.currentTime;
    }
    try {
      const response = await deleteComment({
        comment_name: commentName
      });
      if (response && response.message) {
        const responseData = response.message;
        if (responseData.message === 'Success') {
          toast.success('Comment deleted successfully');
          // Refresh comments
          await refreshSession();
          // Restore video position after comment is deleted
          if (currentVideo) {
            setVideoPlayerStates(prevStates => {
              const newStates = new Map(prevStates);
              const currentState = newStates.get(currentVideo.title) || {
                isPlaying: false,
                currentTime: 0,
                newComment: ''
              };
              newStates.set(currentVideo.title, {
                ...currentState,
                currentTime: currentTime
              });
              return newStates;
            });
            const videoRef = videoRefs.current.get(currentVideo.title);
            if (videoRef) {
              videoRef.currentTime = currentTime;
            }
          }
          setCommentToDelete(null);
        } else if (responseData.error) {
          toast.error(`Error: ${responseData.error}`);
          console.error('API Error:', responseData.error);
        }
      } else {
        toast.error('Failed to delete comment: Invalid response');
        console.error('Invalid API response:', response);
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment({ name: comment.name, text: comment.comment_text });
    setEditCommentText(comment.comment_text);
  };

  const handleSaveComment = async () => {
    if (!editingComment) return;
    // Store current time before editing
    let currentTime = 0;
    if (currentVideo) {
      const videoState = videoPlayerStates.get(currentVideo.title);
      if (videoState) currentTime = videoState.currentTime;
    }
    try {
      const response = await updateComment({
        comment_name: editingComment.name,
        comment_text: editCommentText
      });
      if (response && response.message) {
        const responseData = response.message;
        if (responseData.message === 'Success') {
          toast.success('Comment updated successfully');
          // Refresh comments
          await refreshSession();
          // Clear editing state
          setEditingComment(null);
          setEditCommentText('');
          // Restore video position after comment is edited
          if (currentVideo) {
            setVideoPlayerStates(prevStates => {
              const newStates = new Map(prevStates);
              const currentState = newStates.get(currentVideo.title) || {
                isPlaying: false,
                currentTime: 0,
                newComment: ''
              };
              newStates.set(currentVideo.title, {
                ...currentState,
                currentTime: currentTime
              });
              return newStates;
            });
            const videoRef = videoRefs.current.get(currentVideo.title);
            if (videoRef) {
              videoRef.currentTime = currentTime;
            }
          }
        } else if (responseData.error) {
          toast.error(`Error: ${responseData.error}`);
          console.error('API Error:', responseData.error);
        }
      } else {
        toast.error('Failed to update comment: Invalid response');
        console.error('Invalid API response:', response);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditCommentText('');
  };

  const handleEditDuration = (comment: Comment) => {
    setEditingDuration({ commentName: comment.name, duration: comment.duration || 30 });
  };

  const handleSaveDuration = async () => {
    if (!editingDuration) return;

    setIsUpdatingDuration(true);
    try {
      console.log('Updating duration for comment:', editingDuration.commentName, 'to:', editingDuration.duration);
      
      const response = await fetch('/api/method/surgical_training.api.comment.update_comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          comment_name: editingDuration.commentName,
          duration: editingDuration.duration.toString()
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('API Response:', result);
      
      // Handle Frappe API response structure properly
      const apiResult = result.message || result;
      
      if (response.ok && apiResult.message === 'Success') {
        console.log('Duration updated successfully!');
        // Update local comments state
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.name === editingDuration.commentName 
              ? { ...comment, duration: editingDuration.duration }
              : comment
          )
        );
        setEditingDuration(null);
        alert('Duration updated successfully!');
      } else {
        // Handle error cases
        const errorMessage = apiResult.error || apiResult.message || 'Failed to update duration';
        console.error('Error updating duration:', errorMessage);
        alert(`Failed to update duration: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating duration:', error);
      alert('Failed to update duration: Network error');
    } finally {
      setIsUpdatingDuration(false);
    }
  };

  const handleCancelDurationEdit = () => {
    setEditingDuration(null);
  };

  // Custom Template Management Functions
  const handleCreateTemplate = async () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    try {
      await createTemplate({
        title: newTemplate.title.trim(),
        content: newTemplate.content.trim(),
        color: newTemplate.color,
        emoji: newTemplate.emoji
      });
      
      toast.success('Template created successfully!');
      setNewTemplate({ title: '', content: '', color: 'blue', emoji: '💬' });
      mutateTemplates(); // Refresh templates
    } catch (error) {
      console.error('Error creating template:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        toast.error(`Failed to create template: ${error.message}`);
      } else {
        toast.error('Failed to create template. The template feature may not be available yet.');
      }
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !editingTemplate.title.trim() || !editingTemplate.content.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    try {
      await updateTemplateAPI({
        template_name: editingTemplate.name,
        title: editingTemplate.title.trim(),
        content: editingTemplate.content.trim(),
        color: editingTemplate.color,
        emoji: editingTemplate.emoji
      });
      
      toast.success('Template updated successfully!');
      setEditingTemplate(null);
      mutateTemplates(); // Refresh templates
    } catch (error) {
      toast.error('Failed to update template');
      console.error('Error updating template:', error);
    }
  };

  const handleDeleteTemplate = async (templateName: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await deleteTemplate({ template_name: templateName });
      toast.success('Template deleted successfully!');
      mutateTemplates(); // Refresh templates
    } catch (error) {
      toast.error('Failed to delete template');
      console.error('Error deleting template:', error);
    }
  };

  const handleEditTemplate = (template: CustomTemplate) => {
    setEditingTemplate({ ...template });
  };

  const handleCancelTemplateEdit = () => {
    setEditingTemplate(null);
  };

  // Evaluation handling functions
  const handleEvaluationChange = (field: keyof EvaluationData, value: string) => {
    setEvaluationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleEvaluationExpanded = (category: string) => {
    setEvaluationExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const resetEvaluationForm = () => {
    setEvaluationData({
      identification: '',
      situation: '',
      history: '',
      examination: '',
      assessment: '',
      recommendation: '',
      grs: '',
      comment: ''
    });
    setEvaluationExpanded({});
  };

  const getEvaluationLabel = (category: string, value: string) => {
    const labels: {[key: string]: {[key: string]: string}} = {
      identification: {
        '0': 'Requires direct prompting',
        '1': 'Introduces after hint',
        '2': 'Incomplete introduction',
        '3': 'Complete introduction'
      },
      situation: {
        '0': 'Unable to identify problems',
        '1': 'After extended prompting',
        '2': 'With few prompts',
        '3': 'Unprompted identification'
      },
      history: {
        '0': 'Unstructured/irrelevant',
        '1': 'Needs clarification',
        '2': 'Few questions needed',
        '3': 'Comprehensive history'
      },
      examination: {
        '0': 'Omitted/irrelevant',
        '1': 'Needs clarification',
        '2': 'Few questions needed',
        '3': 'Comprehensive observations'
      },
      assessment: {
        '0': 'No logical assessment',
        '1': 'After extended questioning',
        '2': 'After minimal questioning',
        '3': 'Comprehensive assessment'
      },
      recommendation: {
        '0': 'No clear recommendation',
        '1': 'After extended questioning',
        '2': 'After minimal questioning',
        '3': 'Without questioning'
      },
      grs: {
        '0': 'Not confident',
        '1': 'Extended questioning',
        '2': 'Some questioning',
        '3': 'Little/no questioning'
      }
    };
    return labels[category]?.[value] || 'Not selected';
  };

  const handleAddEvaluation = async () => {
    if (!currentVideo) return;

    // Check if at least one evaluation field is filled
    const evaluationFields = ['identification', 'situation', 'history', 'examination', 'assessment', 'recommendation', 'grs'];
    const filledFields = evaluationFields.filter(field => evaluationData[field as keyof EvaluationData]);

    if (filledFields.length === 0) {
      toast.error('Please complete at least one evaluation criteria');
      return;
    }

    try {
      // Calculate total score only for filled fields
      const filledScores = evaluationFields
        .filter(field => evaluationData[field as keyof EvaluationData])
        .map(field => parseInt(evaluationData[field as keyof EvaluationData]));
      const totalScore = filledScores.reduce((sum, score) => sum + score, 0);
      const maxPossibleScore = filledFields.length * 3;
      
      // Create a concise evaluation summary for comment text with special marker
      const evaluationLines = [
        '[EVALUATION]', // Special marker for timeline identification
        `📊 PERFORMANCE EVALUATION - ${sessionName}`,
        `⏰ Timestamp: ${formatTime(floatingCommentTimestamp)}`,
        '',
        '📋 COMPLETED ASSESSMENTS:'
      ];

      // Add only filled evaluation fields
      evaluationFields.forEach(field => {
        const value = evaluationData[field as keyof EvaluationData];
        if (value) {
          const fieldNames = {
            identification: 'Identification',
            situation: 'Situation',
            history: 'History',
            examination: 'Examination',
            assessment: 'Assessment',
            recommendation: 'Recommendation',
            grs: 'Global Rating'
          };
          evaluationLines.push(`• ${fieldNames[field as keyof typeof fieldNames]}: ${value}/3 (${getEvaluationLabel(field, value)})`);
        }
      });

      evaluationLines.push('');
      evaluationLines.push(`📈 PARTIAL SCORE: ${totalScore}/${maxPossibleScore} (${filledFields.length}/${evaluationFields.length} criteria completed)`);
      
      if (evaluationData.comment) {
        evaluationLines.push('');
        evaluationLines.push(`💬 ADDITIONAL NOTES: ${evaluationData.comment}`);
      }

      const evaluationSummary = evaluationLines.join('\n');

      // Check if the summary is too long and truncate if necessary
      const maxLength = 2000; // Reasonable limit for comment text
      const finalSummary = evaluationSummary.length > maxLength 
        ? evaluationSummary.substring(0, maxLength - 50) + '... [TRUNCATED]'
        : evaluationSummary;

      // Store current time before adding evaluation
      const currentTime = floatingCommentTimestamp;
      
      const response = await addComment({
        session: sessionName,
        video_title: currentVideo.title,
        timestamp: currentTime,
        comment_text: finalSummary
      });
      
      if (response && response.message) {
        const responseData = response.message;
        
        if (responseData.message === 'Success') {
          toast.success('Evaluation added successfully');
          // Reset form and close modal
          resetEvaluationForm();
          setShowFloatingComment(false);
          // Refresh comments
          await refreshSession();
        } else if (responseData.error) {
          toast.error(`Error: ${responseData.error}`);
          console.error('API Error:', responseData.error);
        }
      } else {
        toast.error('Failed to add evaluation: Invalid response');
        console.error('Invalid API response:', response);
      }
    } catch (error) {
      console.error('Error adding evaluation:', error);
      
      // Enhanced error handling
      if (error && typeof error === 'object') {
        if ('exception' in error) {
          const errorMsg = error.exception as string;
          if (errorMsg.includes('ValidationError')) {
            toast.error('Validation Error: Please check your evaluation data');
          } else if (errorMsg.includes('PermissionError')) {
            toast.error('Permission Error: You may not have access to add evaluations');
          } else {
            toast.error('Server Error: Please try again or contact support');
          }
        } else if ('message' in error) {
          toast.error(`Error: ${error.message}`);
        } else {
          toast.error('Failed to add evaluation: Unknown error');
        }
      } else {
        toast.error('Failed to add evaluation: Network or connection error');
      }
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-700 border-blue-200 hover:bg-blue-50',
      green: 'text-green-700 border-green-200 hover:bg-green-50',
      yellow: 'text-yellow-700 border-yellow-200 hover:bg-yellow-50',
      red: 'text-red-700 border-red-200 hover:bg-red-50',
      purple: 'text-purple-700 border-purple-200 hover:bg-purple-50',
      indigo: 'text-indigo-700 border-indigo-200 hover:bg-indigo-50',
      pink: 'text-pink-700 border-pink-200 hover:bg-pink-50',
      gray: 'text-gray-700 border-gray-200 hover:bg-gray-50'
    };
    return colorMap[color] || colorMap.blue;
  };

  // Helper function to check if a comment is an evaluation
  const isEvaluationComment = (comment: Comment) => {
    return comment.comment_text.startsWith('[EVALUATION]');
  };

  // Helper function to format evaluation comment for display
  const formatEvaluationDisplay = (commentText: string) => {
    // Remove the [EVALUATION] marker and format for display
    return commentText.replace('[EVALUATION]\n', '').trim();
  };

  const seekToTime = (videoTitle: string, timestamp: number) => {
    const videoRef = videoRefs.current.get(videoTitle);
    if (videoRef) {
      videoRef.currentTime = timestamp;
    }
  };

  // Filter comments by video title
  const getVideoComments = (videoTitle: string) => {
    const videoComments = comments.filter(comment => comment.video_title === videoTitle);
    
    // Debug: Log if we're looking for a video that doesn't exist
    if (videoComments.length === 0 && comments.length > 0) {
      const existingVideoTitles = sessionData?.videos.map(v => v.title) || [];
      if (!existingVideoTitles.includes(videoTitle)) {
        console.log(`API Error: Video with title '${videoTitle}' not found in session ${sessionName}`);
        console.log('Available videos:', existingVideoTitles);
        console.log('Comments with missing video references:', 
          comments.filter(c => !existingVideoTitles.includes(c.video_title))
        );
      }
    }
    
    return videoComments.sort((a, b) => a.timestamp - b.timestamp);
  };

  const changeLayout = (newLayout: 'single' | 'grid' | 'side-by-side') => {
    setLayout(newLayout);
  };

  // Sync all videos to the same timeline
  const syncVideosToReference = (referenceVideo: Video) => {
    if (!sessionData) {
      toast.error('No session data available for synchronization');
      return;
    }

    // Get the current time from the reference video
    const referenceTime = videoPlayerStates.get(referenceVideo.title)?.currentTime || 0;
    
    // Get all videos to sync (based on current layout)
    let videosToSync: Video[] = [];
    if (layout === 'side-by-side') {
      videosToSync = sessionData.videos.slice(0, 2);
    } else if (layout === 'grid') {
      videosToSync = sessionData.videos;
    } else {
      toast.error('Sync is only available in Side by Side or Grid mode');
      return;
    }

    if (videosToSync.length <= 1) {
      toast.error('Need at least 2 videos to synchronize');
      return;
    }

    // Sync all other videos to the reference time
    let syncedCount = 0;
    videosToSync.forEach((video) => {
      if (video.title !== referenceVideo.title) {
        handleSeek(video.title, referenceTime);
        syncedCount++;
      }
    });

    toast.success(`Synchronized ${syncedCount} video${syncedCount !== 1 ? 's' : ''} to ${referenceVideo.title} at ${formatTime(referenceTime)}`);
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

  // Check if access check is still pending
  if (hasAccess === null) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    );
  }

  // Check if user has access to this session
  if (hasAccess === false) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-red-50/30 to-orange-50/50">
        <div className="text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-6">
            <AlertCircle size={40} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            You don't have permission to access this training session. Please contact your administrator to request access.
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

  if (isLoadingSession && !apiResponse) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse mx-auto">
            <Video className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Loading Session...</h2>
            <p className="text-gray-600">Please wait while we load your session data.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center space-y-4 max-w-lg">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Session</h2>
          <p className="text-gray-600">{error}</p>
          

          
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Button onClick={() => {
              setError(null);
              refreshSession();
            }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!apiResponse || !currentVideo) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-6">
            <Video size={40} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h3>
          <p className="text-gray-600 mb-6 max-w-md">
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
  const renderVideoPlayer = (video: Video) => {
    if (!video) return null;

    const videoState = videoPlayerStates.get(video.title);
    if (!videoState) return null;
    
    // Debug: video data
    // console.log('renderVideoPlayer - video data:', video);
    
    const videoComments = getVideoComments(video.title);
    
    return (
      <Card className="bg-white border border-gray-200 shadow-lg overflow-hidden relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
          <CardTitle className="text-xl text-gray-900">
            {video.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {video.description}
          </CardDescription>
            </div>
            
            {/* Sync Button - Only show in multi-video modes */}
            {(layout === 'side-by-side' || layout === 'grid') && sessionData && sessionData.videos.length >= 2 && (
              <Button
                onClick={() => syncVideosToReference(video)}
                variant="outline"
                size="lg"
                className="group flex items-center gap-3 transition-all duration-300 transform hover:scale-105 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-700 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 shadow-md hover:shadow-lg ml-4 px-6 py-4 min-h-[56px]"
                title={`Sync all other videos to this video's timeline`}
              >
                <Zap size={18} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base font-medium">Sync</span>
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Enhanced Video Player with Floating Comment Integration */}
          <div className="relative space-y-4">
            <CustomVideoPlayer
              src={video.video_file && video.video_file.trim() 
                ? video.video_file  // Use the path as-is from the backend
                : '/files/placeholder.mp4'  // fallback for missing video
              }
              title={video.title}
              comments={videoComments.map(comment => ({
                ...comment,
                isEvaluation: isEvaluationComment(comment)
              }))}
              isPlaying={videoState.isPlaying}
              currentTime={videoState.currentTime}
              onTimeUpdate={(time) => handleProgress(video.title, { playedSeconds: time })}
              onPlayPause={(playing) => handlePlayPause(video.title, playing)}
              onSeek={(time) => handleSeek(video.title, time)}

          />
            
            {/* Floating Quick Comment Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <MessageSquare size={20} className="text-white" />
        </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quick Comment</h3>
                    <p className="text-base text-gray-600">
                      Press 'C' to add annotation at current moment
                    </p>
          </div>
            </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white px-4 py-3 rounded-full border border-gray-200">
                    <span className="text-base font-mono text-gray-700">
                      {formatTime(videoState.currentTime)}
                </span>
                    </div>
                        <Button
                    onClick={() => handleFloatingComment()}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-h-[56px]"
                  >
                    <MessageSquare size={18} className="mr-2" />
                    Comment
                        </Button>
                </div>
                      </div>
                      
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-base text-gray-600 mr-2">Quick templates:</span>
                          <Button
                  onClick={() => {
                    handleCommentChange(video.title, '👍 Good technique');
                    handleFloatingComment();
                  }}
                            variant="outline"
                  size="lg"
                  className="text-green-700 border-green-200 hover:bg-green-50 px-6 py-4 text-base min-h-[56px] rounded-xl"
                          >
                  👍 Good
                          </Button>
                          <Button
                  onClick={() => {
                    handleCommentChange(video.title, '⚠️ Needs attention');
                    handleFloatingComment();
                  }}
                            variant="outline"
                  size="lg"
                  className="text-yellow-700 border-yellow-200 hover:bg-yellow-50 px-6 py-4 text-base min-h-[56px] rounded-xl"
                          >
                  ⚠️ Attention
                          </Button>
                        <Button
                  onClick={() => {
                    handleCommentChange(video.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.');
                    handleFloatingComment();
                  }}
                          variant="outline"
                  size="lg"
                  className="text-red-700 border-red-200 hover:bg-red-50 px-6 py-4 text-base min-h-[56px] rounded-xl"
                        >
                  ❌ Critical
                        </Button>
                        <Button
                  onClick={() => {
                    handleCommentChange(video.title, '');
                    handleFloatingComment();
                  }}
                          variant="outline"
                  size="lg"
                  className="text-blue-700 border-blue-200 hover:bg-blue-50 px-6 py-4 text-base min-h-[56px] rounded-xl"
                        >
                  ✏️ Custom
                        </Button>
              </div>
                      </div>
                    </div>
                    
          
          {/* Compact Comment History Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-500" />
                Comment History
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
                  {videoComments.length}
                </span>
              </h3>
                <Button
                onClick={() => handleFloatingComment()}
                variant="outline"
                size="sm"
                className="text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                <MessageSquare size={14} className="mr-1" />
                Add Comment
                </Button>
            </div>
          </div>
          
          {/* Comments Display */}
          <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-blue-500" />
              Comments 
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
                {videoComments.length}
              </span>
            </h3>
            
            {videoComments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Comments Yet</h4>
                <p className="text-gray-500">Be the first to share your thoughts on this video.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar border border-gray-200 rounded-xl bg-gray-50/50 p-4">
                {videoComments.map((comment, index) => {
                  const isEvaluation = isEvaluationComment(comment);
                  
                  return (
                  <div 
                    key={comment.name} 
                    className={`group p-4 rounded-xl border transition-all duration-300 transform hover:-translate-y-1 ${
                      isEvaluation 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:shadow-lg hover:shadow-green-100' 
                        : 'bg-white border-gray-100 hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                        isEvaluation 
                          ? 'bg-gradient-to-br from-green-600 to-emerald-600' 
                          : 'bg-blue-600'
                      }`}>
                        {isEvaluation ? (
                          <ClipboardCheck size={16} className="text-white" />
                        ) : (
                        <User size={16} className="text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-semibold text-gray-900">
                              {comment.doctor_name || comment.doctor}
                            </span>
                            {isEvaluation && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <ClipboardCheck size={10} />
                                Evaluation
                              </span>
                            )}
                            <button
                              onClick={() => seekToTime(video.title, comment.timestamp)}
                              className={`group/btn px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                                isEvaluation 
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              <Clock size={12} className="group-hover/btn:scale-110 transition-transform duration-300" />
                              {formatTime(comment.timestamp)}
                            </button>
                            
                            {/* Duration Display with Edit Functionality */}
                            {editingDuration?.commentName === comment.name ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-white border border-orange-300 rounded-full px-2 py-1">
                                                                     <Clock size={12} className="text-orange-600" />
                                  <input
                                    type="number"
                                    min="1"
                                    max="600"
                                    value={editingDuration.duration}
                                    onChange={(e) => setEditingDuration(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 30 } : null)}
                                    className="w-12 bg-transparent text-xs font-medium text-orange-700 border-none outline-none text-center"
                                    disabled={isUpdatingDuration}
                                  />
                                  <span className="text-xs text-orange-700">s</span>
                                </div>
                                <button
                                  onClick={handleSaveDuration}
                                  disabled={isUpdatingDuration}
                                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                                  title="Save duration"
                                >
                                  <Save size={12} />
                                </button>
                                <button
                                  onClick={handleCancelDurationEdit}
                                  disabled={isUpdatingDuration}
                                  className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                                  title="Cancel"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditDuration(comment)}
                                className={`group/duration px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm transition-all hover:shadow-md ${
                                  isEvaluation 
                                    ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                                    : 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200'
                                }`}
                                title="Click to edit duration"
                              >
                                                                 <Clock size={12} className="group-hover/duration:scale-110 transition-transform duration-200" />
                                {comment.duration || 30}s
                                <Edit3 size={10} className="opacity-0 group-hover/duration:opacity-100 transition-opacity duration-200" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                          {comment.created_at && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {formatDate(comment.created_at)}
                            </span>
                          )}
                            {canEditComment(comment) && (
                              <button
                                onClick={() => handleEditComment(comment)}
                                disabled={isUpdatingComment || editingComment?.name === comment.name}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                                title="Edit comment"
                              >
                                <Edit3 size={14} />
                              </button>
                          )}
                            {canDeleteComment(comment) && (
                              <button
                                onClick={() => setCommentToDelete({ name: comment.name, text: comment.comment_text })}
                                disabled={isDeletingComment}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                title="Delete comment"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Comment content - show editing interface if this comment is being edited */}
                        {editingComment?.name === comment.name ? (
                          <div className="space-y-3">
                            <textarea
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-blue-200 bg-blue-50/50 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-3 py-2 text-gray-900 placeholder-gray-500 transition-all duration-300 resize-none"
                              placeholder="Edit your comment..."
                              disabled={isUpdatingComment}
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={handleCancelEdit}
                                variant="outline"
                                size="sm"
                                disabled={isUpdatingComment}
                                className="text-gray-600 border-gray-200 hover:bg-gray-50"
                              >
                                <X size={12} className="mr-1" />
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSaveComment}
                                size="sm"
                                disabled={isUpdatingComment || !editCommentText.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Save size={12} className="mr-1" />
                                {isUpdatingComment ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                        <div
                          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words"
                          dangerouslySetInnerHTML={{ 
                            __html: isEvaluation 
                              ? formatEvaluationDisplay(comment.comment_text)
                              : comment.comment_text 
                          }}
                        />
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Enhanced Header Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                  <Video size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {sessionData?.session.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={14} />
                      <span className="text-sm">
                        {new Date(sessionData?.session.session_date || '').toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sessionData?.session.status || '')}`}>
                      {sessionData?.session.status || 'Active'}
                    </span>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={14} />
                      <span className="text-sm">{sessionData?.videos.length || 0} videos</span>
                    </div>
                    {/* Compact Description Preview */}
                    {sessionData?.session.description && (
                      <Button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 h-auto rounded-full transition-all duration-200"
                        title={showFullDescription ? 'Hide session details' : 
                          `${sessionData.session.description.replace(/<[^>]*>/g, '').substring(0, 100)}${sessionData.session.description.length > 100 ? '...' : ''}`}
                      >
                        <Info size={12} className="mr-1" />
                        <span className="text-xs font-medium">
                          {showFullDescription ? 'Less' : 'Details'}
                        </span>
                        {showFullDescription ? (
                          <ChevronUp size={12} className="ml-1" />
                        ) : (
                          <ChevronDown size={12} className="ml-1" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Collapsible Session Description */}
              {showFullDescription && sessionData?.session.description && (
                <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm transition-all duration-300 ease-in-out animate-fade-in-up">
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <FileText size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        Session Overview
                        <span className="h-1 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></span>
                      </h3>
                  <div 
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                          __html: sessionData.session.description
                    }}
                  />
                </div>
                    <Button
                      onClick={() => setShowFullDescription(false)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-600 hover:bg-white/50 p-2 h-auto rounded-full transition-all duration-200"
                      title="Close description"
                    >
                      ✕
                    </Button>
              </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleExportEvaluations}
                disabled={isExporting}
                variant="outline" 
                className="group bg-blue-500/10 hover:bg-blue-500 border-blue-200 text-blue-700 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Download size={16} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                {isExporting ? 'Exporting...' : 'Export JSON'}
              </Button>
              

              
              <Button 
                asChild 
                variant="outline" 
                className="group border-blue-200 text-blue-700 hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 flex items-center gap-3">
              <Eye size={24} className="text-blue-500" />
              Video Viewer
            </h2>
            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-gray-200 shadow-lg">
              <Button
                variant={layout === 'single' ? 'default' : 'ghost'}
                size="lg"
                onClick={() => changeLayout('single')}
                className={`group flex items-center gap-3 transition-all duration-300 transform hover:scale-105 rounded-xl px-6 py-4 min-h-[56px] ${
                  layout === 'single' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Maximize2 size={18} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base font-medium">Single</span>
              </Button>
              <Button
                variant={layout === 'side-by-side' ? 'default' : 'ghost'}
                size="lg"
                onClick={() => changeLayout('side-by-side')}
                className={`group flex items-center gap-3 transition-all duration-300 transform hover:scale-105 rounded-xl px-6 py-4 min-h-[56px] ${
                  layout === 'side-by-side' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Columns size={18} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base font-medium">Side by Side</span>
              </Button>
              <Button
                variant={layout === 'grid' ? 'default' : 'ghost'}
                size="lg"
                onClick={() => changeLayout('grid')}
                className={`group flex items-center gap-3 transition-all duration-300 transform hover:scale-105 rounded-xl px-6 py-4 min-h-[56px] ${
                  layout === 'grid' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid size={18} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-base font-medium">Grid</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content based on layout */}
        {layout === 'single' && (
          <div className="w-full">
            {/* Video Player - Full Width */}
            <div>
              {renderVideoPlayer(currentVideo)}
            </div>
          </div>
        )}
        
        {layout === 'side-by-side' && sessionData && sessionData.videos.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {sessionData.videos.slice(0, 2).map((video, index) => (
              <div key={video.title} style={{ animationDelay: `${index * 200}ms` }} className="animate-fade-in-up">
                {renderVideoPlayer(video)}
              </div>
            ))}
          </div>
        )}
        
        {layout === 'grid' && sessionData && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sessionData.videos.map((video, index) => (
              <div key={video.title} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up">
                {renderVideoPlayer(video)}
              </div>
            ))}
          </div>
        )}

        {/* Global Floating Video List Sidebar */}
        {sessionData && (
          <VideoList
            videos={sessionData.videos}
            currentVideo={currentVideo}
            onVideoChange={handleVideoChange}
            getVideoComments={getVideoComments}
          />
        )}
      </div>
      
      {/* Floating Comment Modal */}
      {showFloatingComment && currentVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] border border-gray-200 animate-fade-in-up overflow-hidden flex flex-col">
            {/* Fixed Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <MessageSquare size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add Video Annotation</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock size={12} />
                      At {formatTime(floatingCommentTimestamp)} in {currentVideo.title}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowFloatingComment(false);
                    // Reset annotation settings when closing
                    setAnnotationDuration(30);
                    setAnnotationCommentType('positive');
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
                >
                  ✕
                </Button>
              </div>
              
              {/* Tab Navigation */}
              <div className="mt-4">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('comment')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm ${
                      activeTab === 'comment'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MessageSquare size={16} />
                    Comment
                  </button>
                  <button
                    onClick={() => setActiveTab('evaluation')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm ${
                      activeTab === 'evaluation'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ClipboardCheck size={16} />
                    Evaluation
                  </button>
                </div>
              </div>
              
              {/* Compact Timestamp & Settings - Fixed at top */}
              <div className="bg-gray-50 rounded-lg p-3 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Timestamp */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Timestamp
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={Math.floor(floatingCommentTimestamp)}
                        onChange={(e) => setFloatingCommentTimestamp(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-center font-mono text-sm"
                        min="0"
                        max={Math.floor(currentVideo.duration || 0)}
                      />
                      <span className="text-xs text-gray-500">sec</span>
                      <Button
                        onClick={() => setFloatingCommentTimestamp(videoPlayerStates.get(currentVideo.title)?.currentTime || 0)}
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-auto"
                      >
                        Current
                      </Button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <select
                      value={annotationDuration}
                      onChange={(e) => setAnnotationDuration(parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    >
                      <option value={10}>10s</option>
                      <option value={15}>15s</option>
                      <option value={30}>30s</option>
                      <option value={60}>1min</option>
                      <option value={120}>2min</option>
                      <option value={300}>5min</option>
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={annotationCommentType}
                      onChange={(e) => setAnnotationCommentType(e.target.value as any)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    >
                      <option value="positive">✅ Positive</option>
                      <option value="neutral">💬 General</option>
                      <option value="warning">⚠️ Attention</option>
                      <option value="critical">❌ Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Tab Content */}
                {activeTab === 'comment' ? (
                  <>
                {/* Comment Content */}
                <div className="space-y-4">
                  <label className="block text-base font-medium text-gray-700">
                    Your Observation
                  </label>
                  <div className="relative">
                    <textarea
                      rows={6}
                      className="w-full rounded-xl border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-4 py-3 text-sm text-gray-900 placeholder-gray-500 transition-all duration-300 resize-none"
                      placeholder="Describe what you observe at this moment. Include technical details, technique assessment, or areas for improvement..."
                      value={videoPlayerStates.get(currentVideo.title)?.newComment || ''}
                      onChange={(e) => handleCommentChange(currentVideo.title, e.target.value)}
                      disabled={isAddingComment}
                    />
                    
                    {/* Character Counter */}
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {(videoPlayerStates.get(currentVideo.title)?.newComment || '').length}/500
                    </div>
                    
                    {/* Voice Transcript Overlay */}
                    {isListening && voiceTranscript && (
                      <div className="absolute top-3 left-3 right-16 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-700">🎤 Listening...</span>
                          </div>
                        </div>
                        <div className="text-sm text-blue-800 bg-white/50 rounded-lg px-2 py-1">
                          {voiceTranscript || 'Start speaking...'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-base font-medium text-gray-700">
                    Quick Templates
                  </label>
                    <Button
                      onClick={() => setShowTemplateManager(true)}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-200 hover:bg-blue-50 px-3 py-2"
                    >
                      <Edit3 size={14} className="mr-1" />
                      Manage
                    </Button>
                  </div>
                  
                  {/* Default Templates - Compact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      onClick={() => handleCommentChange(currentVideo.title, '👍 Excellent technique demonstrated. Good hand positioning and instrument control.')}
                      variant="outline"
                      className="text-left p-3 h-auto text-green-700 border-green-200 hover:bg-green-50 rounded-lg"
                    >
                      <div className="text-sm font-medium">👍 Positive Feedback</div>
                      <div className="text-xs text-gray-600 mt-1">Excellent technique demonstrated</div>
                    </Button>
                    <Button
                      onClick={() => handleCommentChange(currentVideo.title, '⚠️ Attention needed: Consider adjusting approach for better safety and precision.')}
                      variant="outline"
                      className="text-left p-3 h-auto text-yellow-700 border-yellow-200 hover:bg-yellow-50 rounded-lg"
                    >
                      <div className="text-sm font-medium">⚠️ Needs Attention</div>
                      <div className="text-xs text-gray-600 mt-1">Requires adjustment</div>
                    </Button>
                    <Button
                      onClick={() => handleCommentChange(currentVideo.title, '🎯 Key learning moment: This demonstrates proper technique for this procedure.')}
                      variant="outline"
                      className="text-left p-3 h-auto text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg"
                    >
                      <div className="text-sm font-medium">🎯 Teaching Point</div>
                      <div className="text-xs text-gray-600 mt-1">Key learning moment</div>
                    </Button>
                    <Button
                      onClick={() => handleCommentChange(currentVideo.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.')}
                      variant="outline"
                      className="text-left p-3 h-auto text-red-700 border-red-200 hover:bg-red-50 rounded-lg"
                    >
                      <div className="text-sm font-medium">❌ Critical Issue</div>
                      <div className="text-xs text-gray-600 mt-1">Safety concern</div>
                    </Button>
                  </div>

                  {/* Custom Templates */}
                  {Array.isArray(customTemplates) && customTemplates.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Your Custom Templates
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {customTemplates.map((template) => (
                          <Button
                            key={template.name}
                            onClick={() => handleCommentChange(currentVideo.title, template.content)}
                            variant="outline"
                            className={`text-left p-3 h-auto rounded-lg ${getColorClasses(template.color)}`}
                          >
                            <div className="text-sm font-medium">
                              {template.emoji} {template.title}
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-2 mt-1">
                              {template.content.length > 40 
                                ? `${template.content.substring(0, 40)}...` 
                                : template.content
                              }
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                  </>
                ) : (
                  <>
                    {/* Evaluation Form Tab Content */}
                  <div className="space-y-3">
                    {/* Compact Progress Indicator */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target size={14} className="text-blue-500" />
                          <span className="font-medium text-gray-900 text-sm">Performance Assessment</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {Object.values(evaluationData).slice(0, 7).filter(v => v !== '').length}/7 completed
                        </div>
                      </div>
                    </div>

                    {/* Evaluation Grid - Compact View */}
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { key: 'identification', title: 'ID', icon: '👤', desc: 'Introduction & identification' },
                        { key: 'situation', title: 'Situation', icon: '🎯', desc: 'Problem identification' },
                        { key: 'history', title: 'History', icon: '📋', desc: 'Background information' },
                        { key: 'examination', title: 'Examination', icon: '🔍', desc: 'Observations & examination' },
                        { key: 'assessment', title: 'Assessment', icon: '🧠', desc: 'Logical assessment' },
                        { key: 'recommendation', title: 'Recommendation', icon: '💡', desc: 'Clear recommendations' },
                        { key: 'grs', title: 'Global Rating', icon: '⭐', desc: 'Overall confidence level' }
                      ].map((category) => {
                        const currentValue = evaluationData[category.key as keyof EvaluationData];
                        const isExpanded = evaluationExpanded[category.key];
                        
                        return (
                          <div key={category.key} className="border border-gray-200 rounded-lg bg-white">
                            {/* Compact Category Header */}
                            <div className="p-2">
                              <button
                                onClick={() => toggleEvaluationExpanded(category.key)}
                                className="w-full flex items-center justify-between hover:bg-gray-50 rounded-md p-1 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{category.icon}</span>
                                  <div className="text-left">
                                    <div className="text-sm font-medium text-gray-900">{category.title}</div>
                                    <div className="text-xs text-gray-500">{category.desc}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {currentValue && (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                      {getEvaluationLabel(category.key, currentValue)}
                                    </span>
                                  )}
                                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} />
                                </div>
                              </button>
                              
                              {/* Compact Rating Options */}
                              {isExpanded && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                  <div className="grid grid-cols-2 gap-1">
                                    {['poor', 'fair', 'good', 'excellent'].map((option) => (
                                      <button
                                        key={option}
                                        onClick={() => handleEvaluationChange(category.key as keyof EvaluationData, option)}
                                        className={`p-2 text-xs rounded-md transition-colors ${
                                          currentValue === option
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                                        }`}
                                      >
                                        {getEvaluationLabel(category.key, option)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Additional Comment Section */}
                    <div className="border border-gray-200 rounded-lg bg-white p-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Additional Comments
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                        placeholder="Any additional observations or comments..."
                        value={evaluationData.comment}
                        onChange={(e) => handleEvaluationChange('comment', e.target.value)}
                      />
                    </div>

                    {/* Reset Button */}
                    <div className="flex justify-start">
                      <Button
                        onClick={resetEvaluationForm}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-200 hover:bg-gray-50 px-3 py-2"
                      >
                        <X size={14} className="mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>

            {/* Fixed Footer with Actions */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Voice Recording */}
                  <div className="relative">
                    <Button
                      onClick={toggleVoiceRecording}
                      variant="outline"
                      size="sm"
                      disabled={!isVoiceSupported}
                      className={`flex items-center gap-2 transition-all duration-300 px-3 py-2 ${
                        isListening 
                          ? 'border-red-200 text-red-700 bg-red-50' 
                          : microphonePermission === 'denied'
                          ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                      }`}
                      title={
                        !isVoiceSupported 
                          ? 'Speech recognition not supported'
                          : microphonePermission === 'denied'
                          ? 'Microphone access denied'
                          : isListening
                          ? 'Stop recording'
                          : 'Start voice recording'
                      }
                    >
                      <Mic size={14} className={isListening ? 'animate-pulse' : ''} />
                      <span className="text-sm">{isListening ? 'Stop' : 'Voice'}</span>
                    </Button>
                    
                    {isListening && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                    )}
                  </div>

                  {/* Voice controls */}
                  {voiceTranscript && !isListening && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={insertVoiceTranscript}
                        variant="outline"
                        size="sm"
                        className="text-green-700 border-green-200 hover:bg-green-50 px-3 py-2"
                      >
                        <CheckCircle size={12} />
                        <span className="text-sm ml-1">Use</span>
                      </Button>
                      <Button
                        onClick={clearVoiceTranscript}
                        variant="outline"
                        size="sm"
                        className="text-gray-600 border-gray-200 hover:bg-gray-50 px-3 py-2"
                      >
                        <span className="text-sm">Clear</span>
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      setShowFloatingComment(false);
                      // Reset annotation settings when canceling
                      setAnnotationDuration(30);
                      setAnnotationCommentType('positive');
                    }}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  {activeTab === 'comment' ? (
                    <Button
                      onClick={() => {
                        // Update the timestamp first
                        if (currentVideo) {
                          const currentState = videoPlayerStates.get(currentVideo.title);
                          if (currentState) {
                            setVideoPlayerStates(prevStates => {
                              const newStates = new Map(prevStates);
                              newStates.set(currentVideo.title, {
                                ...currentState,
                                currentTime: floatingCommentTimestamp
                              });
                              return newStates;
                            });
                          }
                        }
                        // Add the comment with duration and type
                        handleAddComment(currentVideo.title, floatingCommentTimestamp, annotationDuration, annotationCommentType);
                        setShowFloatingComment(false);
                        // Reset annotation settings after successful submission
                        setAnnotationDuration(30);
                        setAnnotationCommentType('positive');
                      }}
                      disabled={isAddingComment || !videoPlayerStates.get(currentVideo.title)?.newComment.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                    >
                      <Send size={14} className="mr-1" />
                      {isAddingComment ? 'Adding...' : 'Add Annotation'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddEvaluation}
                      disabled={isAddingComment || Object.values(evaluationData).slice(0, 7).every(v => !v)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                    >
                      <ClipboardCheck size={14} className="mr-1" />
                      {isAddingComment ? 'Adding...' : 'Add Evaluation'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Comment Modal */}
      {showQuickComment && currentVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quick Comment</h3>
                    <p className="text-sm text-gray-500">
                      At {formatTime(quickCommentTimestamp)} in {currentVideo.title}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowQuickComment(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-3 py-2 text-gray-900 placeholder-gray-500 transition-all duration-300 resize-none"
                  placeholder="Add your observation about this moment..."
                  value={videoPlayerStates.get(currentVideo.title)?.newComment || ''}
                  onChange={(e) => handleCommentChange(currentVideo.title, e.target.value)}
                  autoFocus
                />
                
                {/* Voice Transcript Display in Modal */}
                {isListening && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-700">🎤 Listening...</span>
                      </div>
                      {isVoiceSupported && (
                        <div className="text-xs text-blue-600">Speak naturally, I'll transcribe for you</div>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-2 min-h-[40px] border">
                      <div className="text-sm text-gray-800">
                        {voiceTranscript || (
                          <span className="text-gray-400 italic">Start speaking...</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Enhanced Voice Button for Modal */}
                    <div className="relative">
                      <Button
                        onClick={toggleVoiceRecording}
                        variant="outline"
                        size="sm"
                        disabled={!isVoiceSupported}
                        className={`flex items-center gap-2 transition-all duration-300 ${
                          isListening 
                            ? 'border-red-200 text-red-700 bg-red-50 shadow-lg' 
                            : microphonePermission === 'denied'
                            ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                        }`}
                        title={
                          !isVoiceSupported 
                            ? 'Speech recognition not supported'
                            : microphonePermission === 'denied'
                            ? 'Microphone access denied'
                            : isListening
                            ? 'Stop recording'
                            : 'Start voice recording'
                        }
                      >
                        <Mic size={14} className={isListening ? 'animate-pulse' : ''} />
                        {isListening ? 'Stop' : 'Voice'}
                      </Button>
                      
                      {/* Recording indicator for modal */}
                      {isListening && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                    
                    {/* Voice controls in modal */}
                    {voiceTranscript && !isListening && (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={insertVoiceTranscript}
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle size={12} />
                          Use This
                        </Button>
                        <Button
                          onClick={clearVoiceTranscript}
                          variant="outline"
                          size="sm"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          ✕
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => setShowQuickComment(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => {
                      handleAddComment(currentVideo.title);
                      setShowQuickComment(false);
                    }}
                    disabled={isAddingComment || !videoPlayerStates.get(currentVideo.title)?.newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                  >
                    <Send size={14} className="mr-2" />
                    {isAddingComment ? 'Adding...' : 'Add Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {commentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 animate-fade-in-up p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">Delete Comment?</h3>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {commentToDelete.text}
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <Button
                onClick={() => setCommentToDelete(null)}
                variant="outline"
                className="border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDeleteComment(commentToDelete.name, commentToDelete.text)}
                disabled={isDeletingComment}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingComment ? 'Deleting...' : 'Delete Comment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 animate-fade-in-up max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Edit3 size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Manage Comment Templates</h3>
                    <p className="text-sm text-gray-600">Create and customize your own quick templates</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowTemplateManager(false);
                    setEditingTemplate(null);
                    setNewTemplate({ title: '', content: '', color: 'blue', emoji: '💬' });
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
                >
                  ✕
                </Button>
              </div>
              
              <div className="flex gap-6 max-h-[70vh] overflow-hidden">
                {/* Left Panel - Create/Edit Template */}
                <div className="w-1/2 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      {editingTemplate ? 'Edit Template' : 'Create New Template'}
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Template Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Excellent Suturing"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          value={editingTemplate ? editingTemplate.title : newTemplate.title}
                          onChange={(e) => {
                            if (editingTemplate) {
                              setEditingTemplate({ ...editingTemplate, title: e.target.value });
                            } else {
                              setNewTemplate({ ...newTemplate, title: e.target.value });
                            }
                          }}
                        />
                      </div>

                      {/* Template Content */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Content
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Describe the template content that will be inserted when used..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                          value={editingTemplate ? editingTemplate.content : newTemplate.content}
                          onChange={(e) => {
                            if (editingTemplate) {
                              setEditingTemplate({ ...editingTemplate, content: e.target.value });
                            } else {
                              setNewTemplate({ ...newTemplate, content: e.target.value });
                            }
                          }}
                        />
                      </div>

                      {/* Emoji and Color */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Emoji
                          </label>
                          <input
                            type="text"
                            placeholder="💬"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-center"
                            value={editingTemplate ? editingTemplate.emoji : newTemplate.emoji}
                            onChange={(e) => {
                              if (editingTemplate) {
                                setEditingTemplate({ ...editingTemplate, emoji: e.target.value });
                              } else {
                                setNewTemplate({ ...newTemplate, emoji: e.target.value });
                              }
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                          </label>
                          <select
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            value={editingTemplate ? editingTemplate.color : newTemplate.color}
                            onChange={(e) => {
                              if (editingTemplate) {
                                setEditingTemplate({ ...editingTemplate, color: e.target.value });
                              } else {
                                setNewTemplate({ ...newTemplate, color: e.target.value });
                              }
                            }}
                          >
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="yellow">Yellow</option>
                            <option value="red">Red</option>
                            <option value="purple">Purple</option>
                            <option value="indigo">Indigo</option>
                            <option value="pink">Pink</option>
                            <option value="gray">Gray</option>
                          </select>
                        </div>
                      </div>

                      {/* Preview */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preview
                        </label>
                        <div 
                          className={`p-3 rounded-lg border-2 transition-all ${
                            getColorClasses(editingTemplate ? editingTemplate.color : newTemplate.color)
                          }`}
                        >
                          <div className="text-sm font-medium">
                            {editingTemplate ? editingTemplate.emoji : newTemplate.emoji} {editingTemplate ? editingTemplate.title : newTemplate.title || 'Template Title'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {editingTemplate ? editingTemplate.content : newTemplate.content || 'Template content will appear here...'}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 pt-4">
                        {editingTemplate ? (
                          <>
                            <Button
                              onClick={handleUpdateTemplate}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                            >
                              <Save size={14} className="mr-2" />
                              Update Template
                            </Button>
                            <Button
                              onClick={handleCancelTemplateEdit}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={handleCreateTemplate}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                          >
                            <Save size={14} className="mr-2" />
                            Create Template
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Existing Templates */}
                <div className="w-1/2 space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 h-full">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Your Templates ({Array.isArray(customTemplates) ? customTemplates.length : 0})
                    </h4>
                    
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                      {!Array.isArray(customTemplates) || customTemplates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Edit3 size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No templates yet</p>
                          <p className="text-sm">Create your first custom template to get started</p>
                        </div>
                      ) : (
                        customTemplates.map((template) => (
                          <div
                            key={template.name}
                            className={`border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                              editingTemplate?.name === template.name 
                                ? 'bg-blue-50 border-blue-300' 
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className={`text-sm font-medium ${getColorClasses(template.color).split(' ')[0]}`}>
                                  {template.emoji} {template.title}
                                </div>
                                <div className="text-xs text-gray-600 mt-1 line-clamp-3">
                                  {template.content}
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                  Created {new Date(template.created).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-3">
                                <Button
                                  onClick={() => handleEditTemplate(template)}
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-8 w-8 text-blue-600 hover:bg-blue-100"
                                >
                                  <Edit3 size={14} />
                                </Button>
                                <Button
                                  onClick={() => handleDeleteTemplate(template.name)}
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-8 w-8 text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetail; 