import React from 'react';
import { Button } from '../../../../components/ui/button';
import { Trash2, Edit3 } from 'lucide-react';
import type { CustomTemplate } from '../../types/session.types';

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customTemplates: CustomTemplate[];
  newTemplate: {
    title: string;
    content: string;
    color: string;
    emoji: string;
  };
  editingTemplate: CustomTemplate | null;
  onNewTemplateChange: (field: string, value: string) => void;
  onCreateTemplate: () => void;
  onEditTemplate: (template: CustomTemplate) => void;
  onUpdateTemplate: () => void;
  onCancelTemplateEdit: () => void;
  onDeleteTemplate: (name: string) => void;
  onEditingTemplateChange: (field: string, value: string) => void;
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  customTemplates,
  newTemplate,
  editingTemplate,
  onNewTemplateChange,
  onCreateTemplate,
  onEditTemplate,
  onUpdateTemplate,
  onCancelTemplateEdit,
  onDeleteTemplate,
  onEditingTemplateChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] border border-gray-200 animate-fade-in-up overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Template Manager</h3>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Template */}
          <div className="mb-8">
            <h4 className="text-base font-semibold text-gray-900 mb-4">Create New Template</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTemplate.title}
                    onChange={(e) => onNewTemplateChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Template title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={newTemplate.emoji}
                    onChange={(e) => onNewTemplateChange('emoji', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="📝"
                    maxLength={2}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  rows={3}
                  value={newTemplate.content}
                  onChange={(e) => onNewTemplateChange('content', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Template content..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <select
                  value={newTemplate.color}
                  onChange={(e) => onNewTemplateChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="red">Red</option>
                  <option value="purple">Purple</option>
                </select>
              </div>
              
              <Button
                onClick={onCreateTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Template
              </Button>
            </div>
          </div>
          
          {/* Existing Templates */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4">Your Templates</h4>
            {Array.isArray(customTemplates) && customTemplates.length > 0 ? (
              <div className="space-y-3">
                {customTemplates.map((template) => (
                  <div key={template.name} className="border border-gray-200 rounded-lg p-4">
                    {editingTemplate?.name === template.name ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editingTemplate.title}
                              onChange={(e) => onEditingTemplateChange('title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Emoji
                            </label>
                            <input
                              type="text"
                              value={editingTemplate.emoji}
                              onChange={(e) => onEditingTemplateChange('emoji', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                              maxLength={2}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Content
                          </label>
                          <textarea
                            rows={3}
                            value={editingTemplate.content}
                            onChange={(e) => onEditingTemplateChange('content', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Color
                          </label>
                          <select
                            value={editingTemplate.color}
                            onChange={(e) => onEditingTemplateChange('color', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="yellow">Yellow</option>
                            <option value="red">Red</option>
                            <option value="purple">Purple</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={onUpdateTemplate}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={onCancelTemplateEdit}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{template.emoji}</span>
                            <span className="font-medium text-gray-900">{template.title}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            onClick={() => onEditTemplate(template)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            onClick={() => onDeleteTemplate(template.name)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No custom templates yet. Create your first template above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};