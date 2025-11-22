import {getGenerativeModelsUrl} from './api';

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

export const generativeModelService = {
    getModelNames: async (): Promise<ModelName[]> => {
        const response = await fetch(getGenerativeModelsUrl(), {
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
        const response = await fetch(getGenerativeModelsUrl() + 'enhanced', {
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

    getLightModels: async (): Promise<EnhancedModelsResponse> => {
        const response = await fetch(getGenerativeModelsUrl() + 'enhanced/light', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch light models: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },

    getHeavyModels: async (): Promise<EnhancedModelsResponse> => {
        const response = await fetch(getGenerativeModelsUrl() + 'enhanced/heavy', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch heavy models: ${response.statusText} (${errorText})`);
        }

        return response.json();
    },
};