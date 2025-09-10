import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { modelApiService } from '../lib/modelApiService';

interface ApiKeyContextType {
  hasApiKey: boolean;
  isLoading: boolean;
  checkApiKey: () => Promise<void>;
  refreshApiKeyStatus: () => Promise<void>;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

interface ApiKeyProviderProps {
  children: ReactNode;
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const checkApiKey = async (): Promise<void> => {
    if (!isAuthenticated) {
      setHasApiKey(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiInfo = await modelApiService.getModelApi();
      setHasApiKey(apiInfo.has_api_key);
    } catch (error) {
      console.error('Error checking API key status:', error);
      setHasApiKey(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApiKeyStatus = async (): Promise<void> => {
    await checkApiKey();
  };

  // Check API key status when authentication state changes
  useEffect(() => {
    checkApiKey();
  }, [isAuthenticated]);

  return (
    <ApiKeyContext.Provider
      value={{
        hasApiKey,
        isLoading,
        checkApiKey,
        refreshApiKeyStatus,
      }}
    >
      {children}
    </ApiKeyContext.Provider>
  );
};

export const useApiKey = (): ApiKeyContextType => {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
};