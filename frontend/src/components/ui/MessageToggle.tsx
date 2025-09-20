import React from 'react';
import { FileText, Volume2 } from 'lucide-react';
import './MessageToggle.css';

interface MessageToggleProps {
  showAudio: boolean;
  onToggle: () => void;
  hasText: boolean;
  hasAudio: boolean;
}

const MessageToggle: React.FC<MessageToggleProps> = ({ 
  showAudio, 
  onToggle, 
  hasText, 
  hasAudio 
}) => {
  if (!hasText || !hasAudio) {
    return null; // Don't show toggle if message doesn't have both text and audio
  }

  return (
    <div className="message-toggle-container">
      <button
        onClick={onToggle}
        className="message-toggle-button"
        title={showAudio ? "Show text" : "Show audio"}
      >
        {showAudio ? (
          <>
            <FileText size={16} />
            <span>Show Text</span>
          </>
        ) : (
          <>
            <Volume2 size={16} />
            <span>Show Audio</span>
          </>
        )}
      </button>
    </div>
  );
};

export default MessageToggle;
