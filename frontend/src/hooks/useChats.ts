// /home/nnikolovskii/dev/general-chat/frontend/src/hooks/useChats.ts:
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { chatsService, type ChatResponse } from "../services/chatsService";
import type { ChatSession, Message } from "../types/chat";
import type { MessageResponse } from "../services/chatsService";
import { getChatModels } from "../services/chatModelService";
import {useSse} from "../context/SseContext.tsx";

// Helper function to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
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
            web_search: chat.web_search,
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
export const useChats = (notebookIdParam?: string) => {
    const { latestEvent, connectToThread, addTypingThread, removeTypingThread, isThreadTyping } = useSse();
    const location = useLocation();
    const initialFetchDone = useRef(false);
    const { user, isAuthenticated } = useAuth();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [creatingChat, setCreatingChat] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);
    const [hasModelsConfigured, setHasModelsConfigured] = useState<boolean>(false);
    const [isTemporaryChat, setIsTemporaryChat] = useState(false);
    const [currentChatModels, setCurrentChatModels] = useState<Record<string, any>>({});
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
                const currentChat = prev.find(chat => chat.thread_id === currentThreadId);
                const optimisticMessages = currentChat
                    ? currentChat.messages.filter(msg => msg.id.startsWith("msg_optimistic_"))
                    : [];
                const finalMessages = [...convertedMessages, ...optimisticMessages];
                const updated = prev.map((chat) =>
                    chat.thread_id === currentThreadId
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
    }, [currentThreadId]);
    useEffect(() => {
        const fetchInitialChats = async () => {
            setLoadingChats(true);
            setLoadingMessages(true);
            try {
                const backendChats = await chatsService.getChats(notebookIdParam);
                const convertedChats = convertBackendChatsToSessions(backendChats);
                console.log('Converted chats', convertedChats);
                console.log(convertedChats)
                // Check if we should force a temporary chat (from navigation state)
                const shouldForceTemporary = location.state?.forceTemporaryChat;
                setChatSessions(convertedChats);
                let selectedChatId: string | null = null;
                let selectedThreadId: string | null = null;
                let isTemp = false;
                if (shouldForceTemporary || convertedChats.length === 0) {
                    const tempChatId = "temp_" + Date.now();
                    const tempChat: ChatSession = {
                        id: tempChatId,
                        thread_id: "",
                        title: "New Chat",
                        messages: [],
                        createdAt: new Date(),
                        web_search: false,
                    };
                    setChatSessions((prev) => [tempChat, ...prev]);
                    selectedChatId = tempChatId;
                    selectedThreadId = "";
                    isTemp = true;
                    if (shouldForceTemporary) {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } else {
                    selectedChatId = convertedChats[0].id;
                    selectedThreadId = convertedChats[0].thread_id;
                    isTemp = false;
                }
                setCurrentChatId(selectedChatId);
                setCurrentThreadId(selectedThreadId);
                setIsTemporaryChat(isTemp);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unknown error occurred.";
                console.error("Error fetching chats:", errorMessage);
                createTemporaryChat();
                setLoadingMessages(false);
            } finally {
                setLoadingChats(false);
            }
        };
        if (initialFetchDone.current === false) {
            fetchInitialChats();
            initialFetchDone.current = true;
        }
    }, [notebookIdParam, location.state]);
    useEffect(() => {
        if (currentThreadId) {
            console.log('Effect triggered, fetching messages for:', currentThreadId);
            fetchMessagesForCurrentChat();
        }
    }, [currentThreadId, fetchMessagesForCurrentChat]);
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
                setHasModelsConfigured(false);
                setCurrentChatModels({});
            } finally {
                setLoadingModels(false);
            }
        };
        checkModels();
    }, [currentChatId]);
    const createNewChat = async (notebookId?: string, text?: string, options?: { webSearch?: boolean; mode?: string; subMode?: string }) => {
        setCreatingChat(true);
        try {
            const newThreadData = await chatsService.createThread({
                title: `New Chat`,
                text: text,
                notebook_id: notebookId || notebookIdParam,
                web_search: options?.webSearch,
                mode: options?.mode,
                sub_mode: options?.subMode,
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
                web_search: newThreadData.web_search,
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
            web_search: false, // Default for new temporary chats - changed to false
        };
        setChatSessions((prev) => [tempChat, ...prev]);
        setCurrentChatId(tempChatId);
        setCurrentThreadId(null);
        setIsTemporaryChat(true);
        // Return the temp chat ID for immediate use
        return tempChatId;
    };
    const switchToChat = (chatId: string) => {
        console.log('Switching to chat:', chatId);
        const found = chatSessions.find((c) => c.id === chatId);
        if (found) {
            console.log('Found chat with thread_id:', found.thread_id);
            setLoadingMessages(true);
            setCurrentChatId(found.id);
            setCurrentThreadId(found.thread_id);
            setIsTemporaryChat(found.id.startsWith("temp_"));
        } else {
            console.log('Chat not found:', chatId);
        }
    };
    const handleDeleteChat = async (chatId: string) => {
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
        try {
            await chatsService.deleteChat(chatId);
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
        audioData?: string | Blob,
        options?: { webSearch?: boolean; mode?: string; subMode?: string }
    ) => {
        if (!text?.trim() && !audioData) return;

        let audioPath: string | undefined = undefined;
        let audioBase64: string | undefined = undefined;

        // Determine if input is a path (string) or raw audio (Blob)
        if (typeof audioData === 'string') {
            audioPath = audioData;
        } else if (audioData instanceof Blob) {
            // Convert Blob to Base64
            try {
                audioBase64 = await blobToBase64(audioData);
            } catch (e) {
                console.error("Failed to convert audio blob to base64", e);
                return;
            }
        }

        if (isTemporaryChat && currentChatId?.startsWith("temp_")) {
            let newChat: ChatSession | undefined;
            try {
                setCreatingChat(true);
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
                newChat = await createNewChat(notebookIdParam, text, options);
                if (!newChat) {
                    console.error("Failed to create chat");
                    return;
                }
                // Remove temporary chat from sessions
                setChatSessions((prev) => prev.filter((chat) => !chat.id.startsWith("temp_")));
                await chatsService.sendMessageToThread(
                    newChat.thread_id,
                    text,
                    audioPath,
                    audioBase64,
                    options?.mode,
                    options?.subMode,
                );
                addTypingThread(newChat.thread_id);
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unknown error occurred.";
                console.error("Error creating chat and sending message:", errorMessage);
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
                if (newChat) {
                    removeTypingThread(newChat.thread_id);
                }
            } finally {
                setCreatingChat(false);
            }
            return;
        }
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
                audioPath,
                audioBase64,
                options?.mode,
                options?.subMode,
            );
            addTypingThread(currentChat.thread_id);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "An unknown error occurred.";
            console.error("Error sending message:", errorMessage);
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
            if (currentChat) {
                removeTypingThread(currentChat.thread_id);
            }
        }
    };
    // Effect to MANAGE the connection via the global context
    useEffect(() => {
        if (currentThreadId) {
            connectToThread(currentThreadId);
        }
    }, [currentThreadId, connectToThread]);
    // Effect to REACT to new messages from the global context
    useEffect(() => {
        if (!latestEvent || !currentThreadId) {
            return;
        }
        if (latestEvent.data?.thread_id !== currentThreadId) {
            return;
        }
        console.log('useChats hook received event from context:', latestEvent);
        if (latestEvent.event === 'message_update') {
            const messages = latestEvent.data.messages || [];
            const convertedMessages = convertBackendMessages(messages);
            setChatSessions((prev) =>
                prev.map((chat) => {
                    if (chat.thread_id === currentThreadId) {
                        return { ...chat, messages: convertedMessages };
                    }
                    return chat;
                })
            );
            // The update for this thread has been processed, so stop the typing indicator.
            removeTypingThread(currentThreadId);
        } else if (latestEvent.event === 'error') {
            console.error('SSE error event from context:', latestEvent.data.error);
            // An error occurred for this thread, so stop the typing indicator.
            removeTypingThread(currentThreadId);
        }
    }, [latestEvent, currentThreadId, removeTypingThread]);
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
    // DERIVE isTyping for the CURRENT chat from global state
    const isTyping = currentThreadId ? isThreadTyping(currentThreadId) : false;
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