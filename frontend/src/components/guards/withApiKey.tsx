import React from 'react';
import { useApiKey } from '../../contexts/ApiKeyContext';
import ApiKeyGuard from './ApiKeyGuard';

interface WithApiKeyProps {
  children?: React.ReactNode;
}

/**
 * Higher-order component that wraps a component to require API key
 * Usage: export default withApiKey(MyComponent);
 */
export const withApiKey = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithApiKeyComponent = (props: P & WithApiKeyProps) => {
    return (
      <ApiKeyGuard>
        <WrappedComponent {...props} />
      </ApiKeyGuard>
    );
  };

  WithApiKeyComponent.displayName = `withApiKey(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithApiKeyComponent;
};

/**
 * Hook that can be used inside components to check API key and show setup if needed
 */
export const useApiKeyGuard = () => {
  const { hasApiKey, isLoading } = useApiKey();

  const requireApiKey = (callback?: () => void) => {
    if (!isLoading && !hasApiKey) {
      // Return false to indicate API key is missing
      return false;
    }

    if (callback) {
      callback();
    }

    return true;
  };

  return {
    hasApiKey,
    isLoading,
    requireApiKey,
    canProceed: hasApiKey && !isLoading
  };
};