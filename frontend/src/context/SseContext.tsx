// /home/nnikolovskii/dev/general-chat/frontend/src/context/SseContext.tsx:

import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
    useEffect, type ReactNode,
} from "react";

interface SseEventData {
    event: string;
    data: any;
}

interface SseContextType {
    latestEvent: SseEventData | null;
    connectionStatus: "disconnected" | "connecting" | "connected" | "error";
    typingThreads: Set<string>;
    addTypingThread: (threadId: string) => void;
    removeTypingThread: (threadId: string) => void;
    isThreadTyping: (threadId: string) => boolean;
    connectToThread: (threadId: string) => void;
    disconnect: () => void;
}

const SseContext = createContext<SseContextType | undefined>(undefined);

export const SseProvider: React.FC<{ children: ReactNode }> = ({
                                                                   children,
                                                               }) => {
    const [latestEvent, setLatestEvent] = useState<SseEventData | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<
        SseContextType["connectionStatus"]
    >("disconnected");
    const [typingThreads, setTypingThreads] = useState<Set<string>>(new Set());
    const eventSourceRef = useRef<EventSource | null>(null);

    const addTypingThread = useCallback((threadId: string) => {
        setTypingThreads((prev) => new Set(prev).add(threadId));
    }, []);

    const removeTypingThread = useCallback((threadId: string) => {
        setTypingThreads((prev) => {
            const newSet = new Set(prev);
            newSet.delete(threadId);
            return newSet;
        });
    }, []);

    const isThreadTyping = useCallback((threadId: string) => {
        return typingThreads.has(threadId);
    }, [typingThreads]);

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            console.log(
                "SSE Context: Closing existing connection (Hard Disconnect).",
                eventSourceRef.current.url
            );
            const oldEs = eventSourceRef.current;
            oldEs.onopen = null;
            oldEs.onmessage = null;
            oldEs.onerror = null;
            oldEs.close();

            eventSourceRef.current = null;
            setConnectionStatus("disconnected");
            // Note: We don't clear typing threads here - they persist across connection switches
        }
    }, []);

    const connectToThread = useCallback(
        (threadId: string) => {
            if (
                eventSourceRef.current &&
                eventSourceRef.current.url.includes(threadId) &&
                eventSourceRef.current.readyState !== EventSource.CLOSED
            ) {
                return;
            }

            // ===================================================================
            // THE FIX IS HERE: Proactively disable old event handlers
            // ===================================================================
            if (eventSourceRef.current) {
                console.log("SSE Context: Switching threads, closing old connection.", eventSourceRef.current.url);

                // Get a reference to the old EventSource
                const oldEs = eventSourceRef.current;

                // Deregister all event listeners from the old source.
                // This prevents stale onerror/onmessage handlers from firing
                // after we've already decided to connect to a new thread.
                oldEs.onopen = null;
                oldEs.onmessage = null;
                oldEs.onerror = null;

                // Now it's safe to close it.
                oldEs.close();
            }
            // ===================================================================

            console.log("SSE Context: Connecting to new thread:", threadId);
            setConnectionStatus("connecting");

            const apiUrl = window.ENV?.VITE_API_BASE_URL || "http://localhost:8001";
            const url = `${apiUrl}/chats/sse/${threadId}`;
            const es = new EventSource(url);

            es.onopen = () => {
                console.log("SSE Context: Connection opened for thread:", threadId);
                setConnectionStatus("connected");
            };

            es.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data);
                    console.log("SSE Context: Message received:", parsedData);
                    setLatestEvent(parsedData);
                } catch (err) {
                    console.error("SSE Context: Error parsing message:", err);
                    // Remove typing indicator for this thread on error
                    removeTypingThread(threadId);
                }
            };

            es.onerror = (error) => {
                // This handler only belongs to the NEW EventSource object.
                // An error here means the new connection failed.
                console.error("SSE Context: Connection error on new connection:", error);
                setConnectionStatus("error");
                // Remove typing indicator for this thread on error
                removeTypingThread(threadId);
                es.close();
            };

            eventSourceRef.current = es;
        },
        [] // Removed typingThreadId from dependencies as it's not used inside
    );

    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const value = {
        latestEvent,
        connectionStatus,
        typingThreads,
        addTypingThread,
        removeTypingThread,
        isThreadTyping,
        connectToThread,
        disconnect,
    };

    return <SseContext.Provider value={value}>{children}</SseContext.Provider>;
};

export const useSse = (): SseContextType => {
    const context = useContext(SseContext);
    if (context === undefined) {
        throw new Error("useSse must be used within an SseProvider");
    }
    return context;
};
