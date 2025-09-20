import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useChats } from "../../hooks/useChats";
import { useModals } from "../../hooks/useModals";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessagesContainer from "./MessagesContainer";
import InputArea from "./InputArea";
import ModelSettingsModal from "../modals/ModelSettingsModal";
import ModelApiModal from "../modals/ModelApiModal";
import LoginModal from "../modals/LoginModal";
import RegisterModal from "../modals/RegisterModal";
import "./ChatView.css";

const ChatView: React.FC = () => {
  const { logout } = useAuth();
  const {
    chatSessions,
    currentChat,
    currentChatId,
    loadingChats,
    creatingChat,
    isTyping,
    hasApiKey,
    isAuthenticated,
    user,
    createNewChat,
    switchToChat,
    handleDeleteChat,
    handleSendMessage,
    handleDeleteMessage,
  } = useChats();

  const {
    modals,
    actions: {
      handleOpenAIModelsSettings,
      handleCloseAIModelsSettings,
      handleDefaultModelsClick,
      handleModelApiClick,
      handleCloseDefaultModelsModal,
      handleCloseModelApiModal,
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
  console.log("Mobile detection:", window.innerWidth, isMobile);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        // On desktop, always show sidebar
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return (
    <div className="chat-view-wrapper">
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
          onApiKeyRequired={handleModelApiClick}
        />
      </main>

      {/* AI Models Settings Modal */}
      {currentChatId && (
        <ModelSettingsModal
          chatId={currentChatId}
          isOpen={modals.isAIModelsSettingsOpen}
          onClose={handleCloseAIModelsSettings}
          isGlobal={false}
        />
      )}

      {/* Default Models Modal */}
      <ModelSettingsModal
        isOpen={modals.isDefaultModelsModalOpen}
        onClose={handleCloseDefaultModelsModal}
        isGlobal={true}
      />

      {/* Model API Modal */}
      <ModelApiModal
        isOpen={modals.isModelApiModalOpen}
        onClose={handleCloseModelApiModal}
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

export default ChatView;
