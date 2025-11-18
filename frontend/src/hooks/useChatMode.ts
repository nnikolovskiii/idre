import { useState, useEffect } from 'react';

const chatModes = ["brainstorm", "consult", "analyser"] as const;
type ChatMode = typeof chatModes[number];

const STORAGE_KEY = 'chatMode';
const DEFAULT_MODE: ChatMode = "brainstorm";

/**
 * Custom hook to manage chat mode with localStorage persistence
 * Defaults to "brainstorm" mode
 */
export const useChatMode = (): [ChatMode, (mode: ChatMode) => void] => {
  // Get stored mode from localStorage or use default
  const getStoredMode = (): ChatMode => {
    if (typeof window === 'undefined') {
      return DEFAULT_MODE;
    }
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && chatModes.includes(stored as ChatMode)) {
        return stored as ChatMode;
      }
    } catch (error) {
      console.warn('Failed to read chat mode from localStorage:', error);
    }
    
    return DEFAULT_MODE;
  };

  const [currentMode, setCurrentModeState] = useState<ChatMode>(getStoredMode);

  // Update localStorage when mode changes
  const setCurrentMode = (mode: ChatMode) => {
    setCurrentModeState(mode);
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, mode);
      } catch (error) {
        console.warn('Failed to save chat mode to localStorage:', error);
      }
    }
  };

  // Sync with localStorage on mount (handles SSR and tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newMode = e.newValue as ChatMode;
        if (chatModes.includes(newMode)) {
          setCurrentModeState(newMode);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      
      // Also check for direct localStorage changes (for same-tab updates)
      const storedMode = getStoredMode();
      if (storedMode !== currentMode) {
        setCurrentModeState(storedMode);
      }
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [currentMode]);

  return [currentMode, setCurrentMode];
};
