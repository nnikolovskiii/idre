import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useModals } from "../../hooks/useModals";
import ChatSidebar from "../chat/ChatSidebar";
import ModelSettingsModal from "../modals/ModelSettingsModal";
import LoginModal from "../modals/LoginModal";
import RegisterModal from "../modals/RegisterModal";
import type { ChatSession } from "../../types/chat";
import ChatHeader from "../chat/ChatHeader";

interface LayoutProps {
    children: React.ReactNode;
    inputArea?: React.ReactNode;
    notebookId?: string;
    title: string;
    chatSessions: ChatSession[];
    currentChatId: string | null;
    loadingChats: boolean;
    creatingChat: boolean;
    isTyping: boolean;
    isAuthenticated?: boolean;
    user?: { name?: string; surname?: string; email?: string; username?: string } | null;
    createNewChat: (notebookId?: string) => void;
    switchToChat: (chatId: string) => void;
    handleDeleteChat: (chatId: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
                                           children,
                                           inputArea,
                                           notebookId,
                                           title,
                                           chatSessions,
                                           currentChatId,
                                           loadingChats,
                                           creatingChat,
                                           isAuthenticated,
                                           user,
                                           createNewChat,
                                           switchToChat,
                                           handleDeleteChat,
                                       }) => {
    const { logout } = useAuth();

    const {
        modals,
        actions: {
            handleOpenAIModelsSettings,
            handleCloseAIModelsSettings,
            handleCloseDefaultModelsModal,
            handleOpenLoginModal,
            handleCloseLoginModal,
            handleOpenRegisterModal,
            handleCloseRegisterModal,
            switchToRegister,
            switchToLogin,
        },
    } = useModals();

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    return (
        <div className="h-dvh w-screen flex bg-[#f8f7f6] text-foreground overflow-hidden">
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-[999] transition-opacity md:hidden ${
                    isSidebarOpen
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar Container */}
            <div className="relative z-[1001] h-full flex-shrink-0 md:static">
                <ChatSidebar
                    chatSessions={chatSessions}
                    currentChatId={currentChatId}
                    collapsed={!isSidebarOpen}
                    onToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
                    onCreateNewChat={() => createNewChat(notebookId)}
                    onSwitchChat={switchToChat}
                    onDeleteChat={handleDeleteChat}
                    loading={loadingChats}
                    creatingChat={creatingChat}
                    onSettingsClick={handleOpenAIModelsSettings}
                    user={user || undefined}
                    onLogout={logout}
                    isAuthenticated={!!isAuthenticated}
                    onLoginClick={handleOpenLoginModal}
                    onRegisterClick={handleOpenRegisterModal}
                />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative">
                <div className="md:hidden">
                    <ChatHeader
                        title={title}
                        onMenuClick={() => setIsSidebarOpen(true)}
                        onSettingsClick={handleOpenAIModelsSettings}
                    />
                </div>
                {children}
                {inputArea}
            </main>

            {/* Modals */}
            <ModelSettingsModal
                chatId={currentChatId || undefined}
                notebookId={notebookId}
                isOpen={
                    modals.isAIModelsSettingsOpen || modals.isDefaultModelsModalOpen
                }
                onClose={() => {
                    handleCloseAIModelsSettings();
                    handleCloseDefaultModelsModal();
                }}
            />
            <LoginModal
                isOpen={modals.isLoginModalOpen}
                onClose={handleCloseLoginModal}
                onSwitchToRegister={switchToRegister}
            />
            <RegisterModal
                isOpen={modals.isRegisterModalOpen}
                onClose={handleCloseRegisterModal}
                onSwitchToLogin={switchToLogin}
            />
        </div>
    );
};

export default Layout;