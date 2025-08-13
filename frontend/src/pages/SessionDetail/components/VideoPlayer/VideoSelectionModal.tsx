import React from 'react';
import { Button } from '../../../../components/ui/button';
import { X, Crown, CheckCircle, VideoIcon } from 'lucide-react';
import type { Video, SessionData } from '../../types/session.types';

interface VideoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: SessionData | null;
  activeVideos: Video[];
  masterVideo: Video | null;
  onAddVideo: (video: Video) => void;
  onRemoveVideo: (video: Video) => void;
}

export const VideoSelectionModal: React.FC<VideoSelectionModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  activeVideos,
  masterVideo,
  onAddVideo,
  onRemoveVideo,
}) => {
  if (!isOpen || !sessionData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] border border-gray-200 animate-fade-in-up overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Select Additional Videos</h3>
              <p className="text-sm text-gray-600 mt-1">Choose videos to display alongside the master video</p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionData.videos?.map((video) => {
              const isSelected = activeVideos.find(v => v.title === video.title);
              const isMaster = masterVideo?.title === video.title;
              
              return (
                <div 
                  key={video.title}
                  className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                    isMaster 
                      ? 'border-blue-500 bg-blue-50' 
                      : isSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Video Thumbnail/Placeholder */}
                  <div className="aspect-video bg-gray-900 relative">
                    <video
                      src={video.video_file}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                    />
                    {isMaster && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                          <Crown size={12} className="inline mr-1" />
                          Master
                        </span>
                      </div>
                    )}
                    {isSelected && !isMaster && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                          <CheckCircle size={12} className="inline mr-1" />
                          Selected
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-2 truncate">{video.title}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {video.duration ? `${Math.floor(video.duration / 60)}:${String(Math.floor(video.duration % 60)).padStart(2, '0')}` : 'Loading...'}
                      </span>
                      
                      {isMaster ? (
                        <span className="text-xs text-blue-600 font-medium">Master Video</span>
                      ) : isSelected ? (
                        <Button
                          onClick={() => onRemoveVideo(video)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 font-medium px-3 py-1 text-xs"
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          onClick={() => onAddVideo(video)}
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-50 font-medium px-3 py-1 text-xs"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {(!sessionData.videos || sessionData.videos.length === 0) && (
            <div className="text-center py-12">
              <VideoIcon size={48} className="mx-auto text-gray-300 mb-4" />
              <h4 className="text-lg font-medium text-gray-500 mb-2">No Videos Available</h4>
              <p className="text-gray-400">No videos found for this session.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {activeVideos.filter(v => v.title !== masterVideo?.title).length} additional videos selected
            </div>
            <Button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};