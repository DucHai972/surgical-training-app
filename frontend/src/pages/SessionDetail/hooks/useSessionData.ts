import { useState, useEffect } from 'react';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { SessionData } from '../types/session.types';
import toast from 'react-hot-toast';

interface UseSessionDataProps {
  sessionName: string | null;
  authUser: string | null;
}

export const useSessionData = ({ sessionName, authUser }: UseSessionDataProps) => {
  console.log('🔧 DEBUG useSessionData: Hook called with:', { sessionName, authUser });
  console.log('🔧 DEBUG useSessionData: Hook invocation timestamp:', new Date().toISOString());
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isAccessPending, setIsAccessPending] = useState<boolean>(true);

  console.log('🔧 DEBUG useSessionData: Current state:', {
    sessionData: !!sessionData,
    sessionDataType: typeof sessionData,
    sessionDataKeys: sessionData ? Object.keys(sessionData) : 'null',
    error: !!error,
    errorValue: error,
    hasAccess,
    isAccessPending
  });

  // Check user permissions for this session
  const isAdmin = authUser === 'administrator@gmail.com';

  useEffect(() => {
    console.log('🔧 DEBUG useSessionData: Access check useEffect triggered');
    
    const checkAccess = async () => {
      console.log('🔧 DEBUG useSessionData: checkAccess called with:', { sessionName, authUser, isAdmin });
      
      if (!sessionName || !authUser) {
        console.log('🔧 DEBUG useSessionData: No sessionName or authUser, setting access pending to false');
        setIsAccessPending(false);
        return;
      }

      // Admin always has access - grant immediately
      if (isAdmin) {
        console.log('🔧 DEBUG useSessionData: User is admin, granting access');
        setHasAccess(true);
        setIsAccessPending(false);
        return;
      }

      // For non-admin users, grant access by default and let the API handle access control
      // This matches the behavior of the old version which didn't have front-end access restrictions
      console.log('🔧 DEBUG useSessionData: Granting access for non-admin user - API will handle access control');
      setHasAccess(true);
      setIsAccessPending(false);
    };

    checkAccess();
  }, [sessionName, authUser, isAdmin]);

  // Always call the hook - don't make it conditional
  // Note: useFrappeGetCall returns the API response directly, not wrapped in another object
  const { data, error: fetchError, isLoading, mutate } = useFrappeGetCall(
    'surgical_training.api.session.get_session_details',
    sessionName ? { session_name: sessionName } : undefined,
    sessionName ? `session-${sessionName}` : null,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      errorRetryCount: 1,
    }
  );
  
  console.log('🔧 DEBUG useSessionData: useFrappeGetCall result (DETAILED):', {
    timestamp: new Date().toISOString(),
    methodName: 'surgical_training.api.session.get_session_details',
    params: sessionName ? { session_name: sessionName } : null,
    key: sessionName ? `session-${sessionName}` : null,
    rawData: data,
    rawDataType: typeof data,
    rawDataString: JSON.stringify(data, null, 2),
    dataStructure: data ? Object.keys(data) : 'no data',
    dataMessage: (data as any)?.message,
    dataData: (data as any)?.data,
    error: fetchError,
    errorType: typeof fetchError,
    errorString: JSON.stringify(fetchError, null, 2),
    isLoading,
    sessionName,
    authUser,
    hasAccess,
    isAccessPending
  });

  useEffect(() => {
    console.log('🔧 DEBUG useSessionData: Data useEffect triggered with:', { 
      timestamp: new Date().toISOString(),
      data: data, 
      dataExists: !!data,
      dataType: typeof data,
      dataValue: data,
      fetchError, 
      fetchErrorExists: !!fetchError,
      isLoading,
      dataStructure: data ? Object.keys(data) : 'no data',
      effectDependencies: { data, fetchError }
    });
    
    // Handle successful data - the API returns {"message": "Success", "data": {...}}
    if (data) {
      console.log('🔧 DEBUG useSessionData: Raw data received:', data);
      
      // The useFrappeGetCall wraps the API response: {message: {message: "Success", data: sessionData}}  
      console.log('🔧 DEBUG useSessionData: Checking data structure...');
      console.log('🔧 DEBUG useSessionData: data.message:', (data as any).message);
      console.log('🔧 DEBUG useSessionData: data.message.message:', (data as any).message?.message);
      console.log('🔧 DEBUG useSessionData: data.message.data exists:', !!((data as any).message?.data));
      console.log('🔧 DEBUG useSessionData: data.videos exists:', !!((data as any).videos));
      
      if ((data as any).message?.message === 'Success' && (data as any).message?.data) {
        console.log('🔧 DEBUG useSessionData: ✅ MATCH - Setting session data from data.message.data:', (data as any).message.data);
        console.log('🔧 DEBUG useSessionData: About to call setSessionData with:', (data as any).message.data);
        setSessionData((data as any).message.data);
        setError(null);
        console.log('🔧 DEBUG useSessionData: ✅ setSessionData and setError(null) called successfully');
      } else if ((data as any).message === 'Success' && (data as any).data) {
        // Fallback: Direct API response format (less likely but possible)
        console.log('🔧 DEBUG useSessionData: ✅ FALLBACK 1 - Setting session data from data.data:', (data as any).data);
        setSessionData((data as any).data);
        setError(null);
        console.log('🔧 DEBUG useSessionData: ✅ setSessionData (fallback 1) and setError(null) called successfully');
      } else if ((data as any).videos) {
        // Fallback: If data is returned directly (less likely)
        console.log('🔧 DEBUG useSessionData: ✅ FALLBACK 2 - Setting session data directly:', data);
        setSessionData(data as unknown as SessionData);
        setError(null);
        console.log('🔧 DEBUG useSessionData: ✅ setSessionData (fallback 2) and setError(null) called successfully');
      } else {
        console.warn('🔧 DEBUG useSessionData: ❌ NO MATCH - Unexpected data structure:', data);
        console.warn('🔧 DEBUG useSessionData: Data keys:', Object.keys(data as any));
        console.warn('🔧 DEBUG useSessionData: Data message:', (data as any).message);
        console.warn('🔧 DEBUG useSessionData: Data message.message:', (data as any).message?.message);
        console.warn('🔧 DEBUG useSessionData: Data type:', typeof (data as any).message);
        console.warn('🔧 DEBUG useSessionData: Message comparison direct:', (data as any).message === 'Success');
        console.warn('🔧 DEBUG useSessionData: Message comparison nested:', (data as any).message?.message === 'Success');
      }
    } else if (fetchError) {
      console.error('🔧 DEBUG useSessionData: Session data error:', fetchError);
      
      if (typeof fetchError === 'object' && fetchError !== null) {
        if ('_server_messages' in fetchError) {
          try {
            const messages = JSON.parse((fetchError as any)._server_messages);
            if (Array.isArray(messages) && messages.length > 0) {
              const msg = messages[0];
              if (typeof msg === 'string') {
                const parsedMsg = JSON.parse(msg);
                if (parsedMsg?.message) {
                  setError(parsedMsg.message);
                } else {
                  setError('Session not found or access denied');
                }
              }
            }
          } catch (parseError) {
            setError('Session not found or access denied');
          }
        } else if ('message' in fetchError) {
          setError((fetchError as any).message);
        } else {
          setError('Failed to load session data');
        }
      } else {
        setError('Failed to load session data');
      }
    }
  }, [data, fetchError]);

  const refreshSession = async () => {
    try {
      await mutate();
      toast.success('Session data refreshed');
    } catch (error) {
      console.error('Error refreshing session:', error);
      toast.error('Failed to refresh session data');
    }
  };

  console.log('🔧 DEBUG useSessionData: Returning from hook:', {
    sessionData: !!sessionData,
    error: !!error,
    hasAccess,
    isAccessPending,
    isLoading,
    isAdmin
  });

  return {
    sessionData,
    error,
    hasAccess,
    isAccessPending,
    isLoading,
    refreshSession,
    isAdmin
  };
};