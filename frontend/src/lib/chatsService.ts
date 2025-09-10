import {
  getChatsUrl,
  getThreadMessagesUrl,
  sendMessageToThreadUrl,
  getChatAIModelsUrl,
  updateChatAIModelsUrl,
  deleteMessageUrl
} from './api';
import type { BackendMessage } from './api';

// Type definitions
export interface Thread {
  id: string;
  title: string;
  created_at: string;
}

export interface CreateThreadRequest {
  title: string;
}

export interface CreateThreadResponse {
  chat_id: string;
  thread_id: string;
  title: string;
  created_at: string;
}

export interface SendMessageRequest {
  message?: string;
  audio_path?: string;
  ai_model?: string;
  light_model?: string;
  heavy_model?: string;
}

export interface SendMessageResponse {
  status: string;
  data?: any;
}

export interface AIModelsResponse {
  light_model: string;
  heavy_model: string;
}

export interface UpdateAIModelsRequest {
  light_model: string;
  heavy_model: string;
}

// Chats service functions
export const chatsService = {
  createThread: async (request: CreateThreadRequest): Promise<CreateThreadResponse> => {
    const response = await fetch(getChatsUrl('/create-thread'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create thread: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  getThreads: async (): Promise<Thread[]> => {
    const response = await fetch(getChatsUrl(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch threads: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  getThreadMessages: async (threadId: string): Promise<BackendMessage[]> => {
    const response = await fetch(getThreadMessagesUrl(threadId), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch messages: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  sendMessageToThread: async (
    threadId: string,
    message?: string,
    audioPath?: string,
    onLoadingUpdate?: (isLoading: boolean) => void
  ): Promise<SendMessageResponse> => {
    const payload: SendMessageRequest = {};

    // Only include non-empty message
    if (message && message.trim()) {
      payload.message = message;
    }

    if (audioPath) {
      payload.audio_path = audioPath;
    }
    

    // Signal that processing is starting
    if (onLoadingUpdate) {
      onLoadingUpdate(true);
    }

    try {
      const response = await fetch(sendMessageToThreadUrl(threadId), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.statusText} (${errorText})`);
      }

      const result = await response.json();
      
      // Signal that processing is complete
      if (onLoadingUpdate) {
        onLoadingUpdate(false);
      }
      
      return result;
    } catch (error) {
      // Make sure to turn off loading indicator on error
      if (onLoadingUpdate) {
        onLoadingUpdate(false);
      }
      throw error;
    }
  },

  getChatAIModels: async (chatId: string): Promise<AIModelsResponse> => {
    const response = await fetch(getChatAIModelsUrl(chatId), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch AI models: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  updateChatAIModels: async (chatId: string, request: UpdateAIModelsRequest): Promise<{ status: string; message: string }> => {
    const response = await fetch(updateChatAIModelsUrl(chatId), {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update AI models: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  deleteMessage: async (threadId: string, messageId: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(deleteMessageUrl(threadId, messageId), {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete message: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },
};
