import { Video, Play, MessageSquare, Clock, ChevronRight, Menu, X, List, Grid } from 'lucide-react';

import { Button } from './ui/button';
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleVideoSelect = (video: Video) => {
    onVideoChange(video);
    // Auto-close on mobile/tablet for better UX
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Toggle Button - Fixed position */}
      <Button
        onClick={toggleSidebar}
        className={`fixed top-6 right-6 z-[9999] h-16 w-16 rounded-full shadow-lg transition-all duration-300 ${
          isOpen 
            ? 'bg-red-600 hover:bg-red-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={isOpen ? 'Close video list' : 'Open video list'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-[9997] transition-transform duration-300 ease-in-out border-l border-gray-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '480px', maxWidth: '90vw' }}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 border-b border-blue-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                <Video size={24} className="text-white" />
          </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Training Videos</h2>
                <p className="text-base text-white/90">
              {videos.length} video{videos.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-full text-lg font-semibold shadow-lg">
              {videos.length}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-2">
            <Button
              onClick={() => setViewMode('list')}
              variant="ghost"
              size="lg"
              className={`flex-1 text-white hover:bg-white/20 transition-all duration-200 rounded-xl px-6 py-4 min-h-[56px] ${
                viewMode === 'list' ? 'bg-white/20 shadow-sm' : ''
              }`}
            >
              <List size={18} className="mr-3" />
              List
            </Button>
            <Button
              onClick={() => setViewMode('grid')}
              variant="ghost"
              size="lg"
              className={`flex-1 text-white hover:bg-white/20 transition-all duration-200 rounded-xl px-6 py-4 min-h-[56px] ${
                viewMode === 'grid' ? 'bg-white/20 shadow-sm' : ''
              }`}
            >
              <Grid size={18} className="mr-3" />
              Grid
            </Button>
          </div>
        </div>

        {/* Video List Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto custom-scrollbar">
            {viewMode === 'list' ? (
              // List View
              <div className="p-4 space-y-3">
          {videos.map((video, index) => {
            const isActive = currentVideo.title === video.title;
            const commentCount = getVideoComments(video.title).length;
            
            return (
              <div
                key={video.title}
                      onClick={() => handleVideoSelect(video)}
                      className={`group relative cursor-pointer rounded-xl transition-all duration-300 border ${
                  isActive 
                          ? 'bg-blue-50 border-blue-200 shadow-lg scale-[1.02]' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator */}
                {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-xl"></div>
                )}
                
                      <div className="p-4 pl-6">
                  {/* Video header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 ${
                        isActive 
                          ? 'bg-blue-600 scale-110' 
                                : 'bg-gray-100 group-hover:bg-blue-100'
                      }`}>
                              <Play size={14} className={`${
                                isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
                        } transition-colors duration-300`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm leading-tight transition-colors duration-300 ${
                          isActive 
                                  ? 'text-blue-900' 
                                  : 'text-gray-900 group-hover:text-blue-700'
                        }`}>
                          {video.title}
                        </h4>
                        
                        {video.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                          <ChevronRight size={14} className={`flex-shrink-0 ml-2 transition-all duration-300 ${
                      isActive 
                              ? 'text-blue-600 transform rotate-90' 
                              : 'text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1'
                    }`} />
                  </div>
                  
                  {/* Video metadata */}
                        <div className="flex items-center gap-2 text-xs">
                    {video.duration && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors duration-300 ${
                        isActive 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-600'
                      }`}>
                              <Clock size={10} />
                        <span className="font-medium">{formatDuration(video.duration)}</span>
                      </div>
                    )}
                    
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors duration-300 ${
                      isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                    }`}>
                            <MessageSquare size={10} />
                            <span className="font-medium">{commentCount}</span>
                    </div>
                    
                    {isActive && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                              <span className="font-medium">Playing</span>
                      </div>
                    )}
                  </div>
                </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Grid View
              <div className="p-4 grid grid-cols-1 gap-4">
                {videos.map((video, index) => {
                  const isActive = currentVideo.title === video.title;
                  const commentCount = getVideoComments(video.title).length;
                  
                  return (
                    <div
                      key={video.title}
                      onClick={() => handleVideoSelect(video)}
                      className={`group cursor-pointer rounded-xl transition-all duration-300 border overflow-hidden ${
                        isActive 
                          ? 'bg-blue-50 border-blue-200 shadow-lg scale-[1.02]' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Video thumbnail placeholder */}
                      <div className={`h-24 bg-gradient-to-br relative overflow-hidden ${
                        isActive 
                          ? 'from-blue-500 to-indigo-600' 
                          : 'from-gray-400 to-gray-600 group-hover:from-blue-400 group-hover:to-blue-600'
                      } transition-all duration-300`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play size={24} className="text-white opacity-80" />
                        </div>
                        {isActive && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Playing
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3">
                        <h4 className={`font-semibold text-sm mb-2 transition-colors duration-300 ${
                          isActive 
                            ? 'text-blue-900' 
                            : 'text-gray-900 group-hover:text-blue-700'
                        }`}>
                          {video.title}
                        </h4>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {video.duration && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                                isActive 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <Clock size={10} />
                                <span>{formatDuration(video.duration)}</span>
                              </div>
                            )}
                            
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                              isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <MessageSquare size={10} />
                              <span>{commentCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
              </div>
            );
          })}
        </div>
            )}
        
        {videos.length === 0 && (
          <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Video size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Available</h3>
                <p className="text-gray-600">There are no training videos in this session yet.</p>
            </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            {videos.filter(v => v.title === currentVideo.title).length > 0 ? (
              <>Currently viewing: <span className="font-medium text-blue-600">{currentVideo.title}</span></>
            ) : (
              'Select a video to start watching'
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoList; 