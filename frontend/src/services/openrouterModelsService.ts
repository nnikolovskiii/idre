import { getOpenRouterModelsUrl } from './api';

// Type definitions
export type ModelName = string;

// Enhanced model interface with recommendation data
export interface EnhancedModel {
    name: string;
    type: string;
    is_recommended: boolean;
    recommendation_order?: number;
    recommendation_reason?: string;
}

// Response interface for enhanced models endpoint
export interface EnhancedModelsResponse {
    models: EnhancedModel[];
}

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

    getEnhancedModels: async (): Promise<EnhancedModelsResponse> => {
        const response = await fetch(getOpenRouterModelsUrl() + 'enhanced', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch enhanced models: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },
};