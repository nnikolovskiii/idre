import React from 'react';
import { Menu, Settings, Bot, Key } from 'lucide-react';

interface ChatHeaderProps {
  title: string;
  isMobile: boolean;
  onMenuClick: () => void;
  onSettingsClick: () => void;
  onDefaultModelsClick: () => void;
  onModelApiClick: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, isMobile, onMenuClick, onSettingsClick, onDefaultModelsClick, onModelApiClick }) => {
  console.log('ChatHeader rendering, isMobile:', isMobile);
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
          onClick={onDefaultModelsClick}
          title="Default Models"
        >
          <Bot size={18} />
        </button>
        <button
          className="settings-button"
          onClick={onModelApiClick}
          title="Model API Settings"
        >
          <Key size={18} />
        </button>
        <button
          className="settings-button"
          onClick={onSettingsClick}
          title="AI Models Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
