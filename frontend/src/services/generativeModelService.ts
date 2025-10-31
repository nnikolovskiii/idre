import {getGenerativeModelsUrl} from './api';

export type ModelName = string;

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


    getFreeModelNames: async (): Promise<ModelName[]> => {
        const response = await fetch(`${getGenerativeModelsUrl()}free`, {
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