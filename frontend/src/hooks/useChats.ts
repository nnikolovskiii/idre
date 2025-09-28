import {useState, useEffect, useCallback} from "react";
import {useAuth} from "../contexts/AuthContext";
import {useApiKey} from "../contexts/ApiKeyContext";
import {chatsService} from "../lib/chatsService";
import {getChatsUrl} from "../lib/api";
import type {BackendMessage, ChatSession, Message} from "../types/chat";

const convertBackendMessages = (messages: BackendMessage[]): Message[] => {
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

export const useChats = () => {
    const {user, isAuthenticated} = useAuth();
    const {hasApiKey} = useApiKey();
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [loadingChats, setLoadingChats] = useState(true);
    const [creatingChat, setCreatingChat] = useState(false);

    const fetchMessagesForCurrentChat = useCallback(async () => {
        const currentChat = chatSessions.find((chat) => chat.id === currentChatId);
        if (!currentChat || !currentChat.thread_id) return;

        setChatSessions((prev) =>
            prev.map((chat) =>
                chat.id === currentChatId ? {...chat, messages: []} : chat
            )
        );

        try {
            const backendMessages = await chatsService.getThreadMessages(
                currentChat.thread_id
            );
            const convertedMessages = convertBackendMessages(backendMessages);

            setChatSessions((prev) =>
                prev.map((chat) =>
                    chat.id === currentChatId
                        ? {...chat, messages: convertedMessages}
                        : chat
                )
            );
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Could not fetch messages.";
            console.error("Error fetching messages for thread:", errorMessage);
        }
    }, [currentChatId]);

    useEffect(() => {
        const fetchInitialChats = async () => {
            setLoadingChats(true);
            try {
                const response = await fetch(getChatsUrl("/get-all"), {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) throw new Error("Failed to fetch chat history.");

                const backendChats: BackendChat[] = await response.json();

                if (backendChats.length > 0) {
                    const convertedChats: ChatSession[] = backendChats
                        .map((chat) => ({
                            id: chat.chat_id,
                            thread_id: chat.thread_id,
                            title: `Chat ${chat.chat_id.substring(0, 8)}`,
                            messages: [],
                            createdAt: new Date(chat.created_at),
                        }))
                        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

                    setChatSessions(convertedChats);
                    setCurrentChatId(convertedChats[0].id);
                } else {
                    await createNewChat();
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unknown error occurred.";
                console.error("Error fetching chats:", errorMessage);
                await createNewChat();
            } finally {
                setLoadingChats(false);
            }
        };

        fetchInitialChats();
    }, []);

    useEffect(() => {
        if (currentChatId) {
            fetchMessagesForCurrentChat();
        }
    }, [currentChatId, fetchMessagesForCurrentChat]);

    const createNewChat = async () => {
        setCreatingChat(true);
        try {
            const newThreadData = await chatsService.createThread({
                title: `New Chat`,
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
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to create new chat.";
            console.error("Error creating new chat:", errorMessage);
        } finally {
            setCreatingChat(false);
        }
    };

    const switchToChat = (chatId: string) => {
        setCurrentChatId(chatId);
    };

    const handleDeleteChat = (chatId: string) => {
        setChatSessions((prev) => prev.filter((chat) => chat.id !== chatId));

        if (currentChatId === chatId) {
            const remainingChats = chatSessions.filter((chat) => chat.id !== chatId);
            if (remainingChats.length > 0) {
                setCurrentChatId(remainingChats[0].id);
            } else {
                createNewChat();
            }
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
                    ? {...chat, messages: [...chat.messages, optimisticMessage]}
                    : chat
            )
        );
    };

    const handleSendMessage = async (
        text?: string,
        audioPath?: string,
        onApiKeyRequired?: () => void
    ) => {
        if (!hasApiKey) {
            onApiKeyRequired?.();
            return;
        }

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
        hasApiKey,
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
