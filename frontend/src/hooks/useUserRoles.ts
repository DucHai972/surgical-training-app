import { useFrappeGetCall, useFrappeAuth } from 'frappe-react-sdk';
import { hasAdminAccess, hasDoctorAccess } from '../utils/roleUtils';

/**
 * Custom hook for consistent user role loading across all pages
 * Handles the common race condition and role extraction patterns
 */
export const useUserRoles = () => {
  const { currentUser } = useFrappeAuth();
  
  // Fetch roles with proper loading state and key
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useFrappeGetCall(
    'surgical_training.api.user.get_user_roles',
    undefined,
    currentUser ? `user-roles-${currentUser}` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Handle role data extraction with proper fallback
  const rolesResponseData = rolesData?.message || rolesData;
  let userRoles = rolesResponseData?.roles || [];
  
  // Fallback to frappe_roles if main roles array is empty
  if (userRoles.length === 0 && rolesResponseData?.frappe_roles) {
    userRoles = rolesResponseData.frappe_roles;
  }

  // Calculate access permissions
  const hasAdmin = hasAdminAccess(userRoles);
  const hasDoctor = hasDoctorAccess(userRoles);


  return {
    // Data
    userRoles,
    rolesData: rolesResponseData,
    
    // Loading states
    rolesLoading,
    rolesError,
    isReady: !rolesLoading && (rolesData || rolesError),
    
    // Permissions
    hasAdmin,
    hasDoctor,
    
    // Utility
    currentUser,
  };
};