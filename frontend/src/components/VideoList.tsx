import { Video, Play, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Video {
  title: string;
  description: string;
  video_file: string;
  duration: number;
}

interface VideoListProps {
  videos: Video[];
  currentVideo: Video;
  onVideoChange: (video: Video) => void;
  getVideoComments: (videoTitle: string) => any[];
}

const VideoList = ({ videos, currentVideo, onVideoChange, getVideoComments }: VideoListProps) => {
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 dark:from-indigo-600 dark:via-purple-700 dark:to-blue-700 border-b border-indigo-300 dark:border-indigo-800 p-6">
        <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
            <Video size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <span>Training Videos</span>
            <div className="text-sm font-normal text-white/80 mt-1">
              {videos.length} video{videos.length !== 1 ? 's' : ''} available
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
            {videos.length}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          {videos.map((video, index) => {
            const isActive = currentVideo.title === video.title;
            const commentCount = getVideoComments(video.title).length;
            
            return (
              <div
                key={video.title}
                onClick={() => onVideoChange(video)}
                className={`group relative cursor-pointer transition-all duration-300 border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/50 dark:via-purple-950/30 dark:to-indigo-950/50' 
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600"></div>
                )}
                
                <div className="p-5 pl-6">
                  {/* Video header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shadow-md transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 scale-110' 
                          : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                      }`}>
                        <Play size={16} className={`${
                          isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        } transition-colors duration-300`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-base leading-tight transition-colors duration-300 ${
                          isActive 
                            ? 'text-indigo-900 dark:text-indigo-100' 
                            : 'text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
                        }`}>
                          {video.title}
                        </h4>
                        
                        {video.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <ChevronRight size={16} className={`flex-shrink-0 ml-2 transition-all duration-300 ${
                      isActive 
                        ? 'text-indigo-600 dark:text-indigo-400 transform rotate-90' 
                        : 'text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-1'
                    }`} />
                  </div>
                  
                  {/* Video metadata */}
                  <div className="flex items-center gap-4 text-xs">
                    {video.duration && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors duration-300 ${
                        isActive 
                          ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        <Clock size={12} />
                        <span className="font-medium">{formatDuration(video.duration)}</span>
                      </div>
                    )}
                    
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors duration-300 ${
                      isActive 
                        ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <MessageSquare size={12} />
                      <span className="font-medium">{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {isActive && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-medium">Now Playing</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Hover effect overlay */}
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                  isActive ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                } bg-gradient-to-r from-indigo-500/5 to-purple-500/5`}></div>
              </div>
            );
          })}
        </div>
        
        {videos.length === 0 && (
          <div className="p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Video size={24} className="text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Videos Available</h3>
            <p className="text-gray-600 dark:text-gray-400">There are no training videos in this session yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoList; 