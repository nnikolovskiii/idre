import { getOpenRouterModelsUrl } from './api';

// Type definitions
export type ModelName = string;

// OpenRouter Models service functions
export const openrouterModelsService = {
    getModelNames: async (): Promise<ModelName[]> => {
        const response = await fetch(getOpenRouterModelsUrl(), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch OpenRouter models: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },


    getFreeModelNames: async (): Promise<ModelName[]> => {
        const response = await fetch(`${getOpenRouterModelsUrl()}free`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch free OpenRouter models: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },
};