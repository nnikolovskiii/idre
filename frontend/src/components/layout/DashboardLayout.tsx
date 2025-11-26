import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useModals } from "../../hooks/useModals";
import GlobalSidebar from "./GlobalSidebar";
import ModelSettingsModal from "../modals/ModelSettingsModal";
import LoginModal from "../modals/LoginModal";
import RegisterModal from "../modals/RegisterModal";
import CreateNotebookModal from "../CreateNotebookModal";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
    const { user, logout, isAuthenticated } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [isCreateNotebookOpen, setIsCreateNotebookOpen] = useState(false);

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

    return (
        <div className="h-dvh w-screen flex bg-background text-foreground overflow-hidden">
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-[999] transition-opacity md:hidden ${
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div className="relative z-[1001] h-full flex-shrink-0 md:static">
                <GlobalSidebar
                    collapsed={!isSidebarOpen}
                    onToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
                    onSettingsClick={handleOpenAIModelsSettings}
                    user={user || undefined}
                    onLogout={logout}
                    isAuthenticated={isAuthenticated}
                    onLoginClick={handleOpenLoginModal}
                    onRegisterClick={handleOpenRegisterModal}
                    onCreateNotebook={() => setIsCreateNotebookOpen(true)}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 border-b border-border bg-background">
                    <button onClick={() => setIsSidebarOpen(true)} className="mr-4">
                        <Menu size={24} />
                    </button>
                    <h1 className="font-semibold text-lg">{title || "IDRE"}</h1>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>

            {/* Modals */}
            <ModelSettingsModal
                isOpen={modals.isAIModelsSettingsOpen || modals.isDefaultModelsModalOpen}
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
            <CreateNotebookModal
                isOpen={isCreateNotebookOpen}
                onClose={() => setIsCreateNotebookOpen(false)}
                onSuccess={() => {
                    // Trigger refresh in useNotebooks via event or context if needed,
                    // but direct navigation in modal usually handles flow.
                    // For the sidebar list to update, GlobalSidebar calls getAllNotebooks on mount/update.
                    window.dispatchEvent(new Event("notebook-created"));
                }}
            />
        </div>
    );
};

export default DashboardLayout;