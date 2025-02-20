import { Redirect } from 'expo-router';
import React from 'react';

import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from './LoadingScreen';

type Props = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <>{children}</>;
} 