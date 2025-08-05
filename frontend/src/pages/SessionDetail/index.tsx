import React from 'react';
import { useParams } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';
import { SessionDetailMain } from './SessionDetailMain';

export const SessionDetail: React.FC = () => {
  const { sessionName } = useParams<{ sessionName: string }>();
  const { currentUser } = useFrappeAuth();

  console.log('🔧 DEBUG SessionDetail: Wrapper component rendered with:', {
    sessionName,
    currentUser,
    urlSessionName: sessionName ?? null,
    authUser: currentUser ?? null
  });

  return (
    <SessionDetailMain 
      sessionName={sessionName ?? null} 
      authUser={currentUser ?? null} 
    />
  );
};

export default SessionDetail;