import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Maximize2, VideoIcon, Play, Square } from 'lucide-react';
import type { Video, VideoPlayerState } from '../../types/session.types';

interface AdditionalVideosPanelProps {
  activeVideos: Video[];
  masterVideo: Video | null;
  masterVideoHeight: number;
  videoPlayerStates: Map<string, VideoPlayerState>;
  onShowVideoSelection: () => void;
  onHandleProgress: (videoTitle: string, state: { playedSeconds: number }) => void;
  onHandlePlayPause: (videoTitle: string, playing: boolean, skipSync?: boolean) => void;
  onHandleSeek: (videoTitle: string, seconds: number) => void;
}

export const AdditionalVideosPanel: React.FC<AdditionalVideosPanelProps> = ({
  activeVideos,
  masterVideo,
  masterVideoHeight,
  videoPlayerStates,
  onShowVideoSelection,
  onHandleProgress,
  onHandlePlayPause,
  onHandleSeek,
}) => {
  const additionalVideos = activeVideos.filter(video => video.title !== masterVideo?.title);

  return (
    <div className="w-1/3">
      <div className="space-y-3">
        {/* Sub-Videos Header */}
        <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Maximize2 size={16} className="text-gray-600" />
              <h4 className="text-sm font-bold text-gray-800">Additional Views</h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                {additionalVideos.length} videos
              </span>
              <Button
                onClick={onShowVideoSelection}
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-300 hover:bg-blue-50 font-medium px-2 py-1 text-xs"
              >
                <VideoIcon size={12} className="mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Sub-Videos Stack */}
        {additionalVideos.length > 0 ? (
          <div 
            className="space-y-3" 
            style={{
              maxHeight: masterVideoHeight > 0 ? `${masterVideoHeight - 50}px` : 'auto',
              overflowY: 'auto'
            }}
          >
            {additionalVideos.map((video) => {
              const videoState = videoPlayerStates.get(video.title);
              if (!videoState) return null;
              
              const additionalVideosCount = additionalVideos.length;
              const maxVideoHeight = masterVideoHeight > 0 
                ? Math.min(
                    (masterVideoHeight - 100) / additionalVideosCount - 12, // 12px for spacing
                    250 // Max height per video
                  )
                : 200; // Fallback height
              
              return (
                <div key={video.title} className="bg-gray-900 border border-gray-400 rounded-lg overflow-hidden shadow-md">
                  {/* Sub-Video Header */}
                  <div className="px-3 py-2 bg-gray-200 border-b border-gray-400">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-bold text-gray-800">{video.title}</h5>
                      <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        View Only
                      </span>
                    </div>
                  </div>
                  
                  {/* Sub-Video Player - Minimal */}
                  <div 
                    className="bg-black relative"
                    style={{
                      height: `${maxVideoHeight}px`,
                      minHeight: '120px'
                    }}
                  >
                    <video
                      key={`sub-${video.title}`}
                      className="w-full h-full object-cover"
                      src={video.video_file}
                      muted
                      playsInline
                      ref={(videoEl) => {
                        if (videoEl) {
                          // Sync play/pause state
                          if (videoState.isPlaying && videoEl.paused) {
                            videoEl.play().catch(() => {});
                          } else if (!videoState.isPlaying && !videoEl.paused) {
                            videoEl.pause();
                          }
                          
                          // Sync time (with small tolerance to avoid constant updates)
                          if (Math.abs(videoEl.currentTime - videoState.currentTime) > 1) {
                            videoEl.currentTime = videoState.currentTime;
                          }
                        }
                      }}
                      onTimeUpdate={(e) => {
                        const time = (e.target as HTMLVideoElement).currentTime;
                        onHandleProgress(video.title, { playedSeconds: time });
                      }}
                    />
                    
                    {/* Simple Play/Pause Control Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30">
                      <button
                        onClick={() => onHandlePlayPause(video.title, !videoState.isPlaying, true)}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all"
                      >
                        {videoState.isPlaying ? (
                          <Square size={24} className="text-gray-800" />
                        ) : (
                          <Play size={24} className="text-gray-800" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Sub-Video Simple Timeline */}
                  <div className="px-3 py-2 bg-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-600 min-w-0">
                        {Math.floor(videoState.currentTime / 60)}:{String(Math.floor(videoState.currentTime % 60)).padStart(2, '0')}
                      </span>
                      <div 
                        className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const videoEl = document.querySelector(`video[src="${video.video_file}"]`) as HTMLVideoElement;
                          if (videoEl && videoEl.duration) {
                            const newTime = percent * videoEl.duration;
                            onHandleSeek(video.title, newTime);
                          }
                        }}
                      >
                        <div 
                          className="h-full bg-blue-500 transition-all duration-200"
                          style={{ 
                            width: `${(() => {
                              const videoEl = document.querySelector(`video[src="${video.video_file}"]`) as HTMLVideoElement;
                              const duration = videoEl?.duration || 300; // Fallback to 5 minutes
                              return Math.min(((videoState.currentTime || 0) / duration) * 100, 100);
                            })()}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-600 min-w-0">
                        {(() => {
                          const videoEl = document.querySelector(`video[src="${video.video_file}"]`) as HTMLVideoElement;
                          const duration = videoEl?.duration || 0;
                          if (duration > 0) {
                            const minutes = Math.floor(duration / 60);
                            const seconds = Math.floor(duration % 60);
                            return `${minutes}:${String(seconds).padStart(2, '0')}`;
                          }
                          return '--:--';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <VideoIcon size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No additional videos selected</p>
            <p className="text-xs text-gray-400">Click "Add" to select videos</p>
          </div>
        )}
      </div>
    </div>
  );
};