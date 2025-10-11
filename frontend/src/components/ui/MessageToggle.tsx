import React from 'react';
import { FileText, Volume2 } from 'lucide-react';
import clsx from 'clsx';

interface MessageToggleProps {
  showAudio: boolean;
  onToggle: () => void;
  hasText: boolean;
  hasAudio: boolean;
  isUserMessage?: boolean;
}

const MessageToggle: React.FC<MessageToggleProps> = ({
                                                       showAudio,
                                                       onToggle,
                                                       hasText,
                                                       hasAudio,
                                                       isUserMessage = false,
                                                     }) => {
  if (!hasText || !hasAudio) {
    return null; // Don't show toggle if message doesn't have both text and audio
  }

  const buttonClasses = clsx(
      // Base styles
      "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
      "cursor-pointer transition-all duration-200 ease-in-out outline-none",
      "focus:border-ring focus:ring-2 focus:ring-ring/20",
      "active:translate-y-px",
      "md:gap-1.5 md:px-2.5 md:py-1.5 md:text-[0.8rem]",
      // Theme-based styles
      {
        // AI message theme
        'border-border bg-muted text-muted-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground': !isUserMessage,
        // User message theme
        'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:border-primary-foreground/30 hover:bg-primary-foreground/20': isUserMessage,
      }
  );

  const iconSize = 16;
  const iconResponsiveClass = "md:h-3.5 md:w-3.5";

  return (
      <div className="mb-3 flex justify-start">
        <button
            onClick={onToggle}
            className={buttonClasses}
            title={showAudio ? "Show text" : "Show audio"}
        >
          {showAudio ? (
              <>
                <FileText size={iconSize} className={iconResponsiveClass} />
                <span>Show Text</span>
              </>
          ) : (
              <>
                <Volume2 size={iconSize} className={iconResponsiveClass} />
                <span>Show Audio</span>
              </>
          )}
        </button>
      </div>
  );
};

export default MessageToggle;