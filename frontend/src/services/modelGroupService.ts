import { buildApiUrl } from './api';

export interface GenerativeModelSimple {
    id: string;
    name: string;
    type: string;
}

export interface ModelGroup {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    models: GenerativeModelSimple[];
    created_at: string;
    updated_at: string;
}

export interface CreateModelGroupRequest {
    name: string;
    description?: string;
    model_ids?: string[];
}

export interface UpdateModelGroupRequest {
    name?: string;
    description?: string;
    model_ids?: string[];
}

export interface ModelGroupListResponse {
    status: string;
    message: string;
    data: ModelGroup[];
}

const getBaseUrl = () => buildApiUrl('/model-groups');

export const modelGroupService = {
    getAllGroups: async (): Promise<ModelGroupListResponse> => {
        const response = await fetch(getBaseUrl(), {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch model groups');
        return response.json();
    },

    getGroup: async (id: string): Promise<ModelGroup> => {
        const response = await fetch(`${getBaseUrl()}/${id}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch model group');
        return response.json();
    },

    createGroup: async (data: CreateModelGroupRequest): Promise<ModelGroup> => {
        const response = await fetch(getBaseUrl(), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create model group');
        return response.json();
    },

    updateGroup: async (id: string, data: UpdateModelGroupRequest): Promise<ModelGroup> => {
        const response = await fetch(`${getBaseUrl()}/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update model group');
        return response.json();
    },

    deleteGroup: async (id: string): Promise<void> => {
        const response = await fetch(`${getBaseUrl()}/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete model group');
    },
};