import {
  getChatsUrl,
  getThreadMessagesUrl,
  sendMessageToThreadUrl,
  getChatAIModelsUrl,
  updateChatAIModelsUrl,
  deleteChatUrl,
  deleteMessageUrl
} from './api';

// Type definitions
export interface Thread {
  id: string;
  title: string;
  created_at: string;
}

export interface ChatResponse {
  chat_id: string;
  user_id: string;
  thread_id: string;
  created_at: string;
  updated_at: string;
}

export interface MessageResponse {
  id: string;
  content: string;
  type: string;
  additional_kwargs: Record<string, any>;
}

export interface CreateThreadRequest {
  title: string;
  notebook_id?: string;
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
  message: string;
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
  /**
   * Get all chats for the current user
   * Endpoint: GET /chats/all
   */
  getChats: async (notebookId?: string): Promise<ChatResponse[]> => {
    const url = new URL(getChatsUrl('/all'));
    if (notebookId) {
      url.searchParams.append('notebook_id', notebookId);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch chats: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  /**
   * Create a new thread
   * Endpoint: POST /chats/create-thread
   */
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

  /**
   * Get all messages for a specific thread
   * Endpoint: GET /chats/{thread_id}/messages
   */
  getThreadMessages: async (threadId: string): Promise<MessageResponse[]> => {
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

  /**
   * Send a message to a thread
   * Endpoint: POST /chats/{thread_id}/send
   */
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

  /**
   * Delete a chat
   * Endpoint: DELETE /chats/{chat_id}
   */
  deleteChat: async (chatId: string): Promise<SendMessageResponse> => {
    const response = await fetch(deleteChatUrl(chatId), {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete chat: ${response.statusText} (${errorText})`);
    }

    return response.json();
  },

  /**
   * Delete a message from a thread
   * Endpoint: DELETE /chats/{thread_id}/messages/{message_id}
   */
  deleteMessage: async (threadId: string, messageId: string): Promise<SendMessageResponse> => {
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

  /**
   * Get AI models for a chat
   * Endpoint: GET /chats/{chat_id}/ai-models
   */
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

  /**
   * Update AI models for a chat
   * Endpoint: PUT /chats/{chat_id}/ai-models
   */
  updateChatAIModels: async (
      chatId: string,
      request: UpdateAIModelsRequest
  ): Promise<SendMessageResponse> => {
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

  // Legacy method for backward compatibility
  getThreads: async (): Promise<Thread[]> => {
    const chats = await chatsService.getChats();
    return chats.map(chat => ({
      id: chat.thread_id,
      title: chat.chat_id, // You might want to fetch actual titles separately
      created_at: chat.created_at,
    }));
  },
};