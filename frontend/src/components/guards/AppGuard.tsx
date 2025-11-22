import React from 'react';
import ApiKeyGuard from './ApiKeyGuard';

interface AppGuardProps {
  children: React.ReactNode;
}

/**
 * AppGuard component that wraps the entire authenticated portion of the app
 * and ensures API key is present before allowing access to any component.
 */
const AppGuard: React.FC<AppGuardProps> = ({ children }) => {
  return (
    <ApiKeyGuard>
      {children}
    </ApiKeyGuard>
  );
};

export default AppGuard;