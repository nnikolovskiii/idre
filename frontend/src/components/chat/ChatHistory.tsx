import React, { useState } from "react";
import { History, Plus, ChevronDown, Trash2 } from "lucide-react";
import type { ChatSession } from "../../types/chat";

// Custom scrollbar styles
const customScrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

.custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: hsl(var(--muted-foreground) / 0.7);
}

/* Firefox scrollbar styling */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.3) transparent;
}

.custom-scrollbar:hover {
  scrollbar-color: hsl(var(--muted-foreground) / 0.5) transparent;
}

/* Dark theme adjustments */
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.4);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.6);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:active {
  background: hsl(var(--muted-foreground) / 0.8);
}

.dark .custom-scrollbar {
  scrollbar-color: hsl(var(--muted-foreground) / 0.4) transparent;
}

.dark .custom-scrollbar:hover {
  scrollbar-color: hsl(var(--muted-foreground) / 0.6) transparent;
}
`;

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
    isThreadTyping?: (threadId: string) => boolean;
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
                                                     isThreadTyping,
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
        <>
            <style>{customScrollbarStyles}</style>
            <section className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center px-1 pb-2">
                <button
                    className="flex items-center px-2 gap-2 w-full text-left text-xs font-semibold tracking-wider uppercase transition-colors hover:text-foreground"
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
                    className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-sidebar-accent disabled:opacity-50 text-sidebar-foreground"
                    onClick={onCreateNewChat}
                    disabled={creatingChat}
                    title="New Chat"
                >
                    {creatingChat ? (
                        <div
                            className="w-4 h-4 border-2 border-sidebar-border border-t-sidebar-primary rounded-full animate-spin"
                        ></div>
                    ) : (
                        <Plus size={16} />
                    )}
                </button>
            </div>
            {historyOpen && (
                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                    {loading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            <div className="w-6 h-6 border-2 border-sidebar-border border-t-sidebar-primary rounded-full animate-spin mx-auto mb-4"></div>
                            <span>Loading chats...</span>
                        </div>
                    ) : chatSessions.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No chat sessions yet.
                        </div>
                    ) : (
                        chatSessions.map((chat) => {
                            const isTyping = isThreadTyping && chat.thread_id ? isThreadTyping(chat.thread_id) : false;
                            return (
                                <div
                                    key={chat.id}
                                    className={`group flex items-center justify-between gap-2 p-2.5 px-3 rounded-md cursor-pointer mb-1 border ${
                                        chat.id === currentChatId
                                            ? "bg-sidebar-accent text-sidebar-primary border-sidebar-border"
                                            : "border-transparent hover:bg-sidebar-accent"
                                    }`}
                                    onClick={() => {
                                        onSwitchChat(chat.id);
                                        if (window.innerWidth <= 768) {
                                            onToggleCollapse();
                                        }
                                    }}
                                >
                                    <div className="flex-1 flex items-center gap-2 font-medium text-sm whitespace-nowrap overflow-hidden text-sidebar-foreground">
                                        <span className="overflow-hidden text-ellipsis">
                                            {chat.title || `Chat ${chat.id.slice(0, 8)}`}
                                        </span>
                                        {isTyping && (
                                            <span className="flex-shrink-0 flex items-center gap-0.5">
                                                <span className="w-1 h-1 bg-sidebar-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-1 h-1 bg-sidebar-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-1 h-1 bg-sidebar-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        className="flex-shrink-0 flex items-center justify-center p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                        title="Delete chat"
                                        aria-label="Delete chat"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </section>
        </>
    );
};

export default ChatHistory;
