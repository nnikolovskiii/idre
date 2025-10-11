import React, { useState, useEffect } from "react";
import "./ChatSidebar.css";
import type { ChatSession } from "../../types/chat";
import { ChevronLeft, X, MessageCircle, FolderOpen, ArrowLeft } from "lucide-react";
import SettingsDropdown from "./SettingsDropdown";
import AuthDropdown from "./AuthDropdown";
import ChatHistory from "./ChatHistory";
import idreLogo from "../../assets/idre_logo_v1.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotebooks } from "../../hooks/useNotebooks"; // Adjust path as needed

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
                                                   loading = false,
                                                   creatingChat = false,
                                                   onSettingsClick,
                                                   user,
                                                   onLogout,
                                                   isAuthenticated = false,
                                                   onLoginClick,
                                                   onRegisterClick,
                                                 }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const navigate = useNavigate();
  const location = useLocation();
  const { currentNotebook, getNotebookById } = useNotebooks();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Update active tab based on current route
  useEffect(() => {
    if (location.pathname.startsWith("/files/")) {
      setActiveTab("files");
    } else if (location.pathname.startsWith("/chat/")) {
      setActiveTab("chat");
    }
  }, [location.pathname]);

  const getNotebookIdFromPath = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    // Expected: ["chat", ":notebookId", ...] or ["files", ":notebookId", ...]
    if (parts.length >= 2 && (parts[0] === 'chat' || parts[0] === 'files')) {
      return parts[1];
    }
    return null;
  };

  // Fetch notebook when path changes
  useEffect(() => {
    const notebookId = getNotebookIdFromPath();
    if (notebookId && !currentNotebook?.id) {
      getNotebookById(notebookId);
    }
  }, [location.pathname, getNotebookById, currentNotebook?.id]);

  const handleTabChange = (tab: "chat" | "files") => {
    setActiveTab(tab);
    const notebookId = getNotebookIdFromPath();
    if (tab === "files") {
      if (notebookId) {
        navigate(`/files/${notebookId}`);
      } else {
        navigate('/notebooks');
      }
    } else {
      // Chat requires a notebook context; send user to notebooks dashboard to pick one
      if (notebookId) {
        navigate(`/chat/${notebookId}`);
      } else {
        navigate("/notebooks");
      }
    }
  };

  return (
      <aside
          className={`chat-sidebar ${collapsed ? "collapsed" : ""} ${
              !collapsed && isMobile ? "mobile-visible" : ""
          }`}
          onClick={collapsed && isMobile ? onToggleCollapse : undefined}
      >
        <div className="sidebar-content">
          <header className="sidebar-header">
            <div className="sidebar-logo">
              <img src={idreLogo} alt="Blocks Logo" width={70} height={70} />
            </div>
            {isMobile ? (
                <button
                    className="mobile-close-btn"
                    onClick={onToggleCollapse}
                    title="Close sidebar"
                >
                  <X size={20} />
                </button>
            ) : (
                <button
                    className="collapse-btn"
                    onClick={onToggleCollapse}
                    title="Collapse sidebar"
                >
                  <ChevronLeft size={18} />
                </button>
            )}
          </header>



          {/* Notebook Indicator */}
          {!collapsed && currentNotebook && (
              <div className="notebook-indicator">
                <button
                    className="navigation-item"
                    onClick={() => navigate('/notebooks')}
                    title="Back to Notebooks"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="notebook-name">{currentNotebook.title}</span>
              </div>
          )}

          {/* Navigation Section */}
          {!collapsed && (
              <section className="navigation-section">
                <div className="navigation-header">
                  <MessageCircle size={16} />
                  <span>Navigation</span>
                </div>
                <div className="navigation-items">
                  <button
                      className={`navigation-item ${
                          activeTab === "chat" ? "active" : ""
                      }`}
                      onClick={() => handleTabChange("chat")}
                      title="Chat History"
                  >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                  </button>
                  <button
                      className={`navigation-item ${
                          activeTab === "files" ? "active" : ""
                      }`}
                      onClick={() => handleTabChange("files")}
                      title="Files"
                  >
                    <FolderOpen size={16} />
                    <span>Files</span>
                  </button>
                </div>
              </section>
          )}

          <SettingsDropdown
              collapsed={collapsed}
              onToggleCollapse={onToggleCollapse}
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