import React from "react";
import { Menu, Settings } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  isMobile: boolean;
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  isMobile,
  onMenuClick,
  onSettingsClick,
}) => {
  console.log("ChatHeader rendering, isMobile:", isMobile);
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        {isMobile && (
          <button className="menu-button" onClick={onMenuClick}>
            <Menu size={24} />
          </button>
        )}
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        <button
          className="settings-button"
          onClick={onSettingsClick}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
