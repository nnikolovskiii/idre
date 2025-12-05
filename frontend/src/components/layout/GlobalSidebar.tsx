import React, {useState, useEffect, memo} from "react";
import {
    ChevronLeft, X,
    LayoutGrid, CheckSquare, Plus
} from "lucide-react";
import {useNavigate, useLocation} from "react-router-dom";
import {useTheme} from "../../context/ThemeContext";
import {useNotebooks} from "../../hooks/useNotebooks";
import {Icon, type IconName} from "../Icon";
import idreLogo from "../../assets/idre_logo_v2_white.png";
import idreWhiteLogo from "../../assets/idre_logo_v2_black.png";

import SettingsDropdown from "../chat/SettingsDropdown";
import AuthDropdown from "../chat/AuthDropdown";
import {ThemeToggle} from "../ThemeToggle";

// Helper to add opacity to hex color for active state background
const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return hex; // fallback
}

interface GlobalSidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    onSettingsClick: () => void;
    user?: { name?: string; surname?: string; email?: string; username?: string };
    onLogout: () => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onCreateNotebook: () => void;
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
    const {theme} = useTheme();
    const {notebooks, getAllNotebooks} = useNotebooks();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        getAllNotebooks();

        // ADDED: Listen for updates from Dashboard/Modals
        const handleRefresh = () => getAllNotebooks();
        window.addEventListener("notebook-updated", handleRefresh);
        window.addEventListener("notebook-created", handleRefresh); // Ensure we catch creations too

        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => {
            window.removeEventListener("resize", checkMobile);
            window.removeEventListener("notebook-updated", handleRefresh);
            window.removeEventListener("notebook-created", handleRefresh);
        };
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

    const handleNavigation = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        navigate(path);
    };

    const getLastTabPath = (notebookId: string) => {
        const lastTab = localStorage.getItem(`notebook-last-tab-${notebookId}`) || 'chat';
        let path = `/${lastTab}/${notebookId}`;
        if (lastTab === 'idea') {
            path = `/idea-canvas/${notebookId}`;
        }
        return path;
    };

    const handleNotebookNavigation = (e: React.MouseEvent, notebookId: string) => {
        e.stopPropagation();
        navigate(getLastTabPath(notebookId));
    };

    return (
        <aside className={sidebarClasses}>
            <div className={`flex flex-col h-full ${collapsed && !isMobile ? "p-2 overflow-hidden" : "p-2"}`}>

                {/* Header / Logo */}
                <header
                    className={`flex items-center ${collapsed && !isMobile ? "justify-center py-2 pb-3" : "justify-between px-1 py-3 pb-4"}`}>
                    <div
                        className={`flex items-center gap-2 font-semibold text-lg text-sidebar-foreground ${collapsed && !isMobile ? "hidden" : ""}`}>
                        <img className={'ml-2.5'}
                             src={theme === 'dark' ? idreWhiteLogo : idreLogo} alt="IDRE Logo" width={60} height={60}/>
                    </div>
                    {isMobile ? (
                        <button
                            className="flex items-center justify-center p-2 rounded-md bg-sidebar-accent text-sidebar-foreground"
                            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
                        >
                            <X size={20}/>
                        </button>
                    ) : (
                        <button
                            className={`flex items-center justify-center p-1 rounded-md text-muted-foreground hover:bg-sidebar-accent transition-transform ${collapsed ? "rotate-180" : ""}`}
                            onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
                        >
                            <ChevronLeft size={18}/>
                        </button>
                    )}
                </header>

                <div className="flex-grow flex flex-col gap-3 bg-background min-h-0 items-start overflow-y-auto">

                    {/* Main Navigation */}
                    <section className="flex flex-col gap-1 w-full">
                        <button
                            onClick={(e) => handleNavigation(e, "/notebooks")}
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left transition-all ${
                                isActive("/notebooks")
                                    ? "bg-sidebar-accent text-sidebar-primary font-semibold border border-sidebar-border"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                            } ${collapsed && !isMobile ? "justify-center" : ""}`}
                            title="Notebooks Dashboard"
                        >
                            <LayoutGrid size={18}/>
                            {!collapsed && <span>Notebooks</span>}
                        </button>

                        <button
                            onClick={(e) => handleNavigation(e, "/tasks")}
                            className={`flex items-center gap-3 py-2.5 px-3 rounded-md text-sm font-medium text-left transition-all ${
                                isActive("/tasks")
                                    ? "bg-sidebar-accent text-sidebar-primary font-semibold border border-sidebar-border"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                            } ${collapsed && !isMobile ? "justify-center" : ""}`}
                            title="All Tasks"
                        >
                            <CheckSquare size={18}/>
                            {!collapsed && <span>All Tasks</span>}
                        </button>
                    </section>

                    {/* Notebook List (Hidden when collapsed) */}
                    {(!collapsed || isMobile) && (
                        <>
                            <div className="w-full border-t border-sidebar-border my-1"></div>

                            <div className="flex flex-col w-full flex-1 min-h-0">
                                <div
                                    className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <span>Your Notebooks</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onCreateNotebook(); }}
                                        className="hover:text-sidebar-primary"
                                    >
                                        <Plus size={14}/>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-1">
                                    {notebooks.map((nb) => {
                                        const notebookPath = getLastTabPath(nb.id);
                                        const active = isActive(notebookPath);
                                        const color = nb.bg_color || '#4d4dff';

                                        return (
                                            <button
                                                key={nb.id}
                                                onClick={(e) => handleNotebookNavigation(e, nb.id)}
                                                className={`
                                                    flex items-center gap-3 w-full p-2 rounded-md text-sm text-left transition-all
                                                    group relative overflow-hidden
                                                    ${active
                                                    ? 'font-medium text-foreground'
                                                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                                                }
                                                `}
                                                // Only apply background opacity if active, otherwise transparent
                                                style={{
                                                    backgroundColor: active ? hexToRgba(color, 0.1) : 'transparent',
                                                }}
                                                title={nb.title}
                                            >
                                                {/* Left Accent Bar for active state */}
                                                {active && (
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-1"
                                                        style={{ backgroundColor: color }}
                                                    />
                                                )}

                                                {/* Icon with color */}
                                                <div
                                                    className={`
                                                        flex items-center justify-center w-6 h-6 rounded-md 
                                                        transition-colors
                                                        ${!active ? 'bg-transparent' : ''}
                                                    `}
                                                    style={{ color: color }}
                                                >
                                                    <Icon name={nb.emoji as IconName} className="w-4 h-4 flex-shrink-0"/>
                                                </div>

                                                <span className="truncate">{nb.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-auto pt-4 border-t border-sidebar-border">
                    <div className="flex flex-col gap-2">
                        <SettingsDropdown
                            collapsed={collapsed}
                            onToggleCollapse={onToggleCollapse}
                            onSettingsClick={onSettingsClick}
                        />
                        <div
                            className={`flex items-center ${
                                collapsed && !isMobile
                                    ? "flex-col justify-center gap-4 py-2"
                                    : "justify-between p-2"
                            }`}
                        >
                            <AuthDropdown
                                collapsed={collapsed}
                                user={user}
                                onLogout={onLogout}
                                onToggleCollapse={onToggleCollapse}
                                isAuthenticated={isAuthenticated}
                                onLoginClick={onLoginClick}
                                onRegisterClick={onRegisterClick}
                            />
                            <ThemeToggle/>
                        </div>
                    </div>
                </footer>
            </div>
        </aside>
    );
};

export default memo(GlobalSidebar);