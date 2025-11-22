import React, { createContext, useState, useContext, useEffect, type ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { modelApiService } from '../services/modelApiService';

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
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const [hasApiKey, setHasApiKey] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkApiKey = useCallback(async (): Promise<void> => {
        if (isAuthLoading) return;

        if (!isAuthenticated) {
            setHasApiKey(false);
            setIsLoading(false);
            return;
        }

        // Only set loading to true if it isn't already (prevents flickering)
        setIsLoading(prev => prev ? prev : true);

        try {
            const apiInfo = await modelApiService.getModelApi();
            setHasApiKey(apiInfo.has_api_key);
        } catch (error) {
            console.error('Error checking API key status:', error);
            setHasApiKey(false);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, isAuthLoading]);

    const refreshApiKeyStatus = useCallback(async (): Promise<void> => {
        await checkApiKey();
    }, [checkApiKey]);

    useEffect(() => {
        let isMounted = true;

        if (isAuthLoading) return;

        if (isAuthenticated) {
            checkApiKey();
        } else {
            if (isMounted) {
                setHasApiKey(false);
                setIsLoading(false);
            }
        }

        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, isAuthLoading, checkApiKey]);

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