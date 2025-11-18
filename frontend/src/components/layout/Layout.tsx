// File: frontend/src/components/layout/Layout.tsx

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useModals } from "../../hooks/useModals";
import ChatSidebar from "../chat/ChatSidebar";
import ModelSettingsModal from "../modals/ModelSettingsModal";
import LoginModal from "../modals/LoginModal";
import RegisterModal from "../modals/RegisterModal";
import type { ChatSession } from "../../types/chat";
import ChatHeader from "../chat/ChatHeader";
import idreLogo from "../../assets/idre_logo_v2_white.png";
import idreWhiteLogo from "../../assets/idre_logo_v2_black.png";

interface LayoutProps {
    children: React.ReactNode;
    inputArea?: React.ReactNode;
    modelInfo?: React.ReactNode;
    notebookId?: string;
    title: string;
    chatSessions: ChatSession[];
    currentChatId: string | null;
    loadingChats: boolean;
    creatingChat: boolean;
    isTyping: boolean;
    isAuthenticated?: boolean;
    user?: { name?: string; surname?: string; email?: string; username?: string } | null;
    isTemporaryChat?: boolean;
    createNewChat: (notebookId?: string) => void;
    createTemporaryChat?: () => string;
    switchToChat: (chatId: string) => void;
    handleDeleteChat: (chatId: string) => void;
    isThreadTyping?: (threadId: string) => boolean;
    forceRegularLayout?: boolean; // <-- ADDED PROP
}

const Layout: React.FC<LayoutProps> = ({
                                           children,
                                           inputArea,
                                           modelInfo,
                                           notebookId,
                                           title,
                                           chatSessions,
                                           currentChatId,
                                           loadingChats,
                                           creatingChat,
                                           isAuthenticated,
                                           user,
                                           isTemporaryChat = false,
                                           createNewChat,
                                           createTemporaryChat,
                                           switchToChat,
                                           handleDeleteChat,
                                           isThreadTyping,
                                           forceRegularLayout = false, // <-- ADDED PROP WITH DEFAULT
                                       }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

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

    // Function to switch chat and navigate to chat route
    const handleSwitchChatWithNavigation = useCallback((chatId: string) => {
        switchToChat(chatId);
        if (notebookId) {
            navigate(`/chat/${notebookId}`);
        }
    }, [switchToChat, notebookId, navigate]);

    return (
        <div className="h-dvh w-screen flex bg-background text-foreground overflow-hidden">
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
                    onCreateNewChat={() => createTemporaryChat ? createTemporaryChat() : createNewChat(notebookId)}
                    onSwitchChat={switchToChat}
                    onDeleteChat={handleDeleteChat}
                    onSwitchChatWithNavigation={handleSwitchChatWithNavigation}
                    loading={loadingChats}
                    creatingChat={creatingChat}
                    onSettingsClick={handleOpenAIModelsSettings}
                    user={user || undefined}
                    onLogout={logout}
                    isAuthenticated={!!isAuthenticated}
                    onLoginClick={handleOpenLoginModal}
                    onRegisterClick={handleOpenRegisterModal}
                    isThreadTyping={isThreadTyping}
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

                {/* 
                  CHANGE: Updated condition to respect the new prop
                */}
                {isTemporaryChat && !forceRegularLayout ? (
                    // LAYOUT 1: Temporary Chat (Logo + Input are centered together)
                    // This container will grow to fill space and center its content.
                    <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto p-4">
                        <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
                            <img
                                src={idreLogo}
                                alt="Logo"
                                className="w-60 h-auto dark:hidden"
                            />
                            <img
                                src={idreWhiteLogo}
                                alt="Logo"
                                className="w-60 h-auto hidden dark:block"
                            />
                            {/* The input area is now INSIDE the centered block */}
                            {inputArea}
                        </div>
                    </div>
                ) : (
                    // LAYOUT 2: Regular Chat (Messages scroll, Input is fixed at the bottom)
                    <>
                        {/* This container holds the scrollable chat messages */}
                        <div className="flex-1 w-full overflow-y-auto">
                            {children}
                        </div>
                        {/* The input area is a sibling, anchoring it to the bottom */}
                        {inputArea}
                        {modelInfo}
                    </>
                )}
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
                isTemporaryChat={isTemporaryChat}
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