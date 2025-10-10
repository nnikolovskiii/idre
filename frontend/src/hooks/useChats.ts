import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useApiKey } from "../contexts/ApiKeyContext";
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
            title: `Chat ${chat.chat_id.substring(0, 8)}`,
            messages: [],
            createdAt: new Date(chat.created_at),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const useChats = (notebookIdParam?: string) => {
    const { user, isAuthenticated } = useAuth();
    const { hasApiKey } = useApiKey();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [creatingChat, setCreatingChat] = useState(false);
    const [hasModelsConfigured, setHasModelsConfigured] = useState<boolean>(false);

    // In useChats hook, update the fetchMessagesForCurrentChat function:
    const fetchMessagesForCurrentChat = useCallback(async () => {
        if (!currentThreadId) {
            console.log('No currentThreadId, skipping fetch');
            return;
        }

        console.log('Fetching messages for thread:', currentThreadId);

        try {
            const backendMessages = await chatsService.getThreadMessages(currentThreadId);
            const convertedMessages = convertBackendMessages(backendMessages);

            console.log('Fetched messages:', convertedMessages.length);

            setChatSessions((prev) => {
                const updated = prev.map((chat) =>
                    chat.thread_id === currentThreadId
                        ? { ...chat, messages: convertedMessages }
                        : chat
                );
                console.log('Updated chatSessions');
                return updated;
            });
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Could not fetch messages.";
            console.error("Error fetching messages for thread:", errorMessage);
        }
    }, [currentThreadId]); // Only depend on currentThreadId

    useEffect(() => {
        const fetchInitialChats = async () => {
            setLoadingChats(true);
            try {
                // Use the new chatsService.getChats() method with optional notebook_id
                const backendChats = await chatsService.getChats(notebookIdParam);

                if (backendChats.length > 0) {
                    const convertedChats = convertBackendChatsToSessions(backendChats);
                    setChatSessions(convertedChats);
                    setCurrentChatId(convertedChats[0].id);
                    setCurrentThreadId(convertedChats[0].thread_id);
                } else {
                    // Do not auto-create a new chat; wait for user to click Add
                    setChatSessions([]);
                    setCurrentChatId(null);
                    setCurrentThreadId(null);
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unknown error occurred.";
                console.error("Error fetching chats:", errorMessage);
                // Do not auto-create a new chat on error; user can create manually
                setChatSessions([]);
                setCurrentChatId(null);
                setCurrentThreadId(null);
            } finally {
                setLoadingChats(false);
            }
        };

        fetchInitialChats();
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
            // By default, no models configured
            setHasModelsConfigured(false);
            if (!currentChatId) return;
            try {
                const models = await getChatModels(currentChatId);
                const hasAny = !!models && (Object.keys(models).length > 0);
                const hasNamed = !!(models?.["light"]?.model_name || models?.["heavy"]?.model_name);
                setHasModelsConfigured(hasAny && hasNamed);
            } catch (e) {
                // If fetching fails, assume not configured
                setHasModelsConfigured(false);
            }
        };
        checkModels();
    }, [currentChatId]);

    const createNewChat = async (notebookId?: string) => {
        setCreatingChat(true);
        try {
            const newThreadData = await chatsService.createThread({
                title: `New Chat`,
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
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to create new chat.";
            console.error("Error creating new chat:", errorMessage);
        } finally {
            setCreatingChat(false);
        }
    };

    const switchToChat = (chatId: string) => {
        console.log('Switching to chat:', chatId);
        const found = chatSessions.find((c) => c.id === chatId);
        if (found) {
            console.log('Found chat with thread_id:', found.thread_id);
            setCurrentChatId(found.id);
            setCurrentThreadId(found.thread_id);
        } else {
            console.log('Chat not found:', chatId);
        }
    };
    
    const handleDeleteChat = async (chatId: string) => {
        try {
            // Call the backend to delete the chat
            await chatsService.deleteChat(chatId);

            // Remove from local state
            setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId));

            // Handle current chat selection
            if (currentChatId === chatId) {
                const remainingChats = chatSessions.filter((chat) => chat.id !== chatId);
                if (remainingChats.length > 0) {
                    setCurrentChatId(remainingChats[0].id);
                    setCurrentThreadId(remainingChats[0].thread_id);
                } else {
                    // Do not auto-create a new chat after deleting the last one
                    setCurrentChatId(null);
                    setCurrentThreadId(null);
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
        audioPath?: string,
        onApiKeyRequired?: () => void
    ) => {
        // if (!hasApiKey) {
        //     onApiKeyRequired?.();
        //     return;
        // }

        const currentChat = chatSessions.find((chat) => chat.id === currentChatId);
        if (!currentChat || !currentChat.thread_id) {
            console.error("No active chat session selected.");
            return;
        }

        if (!text?.trim() && !audioPath) return;

        const optimisticText = text || "Audio message sent...";
        addOptimisticMessage(optimisticText, audioPath);

        try {
            const result = await chatsService.sendMessageToThread(
                currentChat.thread_id,
                text,
                audioPath,
                (isLoading: boolean) => {
                    setIsTyping(isLoading);
                }
            );

            if (result.status === "success" || result.status === "interrupted") {
                await fetchMessagesForCurrentChat();
            }
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
        }
    };

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
        creatingChat,
        isTyping,
        hasModelsConfigured,
        isAuthenticated,
        user,
        createNewChat,
        switchToChat,
        handleDeleteChat,
        handleSendMessage,
        fetchMessagesForCurrentChat,
        addOptimisticMessage,
        handleDeleteMessage,
    };
};