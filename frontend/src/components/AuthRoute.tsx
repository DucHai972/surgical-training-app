import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';

interface AuthRouteProps {
  children: ReactNode;
}

const AuthRoute = ({ children }: AuthRouteProps) => {
  const { currentUser, isValidating } = useFrappeAuth();

  if (isValidating) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthRoute; 