import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiKey } from '../contexts/ApiKeyContext';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessagesContainer from './MessagesContainer';
import InputArea from './InputArea';
import AIModelsSettings from './AIModelsSettings';
import DefaultModelsModal from './DefaultModelsModal';
import ModelApiModal from './ModelApiModal';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import './ChatView.css';
import { getChatsUrl } from '../lib/api';
import { chatsService } from '../lib/chatsService';
import type { BackendMessage } from '../lib/api';

// A cleaner, frontend-specific interface for a message object.
export interface Message {
  id: string;
  type: 'human' | 'ai';
  content: string;
  audioUrl?: string; // Holds the file_url for audio files
  additional_kwargs?: { [key: string]: any }; // Additional metadata from backend
  timestamp: Date;
}

export interface ChatSession {
  id: string; // This is the chat_id
  title: string;
  thread_id: string;
  messages: Message[];
  createdAt: Date;
}

// Type from the backend for the list of chats
export interface BackendChat {
  chat_id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
}

// Helper to convert backend messages to our frontend Message format
const convertBackendMessages = (messages: BackendMessage[]): Message[] => {
  return messages
      .filter(msg => msg.type === 'human' || msg.type === 'ai') // Ignore system messages for display
      .map((msg) => ({
        id: msg.id,
        type: msg.type as 'human' | 'ai',
        content: msg.content,
        audioUrl: msg.additional_kwargs?.file_url,
        additional_kwargs: msg.additional_kwargs, // Preserve additional_kwargs
        timestamp: new Date() // Ideally, the backend would provide a timestamp
      }));
};

