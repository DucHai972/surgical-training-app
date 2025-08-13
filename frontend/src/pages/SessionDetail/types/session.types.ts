// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionEvent {
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

export interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface SpeechRecognition {
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

export interface Video {
  title: string;
  description: string;
  video_file: string;
  duration: number;
}

export interface Comment {
  name: string;
  doctor: string;
  doctor_name?: string;
  video_title: string;
  timestamp: number;
  duration?: number;
  comment_type?: string;
  comment_text: string;
  creation_date?: string;
  created_at: string;
}

export interface CustomTemplate {
  name: string;
  title: string;
  content: string;
  color: string;
  emoji: string;
  created: string;
  modified: string;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  newComment: string;
}

export interface ActiveLabel {
  id: string;
  videoTitle: string;
  startTime: number;
  comment: string;
  type: string;
  createdAt: number;
}

export interface SessionInfo {
  name: string;
  title: string;
  description: string;
  session_date: string;
  status: string;
}

export interface SessionData {
  session: SessionInfo;
  videos: Video[];
  comments: Comment[];
}

export interface EvaluationData {
  identification: string;
  situation: string;
  history: string;
  examination: string;
  assessment: string;
  recommendation: string;
  grs: string;
  comment: string;
}

export type LayoutType = 'single' | 'side-by-side';

export type CommentType = 'positive' | 'attention' | 'critical' | 'teaching' | 'general' | 'identification' | 'situation' | 'background' | 'assessment' | 'recommendation';

export type LabelMode = 'start_end' | 'duration';

export type AnnotationCommentType = 'identification' | 'situation' | 'background' | 'assessment' | 'recommendation' | 'general';

export type ActiveTab = 'videos' | 'comments' | 'comment' | 'evaluation';