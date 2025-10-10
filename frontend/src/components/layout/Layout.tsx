// src/components/layout/Layout.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useModals } from "../../hooks/useModals";
import ChatSidebar from "../chat/ChatSidebar";
import ModelSettingsModal from "../modals/ModelSettingsModal";
import LoginModal from "../modals/LoginModal";
import RegisterModal from "../modals/RegisterModal";
import type { ChatSession } from "../../types/chat";

interface LayoutProps {
    children: React.ReactNode;
    inputArea?: React.ReactNode;
    wrapperClassName?: string;
    mainClassName?: string;
    notebookId?: string;
    // Injected chat state/actions from parent (useChats)
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
    wrapperClassName = "chat-view-wrapper",
    mainClassName = "main-chat-area",
    notebookId,
    chatSessions,
    currentChatId,
    loadingChats,
    creatingChat,
    isTyping,
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
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className={wrapperClassName}>
            {isMobile && (
                <div
                    className={`mobile-overlay ${isSidebarOpen ? "visible" : ""}`}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <div className={`chat-sidebar-container ${isMobile ? "mobile" : ""}`}>
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

            <main className={mainClassName}>
                {children}
                {inputArea}
            </main>

            {/* AI Models Settings Modal */}
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

            {/* Login Modal */}
            <LoginModal
                isOpen={modals.isLoginModalOpen}
                onClose={handleCloseLoginModal}
                onSwitchToRegister={switchToRegister}
            />

            {/* Register Modal */}
            <RegisterModal
                isOpen={modals.isRegisterModalOpen}
                onClose={handleCloseRegisterModal}
                onSwitchToLogin={switchToLogin}
            />
        </div>
    );
};

export default Layout;