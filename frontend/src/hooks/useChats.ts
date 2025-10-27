import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { chatsService, type ChatResponse } from "../lib/chatsService";
import type { ChatSession, Message } from "../types/chat";
import type { MessageResponse } from "../lib/chatsService";
import { getChatModels } from "../lib/chatModelService";

const convertBackendMessages = (messages: MessageResponse[]): Message[] => {
    return messages
        .filter((msg) => msg.type === "human" || msg.type === "ai")
        .map((msg) => ({
            id: msg.id,
            type: msg.type as "human" | "ai",
            content: msg.content,
            audioUrl: msg.additional_kwargs?.file_url,
            additional_kwargs: msg.additional_kwargs,
            timestamp: new Date(),
        }));
};

const convertBackendChatsToSessions = (backendChats: ChatResponse[]): ChatSession[] => {
    return backendChats
        .map((chat) => ({
            id: chat.chat_id,
            thread_id: chat.thread_id,
            title: chat.title,
            messages: [],
            createdAt: new Date(chat.created_at),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const useChats = (notebookIdParam?: string) => {
    const initialFetchDone = useRef(false);
    const { user, isAuthenticated } = useAuth();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [creatingChat, setCreatingChat] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [hasModelsConfigured, setHasModelsConfigured] = useState<boolean>(false);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);
    const [isTemporaryChat, setIsTemporaryChat] = useState(false);
    const [currentChatModels, setCurrentChatModels] = useState<Record<string, any>>({});

    // In useChats hook, update the fetchMessagesForCurrentChat function:
    const fetchMessagesForCurrentChat = useCallback(async () => {
        if (!currentThreadId) {
            console.log('No currentThreadId, skipping fetch');
            return;
        }

        console.log('Fetching messages for thread:', currentThreadId);
        setLoadingMessages(true);

        try {
            const backendMessages = await chatsService.getThreadMessages(currentThreadId);
            const convertedMessages = convertBackendMessages(backendMessages);

            console.log('Fetched messages:', convertedMessages.length);

            setChatSessions((prev) => {
                // Find the current chat in the previous state
                const currentChat = prev.find(chat => chat.thread_id === currentThreadId);

                // Get any existing optimistic messages from that chat
                const optimisticMessages = currentChat
                    ? currentChat.messages.filter(msg => msg.id.startsWith("msg_optimistic_"))
                    : [];

                // Combine the messages from the backend with our existing optimistic messages
                // This prevents the fetch from wiping out the user's immediate feedback.
                // The SSE event will later replace the optimistic message with the real one.
                const finalMessages = [...convertedMessages, ...optimisticMessages];

                const updated = prev.map((chat) =>
                    chat.thread_id === currentThreadId
                        // Use the newly combined message list
                        ? { ...chat, messages: finalMessages }
                        : chat
                );
                console.log('Updated chatSessions');
                return updated;
            });
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Could not fetch messages.";
            console.error("Error fetching messages for thread:", errorMessage);
        } finally {
            setLoadingMessages(false);
        }
    }, [currentThreadId]); // Only depend on currentThreadId

    useEffect(() => {
        const fetchInitialChats = async () => {
            setLoadingChats(true);
            setLoadingMessages(true);
            try {
                // Use the new chatsService.getChats() method with optional notebook_id
                const backendChats = await chatsService.getChats(notebookIdParam);

                if (backendChats.length > 0) {
                    const convertedChats = convertBackendChatsToSessions(backendChats);
                    setChatSessions(convertedChats);
                    setCurrentChatId(convertedChats[0].id);
                    setCurrentThreadId(convertedChats[0].thread_id);
                } else {
                    // No chats found, so create a temporary one automatically.
                    createTemporaryChat();
                    setLoadingMessages(false);
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unknown error occurred.";
                console.error("Error fetching chats:", errorMessage);
                // Also create a temp chat on error so the user isn't blocked
                createTemporaryChat();
                setLoadingMessages(false);
            } finally {
                setLoadingChats(false);
            }
        };

        // =======================================================
        // THE FIX IS HERE
        // =======================================================
        if (initialFetchDone.current === false) {
            fetchInitialChats();
            initialFetchDone.current = true;
        }
    }, [notebookIdParam]);

    useEffect(() => {
        if (currentThreadId) {
            console.log('Effect triggered, fetching messages for:', currentThreadId);
            fetchMessagesForCurrentChat();
        }
    }, [currentThreadId, fetchMessagesForCurrentChat]);

    // Determine if the current chat has models configured (chat-level)
    useEffect(() => {
        const checkModels = async () => {
            if (!currentChatId) {
                setHasModelsConfigured(false);
                setLoadingModels(false);
                setCurrentChatModels({});
                return;
            }

            setLoadingModels(true);
            try {
                const models = await getChatModels(currentChatId);
                const hasAny = !!models && (Object.keys(models).length > 0);
                const hasNamed = !!(models?.["light"]?.model_name || models?.["heavy"]?.model_name);
                setHasModelsConfigured(hasAny && hasNamed);
                setCurrentChatModels(models || {});
            } catch {
                // If fetching fails, assume not configured
                setHasModelsConfigured(false);
                setCurrentChatModels({});
            } finally {
                setLoadingModels(false);
            }
        };
        checkModels();
    }, [currentChatId]);

    const createNewChat = async (notebookId?: string, text?: string) => {
        setCreatingChat(true);
        try {
            const newThreadData = await chatsService.createThread({
                title: `New Chat`,
                text: text,
                notebook_id: notebookId || notebookIdParam,
            });

            const newChat: ChatSession = {
                id: newThreadData.chat_id,
                thread_id: newThreadData.thread_id,
                title: newThreadData.title,
                messages: [
                    {
                        id: "msg_welcome_" + Date.now(),
                        type: "ai",
                        content: "Hello! How can I assist you today?",
                        timestamp: new Date(),
                    },
                ],
                createdAt: new Date(newThreadData.created_at),
            };

            setChatSessions((prev) => [newChat, ...prev]);
            setCurrentChatId(newChat.id);
            setCurrentThreadId(newChat.thread_id);
            setIsTemporaryChat(false);
            return newChat;
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to create new chat.";
            console.error("Error creating new chat:", errorMessage);
            throw err;
        } finally {
            setCreatingChat(false);
        }
    };

    const createTemporaryChat = () => {
        const tempChatId = "temp_" + Date.now();
        const tempChat: ChatSession = {
            id: tempChatId,
            thread_id: "",
            title: "New Chat",
            messages: [],
            createdAt: new Date(),
        };

        setChatSessions((prev) => [tempChat, ...prev]);
        setCurrentChatId(tempChatId);
        setCurrentThreadId(null);
        setIsTemporaryChat(true);
    };

    const switchToChat = (chatId: string) => {
        console.log('Switching to chat:', chatId);
        const found = chatSessions.find((c) => c.id === chatId);
        if (found) {
            console.log('Found chat with thread_id:', found.thread_id);
            setLoadingMessages(true); // Set loading immediately when switching
            setCurrentChatId(found.id);
            setCurrentThreadId(found.thread_id);
            setIsTemporaryChat(found.id.startsWith("temp_"));
        } else {
            console.log('Chat not found:', chatId);
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        // If it's a temporary chat, just remove it from local state
        if (chatId.startsWith("temp_")) {
            setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId));

            if (currentChatId === chatId) {
                const remainingChats = chatSessions.filter((chat) => chat.id !== chatId);
                if (remainingChats.length > 0) {
                    setCurrentChatId(remainingChats[0].id);
                    setCurrentThreadId(remainingChats[0].thread_id);
                    setIsTemporaryChat(remainingChats[0].id.startsWith("temp_"));
                } else {
                    setCurrentChatId(null);
                    setCurrentThreadId(null);
                    setIsTemporaryChat(false);
                }
            }
            return;
        }

        // For real chats, call the backend
        try {
            await chatsService.deleteChat(chatId);

            // Remove from local state
            setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId));

            // Handle current chat selection
            if (currentChatId === chatId) {
                const remainingChats = chatSessions.filter((chat) => chat.id !== chatId);
                if (remainingChats.length > 0) {
                    setCurrentChatId(remainingChats[0].id);
                    setCurrentThreadId(remainingChats[0].thread_id);
                    setIsTemporaryChat(remainingChats[0].id.startsWith("temp_"));
                } else {
                    // Do not auto-create a new chat after deleting the last one
                    setCurrentChatId(null);
                    setCurrentThreadId(null);
                    setIsTemporaryChat(false);
                }
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to delete chat.";
            console.error("Error deleting chat:", errorMessage);
        }
    };

    const addOptimisticMessage = (content: string, audioUrl?: string) => {
        if (!currentChatId) return;

        const optimisticMessage: Message = {
            id: "msg_optimistic_" + Date.now(),
            type: "human",
            content,
            audioUrl,
            timestamp: new Date(),
        };

        setChatSessions((prev) =>
            prev.map((chat) =>
                chat.id === currentChatId
                    ? { ...chat, messages: [...chat.messages, optimisticMessage] }
                    : chat
            )
        );
    };

    const handleSendMessage = async (
        text?: string,
        audioPath?: string
    ) => {
        if (!text?.trim() && !audioPath) return;

        // If this is a temporary chat, create the real chat first
        if (isTemporaryChat && currentChatId?.startsWith("temp_")) {
            try {
                setCreatingChat(true);

                // Add optimistic message to temporary chat FIRST for instant feedback
                const optimisticText = text || "Audio message sent...";
                const optimisticMessage: Message = {
                    id: "msg_optimistic_" + Date.now(),
                    type: "human",
                    content: optimisticText,
                    audioUrl: audioPath,
                    timestamp: new Date(),
                };

                setChatSessions((prev) =>
                    prev.map((chat) =>
                        chat.id === currentChatId
                            ? { ...chat, messages: [...chat.messages, optimisticMessage] }
                            : chat
                    )
                );

                const newChat = await createNewChat(notebookIdParam, text);

                if (!newChat) {
                    console.error("Failed to create chat");
                    return;
                }

                // Transfer the optimistic message to the new chat and remove temporary chat
                setChatSessions((prev) => {
                    const filtered = prev.filter((chat) => !chat.id.startsWith("temp_"));
                    return filtered.map((chat) =>
                        chat.id === newChat.id
                            ? { ...chat, messages: [...chat.messages, optimisticMessage] }
                            : chat
                    );
                });

                await chatsService.sendMessageToThread(
                    newChat.thread_id,
                    text,
                    audioPath
                );

                setIsTyping(true);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unknown error occurred.";
                console.error("Error creating chat and sending message:", errorMessage);

                // Remove optimistic message on error
                setChatSessions((prev) =>
                    prev.map((chat) =>
                        chat.id === currentChatId
                            ? {
                                ...chat,
                                messages: chat.messages.filter(
                                    (msg: Message) => !msg.id.startsWith("msg_optimistic_")
                                ),
                            }
                            : chat
                    )
                );
                setIsTemporaryChat(false);
            } finally {
                setCreatingChat(false);
            }
            return;
        }

        // Normal flow for existing chats
        const currentChat = chatSessions.find((chat) => chat.id === currentChatId);
        if (!currentChat || !currentChat.thread_id) {
            console.error("No active chat session selected.");
            return;
        }

        const optimisticText = text || "Audio message sent...";
        addOptimisticMessage(optimisticText, audioPath);

        try {
            await chatsService.sendMessageToThread(
                currentChat.thread_id,
                text,
                audioPath
            );

            setIsTyping(true);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Error sending message:", errorMessage);

            // Remove optimistic message on error
            setChatSessions((prev) =>
                prev.map((chat) =>
                    chat.id === currentChatId
                        ? {
                            ...chat,
                            messages: chat.messages.filter(
                                (msg: Message) => !msg.id.startsWith("msg_optimistic_")
                            ),
                        }
                        : chat
                )
            );
            setIsTyping(false);
        }
    };

    // Set up SSE connection for real-time updates
    useEffect(() => {
        if (!currentThreadId) {
            // Close existing connection if no thread
            if (eventSource) {
                eventSource.close();
                setEventSource(null);
            }
            return;
        }

        // Close existing connection before creating new one
        if (eventSource) {
            eventSource.close();
        }

        const apiUrl = window.ENV?.VITE_API_BASE_URL || 'http://localhost:8001';
        const url = `${apiUrl}/chats/sse/${currentThreadId}`;

        console.log('Connecting to SSE:', url);
        const es = new EventSource(url);

        es.onopen = () => {
            console.log('SSE connection opened for thread:', currentThreadId);
        };

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('SSE message received:', data);

                if (data.event === 'message_update') {
                    const messages = data.data.messages || [];
                    const convertedMessages = convertBackendMessages(messages);

                    setChatSessions((prev) =>
                        prev.map((chat) => {
                            if (chat.thread_id === currentThreadId) {
                                // The SSE stream is now the source of truth for this chat's messages.
                                // By replacing the entire messages array with the one from the backend,
                                // we automatically remove the optimistic message once the real data arrives.
                                return { ...chat, messages: convertedMessages };
                            }
                            return chat;
                        })
                    );

                    setIsTyping(false);
                } else if (data.event === 'error') {
                    console.error('SSE error event:', data.data.error);
                    setIsTyping(false);
                }
            } catch (err) {
                console.error('Error parsing SSE message:', err);
            }
        };

        es.onerror = (error) => {
            console.error('SSE connection error:', error);
            es.close();
            setIsTyping(false);
        };

        setEventSource(es);

        // Cleanup on unmount or thread change
        return () => {
            console.log('Closing SSE connection for thread:', currentThreadId);
            es.close();
        };
    }, [currentThreadId]);

    const handleDeleteMessage = async (messageId: string) => {
        const currentChat = chatSessions.find((chat) => chat.id === currentChatId);
        if (!currentChat || !currentChat.thread_id) return;

        try {
            await chatsService.deleteMessage(currentChat.thread_id, messageId);
            await fetchMessagesForCurrentChat();
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to delete message.";
            console.error("Error deleting message:", errorMessage);
        }
    };

    const currentChat = chatSessions.find((chat) => chat.id === currentChatId);

    return {
        chatSessions,
        currentChat,
        currentChatId,
        loadingChats,
        loadingMessages,
        loadingModels,
        creatingChat,
        isTyping,
        hasModelsConfigured,
        currentChatModels,
        isAuthenticated,
        user,
        isTemporaryChat,
        createNewChat,
        createTemporaryChat,
        switchToChat,
        handleDeleteChat,
        handleSendMessage,
        fetchMessagesForCurrentChat,
        addOptimisticMessage,
        handleDeleteMessage,
    };
};
