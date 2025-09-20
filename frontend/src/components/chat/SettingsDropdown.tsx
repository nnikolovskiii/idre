import React from "react";
import { Settings, Bot, Key, ChevronDown } from "lucide-react";

interface SettingsDropdownProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onDefaultModelsClick: () => void;
  onModelApiClick: () => void;
  onSettingsClick: () => void;
}

const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  collapsed,
  onToggleCollapse,
  onDefaultModelsClick,
  onModelApiClick,
  onSettingsClick,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <section className="settings-section">
      <button className="settings-header" onClick={() => setIsOpen(!isOpen)}>
        <Settings size={16} />
        {!collapsed && <span>Settings</span>}
        {!collapsed && (
          <ChevronDown size={16} className={isOpen ? "" : "rotated"} />
        )}
      </button>
      {!collapsed && isOpen && (
        <div className="settings-items">
          <button
            className="settings-item"
            onClick={() => {
              onDefaultModelsClick();
              onToggleCollapse();
            }}
            title="Default Models"
          >
            <Bot size={16} />
            <span>AI Models</span>
          </button>
          <button
            className="settings-item"
            onClick={() => {
              onModelApiClick();
              onToggleCollapse();
            }}
            title="Model API Settings"
          >
            <Key size={16} />
            <span>API Key</span>
          </button>
          <button
            className="settings-item"
            onClick={() => {
              onSettingsClick();
              onToggleCollapse();
            }}
            title="AI Models Settings"
          >
            <Settings size={16} />
            <span>Chat Settings</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default SettingsDropdown;
