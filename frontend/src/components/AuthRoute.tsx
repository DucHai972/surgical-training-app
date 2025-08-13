import type { ReactNode } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';
import { useState, useEffect } from 'react';

// Helper function to get the correct login URL based on environment
const getLoginUrl = () => {
  const isDev = import.meta.env.DEV;
  return isDev ? '/assets/surgical_training/frontend/login' : '/isim/login';
};

interface AuthRouteProps {
  children: ReactNode;
}

const AuthRoute = ({ children }: AuthRouteProps) => {
  const { currentUser, isValidating } = useFrappeAuth();
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);

  // Check if user just logged out
  const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';

  // If user just logged out, ignore any stale authentication state
  if (justLoggedOut) {
    // Use window.location to ensure we get to the correct absolute URL
    window.location.replace(getLoginUrl());
    return <div className="flex justify-center items-center h-screen">Redirecting to login...</div>;
  }

  // Retry mechanism for authentication state synchronization
  useEffect(() => {
    if (!currentUser && !isValidating && authRetryCount < 3) {
      setIsWaitingForAuth(true);
      
      const timeout = setTimeout(() => {
        setAuthRetryCount(prev => prev + 1);
        setIsWaitingForAuth(false);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [currentUser, isValidating, authRetryCount]);

  // Reset retry count when user is found
  useEffect(() => {
    if (currentUser) {
      setAuthRetryCount(0);
      setIsWaitingForAuth(false);
    }
  }, [currentUser]);

  if (isValidating || isWaitingForAuth) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser && authRetryCount >= 3) {
    // Use window.location to ensure we get to the correct absolute URL
    window.location.replace(getLoginUrl());
    return <div className="flex justify-center items-center h-screen">Redirecting to login...</div>;
  }

  if (!currentUser) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return <>{children}</>;
};

export default AuthRoute; 