import React from 'react';
import { useApiKey } from '../../contexts/ApiKeyContext';
import { Navigate } from 'react-router-dom';

interface ApiKeyGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ApiKeyGuard: React.FC<ApiKeyGuardProps> = ({
  children,
  redirectTo = '/setup'
}) => {
  const { hasApiKey, isLoading } = useApiKey();

  // Show loading spinner while checking API key
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"></div>
          <p className="text-muted-foreground">Checking API key...</p>
        </div>
      </div>
    );
  }

  // If user has API key, allow access
  if (hasApiKey) {
    return <>{children}</>;
  }

  // If no API key, redirect to setup page immediately
  return <Navigate to={redirectTo} replace />;
};

export default ApiKeyGuard;