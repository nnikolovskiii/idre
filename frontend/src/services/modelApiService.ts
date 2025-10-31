import { buildApiUrl } from './api';

// Type definitions
export interface ModelApiResponse {
    has_api_key: boolean;
}

export interface UpdateModelApiRequest {
    api_key: string;
}

// Model API service functions
export const modelApiService = {
    getModelApi: async (): Promise<ModelApiResponse> => {
        const response = await fetch(buildApiUrl('/model-api/'), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch model API key: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },

    updateModelApi: async (request: UpdateModelApiRequest): Promise<{ status: string; message: string }> => {
        const response = await fetch(buildApiUrl('/model-api/'), {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update model API key: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },

    deleteModelApi: async (): Promise<{ status: string; message: string }> => {
        const response = await fetch(buildApiUrl('/model-api/'), {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to delete model API key: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },
};
