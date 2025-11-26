import React, { useState, useEffect, memo } from "react";
import {
    ChevronLeft, X,
    LayoutGrid, CheckSquare, Plus
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useNotebooks } from "../../hooks/useNotebooks";
import { Icon, type IconName } from "../Icon";
import idreLogo from "../../assets/idre_logo_v2_white.png";
import idreWhiteLogo from "../../assets/idre_logo_v2_black.png";

// Reusing existing dropdowns for consistency
import SettingsDropdown from "../chat/SettingsDropdown";
import AuthDropdown from "../chat/AuthDropdown";
import { ThemeToggle } from "../ThemeToggle";

interface GlobalSidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    onSettingsClick: () => void;
    user?: { name?: string; surname?: string; email?: string; username?: string };
    onLogout: () => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onCreateNotebook: () => void; // Trigger create modal from sidebar
}

const GlobalSidebar: React.FC<GlobalSidebarProps> = ({
                                                         collapsed,
                                                         onToggleCollapse,
                                                         onSettingsClick,
                                                         user,
                                                         onLogout,
                                                         isAuthenticated,
                                                         onLoginClick,
                                                         onRegisterClick,
                                                         onCreateNotebook
                                                     }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    const { notebooks, getAllNotebooks } = useNotebooks();
    const [isMobile, setIsMobile] = useState(false);

    // Fetch notebooks on mount to populate the list
    useEffect(() => {
        getAllNotebooks();
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const sidebarClasses = [
        "h-full flex flex-col flex-shrink-0 bg-sidebar-background border-r border-sidebar-border transition-[width,transform] duration-300 ease-in-out",
        "md:relative fixed top-0 left-0 z-50",
        isMobile ? "w-[280px]" : (collapsed ? "w-[60px]" : "w-[260px]"),
        isMobile && !collapsed ? "translate-x-0 shadow-2xl" : "",
        isMobile && collapsed ? "-translate-x-full" : "",
        !isMobile ? "translate-x-0" : ""
    ].join(" ");

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className={sidebarClasses}>
            <div className={`flex flex-col h-full ${collapsed && !isMobile ? "p-2 overflow-hidden" : "p-2"}`}>

                {/* Header / Logo */}
                <header className={`flex items-center ${collapsed && !isMobile ? "justify-center py-2 pb-3" : "justify-between px-1 pb-3"}`}>
                    <div className={`flex items-center gap-2 font-semibold text-lg text-sidebar-foreground ${collapsed && !isMobile ? "hidden" : ""}`}>
                        <img src={theme === 'dark' ? idreWhiteLogo : idreLogo} alt="IDRE Logo" width={100} height={100} />
                    </div>
                    {isMobile ? (
                        <button
                            className="flex items-center justify-center p-2 rounded-md bg-sidebar-accent text-sidebar-foreground"
                            onClick={onToggleCollapse}
                        >
                            <X size={20} />
                        </button>
                    ) : (
                        <button
                            className={`flex items-center justify-center p-1 rounded-md text-muted-foreground hover:bg-sidebar-accent transition-transform ${collapsed ? "rotate-180" : ""}`}
                            onClick={onToggleCollapse}
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </header>

                <div className="flex-grow flex flex-col gap-3 bg-background min-h-0 items-start overflow-y-auto">

                    {/* Main Navigation */}
                    <section className="flex flex-col gap-1 w-full">
                        <button
                            onClick={() => navigate("/notebooks")}
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left transition-all ${
                                isActive("/notebooks")
                                    ? "bg-sidebar-accent text-sidebar-primary font-semibold border border-sidebar-border"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                            } ${collapsed && !isMobile ? "justify-center" : ""}`}
                            title="Notebooks Dashboard"
                        >
                            <LayoutGrid size={18} />
                            {!collapsed && <span>Notebooks</span>}
                        </button>

                        <button
                            onClick={() => navigate("/tasks")}
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left transition-all ${
                                isActive("/tasks")
                                    ? "bg-sidebar-accent text-sidebar-primary font-semibold border border-sidebar-border"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                            } ${collapsed && !isMobile ? "justify-center" : ""}`}
                            title="All Tasks"
                        >
                            <CheckSquare size={18} />
                            {!collapsed && <span>All Tasks</span>}
                        </button>
                    </section>

                    <div className="w-full border-t border-sidebar-border my-1"></div>

                    {/* Notebooks List */}
                    <div className="flex flex-col w-full flex-1 min-h-0">
                        {!collapsed && (
                            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <span>Your Notebooks</span>
                                <button onClick={onCreateNotebook} className="hover:text-sidebar-primary">
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
                            {notebooks.map((nb) => (
                                <button
                                    key={nb.id}
                                    onClick={() => navigate(`/chat/${nb.id}`)}
                                    className={`flex items-center gap-3 w-full p-2.5 rounded-md text-sm text-left transition-all text-sidebar-foreground hover:bg-sidebar-accent ${
                                        collapsed && !isMobile ? "justify-center" : ""
                                    }`}
                                    title={nb.title}
                                >
                                    <Icon name={nb.emoji as IconName} className="w-4 h-4 flex-shrink-0" />
                                    {!collapsed && <span className="truncate">{nb.title}</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
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

export default memo(GlobalSidebar);