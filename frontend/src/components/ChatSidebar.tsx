import React, { useState, useEffect } from 'react';
import './ChatSidebar.css';
import type { ChatSession } from './ChatView';
import { BotMessageSquare, ChevronLeft, ChevronDown, History, Plus, X, Settings, Bot, Key, User, LogOut, Trash2 } from 'lucide-react';
import { deleteChatUrl } from '../lib/api';

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the chat switch

    if (!confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(deleteChatUrl(chatId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Call the parent handler to update the chat list
      onDeleteChat(chatId);
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

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

            <section className="settings-section">
                <button className="settings-header" onClick={() => setSettingsOpen(!settingsOpen)}>
                    <Settings size={16} />
                    {!collapsed && <span>Settings</span>}
                    {!collapsed && <ChevronDown size={16} className={settingsOpen ? '' : 'rotated'} />}
                </button>
                {!collapsed && settingsOpen && (
                    <div className="settings-items">
                        <button className="settings-item" onClick={() => { onDefaultModelsClick(); onToggleCollapse(); }} title="Default Models">
                            <Bot size={16} />
                            <span>AI Models</span>
                        </button>
                        <button className="settings-item" onClick={() => { onModelApiClick(); onToggleCollapse(); }} title="Model API Settings">
                            <Key size={16} />
                            <span>API Key</span>
                        </button>
                        <button className="settings-item" onClick={() => { onSettingsClick(); onToggleCollapse(); }} title="AI Models Settings">
                            <Settings size={16} />
                            <span>Chat Settings</span>
                        </button>
                    </div>
                )}
            </section>

            <section className="auth-section">
                <button className="auth-header" onClick={() => setAuthOpen(!authOpen)}>
                    <User size={16} />
                    {!collapsed && <span>Authentication</span>}
                    {!collapsed && <ChevronDown size={16} className={authOpen ? '' : 'rotated'} />}
                </button>
                {!collapsed && authOpen && (
                    <div className="auth-items">
                        {isAuthenticated ? (
                            <>
                                {user && (
                                    <div className="profile-info">
                                        <User size={16} />
                                        <div>
                                            <div className="profile-name">{user.name && user.surname ? `${user.name} ${user.surname}` : user.username}</div>
                                            <div className="profile-email">{user.email}</div>
                                        </div>
                                    </div>
                                )}
                                <button className="settings-item logout-btn" onClick={() => { onLogout(); onToggleCollapse(); }} title="Logout">
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="settings-item" onClick={() => { onLoginClick(); onToggleCollapse(); }} title="Login">
                                    <LogOut size={16} />
                                    <span>Login</span>
                                </button>
                                <button className="settings-item" onClick={() => { onRegisterClick(); onToggleCollapse(); }} title="Register">
                                    <User size={16} />
                                    <span>Register</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </section>

            {isAuthenticated && (
                <section className="history-section">
                    <div className="history-header">
                        <button className="history-title-btn" onClick={() => setHistoryOpen(!historyOpen)}>
                            <History size={16} />
                            <span>History</span>
                            <ChevronDown size={16} className={historyOpen ? '' : 'rotated'} />
                        </button>
                        <button className="new-chat-btn" onClick={onCreateNewChat} disabled={creatingChat} title="New Chat">
                            {creatingChat ? <div className="loading-spinner" style={{width: 16, height: 16}}></div> : <Plus size={16} />}
                        </button>
                    </div>
                    {historyOpen && (
                        <div className="chat-sessions">
                            {loading ? (
                                <div className="loading-state">
                                    <div className="loading-spinner"></div>
                                    <span>Loading chats...</span>
                                </div>
                            ) : chatSessions.length === 0 ? (
                                <div className="empty-state">
                                    No chat sessions yet.
                                </div>
                            ) : (
                                chatSessions.map(chat => (
                                     <div
                                         key={chat.id}
                                         className={`chat-session ${chat.id === currentChatId ? 'active' : ''}`}
                                         onClick={() => { onSwitchChat(chat.id); onToggleCollapse(); }}
                                     >
                                         <div className="chat-title">{chat.title || `Chat ${chat.id.slice(0, 8)}`}</div>
                                         <button
                                             className="chat-delete-btn"
                                             onClick={(e) => handleDeleteChat(chat.id, e)}
                                             title="Delete chat"
                                             aria-label="Delete chat"
                                         >
                                             <Trash2 size={14} />
                                         </button>
                                     </div>
                                 ))
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    </aside>
  );
};

export default ChatSidebar;
