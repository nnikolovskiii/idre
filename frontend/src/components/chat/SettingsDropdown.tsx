import React from "react";
import { Settings } from "lucide-react";

interface SettingsDropdownProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    onSettingsClick: () => void;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
                                                               collapsed,
                                                               onToggleCollapse,
                                                               onSettingsClick,
                                                           }) => {
    return (
        <section>
            <button
                className="flex items-center w-full text-left p-2.5 px-3 rounded-md text-sm font-medium transition-all"
                onClick={() => {
                    onSettingsClick();
                    if (window.innerWidth <= 768) {
                        onToggleCollapse();
                    }
                }}
                title="Settings"
            >
                <div className="flex items-center gap-3 flex-1">
                    <Settings size={16} />
                    {!collapsed && <span>Settings</span>}
                </div>
            </button>
        </section>
    );
};

export default SettingsDropdown;