const ChatView: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasApiKey, refreshApiKeyStatus } = useApiKey();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  console.log('Mobile detection:', window.innerWidth, isMobile);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);
  const [isAIModelsSettingsOpen, setIsAIModelsSettingsOpen] = useState(false);
  const [isDefaultModelsModalOpen, setIsDefaultModelsModalOpen] = useState(false);
  const [isModelApiModalOpen, setIsModelApiModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        if (!mobile) { // On desktop, always show sidebar
            setIsSidebarOpen(true);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-show login modal when user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !isLoginModalOpen && !isRegisterModalOpen) {
      setIsLoginModalOpen(true);
    }
  }, [authLoading, isAuthenticated, isLoginModalOpen, isRegisterModalOpen]);

  // Memoized fetch function for messages to avoid re-renders
  const fetchMessagesForCurrentChat = useCallback(async () => {
    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat || !currentChat.thread_id) return;

    // Prevents showing stale messages from another chat
    setChatSessions(prev => prev.map(chat =>
        chat.id === currentChatId ? { ...chat, messages: [] } : chat
    ));

    try {
      const backendMessages = await chatsService.getThreadMessages(currentChat.thread_id);
      const convertedMessages = convertBackendMessages(backendMessages);

      setChatSessions(prev => prev.map(chat =>
          chat.id === currentChatId
              ? { ...chat, messages: convertedMessages }
              : chat
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not fetch messages.';
      console.error('Error fetching messages for thread:', errorMessage);
    }
  }, [currentChatId, chatSessions]);


  // Effect to fetch chats on initial component mount
  useEffect(() => {
    const fetchInitialChats = async () => {
      setLoadingChats(true);
      try {
        const response = await fetch(getChatsUrl('/get-all'), {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to fetch chat history.');

        const backendChats: BackendChat[] = await response.json();

        if (backendChats.length > 0) {
          const convertedChats: ChatSession[] = backendChats.map(chat => ({
            id: chat.chat_id,
            thread_id: chat.thread_id,
            title: `Chat ${chat.chat_id.substring(0, 8)}`,
            messages: [],
            createdAt: new Date(chat.created_at)
          })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort newest first

          setChatSessions(convertedChats);
          setCurrentChatId(convertedChats[0].id);
        } else {
          // If the user has no chats, create a new one automatically.
          await createNewChat();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error('Error fetching chats:', errorMessage);
        // As a fallback, create a local-only chat session.
        await createNewChat();
      } finally {
        setLoadingChats(false);
      }
    };

    fetchInitialChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to fetch messages when the current chat changes
  useEffect(() => {
    if (currentChatId) {
      fetchMessagesForCurrentChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChatId]);


  const createNewChat = async () => {
    setCreatingChat(true);
    try {
      const newThreadData = await chatsService.createThread({ title: `New Chat` });
      const newChat: ChatSession = {
        id: newThreadData.chat_id,
        thread_id: newThreadData.thread_id,
        title: newThreadData.title,
        messages: [{
          id: 'msg_welcome_' + Date.now(),
          type: 'ai',
          content: "Hello! How can I assist you today?",
          timestamp: new Date()
        }],
        createdAt: new Date(newThreadData.created_at)
      };

      setChatSessions(prev => [newChat, ...prev]); // Add to the top of the list
      setCurrentChatId(newChat.id);
      if (isMobile) {
        setIsSidebarOpen(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create new chat.';
      console.error('Error creating new chat:', errorMessage);
    } finally {
      setCreatingChat(false);
    }
  };

  const switchToChat = (chatId: string) => {
    setCurrentChatId(chatId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = (chatId: string) => {
    // Remove the chat from the sessions list
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));

    // If the deleted chat was the current one, switch to another chat or create a new one
    if (currentChatId === chatId) {
      const remainingChats = chatSessions.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        // Switch to the first remaining chat
        setCurrentChatId(remainingChats[0].id);
      } else {
        // No chats left, create a new one
        createNewChat();
      }
    }
  };

  // Optimistically adds a message to the UI while the backend processes it.
  const addOptimisticMessage = (content: string, audioUrl?: string) => {
    if (!currentChatId) return;

    const optimisticMessage: Message = {
      id: 'msg_optimistic_' + Date.now(),
      type: 'human',
      content,
      audioUrl,
      timestamp: new Date()
    };

    setChatSessions(prev => prev.map(chat =>
        chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, optimisticMessage] }
            : chat
    ));
  };

  const handleSendMessage = async (text?: string, audioPath?: string) => {
    // Check if user has API key before allowing message sending
    if (!hasApiKey) {
      setIsModelApiModalOpen(true);
      return;
    }

    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat || !currentChat.thread_id) {
      console.error("No active chat session selected.");
      return;
    }

    if (!text?.trim() && !audioPath) return;

    const optimisticText = text || "Audio message sent...";
    addOptimisticMessage(optimisticText, audioPath);

    try {
      const result = await chatsService.sendMessageToThread(
        currentChat.thread_id,
        text,
        audioPath,
        (isLoading: boolean) => {
          // This callback will be called by the API function to manage loading state
          setIsTyping(isLoading);
        }
      );

      // The backend returns either "success" or "interrupted" status
      if (result.status === 'success' || result.status === 'interrupted') {
        // Refresh messages to get the complete conversation including AI response
        await fetchMessagesForCurrentChat();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error('Error sending message:', errorMessage);

      // Remove optimistic message on error
      setChatSessions(prev => prev.map(chat =>
          chat.id === currentChatId
              ? { ...chat, messages: chat.messages.filter(msg => !msg.id.startsWith('msg_optimistic_')) }
              : chat
      ));
    }
  };

  const handleOpenAIModelsSettings = () => {
    setIsAIModelsSettingsOpen(true);
  };

  const handleCloseAIModelsSettings = () => {
    setIsAIModelsSettingsOpen(false);
  };

  const handleDefaultModelsClick = () => {
    setIsDefaultModelsModalOpen(true);
  };

  const handleModelApiClick = () => {
    setIsModelApiModalOpen(true);
  };

  const handleCloseDefaultModelsModal = () => {
    setIsDefaultModelsModalOpen(false);
  };

  const handleCloseModelApiModal = () => {
    setIsModelApiModalOpen(false);
    // Refresh API key status when modal closes to update UI immediately
    refreshApiKeyStatus();
  };

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleOpenRegisterModal = () => {
    setIsRegisterModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
  };

  const handleSwitchToRegister = () => {
    setIsLoginModalOpen(false);
    setIsRegisterModalOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterModalOpen(false);
    setIsLoginModalOpen(true);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const currentChat = chatSessions.find(chat => chat.id === currentChatId);
    if (!currentChat || !currentChat.thread_id) return;

    try {
      await chatsService.deleteMessage(currentChat.thread_id, messageId);
      // Refresh messages after deletion
      await fetchMessagesForCurrentChat();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete message.';
      console.error('Error deleting message:', errorMessage);
    }
  };

  const currentChat = chatSessions.find(chat => chat.id === currentChatId);

  return (
      <div className="chat-view-wrapper">
        {isMobile && (
            <div 
              className={`mobile-overlay ${isSidebarOpen ? 'visible' : ''}`}
              onClick={() => setIsSidebarOpen(false)}
            />
        )}
        <div className={`chat-sidebar-container ${isMobile ? 'mobile' : ''}`}>
            <ChatSidebar
                chatSessions={chatSessions}
                currentChatId={currentChatId}
                collapsed={!isSidebarOpen}
                onToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
                onCreateNewChat={createNewChat}
                onSwitchChat={switchToChat}
                onDeleteChat={handleDeleteChat}
                loading={loadingChats}
                creatingChat={creatingChat}
                onSettingsClick={handleOpenAIModelsSettings}
                onDefaultModelsClick={handleDefaultModelsClick}
                onModelApiClick={handleModelApiClick}
                user={user || undefined}
                onLogout={logout}
                isAuthenticated={isAuthenticated}
                onLoginClick={handleOpenLoginModal}
                onRegisterClick={handleOpenRegisterModal}
            />
        </div>

        <main className="main-chat-area">
            {isMobile && (
                <ChatHeader
                    title={currentChat?.title || "AI Assistant"}
                    isMobile={isMobile}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    onSettingsClick={handleOpenAIModelsSettings}
                    onDefaultModelsClick={handleDefaultModelsClick}
                    onModelApiClick={handleModelApiClick}
                />
            )}
            <MessagesContainer
              messages={currentChat?.messages || []}
              isTyping={isTyping}
              onDeleteMessage={handleDeleteMessage}
            />
            <InputArea
              onSendMessage={handleSendMessage}
              disabled={creatingChat || isTyping}
              hasApiKey={hasApiKey}
              onApiKeyRequired={() => setIsModelApiModalOpen(true)}
            />
        </main>

        {/* AI Models Settings Modal */}
        {currentChatId && (
          <AIModelsSettings
            chatId={currentChatId}
            isOpen={isAIModelsSettingsOpen}
            onClose={handleCloseAIModelsSettings}
          />
        )}

        {/* Default Models Modal */}
        <DefaultModelsModal
          isOpen={isDefaultModelsModalOpen}
          onClose={handleCloseDefaultModelsModal}
        />

        {/* Model API Modal */}
        <ModelApiModal
          isOpen={isModelApiModalOpen}
          onClose={handleCloseModelApiModal}
        />

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={handleCloseLoginModal}
          onSwitchToRegister={handleSwitchToRegister}
        />

        {/* Register Modal */}
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={handleCloseRegisterModal}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </div>
  );
};

export default ChatView;
