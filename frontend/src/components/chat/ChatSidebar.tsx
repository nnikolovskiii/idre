// 1. Import useTheme and ThemeToggle
import { ThemeToggle } from "../ThemeToggle"; // Make sure this path is correct

import React, { useState, useEffect } from "react";
import type { ChatSession } from "../../types/chat";
import { ChevronLeft, X, MessageCircle, FolderOpen, ArrowLeft } from "lucide-react";
import SettingsDropdown from "./SettingsDropdown";
import AuthDropdown from "./AuthDropdown";
import ChatHistory from "./ChatHistory";
import idreLogo from "../../assets/idre_logo_v2_white.png";
import idreWhiteLogo from "../../assets/idre_logo_v2_black.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useNotebooks } from "../../hooks/useNotebooks";
import { useTheme } from "../../context/ThemeContext";

// ... (Interface ChatSidebarProps remains the same)
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
  // ... (all your existing hooks and state remain the same)
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "files">("chat");
  const navigate = useNavigate();
  const location = useLocation();
  const { currentNotebook, getNotebookById } = useNotebooks();
  const { theme } = useTheme();

  // ... (all your useEffect hooks remain the same)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith("/files/")) {
      setActiveTab("files");
    } else if (location.pathname.startsWith("/chat/")) {
      setActiveTab("chat");
    }
  }, [location.pathname]);

  const getNotebookIdFromPath = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[0] === 'chat' || parts[0] === 'files')) {
      return parts[1];
    }
    return null;
  };

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
      navigate(notebookId ? `/files/${notebookId}` : '/notebooks');
    } else {
      navigate(notebookId ? `/chat/${notebookId}` : "/notebooks");
    }
  };


  // 2. Refactored sidebar classes to use semantic color variables
  // - `bg-white dark:bg-gray-800` is now `bg-sidebar-background`
  // - `border-neutral-200 dark:border-neutral-700` is now `border-sidebar-border`
  const sidebarClasses = [
    "h-full flex flex-col flex-shrink-0 bg-sidebar-background border-r border-sidebar-border transition-[width,transform] duration-300 ease-in-out",
    "md:relative fixed top-0 left-0 z-50",
    isMobile ? "w-[280px]" : (collapsed ? "w-[60px]" : "w-[260px]"),
    isMobile && !collapsed ? "translate-x-0 shadow-2xl" : "",
    isMobile && collapsed ? "-translate-x-full" : "",
    !isMobile ? "translate-x-0" : ""
  ].join(" ");


  return (
      <aside
          className={sidebarClasses}
          onClick={collapsed && isMobile ? onToggleCollapse : undefined}
      >
        <div
            className={`flex flex-col h-full ${
                collapsed && !isMobile ? "p-2 overflow-hidden" : "p-4"
            }`}
        >
          <header
              className={`flex items-center ${
                  collapsed && !isMobile
                      ? "justify-center py-2 pb-3"
                      : "justify-between px-1 pb-3"
              }`}
          >
            {/* - Refactored text color to use `text-sidebar-foreground` */}
            <div
                className={`flex items-center gap-2 font-semibold text-lg text-sidebar-foreground ${
                    collapsed && !isMobile ? "hidden" : ""
                }`}
            >
              <img src={theme === 'dark' ? idreWhiteLogo : idreLogo} alt="IDRE Logo" width={70} height={70} />
            </div>
            {isMobile ? (
                <button
                    // - Refactored button colors to use accent and foreground variables
                    className="flex items-center justify-center p-2 rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 transition-all text-sidebar-foreground"
                    onClick={onToggleCollapse}
                    title="Close sidebar"
                >
                  <X size={20} />
                </button>
            ) : (
                <button
                    // - Refactored icon colors to use muted-foreground and accent for hover
                    className={`flex items-center justify-center p-1 rounded-md text-muted-foreground hover:bg-sidebar-accent transition-transform ${
                        collapsed ? "rotate-180" : ""
                    }`}
                    onClick={onToggleCollapse}
                    title="Collapse sidebar"
                >
                  <ChevronLeft size={18} />
                </button>
            )}
          </header>

          <div className="flex-grow flex flex-col gap-6 bg-background min-h-0">

            {!collapsed && currentNotebook && (
                // - Refactored notebook display colors
                <div className="flex items-center gap-2 p-2 px-3 rounded-md bg-sidebar-accent flex-shrink-0">
                  <button
                      className="flex items-center justify-center p-1 rounded-md text-sidebar-foreground hover:bg-sidebar-background"
                      onClick={() => navigate("/notebooks")}
                      title="Back to Notebooks"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="flex-1 text-sm font-medium text-sidebar-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {currentNotebook.title}
              </span>
                </div>
            )}

            {!collapsed && (
                <section className="flex flex-col gap-2 flex-shrink-0">
                  <div className="flex flex-col gap-1">
                    <button
                        // - Refactored active/inactive tab colors to use semantic variables
                        // - Active: `bg-sidebar-accent`, `text-sidebar-primary`, `border-sidebar-border`
                        // - Inactive: `text-sidebar-foreground`, `hover:bg-sidebar-accent`
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left transition-all ${
                            activeTab === "chat"
                                ? "bg-sidebar-accent text-sidebar-primary font-semibold border border-sidebar-border"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                        onClick={() => handleTabChange("chat")}
                        title="Chat History"
                    >
                      <MessageCircle size={16} />
                      <span>Chat</span>
                    </button>
                    <button
                        className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left hover:text-sidebar-primary transition-all ${
                            activeTab === "files"
                                ? "bg-sidebar-accent text-sidebar-primary font-semibold border border-sidebar-border"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
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

            <div className={collapsed && !isMobile ? "hidden" : "flex flex-col flex-1 min-h-0"}>
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
          </div>

          {/* 3. Refactored footer border color */}
          <footer className="mt-auto pt-4 border-t border-sidebar-border">
            <div className={collapsed && !isMobile ? "hidden" : "contents"}>
              <SettingsDropdown
                  collapsed={collapsed}
                  onToggleCollapse={onToggleCollapse}
                  onSettingsClick={onSettingsClick}
              />
              <div className="flex items-center justify-between p-2">
                <AuthDropdown
                    collapsed={collapsed}
                    user={user}
                    onLogout={onLogout}
                    onToggleCollapse={onToggleCollapse}
                    isAuthenticated={isAuthenticated}
                    onLoginClick={onLoginClick}
                    onRegisterClick={onRegisterClick}
                />
                <ThemeToggle />
              </div>
            </div>
          </footer>

        </div>
      </aside>
  );
};

export default ChatSidebar;
