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
    typingThreadId: string | null;
    setTypingThreadId: (threadId: string | null) => void;
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
    const [typingThreadId, setTypingThreadId] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    // This is a "hard" disconnect, for logging out or unmounting the app.
    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            console.log(
                "SSE Context: Closing existing connection (Hard Disconnect).",
                eventSourceRef.current.url
            );
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setConnectionStatus("disconnected");
            setTypingThreadId(null); // This is correct for a hard disconnect.
        }
    }, []);

    const connectToThread = useCallback(
        (threadId: string) => {
            // If we are already connected to the same thread, do nothing.
            if (
                eventSourceRef.current &&
                eventSourceRef.current.url.includes(threadId)
            ) {
                return;
            }

            // ===================================================================
            // THE FIX IS HERE
            // ===================================================================
            // We no longer call the master disconnect() function which resets the typing state.
            // Instead, we manually close the old connection before creating a new one,
            // preserving the typingThreadId state.
            if (eventSourceRef.current) {
                console.log("SSE Context: Switching threads, closing old connection.", eventSourceRef.current.url);
                eventSourceRef.current.close();
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

                    if (parsedData.data?.thread_id === typingThreadId) {
                        setTypingThreadId(null);
                    }
                } catch (err) {
                    console.error("SSE Context: Error parsing message:", err);
                    setTypingThreadId(null);
                }
            };

            es.onerror = (error) => {
                console.error("SSE Context: Connection error:", error);
                setConnectionStatus("error");
                setTypingThreadId(null);
                es.close();
            };

            eventSourceRef.current = es;
        },
        [typingThreadId] // No longer depends on disconnect
    );

    useEffect(() => {
        // This effect now correctly handles the "hard disconnect" when the app closes.
        return () => {
            disconnect();
        };
    }, [disconnect]);

    const value = {
        latestEvent,
        connectionStatus,
        typingThreadId,
        setTypingThreadId,
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