import React, { useState } from "react";
import { Menu, Settings, Copy } from "lucide-react";
import type { ChatSession } from "../../types/chat";

interface ChatHeaderProps {
  title: string;
  onMenuClick: () => void;
  onSettingsClick: () => void;
  currentChat?: ChatSession | null;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
                                                 title,
                                                 onMenuClick,
                                                 onSettingsClick,
                                                 currentChat,
                                               }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyChat = async () => {
    if (!currentChat || !currentChat.messages.length) return;

    const formattedMessages = currentChat.messages.map((message) => {
      const prefix = message.type === 'human' ? '# User:' : '#AI assistant:';
      const content = message.audioUrl ? '[Audio message]' : (message.content || '');
      return `${prefix}\n${content}`;
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(formattedMessages);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy chat:', error);
    }
  };
  return (
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-2 sm:p-3 pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pl-[max(0.5rem,env(safe-area-inset-left))]">
        <div className="flex items-center gap-4">
          <button className="rounded-md bg-transparent p-1 text-foreground hover:bg-sidebar-accent" onClick={onMenuClick}>
            <Menu size={24} />
          </button>
          <h1 className="m-0 text-lg font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {currentChat && currentChat.messages.length > 0 && (
            <button
                className="flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-2 text-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={handleCopyChat}
                title={copied ? "Copied!" : "Copy chat"}
            >
              <Copy size={18} />
            </button>
          )}
          <button
              className="flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-2 text-foreground transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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