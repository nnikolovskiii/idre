export interface Message {
    id: string;
    type: "human" | "ai";
    content?: string;
    audioUrl?: string;
    timestamp: Date;
    additional_kwargs?: Record<string, unknown>;
}

export interface ChatSession {
    id: string;
    thread_id: string;
    title: string;
    messages: Message[];
    createdAt: Date;
    web_search: boolean;
}

export interface BackendMessage {
    id: string;
    type: 'human' | 'ai' | 'system';
    content: string;
    additional_kwargs?: {
        file_url?: string;
        [key: string]: any;
    };
}

export interface ChatResponse{
    chat_id: string
    user_id: string
    thread_id: string
    created_at: string
    updated_at: string
}