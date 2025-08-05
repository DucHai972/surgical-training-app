import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';

import VideoList from '../../components/VideoList';
import CustomVideoPlayer from '../../components/CustomVideoPlayer';

import { ArrowLeft, MessageSquare, Clock, Video as VideoIcon, Download, Send, Eye, Calendar, Users, FileText, Mic, Zap, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, Trash2, Edit3, Save, X, ClipboardCheck, Target, Maximize2, Columns, AlertTriangle, GraduationCap, Play, Square, RefreshCw, SkipForward, Crown } from 'lucide-react';

// Import types and utilities
import type {
  Video,
  Comment,
  CustomTemplate,
  VideoPlayerState,
  ActiveLabel,
  EvaluationData,
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from './types/session.types';
import { formatTime, formatDate } from './utils/time.utils';
import { isEvaluationComment } from './utils/comment.utils';
import { getColorClasses, getEvaluationLabel, getStatusColor } from './utils/session.utils';
import { canDeleteComment, canEditComment } from './utils/permissions.utils';

// Import hooks and components
import { useSessionData } from './hooks/useSessionData';
// import { SessionHeader } from './components/Layout/SessionHeader'; // TODO: Use SessionHeader component in render


interface SessionDetailMainProps {
  sessionName: string | null;
  authUser: string | null;
}

export const SessionDetailMain: React.FC<SessionDetailMainProps> = ({ sessionName, authUser }) => {
  console.log('🔧 DEBUG SessionDetailMain: Component rendered with props:', { sessionName, authUser });
  
  // Use the session data hook
  const { 
    sessionData: hookSessionData, 
    error: sessionError, 
    hasAccess, 
    isAccessPending, 
    isLoading: isSessionLoading, 
    refreshSession
  } = useSessionData({ sessionName, authUser });
  
  console.log('🔧 DEBUG SessionDetailMain: Hook returned:', {
    hookSessionData: !!hookSessionData,
    sessionError: !!sessionError,
    hasAccess,
    isAccessPending,
    isSessionLoading
  });
  
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
  
  // Use sessionData from hook directly instead of local state
  const sessionData = hookSessionData;
  const error = sessionError;
  
  console.log('🔧 DEBUG SessionDetailMain: Final data assignment:', {
    sessionData: !!sessionData,
    error: !!error,
    sessionDataVideos: sessionData?.videos?.length || 0,
    sessionDataSession: sessionData?.session?.name || 'none'
  });
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [videoPlayerStates, setVideoPlayerStates] = useState<Map<string, VideoPlayerState>>(new Map());
  const [comments, setComments] = useState<Comment[]>([]);
  const [layout, setLayout] = useState<'single' | 'side-by-side'>('single');
  const [isExporting, setIsExporting] = useState(false);
  
  // Multi-video state management
  const [activeVideos, setActiveVideos] = useState<Video[]>([]); // Videos currently displayed in grid
  const [timelineVideo, setTimelineVideo] = useState<Video | null>(null); // Video used for comments/labels
  
  // Video synchronization state
  const [isPlayPauseSync, setIsPlayPauseSync] = useState<boolean>(true); // Sync play/pause across videos
  const [isSeekSync, setIsSeekSync] = useState<boolean>(false); // Sync seek/time across videos
  const [masterVideo, setMasterVideo] = useState<Video | null>(null); // Master video for sync
  // const maxVideosInGrid = 4; // Maximum videos that can fit (will be used in later tasks)
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
  const [annotationDuration, setAnnotationDuration] = useState(60); // Duration in seconds - default to 1 minute
  const [annotationCommentType, setAnnotationCommentType] = useState<'auto' | 'identification' | 'situation' | 'background' | 'assessment' | 'recommendation' | 'general'>('identification');
  const [commentToDelete, setCommentToDelete] = useState<{name: string, text: string} | null>(null);
  const [editingComment, setEditingComment] = useState<{name: string, text: string} | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [editDurationValue, setEditDurationValue] = useState('');
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
  const [activeLabels, setActiveLabels] = useState<ActiveLabel[]>([]);
  const [labelMode, setLabelMode] = useState<'duration' | 'start_end'>('start_end'); // Default to start/end mode
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [labelStatusMessage, setLabelStatusMessage] = useState('');
  const [isbarValue, setIsbarValue] = useState('');
  const videoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());

  // Debug and remove unwanted spacer elements
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as HTMLElement;
            if (element.style.minHeight && 
                (element.classList.contains('h-0') || element.style.minHeight.includes('px'))) {
              console.warn('Spacer div detected and removed:', element);
              element.remove(); // Immediate removal
            }
          }
        });
      });
    });

    const container = document.querySelector('.comment-list-container');
    if (container) {
      observer.observe(container, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [comments]); // Re-run when comments change



  // API for adding comments
  const { call: addComment, loading: isAddingComment } = useFrappePostCall(
    'surgical_training.api.comment.add_comment'
  );

  // API for deleting comments
  const { call: deleteComment, loading: isDeletingComment } = useFrappePostCall(
    'surgical_training.api.comment.delete_comment'
  );

  // API for updating comments
  const { call: updateComment } = useFrappePostCall(
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
          
          // Update the target video's comment with the transcript
          const targetVideo = getTargetVideoForComments();
          if (targetVideo && finalTranscript) {
            const currentComment = videoPlayerStates.get(targetVideo.title)?.newComment || '';
            const newComment = currentComment ? `${currentComment} ${finalTranscript}` : finalTranscript;
            handleCommentChange(targetVideo.title, newComment);
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
    const targetVideo = getTargetVideoForComments();
    if (targetVideo && voiceTranscript.trim()) {
      const currentComment = videoPlayerStates.get(targetVideo.title)?.newComment || '';
      const newComment = currentComment ? `${currentComment} ${voiceTranscript.trim()}` : voiceTranscript.trim();
      handleCommentChange(targetVideo.title, newComment);
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
          // Don't trigger if Ctrl+C is pressed (user wants to copy)
          if (e.ctrlKey || e.metaKey) return;
          
          e.preventDefault();
          // Focus on the comment textarea
          const textarea = document.querySelector('textarea[placeholder*="Describe what you observe"]') as HTMLTextAreaElement;
          if (textarea) {
            textarea.focus();
          }
          break;
        case 'e':
          // End the most recent active label for target video
          const targetVideo = getTargetVideoForComments();
          if (targetVideo && labelMode === 'start_end') {
            e.preventDefault();
            const activeLabelsForVideo = getActiveLabelsForVideo(targetVideo.title);
            if (activeLabelsForVideo.length > 0) {
              const mostRecentLabel = activeLabelsForVideo[activeLabelsForVideo.length - 1];
              handleEndLabel(mostRecentLabel.id);
            }
          }
          break;
        case 'enter':
          // Submit comment when Enter is pressed (with Ctrl/Cmd)
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const targetVideo = getTargetVideoForComments();
            if (targetVideo) {
              const comment = videoPlayerStates.get(targetVideo.title)?.newComment.trim();
              if (comment) {
                if (labelMode === 'start_end') {
                  handleStartLabel(targetVideo.title, comment, annotationCommentType);
                } else {
                  const currentTime = videoPlayerStates.get(targetVideo.title)?.currentTime || 0;
                  handleAddComment(targetVideo.title, currentTime, annotationDuration, annotationCommentType);
                }
              }
            }
          }
          break;
        case ' ':
          const targetVideoForPlayPause = getTargetVideoForComments();
          if (targetVideoForPlayPause) {
            e.preventDefault();
            const videoState = videoPlayerStates.get(targetVideoForPlayPause.title);
            if (videoState) {
              handlePlayPause(targetVideoForPlayPause.title, !videoState.isPlaying);
            }
          }
          break;
        case 'escape':
          // Clear comment input
          const targetVideoForEscape = getTargetVideoForComments();
          if (targetVideoForEscape) {
            handleCommentChange(targetVideoForEscape.title, '');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentVideo, videoPlayerStates, labelMode, activeLabels, annotationCommentType, annotationDuration]);

  useEffect(() => {
    if (sessionData) {
      console.log('🎬 FRONTEND: Received session data from hook:', sessionData);
      console.log('🎬 FRONTEND: Videos array:', sessionData.videos);
      
      // Log each video in detail
      if (sessionData.videos && Array.isArray(sessionData.videos)) {
        sessionData.videos.forEach((video: Video, index: number) => {
          console.log(`🎬 FRONTEND Video ${index + 1}:`, {
            title: video.title,
            video_file: video.video_file,
            description: video.description
          });
        });
      }
      
      setComments(Array.isArray(sessionData.comments) ? sessionData.comments : []);
      
      // Set first video as current if available, but preserve current video if it exists
      if (sessionData.videos && Array.isArray(sessionData.videos) && sessionData.videos.length > 0) {
        // Only set to first video if no current video is set, or if current video is not in the new data
        if (!currentVideo || !sessionData.videos.find((v: Video) => v.title === currentVideo.title)) {
          console.log('🎬 FRONTEND: Setting current video to:', sessionData.videos[0]);
          setCurrentVideo(sessionData.videos[0]);
        }
        
        // Initialize player states for all videos, preserving existing states
        setVideoPlayerStates(prevStates => {
          const newStates = new Map<string, VideoPlayerState>();
          sessionData.videos.forEach((video: Video) => {
            const existingState = prevStates.get(video.title);
            newStates.set(video.title, {
              isPlaying: existingState?.isPlaying || false,
              currentTime: existingState?.currentTime || 0,
              newComment: existingState?.newComment || ''
            });
          });
          return newStates;
        });
      }
    }
    
    if (error) {
      console.error('Session data error from hook:', error);
    }
  }, [sessionData, error, currentVideo]);

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

  const handlePlayPause = (videoTitle: string, playing: boolean, skipSync: boolean = false) => {
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
      
      // Sync play/pause across other videos in side-by-side mode
      if (layout === 'side-by-side' && isPlayPauseSync && !skipSync && activeVideos.length > 1) {
        activeVideos.forEach(video => {
          if (video.title !== videoTitle) {
            const videoState = newStates.get(video.title) || {
              isPlaying: false,
              currentTime: 0,
              newComment: ''
            };
            newStates.set(video.title, {
              ...videoState,
              isPlaying: playing
            });
          }
        });
      }
      
      return newStates;
    });
  };

  // Handle time synchronization across videos (will be used when integrating with video player)
  // const handleTimeSync = (videoTitle: string, newTime: number, skipSync: boolean = false) => {
  //   setVideoPlayerStates(prevStates => {
  //     const newStates = new Map(prevStates);
  //     const currentState = newStates.get(videoTitle) || {
  //       isPlaying: false,
  //       currentTime: 0,
  //       newComment: ''
  //     };
  //     
  //     newStates.set(videoTitle, {
  //       ...currentState,
  //       currentTime: newTime
  //     });
  //     
  //     // Sync time across other videos in side-by-side mode if seek sync is enabled
  //     if (layout === 'side-by-side' && isSeekSync && !skipSync && activeVideos.length > 1) {
  //       activeVideos.forEach(video => {
  //         if (video.title !== videoTitle) {
  //           const videoState = newStates.get(video.title) || {
  //             isPlaying: false,
  //             currentTime: 0,
  //             newComment: ''
  //           };
  //           newStates.set(video.title, {
  //             ...videoState,
  //             currentTime: newTime
  //           });
  //         }
  //       });
  //     }
  //     
  //     return newStates;
  //   });
  // };

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
    console.log('🎬 FRONTEND VIDEO CHANGE:', {
      from: currentVideo ? { title: currentVideo.title, video_file: currentVideo.video_file } : null,
      to: { title: video.title, video_file: video.video_file }
    });
    setCurrentVideo(video);
    setLayout('single');
  };



  // Floating comment functionality
  const handleFloatingComment = (timestamp?: number) => {
    const targetVideo = getTargetVideoForComments();
    if (targetVideo) {
      const videoState = videoPlayerStates.get(targetVideo.title);
      if (videoState) {
        setFloatingCommentTimestamp(timestamp || videoState.currentTime);
        // Don't reset annotation settings - preserve user preferences
        setShowFloatingComment(true);
        // Pause video for commenting
        handlePlayPause(targetVideo.title, false);
      }
    }
  };

  // New label system functions
  const handleStartLabel = (videoTitle: string, comment: string, type: string = 'positive') => {
    const targetVideo = getTargetVideoForComments();
    if (!targetVideo) return;
    
    const videoState = videoPlayerStates.get(videoTitle);
    if (!videoState) return;

    const newLabel: ActiveLabel = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      videoTitle,
      startTime: videoState.currentTime,
      comment,
      type,
      createdAt: Date.now()
    };

    setActiveLabels(prev => [...prev, newLabel]);
    toast.success(`Label started at ${formatTime(videoState.currentTime)}`);
    setLabelStatusMessage(`Label recording started at ${formatTime(videoState.currentTime)}`);
    
    // Clear the comment input
    handleCommentChange(videoTitle, '');
  };

  const handleEndLabel = async (labelId: string) => {
    const targetVideo = getTargetVideoForComments();
    if (!targetVideo) return;
    
    const videoState = videoPlayerStates.get(targetVideo.title);
    if (!videoState) return;

    const activeLabel = activeLabels.find(label => label.id === labelId);
    if (!activeLabel) return;

    const endTime = videoState.currentTime;
    const duration = Math.round(endTime - activeLabel.startTime);

    if (duration <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      // Create the comment with calculated duration
      const commentData = {
        session: sessionName,
        video_title: activeLabel.videoTitle,
        timestamp: activeLabel.startTime,
        comment_text: activeLabel.comment,
        duration: duration,
        comment_type: activeLabel.type
      };

      const response = await addComment(commentData);
      
      if (response && response.message) {
        const responseData = response.message;
        
        if (responseData.message === 'Success') {
          toast.success(`Label completed: ${formatTime(duration)} duration`);
          setLabelStatusMessage(`Label completed with ${formatTime(duration)} duration`);
          
          // Remove the active label
          setActiveLabels(prev => prev.filter(label => label.id !== labelId));
          
          // Refresh comments
          await refreshSession();
        } else if (responseData.error) {
          toast.error(`Error: ${responseData.error}`);
        }
      }
    } catch (error) {
      console.error('Error completing label:', error);
      toast.error('Failed to complete label');
    }
  };

  const handleCancelLabel = (labelId: string) => {
    setActiveLabels(prev => prev.filter(label => label.id !== labelId));
    toast('Label cancelled');
  };

  const getActiveLabelsForVideo = (videoTitle: string) => {
    return activeLabels.filter(label => label.videoTitle === videoTitle);
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
    // Cancel any duration editing
    setEditingDuration(null);
    setEditDurationValue('');
    
    setEditingComment({ name: comment.name, text: comment.comment_text });
    setEditCommentText(comment.comment_text);
  };

  // Handle duration editing
  const handleEditDuration = (comment: Comment) => {
    // Cancel any other editing
    setEditingComment(null);
    setEditCommentText('');
    
    setEditingDuration(comment.name);
    setEditDurationValue(comment.duration ? comment.duration.toString() : '30');
  };

  const handleSaveDuration = async (commentName: string) => {
    if (!editDurationValue) return;
    
    const durationSeconds = parseInt(editDurationValue);
    if (isNaN(durationSeconds) || durationSeconds <= 0) {
      toast.error('Please enter a valid duration in seconds');
      return;
    }

    try {
      const response = await fetch('/api/method/surgical_training.api.comment.update_comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment_name: commentName,
          duration: durationSeconds
        }),
      });

      const result = await response.json();
      
      if (result && result.message && result.message.message === 'Success') {
        toast.success('Duration updated successfully');
        setEditingDuration(null);
        setEditDurationValue('');
        await refreshSession();
      } else {
        toast.error('Failed to update duration');
      }
    } catch (error) {
      console.error('Error updating duration:', error);
      toast.error('Failed to update duration');
    }
  };

  const handleCancelDurationEdit = () => {
    setEditingDuration(null);
    setEditDurationValue('');
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
      
      const targetVideo = getTargetVideoForComments();
      if (!targetVideo) {
        toast.error('No target video selected for evaluation');
        return;
      }

      const response = await addComment({
        session: sessionName,
        video_title: targetVideo.title,
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



  // Comment type categorization functions
  const getCommentType = (comment: Comment) => {
    // If comment has explicit type, use it
    if (comment.comment_type) {
      switch (comment.comment_type) {
        case 'critical': return 'critical';
        case 'positive': return 'positive';
        case 'warning': case 'attention': return 'attention';
        case 'teaching': case 'general': return 'teaching';
        default: break;
      }
    }

    // Fall back to text analysis
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
      return 'attention';
    }

    // Check for teaching indicators
    if (text.includes('🎯') || text.includes('learning') || text.includes('technique') || 
        text.includes('demonstrates') || text.includes('example') || text.includes('shows')) {
      return 'teaching';
    }
    
    // Default to positive for general comments
    return 'positive';
  };

  // Get badge config for comment type - WCAG AA compliant colors
  const getCommentBadge = (type: string) => {
    switch (type) {
      case 'positive':
        return {
          label: 'Positive',
          classes: 'bg-green-100 text-green-800',
          dotClasses: 'bg-green-600'
        };
      case 'attention':
        return {
          label: 'Attention',
          classes: 'bg-yellow-100 text-yellow-900', // Improved contrast: 6.2:1
          dotClasses: 'bg-yellow-600'
        };
      case 'critical':
        return {
          label: 'Critical',
          classes: 'bg-red-100 text-red-800',
          dotClasses: 'bg-red-600'
        };
      case 'teaching':
        return {
          label: 'Teaching',
          classes: 'bg-blue-100 text-blue-800',
          dotClasses: 'bg-blue-600'
        };
      default:
        return {
          label: 'General',
          classes: 'bg-gray-100 text-gray-800',
          dotClasses: 'bg-gray-600'
        };
    }
  };

  // Toggle comment expansion
  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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

  const changeLayout = (newLayout: 'single' | 'side-by-side') => {
    setLayout(newLayout);
    
    // Initialize active videos when switching to side-by-side
    if (newLayout === 'side-by-side' && sessionData) {
      if (activeVideos.length === 0) {
        // Start with first 2 videos by default
        const initialVideos = sessionData.videos.slice(0, 2);
        setActiveVideos(initialVideos);
        
        // Set timeline video to current video or first video
        if (!timelineVideo) {
          setTimelineVideo(currentVideo || initialVideos[0] || null);
        }
        
        // Set master video to first video by default
        if (!masterVideo && initialVideos.length > 0) {
          setMasterVideo(initialVideos[0]);
          // Also set timeline video to master video
          setTimelineVideo(initialVideos[0]);
        }
      } else {
        // If activeVideos exist but no master video, set first active video as master
        if (!masterVideo && activeVideos.length > 0) {
          setMasterVideo(activeVideos[0]);
          // Also set timeline video to master video
          setTimelineVideo(activeVideos[0]);
        }
      }
    }
  };

  // Video grid management functions (will be used in next tasks)
  /*
  const addVideoToGrid = (video: Video) => {
    if (activeVideos.length >= maxVideosInGrid) {
      toast.error(`Maximum ${maxVideosInGrid} videos can be displayed at once`);
      return;
    }
    
    if (!activeVideos.find(v => v.title === video.title)) {
      setActiveVideos(prev => [...prev, video]);
      toast.success(`Added ${video.title} to grid`);
    } else {
      toast(`${video.title} is already in the grid`);
    }
  };

  const removeVideoFromGrid = (video: Video) => {
    if (activeVideos.length <= 1) {
      toast.error('At least one video must remain in the grid');
      return;
    }
    
    setActiveVideos(prev => prev.filter(v => v.title !== video.title));
    
    // If removed video was the timeline video, switch to first remaining video
    if (timelineVideo?.title === video.title) {
      const remainingVideos = activeVideos.filter(v => v.title !== video.title);
      setTimelineVideo(remainingVideos[0] || null);
      toast(`Timeline switched to ${remainingVideos[0]?.title || 'none'}`);
    }
    
    toast.success(`Removed ${video.title} from grid`);
  };

  const setVideoAsTimeline = (video: Video) => {
    if (!activeVideos.find(v => v.title === video.title)) {
      toast.error('Video must be in the grid to be used as timeline');
      return;
    }
    
    setTimelineVideo(video);
    toast.success(`Timeline set to ${video.title}`);
  };

  // Calculate grid dimensions based on video count
  const getGridDimensions = (videoCount: number) => {
    if (videoCount <= 1) return { cols: 1, rows: 1 };
    if (videoCount === 2) return { cols: 2, rows: 1 };
    if (videoCount <= 4) return { cols: 2, rows: 2 };
    if (videoCount <= 6) return { cols: 3, rows: 2 };
    return { cols: 3, rows: 3 }; // Max 9 videos
  };
  */

  // Helper function to get the video that should receive comments/labels
  const getTargetVideoForComments = (): Video | null => {
    if (layout === 'side-by-side') {
      return masterVideo; // Use master video only in side-by-side mode
    }
    return currentVideo; // Use current video in single mode
  };

  // Sync all videos to the same timeline
  const syncVideosToReference = (referenceVideo: Video) => {
    if (!sessionData) {
      toast.error('No session data available for synchronization');
      return;
    }

    // Get the current time from the reference video
    const referenceTime = videoPlayerStates.get(referenceVideo.title)?.currentTime || 0;
    
    // Get all videos to sync (use activeVideos for side-by-side, all videos for single)
    let videosToSync: Video[] = [];
    if (layout === 'side-by-side') {
      videosToSync = activeVideos;
    } else {
      toast.error('Sync is only available in Side by Side mode');
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

  // Add handler to submit ISBAR evaluation as a comment
  const handleSubmitIsbarEvaluation = async (videoTitle: string) => {
    if (!annotationCommentType || isbarValue === '') return;
    const isbarLabels: Record<string, string[]> = {
      identification: [
        'Requires direct prompting',
        'After a hint',
        'Information incomplete',
        'Information complete',
      ],
      situation: [
        'Unable to identify',
        'After extended prompting',
        'Fewer prompts needed',
        'Unprompted',
      ],
      background: [
        'Unstructured/non-relevant',
        'Frequent clarification needed',
        'Few questions needed',
        'Comprehensive focused',
      ],
      assessment: [
        'No logical assessment',
        'After extended questioning',
        'After minimal questioning',
        'Without questioning',
      ],
      recommendation: [
        'No clear recommendation',
        'After extended questioning',
        'After minimal questioning',
        'Without questioning',
      ],
    };
    const label = isbarLabels[annotationCommentType]?.[parseInt(isbarValue)] || '';
    const isbarText = `[ISBAR] ${annotationCommentType.charAt(0).toUpperCase() + annotationCommentType.slice(1)}: ${isbarValue} - ${label}`;
    
    if (labelMode === 'start_end') {
      // Start a label with ISBAR evaluation
      handleStartLabel(videoTitle, isbarText, annotationCommentType);
    } else {
      // Add as regular comment
      const currentTime = videoPlayerStates.get(videoTitle)?.currentTime || 0;
      await addComment({
        session: sessionName,
        video_title: videoTitle,
        timestamp: currentTime,
        comment_text: isbarText,
        duration: annotationDuration,
        comment_type: annotationCommentType
      });
      await refreshSession();
    }
    setIsbarValue('');
  };


  // Check if access check is still pending
  if (isAccessPending) {
    console.log('🔧 DEBUG SessionDetailMain: Rendering access pending screen');
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
  if (!hasAccess) {
    console.log('🔧 DEBUG SessionDetailMain: Rendering no access screen');
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

  if (isSessionLoading && !sessionData) {
    console.log('🔧 DEBUG SessionDetailMain: Rendering loading screen - isSessionLoading:', isSessionLoading, 'sessionData:', !!sessionData);
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse mx-auto">
            <VideoIcon className="w-8 h-8 text-white" />
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
    console.log('🔧 DEBUG SessionDetailMain: Rendering error state - error:', error);
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
              refreshSession();
            }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData || !currentVideo) {
    console.log('🔧 DEBUG SessionDetailMain: Rendering session not found - sessionData:', !!sessionData, 'currentVideo:', !!currentVideo, 'sessionData.videos:', sessionData?.videos?.length);
    if (error) {
      console.log('🔧 DEBUG SessionDetailMain: Error present:', error);
    }
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-6">
            <VideoIcon size={40} className="text-red-600" />
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
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{video.title}</h2>
              <p className="text-gray-600 mt-1">{video.description}</p>
            </div>
            
            {/* Sync Button - Only show in multi-video modes */}
            {layout === 'side-by-side' && sessionData && sessionData.videos.length >= 2 && (
              <Button
                onClick={() => syncVideosToReference(video)}
                variant="outline"
                size="sm"
                className="group flex items-center gap-2 transition-all duration-300 transform hover:scale-105 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-700 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 shadow-md hover:shadow-lg ml-4 px-4 py-2"
                title={`Sync all other videos to this video's timeline`}
              >
                <Zap size={16} className="group-hover:scale-110 transition-transform duration-300" />
                <span className="text-sm font-medium">Sync</span>
              </Button>
            )}
          </div>
        </div>

        {/* Main Content - Responsive 2-Column Layout */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
          {/* Left Column - Video Player (~70%) */}
          <div className="flex-none lg:flex-1 lg:w-[70%] bg-gray-50 flex flex-col">
            {/* Video Player Container */}
            <div className="flex-1 p-4">
              <div className="relative h-full min-h-[400px] lg:min-h-[60vh]">
                {(() => {
                  const videoSrc = video.video_file && video.video_file.trim() 
                    ? video.video_file  // Use the path as-is from the backend
                    : '/files/placeholder.mp4';  // fallback for missing video
                  
                  console.log(`🎥 FRONTEND VIDEO PLAYER RENDER:`, {
                    title: video.title,
                    raw_video_file: video.video_file,
                    computed_src: videoSrc,
                    is_current_video: currentVideo?.title === video.title
                  });
                  
                  return (
                    <CustomVideoPlayer
                      src={videoSrc}
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
                  );
                })()}
              </div>
            </div>

            {/* Active Labels Indicator */}
            {getActiveLabelsForVideo(video.title).length > 0 && (
              <div className="mx-4 mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center">
                      <Target size={12} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Active Labels</h3>
                      <p className="text-xs text-gray-600">Labels waiting for end time</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-gray-700">
                      {getActiveLabelsForVideo(video.title).length} active
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {getActiveLabelsForVideo(video.title).map((label) => (
                    <div key={label.id} className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900 truncate">{label.comment}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={10} />
                          Started at {formatTime(label.startTime)} • 
                          Duration: {formatTime(videoState.currentTime - label.startTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          onClick={() => handleEndLabel(label.id)}
                          variant="outline"
                          size="sm"
                          className="text-green-700 border-green-200 hover:bg-green-50 px-2 py-1 text-xs h-auto"
                        >
                          End
                        </Button>
                        <Button
                          onClick={() => handleCancelLabel(label.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-700 border-red-200 hover:bg-red-50 px-2 py-1 text-xs h-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Action Bar */}
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
                      {formatTime(videoState.currentTime)}
                    </span>
                  </div>
                  <Button
                    onClick={() => handleFloatingComment()}
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
                      handleStartLabel(video.title, '👍 Good technique', 'positive');
                    } else {
                      handleCommentChange(video.title, '👍 Good technique');
                      handleFloatingComment();
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
                      handleStartLabel(video.title, '⚠️ Needs attention', 'warning');
                    } else {
                      handleCommentChange(video.title, '⚠️ Needs attention');
                      handleFloatingComment();
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
                      handleStartLabel(video.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.', 'critical');
                    } else {
                      handleCommentChange(video.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.');
                      handleFloatingComment();
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
                    handleCommentChange(video.title, '');
                    handleFloatingComment();
                  }}
                  variant="outline"
                  size="sm"
                  className="text-blue-700 border-blue-200 hover:bg-blue-50 px-3 py-1 text-xs rounded-lg"
                >
                  ✏️ Custom
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Comments Panel (~30%) */}
                      <div className="comments-panel flex flex-col lg:w-[30%] bg-white border-l-0 lg:border-l border-t lg:border-t-0 border-gray-200 min-h-[120vh] max-h-screen">
            {/* Skip Link for Keyboard Users */}
            <a href="#comments-section" className="skip-link sr-only focus:not-sr-only">
              Skip to comments
            </a>
            
            {/* Comments Header */}
            <div id="comments-section" className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-500" />
                  Comments
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-sm font-medium">
                    {videoComments.length}
                    {videoComments.length > 3 && (
                      <span className="ml-1 text-xs opacity-75">• Scroll for more</span>
                    )}
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  <div className="bg-white px-3 py-1 rounded-full border border-gray-200">
                    <span className="text-sm font-mono text-gray-700">
                      {formatTime(videoState.currentTime)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment Input Section */}
            <div className="comments-input-section flex-none p-2 border-b border-gray-200 bg-gray-50">
              {/* Mode Selector */}
              <div className="mb-1.5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Labeling Mode
                </label>
                <div className="flex space-x-1 bg-white p-1 rounded-md border border-gray-200">
                  <button
                    onClick={() => setLabelMode('start_end')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-sm font-medium transition-all duration-200 text-xs ${
                      labelMode === 'start_end'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    🎯 Start/End
                  </button>
                  <button
                    onClick={() => setLabelMode('duration')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-sm font-medium transition-all duration-200 text-xs ${
                      labelMode === 'duration'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ⏱️ Duration
                  </button>
                </div>
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-2 gap-2 mb-1.5">
                {/* Duration (only show in duration mode) */}
                {labelMode === 'duration' && (
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
                )}

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    ISBAR Category
                  </label>
                  <select
                    value={annotationCommentType}
                    onChange={(e) => {
                      setAnnotationCommentType(e.target.value as any);
                      setIsbarValue(''); // Clear ISBAR value when category changes
                    }}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                  >
                    <option value="identification">🏥 Identification</option>
                    <option value="situation">📊 Situation</option>
                    <option value="background">📋 Background</option>
                    <option value="assessment">🔍 Assessment</option>
                    <option value="recommendation">💡 Recommendation</option>
                    <option value="general">💬 General</option>
                  </select>
                </div>

                {/* ISBAR Value Dropdown - show when ISBAR category is selected */}
                {['identification', 'situation', 'background', 'assessment', 'recommendation'].includes(annotationCommentType) && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      ISBAR Score
                    </label>
                    <select
                      value={isbarValue}
                      onChange={(e) => setIsbarValue(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                    >
                      <option value="">Select score...</option>
                      {annotationCommentType === 'identification' && (
                        <>
                          <option value="0">0 - Requires direct prompting</option>
                          <option value="1">1 - After a hint</option>
                          <option value="2">2 - Information incomplete</option>
                          <option value="3">3 - Information complete</option>
                        </>
                      )}
                      {annotationCommentType === 'situation' && (
                        <>
                          <option value="0">0 - Unable to identify</option>
                          <option value="1">1 - After extended prompting</option>
                          <option value="2">2 - Fewer prompts needed</option>
                          <option value="3">3 - Unprompted</option>
                        </>
                      )}
                      {annotationCommentType === 'background' && (
                        <>
                          <option value="0">0 - Unstructured/non-relevant</option>
                          <option value="1">1 - Frequent clarification needed</option>
                          <option value="2">2 - Few questions needed</option>
                          <option value="3">3 - Comprehensive focused</option>
                        </>
                      )}
                      {annotationCommentType === 'assessment' && (
                        <>
                          <option value="0">0 - No logical assessment</option>
                          <option value="1">1 - After extended questioning</option>
                          <option value="2">2 - After minimal questioning</option>
                          <option value="3">3 - Without questioning</option>
                        </>
                      )}
                      {annotationCommentType === 'recommendation' && (
                        <>
                          <option value="0">0 - No clear recommendation</option>
                          <option value="1">1 - After extended questioning</option>
                          <option value="2">2 - After minimal questioning</option>
                          <option value="3">3 - Without questioning</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="mb-1.5">
                <label htmlFor={`comment-input-${video.title}`} className="block text-xs font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  id={`comment-input-${video.title}`}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 bg-white shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 px-2 py-1.5 text-sm text-gray-900 placeholder-gray-500 transition-all duration-300 resize-none"
                  placeholder="Describe what you observe at this moment..."
                  value={videoPlayerStates.get(video.title)?.newComment || ''}
                  onChange={(e) => handleCommentChange(video.title, e.target.value)}
                  aria-describedby={`comment-help-${video.title}`}
                />
                <div id={`comment-help-${video.title}`} className="sr-only">
                  Use the template buttons below to quickly insert common feedback, or type your own comment.
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {(videoPlayerStates.get(video.title)?.newComment || '').length}/500
                </div>
              </div>

              {/* Template Buttons - Single Row */}
              <div className="mb-3" role="group" aria-label="Quick Comment Templates">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {/* Positive */}
                  <button
                    onClick={() => handleCommentChange(video.title, '👍 Excellent technique demonstrated. Good hand positioning and instrument control.')}
                    className="template-button flex flex-col items-center justify-center p-2 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 rounded-lg transition-colors text-xs font-medium h-16"
                    aria-label="Insert positive feedback template"
                    tabIndex={0}
                  >
                    <CheckCircle size={16} className="mb-1" aria-hidden="true" />
                    <span>Positive</span>
                  </button>
                  
                  {/* Attention */}
                  <button
                    onClick={() => handleCommentChange(video.title, '⚠️ Attention needed: Consider adjusting approach for better safety and precision.')}
                    className="template-button flex flex-col items-center justify-center p-2 border border-yellow-300 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 rounded-lg transition-colors text-xs font-medium h-16"
                    aria-label="Insert attention needed template"
                    tabIndex={0}
                  >
                    <AlertTriangle size={16} className="mb-1" aria-hidden="true" />
                    <span>Attention</span>
                  </button>
                  
                  {/* Critical */}
                  <button
                    onClick={() => handleCommentChange(video.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.')}
                    className="template-button flex flex-col items-center justify-center p-2 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 rounded-lg transition-colors text-xs font-medium h-16"
                    aria-label="Insert critical issue template"
                    tabIndex={0}
                  >
                    <AlertTriangle size={16} className="mb-1" aria-hidden="true" />
                    <span>Critical</span>
                  </button>
                  
                  {/* Teaching */}
                  <button
                    onClick={() => handleCommentChange(video.title, '🎯 Key learning moment: This demonstrates proper technique for this procedure.')}
                    className="template-button flex flex-col items-center justify-center p-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg transition-colors text-xs font-medium h-16"
                    aria-label="Insert teaching moment template"
                    tabIndex={0}
                  >
                    <GraduationCap size={16} className="mb-1" aria-hidden="true" />
                    <span>Teaching</span>
                  </button>
                  
                  {/* Custom */}
                  <button
                    onClick={() => handleFloatingComment()}
                    className="template-button flex flex-col items-center justify-center p-2 border border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 rounded-lg transition-colors text-xs font-medium h-16"
                    aria-label="Open custom comment dialog"
                    tabIndex={0}
                  >
                    <Edit3 size={16} className="mb-1" aria-hidden="true" />
                    <span>Custom</span>
                  </button>
                </div>
              </div>

              {/* Action Toggle Button */}
              <div className="flex items-center gap-2">
                {labelMode === 'start_end' ? (
                  <>
                    <div className="flex gap-2 w-full">
                      {/* Start Label Button - Always Available */}
                      <Button
                        onClick={() => {
                          const comment = videoPlayerStates.get(video.title)?.newComment.trim();
                          const hasIsbarEvaluation = ['identification', 'situation', 'background', 'assessment', 'recommendation'].includes(annotationCommentType) && isbarValue;
                          
                          if (hasIsbarEvaluation) {
                            // Use ISBAR evaluation
                            handleSubmitIsbarEvaluation(video.title);
                          } else if (comment) {
                            // Use regular comment
                            handleStartLabel(video.title, comment, annotationCommentType);
                          }
                        }}
                        disabled={!videoPlayerStates.get(video.title)?.newComment.trim() && !((['identification', 'situation', 'background', 'assessment', 'recommendation'].includes(annotationCommentType) && isbarValue))}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label="Start new label recording"
                        aria-describedby="label-status"
                      >
                        <Play size={14} className="mr-2" aria-hidden="true" />
                        Start Label
                      </Button>

                      {/* End Label Button - Available when there are active labels */}
                      <Button
                        onClick={() => {
                          const activeLabelsForVideo = getActiveLabelsForVideo(video.title);
                          if (activeLabelsForVideo.length === 1) {
                            // If only one active label, end it directly
                            handleEndLabel(activeLabelsForVideo[0].id);
                          } else if (activeLabelsForVideo.length > 1) {
                            // If multiple active labels, end the most recent one
                            const mostRecentLabel = activeLabelsForVideo[activeLabelsForVideo.length - 1];
                            handleEndLabel(mostRecentLabel.id);
                          }
                        }}
                        disabled={getActiveLabelsForVideo(video.title).length === 0}
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-label={getActiveLabelsForVideo(video.title).length > 1 ? "End most recent label" : "End active label"}
                        aria-describedby="label-status"
                        title={getActiveLabelsForVideo(video.title).length > 1 ? `End most recent of ${getActiveLabelsForVideo(video.title).length} active labels` : getActiveLabelsForVideo(video.title).length === 1 ? "End active label" : "No active labels to end"}
                      >
                        <Square size={14} className="mr-2" aria-hidden="true" />
                        End Label {getActiveLabelsForVideo(video.title).length > 0 && `(${getActiveLabelsForVideo(video.title).length})`}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      const comment = videoPlayerStates.get(video.title)?.newComment.trim();
                      const hasIsbarEvaluation = ['identification', 'situation', 'background', 'assessment', 'recommendation'].includes(annotationCommentType) && isbarValue;
                      
                      if (hasIsbarEvaluation) {
                        // Use ISBAR evaluation
                        handleSubmitIsbarEvaluation(video.title);
                      } else if (comment) {
                        // Use regular comment
                        const currentTime = videoPlayerStates.get(video.title)?.currentTime || 0;
                        handleAddComment(video.title, currentTime, annotationDuration, annotationCommentType);
                      }
                    }}
                    disabled={!videoPlayerStates.get(video.title)?.newComment.trim() && !((['identification', 'situation', 'background', 'assessment', 'recommendation'].includes(annotationCommentType) && isbarValue))}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                    aria-label="Add comment at current timestamp"
                  >
                    <Send size={14} className="mr-2" aria-hidden="true" />
                    Add Comment
                  </Button>
                )}
                <Button
                  onClick={() => {
                    handleCommentChange(video.title, '');
                    setIsbarValue(''); // Also clear ISBAR value
                  }}
                  variant="outline"
                  size="sm"
                  className="px-4 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Clear comment text"
                >
                  Clear
                </Button>
              </div>

              {/* Status Messages for Screen Readers */}
              <div id="label-status" className="sr-only">
                {getActiveLabelsForVideo(video.title).length > 0 
                  ? 'Label recording in progress' 
                  : 'Ready to start new label'
                }
                        </div>
              
              {/* Live Region for Dynamic Updates */}
              <div aria-live="assertive" aria-atomic="true" className="sr-only">
                {labelStatusMessage}
                        </div>


                      </div>

            {/* Comments List - Flexible Height with Scrolling */}
            <div 
              className="comments-list-section comment-list-container flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative"
              role="region"
              aria-label="Video Comments"
              aria-live="polite"
              style={{ 
                containIntrinsicSize: 'none',
                contain: 'layout style'
              }}
            >
              {/* Scroll indicator gradient - only when content overflows */}
              {videoComments.length > 0 && (
                <>
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/20 to-transparent pointer-events-none z-10"
                    aria-hidden="true"
                    style={{ opacity: videoComments.length > 5 ? 1 : 0 }}
                  />
                  <div className="sr-only" aria-live="polite">
                    {videoComments.length} comments available. Scroll to navigate all comments.
                  </div>
                </>
              )}
                             {/* Comments container - flexible height, no fixed constraints */}
              <div className="flex flex-col gap-2 p-2">
              {videoComments.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Comments Yet</h4>
                  <p className="text-gray-500">Be the first to share your thoughts on this video.</p>
                </div>
              ) : (
                videoComments.map((comment, index) => {
                  const commentType = getCommentType(comment);
                  const badge = getCommentBadge(commentType);
                  const isExpanded = expandedComments.has(comment.name);
                  const commentText = comment.comment_text;
                  const shouldShowExpander = commentText.length > 150;
                  
                  // Extract doctor initials for avatar
                  const doctorName = comment.doctor_name || comment.doctor || 'Unknown';
                  const initials = doctorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                  
                  return (
                    <article 
                      key={`comment-${comment.name}-${index}`}
                      className="group bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 flex-shrink-0 min-w-0 w-full"
                      role="article"
                      aria-labelledby={`comment-${comment.name}-header`}
                    >
                      {/* Header Row */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">{initials}</span>
                        </div>
                        
                        {/* Content Column */}
                        <div className="flex-1 min-w-0">
                          {/* Top Row: Name, Badge, Actions */}
                          <div className="flex items-center gap-2 mb-1 min-w-0">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span 
                                id={`comment-${comment.name}-header`}
                                className="text-sm font-medium text-gray-900 truncate"
                                aria-label={`Comment by ${doctorName} at ${formatTime(comment.timestamp)}`}
                              >
                                {doctorName}
                              </span>
                              {/* Status Badge */}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${badge.classes}`}>
                                <span className={`w-1.5 h-1.5 ${badge.dotClasses} rounded-full mr-1`}></span>
                                {badge.label}
                              </span>
                            </div>
                            
                            {/* Action Icons (Hidden until hover) - Fixed width to prevent overflow */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-auto">
                              {canEditComment(comment) && (
                                <button 
                                  onClick={() => handleEditComment(comment)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded transition-colors" 
                                  aria-label={`Edit comment by ${doctorName}`}
                                >
                                  <Edit3 size={14} aria-hidden="true" />
                                </button>
                              )}
                              {canDeleteComment(comment) && (
                                <button 
                                  onClick={() => setCommentToDelete({ name: comment.name, text: comment.comment_text })}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 rounded transition-colors" 
                                  aria-label={`Delete comment by ${doctorName}`}
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Timestamp & Jump Button */}
                          <div className="flex items-center gap-2 mb-2">
                            <button
                              onClick={() => handleSeek(video.title, comment.timestamp)}
                              className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                            >
                              <Clock size={12} className="mr-1" />
                              {formatTime(comment.timestamp)}
                              {comment.duration && ` (+${formatTime(comment.duration)})`}
                            </button>
                            
                            {/* Duration Edit Section */}
                            {comment.duration && editingComment?.name !== comment.name && (
                              <div className="flex items-center gap-1">
                                {editingDuration === comment.name ? (
                                  <div className="flex items-center gap-1">
                                    <div className="flex items-center gap-0.5">
                                      <input
                                        type="number"
                                        value={editDurationValue}
                                        onChange={(e) => setEditDurationValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleSaveDuration(comment.name);
                                          } else if (e.key === 'Escape') {
                                            handleCancelDurationEdit();
                                          }
                                        }}
                                        placeholder="30"
                                        className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                                        min="1"
                                        max="600"
                                        autoFocus
                                        title="Duration in seconds (1-600). Press Enter to save, Escape to cancel."
                                      />
                                      <span className="text-xs text-gray-500">s</span>
                                      {editDurationValue && !isNaN(parseInt(editDurationValue)) && (
                                        <span className="text-xs text-blue-600 ml-1">
                                          ({formatTime(parseInt(editDurationValue))})
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleSaveDuration(comment.name)}
                                      className="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                                      aria-label="Save duration"
                                    >
                                      <Save size={12} />
                                    </button>
                                    <button
                                      onClick={handleCancelDurationEdit}
                                      className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded"
                                      aria-label="Cancel duration edit"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditDuration(comment)}
                                    className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                    aria-label="Edit duration"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                            
                            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Comment Text with Expandable Content */}
                      <div className="ml-13 min-w-0"> {/* Offset to align with content above */}
                          {editingComment?.name === comment.name ? (
                            <div className="space-y-2 min-w-0">
                              <textarea
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-md text-sm resize-none min-w-0"
                                rows={3}
                              />
                              <div className="flex items-center gap-2 flex-wrap">
                                <Button
                                  onClick={handleSaveComment}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs flex-shrink-0"
                                >
                                  <Save size={12} className="mr-1" />
                                  Save
                                </Button>
                                <Button
                                  onClick={handleCancelEdit}
                                  variant="outline"
                                  size="sm"
                                  className="px-3 py-1 text-xs flex-shrink-0"
                                >
                                  <X size={12} className="mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                          <div className="text-sm text-gray-700 leading-relaxed min-w-0 break-words">
                            {/* Truncated or Full Text */}
                            <div 
                              id={`comment-${comment.name}-text`}
                              className={`${shouldShowExpander && !isExpanded ? "line-clamp-3" : ""} break-words word-wrap-break-word`}
                            >
                              {commentText}
                            </div>
                            
                            {/* Expand/Collapse Button */}
                            {shouldShowExpander && (
                              <button 
                                onClick={() => toggleCommentExpansion(comment.name)}
                                className="text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 text-xs font-medium mt-1 inline-flex items-center gap-1 rounded px-1"
                                aria-expanded={isExpanded}
                                aria-controls={`comment-${comment.name}-text`}
                                aria-label={isExpanded ? 'Show less of comment' : 'Show more of comment'}
                              >
                                <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                                <svg 
                                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                                </svg>
                              </button>
                          )}
                        </div>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
