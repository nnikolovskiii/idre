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
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      onDeleteChat(chatId);
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  if (!isAuthenticated) return null;

  return (
    <section className="history-section">
      <div className="history-header">
        <button
          className="history-title-btn"
          onClick={() => setHistoryOpen(!historyOpen)}
        >
          <History size={16} />
          <span>History</span>
          <ChevronDown size={16} className={historyOpen ? "" : "rotated"} />
        </button>
        <button
          className="new-chat-btn"
          onClick={onCreateNewChat}
          disabled={creatingChat}
          title="New Chat"
        >
          {creatingChat ? (
            <div
              className="loading-spinner"
              style={{ width: 16, height: 16 }}
            ></div>
          ) : (
            <Plus size={16} />
          )}
        </button>
      </div>
      {historyOpen && (
        <div className="chat-sessions">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Loading chats...</span>
            </div>
          ) : chatSessions.length === 0 ? (
            <div className="empty-state">No chat sessions yet.</div>
          ) : (
            chatSessions.map((chat) => (
              <div
                key={chat.id}
                className={`chat-session ${
                  chat.id === currentChatId ? "active" : ""
                }`}
                onClick={() => {
                  onSwitchChat(chat.id);
                  onToggleCollapse();
                }}
              >
                <div className="chat-title">
                  {chat.title || `Chat ${chat.id.slice(0, 8)}`}
                </div>
                <button
                  className="chat-delete-btn"
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
