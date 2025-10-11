import React, { useState, useEffect } from "react";
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

  const sidebarClasses = [
    "h-full flex flex-col flex-shrink-0 bg-white border-r border-neutral-200 transition-[width,transform] duration-300 ease-in-out",
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
            className={`flex flex-col h-full gap-6 ${
                collapsed && !isMobile ? "p-2 overflow-hidden" : "p-4"
            }`}
        >
          <header
              className={`flex items-center ${
                  collapsed && !isMobile
                      ? "justify-center py-2"
                      : "justify-between px-1"
              }`}
          >
            <div
                className={`flex items-center gap-2 font-semibold text-lg text-neutral-800 ${
                    collapsed && !isMobile ? "hidden" : ""
                }`}
            >
              <img src={idreLogo} alt="Blocks Logo" width={70} height={70} />
            </div>
            {isMobile ? (
                <button
                    className="flex items-center justify-center p-2 rounded-md bg-neutral-100 hover:bg-neutral-200 transition-all text-neutral-600"
                    onClick={onToggleCollapse}
                    title="Close sidebar"
                >
                  <X size={20} />
                </button>
            ) : (
                <button
                    className={`flex items-center justify-center p-1 rounded-md text-neutral-600 hover:bg-neutral-100 transition-transform ${
                        collapsed ? "rotate-180" : ""
                    }`}
                    onClick={onToggleCollapse}
                    title="Collapse sidebar"
                >
                  <ChevronLeft size={18} />
                </button>
            )}
          </header>

          {!collapsed && currentNotebook && (
              <div className="flex items-center gap-2 p-2 px-3 mb-4 rounded-md bg-neutral-100">
                <button
                    className="flex items-center justify-center p-1 rounded-md text-neutral-600 hover:bg-neutral-200"
                    onClick={() => navigate("/notebooks")}
                    title="Back to Notebooks"
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="flex-1 text-sm font-medium text-neutral-700 whitespace-nowrap overflow-hidden text-ellipsis">
              {currentNotebook.title}
            </span>
              </div>
          )}

          {!collapsed && (
              <section className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                  <MessageCircle size={16} />
                  <span>Navigation</span>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left transition-all ${
                          activeTab === "chat"
                              ? "bg-neutral-100/80 text-indigo-600 font-semibold border border-neutral-200"
                              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
                      }`}
                      onClick={() => handleTabChange("chat")}
                      title="Chat History"
                  >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                  </button>
                  <button
                      className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left transition-all ${
                          activeTab === "files"
                              ? "bg-neutral-100/80 text-indigo-600 font-semibold border border-neutral-200"
                              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
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

          {/* This container ensures dropdowns and history are only shown when not collapsed */}
          <div className={collapsed && !isMobile ? "hidden" : "contents"}>
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
        </div>
      </aside>
  );
};

export default ChatSidebar;