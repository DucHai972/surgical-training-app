import React from 'react';
import { Button } from '../../../../components/ui/button';
import { 
  MessageSquare, 
  Clock, 
  Target, 
  ClipboardCheck, 
  ChevronDown, 
  X, 
  Edit3, 
  Mic, 
  CheckCircle, 
  Send 
} from 'lucide-react';
import type { 
  Video, 
  VideoPlayerState, 
  LabelMode, 
  CustomTemplate, 
  EvaluationData,
  CommentType,
  AnnotationCommentType,
  ActiveTab 
} from '../../types/session.types';
import { formatTime } from '../../utils/time.utils';

interface FloatingCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVideo: Video;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  floatingCommentTimestamp: number;
  setFloatingCommentTimestamp: (timestamp: number) => void;
  labelMode: LabelMode;
  setLabelMode: (mode: LabelMode) => void;
  annotationCommentType: AnnotationCommentType;
  setAnnotationCommentType: (type: AnnotationCommentType) => void;
  isbarValue: string;
  setIsbarValue: (value: string) => void;
  videoPlayerStates: Map<string, VideoPlayerState>;
  isAddingComment: boolean;
  customTemplates: CustomTemplate[];
  setShowTemplateManager: (show: boolean) => void;
  evaluationData: EvaluationData;
  evaluationExpanded: Record<string, boolean>;
  isListening: boolean;
  voiceTranscript: string;
  isVoiceSupported: boolean;
  microphonePermission: PermissionState | null;
  onHandleCommentChange: (videoTitle: string, comment: string) => void;
  onToggleEvaluationExpanded: (key: string) => void;
  onHandleEvaluationChange: (key: keyof EvaluationData, value: string) => void;
  onResetEvaluationForm: () => void;
  onToggleVoiceRecording: () => void;
  onInsertVoiceTranscript: () => void;
  onClearVoiceTranscript: () => void;
  onHandleStartLabel: (videoTitle: string, comment: string, type: CommentType) => void;
  onHandleAddComment: (videoTitle: string, timestamp: number, duration: number, type: CommentType) => void;
  onHandleAddEvaluation: () => void;
  getColorClasses: (color: string) => string;
  getEvaluationLabel: (category: string, value: string) => string;
}

export const FloatingCommentModal: React.FC<FloatingCommentModalProps> = ({
  isOpen,
  onClose,
  currentVideo,
  activeTab,
  setActiveTab,
  floatingCommentTimestamp,
  setFloatingCommentTimestamp,
  labelMode,
  setLabelMode,
  annotationCommentType,
  setAnnotationCommentType,
  isbarValue,
  setIsbarValue,
  videoPlayerStates,
  isAddingComment,
  customTemplates,
  setShowTemplateManager,
  evaluationData,
  evaluationExpanded,
  isListening,
  voiceTranscript,
  isVoiceSupported,
  microphonePermission,
  onHandleCommentChange,
  onToggleEvaluationExpanded,
  onHandleEvaluationChange,
  onResetEvaluationForm,
  onToggleVoiceRecording,
  onInsertVoiceTranscript,
  onClearVoiceTranscript,
  onHandleStartLabel,
  onHandleAddComment,
  onHandleAddEvaluation,
  getColorClasses,
  getEvaluationLabel,
}) => {
  if (!isOpen || !currentVideo) return null;

  return (
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
              onClick={onClose}
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
            {/* Mode Selector */}
            <div className="mb-3">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Timestamp */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {labelMode === 'start_end' ? 'Start Time' : 'Timestamp'}
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

              {/* Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ISBAR Category
                </label>
                <select
                  value={annotationCommentType}
                  onChange={(e) => {
                    setAnnotationCommentType(e.target.value as AnnotationCommentType);
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
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto h-full">
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
                      onChange={(e) => onHandleCommentChange(currentVideo.title, e.target.value)}
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
                      onClick={() => onHandleCommentChange(currentVideo.title, '👍 Excellent technique demonstrated. Good hand positioning and instrument control.')}
                      variant="outline"
                      className="text-left p-3 h-auto text-green-700 border-green-200 hover:bg-green-50 rounded-lg"
                    >
                      <div className="text-sm font-medium">👍 Positive Feedback</div>
                      <div className="text-xs text-gray-600 mt-1">Excellent technique demonstrated</div>
                    </Button>
                    <Button
                      onClick={() => onHandleCommentChange(currentVideo.title, '⚠️ Attention needed: Consider adjusting approach for better safety and precision.')}
                      variant="outline"
                      className="text-left p-3 h-auto text-yellow-700 border-yellow-200 hover:bg-yellow-50 rounded-lg"
                    >
                      <div className="text-sm font-medium">⚠️ Needs Attention</div>
                      <div className="text-xs text-gray-600 mt-1">Requires adjustment</div>
                    </Button>
                    <Button
                      onClick={() => onHandleCommentChange(currentVideo.title, '🎯 Key learning moment: This demonstrates proper technique for this procedure.')}
                      variant="outline"
                      className="text-left p-3 h-auto text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg"
                    >
                      <div className="text-sm font-medium">🎯 Teaching Point</div>
                      <div className="text-xs text-gray-600 mt-1">Key learning moment</div>
                    </Button>
                    <Button
                      onClick={() => onHandleCommentChange(currentVideo.title, '❌ Critical issue: This approach poses safety risks and should be corrected immediately.')}
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
                            onClick={() => onHandleCommentChange(currentVideo.title, template.content)}
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
                              onClick={() => onToggleEvaluationExpanded(category.key)}
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
                                      onClick={() => onHandleEvaluationChange(category.key as keyof EvaluationData, option)}
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
                      onChange={(e) => onHandleEvaluationChange('comment', e.target.value)}
                    />
                  </div>

                  {/* Reset Button */}
                  <div className="flex justify-start">
                    <Button
                      onClick={onResetEvaluationForm}
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
                  onClick={onToggleVoiceRecording}
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
                    onClick={onInsertVoiceTranscript}
                    variant="outline"
                    size="sm"
                    className="text-green-700 border-green-200 hover:bg-green-50 px-3 py-2"
                  >
                    <CheckCircle size={12} />
                    <span className="text-sm ml-1">Use</span>
                  </Button>
                  <Button
                    onClick={onClearVoiceTranscript}
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
                onClick={onClose}
                variant="outline"
                size="sm"
                className="px-4 py-2"
              >
                Cancel
              </Button>
              {activeTab === 'comment' ? (
                <div className="flex items-center gap-2">
                  {labelMode === 'start_end' ? (
                    <Button
                      onClick={() => {
                        const comment = videoPlayerStates.get(currentVideo.title)?.newComment.trim();
                        if (comment) {
                          onHandleStartLabel(currentVideo.title, comment, annotationCommentType);
                          onClose();
                        }
                      }}
                      disabled={isAddingComment || !videoPlayerStates.get(currentVideo.title)?.newComment.trim()}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                    >
                      <Target size={14} className="mr-1" />
                      {isAddingComment ? 'Starting...' : 'Start Label'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        onHandleAddComment(currentVideo.title, floatingCommentTimestamp, 30, annotationCommentType); // Default 30s duration
                        onClose();
                      }}
                      disabled={isAddingComment || !videoPlayerStates.get(currentVideo.title)?.newComment.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                    >
                      <Send size={14} className="mr-1" />
                      {isAddingComment ? 'Adding...' : 'Add Annotation'}
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={onHandleAddEvaluation}
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
  );
};