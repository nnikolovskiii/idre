import {
    getDefaultAIModelsUrl,
    updateDefaultAIModelsUrl
} from './api';

// Type definitions
export interface DefaultAIModelsResponse {
    light_model: string;
    heavy_model: string;
}

export interface UpdateDefaultAIModelsRequest {
    light_model: string;
    heavy_model: string;
}

// Default AI Models service functions
export const defaultAIModelsService = {
    getDefaultAIModels: async (): Promise<DefaultAIModelsResponse> => {
        const response = await fetch(getDefaultAIModelsUrl(), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch default AI models: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },

    updateDefaultAIModels: async (request: UpdateDefaultAIModelsRequest): Promise<{ status: string; message: string }> => {
        const response = await fetch(updateDefaultAIModelsUrl(), {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update default AI models: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },
};
