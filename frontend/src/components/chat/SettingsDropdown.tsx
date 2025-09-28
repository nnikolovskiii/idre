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
    <section className="settings-section">
      <button
        className="settings-button"
        onClick={() => {
          onSettingsClick();
          if (window.innerWidth <= 768) {
            onToggleCollapse();
          }
        }}
        title="Settings"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <Settings size={16} />
          {!collapsed && <span>Settings</span>}
        </div>
        <div style={{ width: '24px', height: '24px', opacity: 0 }}></div>
      </button>
    </section>
  );
};
export default SettingsDropdown;
