import { buildApiUrl } from './api.ts';

// Types for chat models
export interface ChatModel {
    id: string;
    user_id: string;
    chat_id: string;
    generative_model_id: string;
    model_name: string;
    model_type: string;
}

export interface ChatModelListResponse {
    data: Record<string, ChatModel>;
}

export interface ChatModelUpdate {
    generative_model_name: string;
    generative_model_type: string;
}

// Helper function to build chat model URLs
const getChatModelsUrl = (chatId: string) => {
    return buildApiUrl(`/chat-models/${chatId}/models`);
};

const getChatModelUrl = (chatModelId: string) => {
    return buildApiUrl(`/chat-models/${chatModelId}`);
};

/**
 * Get all models for a specific chat
 * @param chatId - The ID of the chat
 * @returns Promise with chat models grouped by type
 */
export const getChatModels = async (chatId: string): Promise<Record<string, ChatModel>> => {
    const response = await fetch(getChatModelsUrl(chatId), {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch chat models' }));
        throw new Error(error.detail || 'Failed to fetch chat models');
    }

    const data: ChatModelListResponse = await response.json();
    return data.data;
};

/**
 * Update a chat model
 * @param chatModelId - The ID of the chat model to update
 * @param modelData - The update data containing the new generative_model_name and generative_model_type
 * @returns Promise with the updated chat model
 */
export const updateChatModel = async (
    chatModelId: string,
    modelData: ChatModelUpdate
): Promise<ChatModel> => {
    const response = await fetch(getChatModelUrl(chatModelId), {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelData),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update chat model' }));
        throw new Error(error.detail || 'Failed to update chat model');
    }

    // Parse the response and return a properly typed ChatModel
    const updatedModel: ChatModel = await response.json();
    return updatedModel;
};

/**
 * Delete a chat model
 * @param chatModelId - The ID of the chat model to delete
 * @returns Promise that resolves when the model is deleted
 */
export const deleteChatModel = async (chatModelId: string): Promise<void> => {
    const response = await fetch(getChatModelUrl(chatModelId), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to delete chat model' }));
        throw new Error(error.detail || 'Failed to delete chat model');
    }
};