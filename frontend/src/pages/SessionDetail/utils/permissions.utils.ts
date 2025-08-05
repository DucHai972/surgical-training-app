import { Comment } from '../types/session.types';

/**
 * Permission-related utility functions for SessionDetail
 */

export const canDeleteComment = (_comment: Comment): boolean => {
  // TODO: Implement proper permission checking based on user roles
  // For now, allowing all users to delete (UI only, backend validates)
  // This is just for UI display purposes
  return true; // Show delete button for all comments, backend will validate permissions
};

export const canEditComment = (_comment: Comment): boolean => {
  // TODO: Implement proper permission checking based on user roles
  // For now, allowing all users to edit (UI only, backend validates)
  // This is just for UI display purposes
  return true; // Show edit button for all comments, backend will validate permissions
};