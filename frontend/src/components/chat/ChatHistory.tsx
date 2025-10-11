import React, { useState } from "react";
import { History, Plus, ChevronDown, Trash2 } from "lucide-react";
import type { ChatSession } from "../../types/chat";

interface ChatHistoryProps {
  chatSessions: ChatSession[];
  currentChatId: string | null;
  onSwitchChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  loading: boolean;
  creatingChat: boolean;
  onCreateNewChat: () => void;
  onToggleCollapse: () => void;
  isAuthenticated: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
                                                   chatSessions,
                                                   currentChatId,
                                                   onSwitchChat,
                                                   onDeleteChat,
                                                   loading,
                                                   creatingChat,
                                                   onCreateNewChat,
                                                   onToggleCollapse,
                                                   isAuthenticated,
                                                 }) => {
  const [historyOpen, setHistoryOpen] = useState(true);

  const handleDeleteChat = async (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (
        !confirm(
            "Are you sure you want to delete this chat? This action cannot be undone."
        )
    ) {
      return;
    }

    try {
      // API call logic remains the same
      onDeleteChat(chatId);
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  if (!isAuthenticated) return null;

  return (
      <section className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center px-1 pb-2">
          <button
              className="flex items-center gap-2 w-full text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase hover:text-neutral-700 transition-colors"
              onClick={() => setHistoryOpen(!historyOpen)}
          >
            <History size={16} />
            <span>History</span>
            <ChevronDown
                size={16}
                className={`ml-auto transition-transform duration-200 ${
                    historyOpen ? "" : "rotate-180"
                }`}
            />
          </button>
          <button
              className="flex items-center justify-center w-6 h-6 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 disabled:opacity-50"
              onClick={onCreateNewChat}
              disabled={creatingChat}
              title="New Chat"
          >
            {creatingChat ? (
                <div
                    className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"
                ></div>
            ) : (
                <Plus size={16} />
            )}
          </button>
        </div>
        {historyOpen && (
            <div className="flex-1 overflow-y-auto pr-1 -mr-1">
              {loading ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto mb-4"></div>
                    <span>Loading chats...</span>
                  </div>
              ) : chatSessions.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-500">
                    No chat sessions yet.
                  </div>
              ) : (
                  chatSessions.map((chat) => (
                      <div
                          key={chat.id}
                          className={`group flex items-center justify-between gap-2 p-2.5 px-3 rounded-md cursor-pointer transition-all mb-1 border ${
                              chat.id === currentChatId
                                  ? "bg-neutral-100/80 border-neutral-200"
                                  : "border-transparent hover:bg-neutral-100"
                          }`}
                          onClick={() => {
                            onSwitchChat(chat.id);
                            if (window.innerWidth <= 768) {
                              onToggleCollapse();
                            }
                          }}
                      >
                        <div className="flex-1 font-medium text-neutral-700 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                          {chat.title || `Chat ${chat.id.slice(0, 8)}`}
                        </div>
                        <button
                            className="flex-shrink-0 flex items-center justify-center p-1 rounded-md text-neutral-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            title="Delete chat"
                            aria-label="Delete chat"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                  ))
              )}
            </div>
        )}
      </section>
  );
};

export default ChatHistory;