import { Comment, CommentType } from '../types/session.types';

/**
 * Comment-related utility functions for SessionDetail
 */

export const isEvaluationComment = (comment: Comment): boolean => {
  return comment.comment_text.startsWith('[EVALUATION]');
};

export const categorizeComment = (commentText: string): CommentType => {
  const text = commentText.toLowerCase();
  
  // Check for critical/negative indicators first (highest priority)
  if (text.includes('critical') || text.includes('dangerous') || text.includes('severe') || 
      text.includes('urgent') || text.includes('emergency') || text.includes('fatal') ||
      text.includes('❌') || text.includes('risk') || text.includes('error') ||
      text.includes('wrong') || text.includes('incorrect') || text.includes('bad')) {
    return 'critical';
  }
  
  // Check for attention/warning indicators
  if (text.includes('attention') || text.includes('warning') || text.includes('caution') ||
      text.includes('careful') || text.includes('watch') || text.includes('monitor') ||
      text.includes('⚠️') || text.includes('concern') || text.includes('issue') ||
      text.includes('problem') || text.includes('improve') || text.includes('adjust')) {
    return 'attention';
  }
  
  // Check for teaching/learning indicators
  if (text.includes('teaching') || text.includes('learning') || text.includes('technique') ||
      text.includes('method') || text.includes('approach') || text.includes('skill') ||
      text.includes('📚') || text.includes('🎯') || text.includes('key') ||
      text.includes('important') || text.includes('note') || text.includes('remember')) {
    return 'teaching';
  }
  
  // Check for positive indicators
  if (text.includes('excellent') || text.includes('good') || text.includes('great') ||
      text.includes('perfect') || text.includes('well') || text.includes('correct') ||
      text.includes('👍') || text.includes('✓') || text.includes('nice') ||
      text.includes('smooth') || text.includes('effective') || text.includes('proper')) {
    return 'positive';
  }
  
  // Default to general for other comments
  return 'general';
};

export const getCommentTypeBadge = (commentType: CommentType) => {
  switch (commentType) {
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