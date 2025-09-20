import React, { useState, useEffect } from 'react';
import './ChatSidebar.css';
import type { ChatSession } from './ChatView';
import { BotMessageSquare, ChevronLeft, X } from 'lucide-react';
import SettingsDropdown from './SettingsDropdown';
import AuthDropdown from './AuthDropdown';
import ChatHistory from './ChatHistory';

interface ChatSidebarProps {
  chatSessions: ChatSession[];
  currentChatId: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCreateNewChat: () => void;
  onSwitchChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  loading?: boolean;
  creatingChat?: boolean;
  onSettingsClick: () => void;
  onDefaultModelsClick: () => void;
  onModelApiClick: () => void;
  user?: { name?: string; surname?: string; email?: string; username?: string };
  onLogout: () => void;
  isAuthenticated?: boolean;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chatSessions,
  currentChatId,
  collapsed,
  onToggleCollapse,
  onCreateNewChat,
  onSwitchChat,
  onDeleteChat,
  loading,
  creatingChat,
  onSettingsClick,
  onDefaultModelsClick,
  onModelApiClick,
  user,
  onLogout,
  isAuthenticated = false,
  onLoginClick,
  onRegisterClick,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <aside
        className={`chat-sidebar ${collapsed ? 'collapsed' : ''} ${!collapsed && isMobile ? 'mobile-visible' : ''}`}
        onClick={collapsed && isMobile ? onToggleCollapse : undefined}
    >
        <div className="sidebar-content">

            <header className="sidebar-header">
                <div className="sidebar-logo">
                    <BotMessageSquare size={24} />
                    <span>AI Assistant</span>
                </div>
                {isMobile ? (
                    <button className="mobile-close-btn" onClick={onToggleCollapse} title="Close sidebar">
                        <X size={20} />
                    </button>
                ) : (
                    <button className="collapse-btn" onClick={onToggleCollapse} title="Collapse sidebar">
                        <ChevronLeft size={18} />
                    </button>
                )}
            </header>

            <SettingsDropdown
              collapsed={collapsed}
              onToggleCollapse={onToggleCollapse}
              onDefaultModelsClick={onDefaultModelsClick}
              onModelApiClick={onModelApiClick}
              onSettingsClick={onSettingsClick}
            />

            <AuthDropdown
              collapsed={collapsed}
              user={user}
              onLogout={onLogout}
              onToggleCollapse={onToggleCollapse}
              isAuthenticated={isAuthenticated}
              onLoginClick={onLoginClick}
              onRegisterClick={onRegisterClick}
            />

            <ChatHistory
              chatSessions={chatSessions}
              currentChatId={currentChatId}
              onSwitchChat={onSwitchChat}
              onDeleteChat={onDeleteChat}
              loading={loading}
              creatingChat={creatingChat}
              onCreateNewChat={onCreateNewChat}
              onToggleCollapse={onToggleCollapse}
              isAuthenticated={isAuthenticated}
            />
        </div>
    </aside>
  );
};

export default ChatSidebar;
