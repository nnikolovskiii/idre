import { buildApiUrl } from './api.ts';

// Types for notebook models
export interface NotebookModel {
    id: string;
    user_id: string;
    notebook_id: string;
    generative_model_id: string;
    model_name: string;
    model_type: string;
}

export interface NotebookModelListResponse {
    data: Record<string, NotebookModel>;
}

export interface NotebookModelUpdate {
    generative_model_name: string;
    generative_model_type: string;
}

// Helper function to build notebook model URLs
const getNotebookModelsUrl = (notebookId: string) => {
    return buildApiUrl(`/notebook-models/${notebookId}/models`);
};

const getNotebookModelUrl = (notebookModelId: string) => {
    return buildApiUrl(`/notebook-models/${notebookModelId}`);
};

/**
 * Get all models for a specific notebook
 * @param notebookId - The ID of the notebook
 * @returns Promise with notebook models grouped by type
 */
export const getNotebookModels = async (notebookId: string): Promise<Record<string, NotebookModel>> => {
    const response = await fetch(getNotebookModelsUrl(notebookId), {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch notebook models' }));
        throw new Error(error.detail || 'Failed to fetch notebook models');
    }

    const data: NotebookModelListResponse = await response.json();
    return data.data;
};

/**
 * Update a notebook model
 * @param notebookModelId - The ID of the notebook model to update
 * @param modelData - The update data containing the new generative_model_id
 * @returns Promise with the updated notebook model
 */
export const updateNotebookModel = async (
    notebookModelId: string,
    modelData: NotebookModelUpdate
): Promise<NotebookModel> => {
    const response = await fetch(getNotebookModelUrl(notebookModelId), {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelData),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update notebook model' }));
        throw new Error(error.detail || 'Failed to update notebook model');
    }

    // Parse the response and return a properly typed NotebookModel
    const updatedModel: NotebookModel = await response.json();
    return updatedModel;
};

/**
 * Delete a notebook model
 * @param notebookModelId - The ID of the notebook model to delete
 * @returns Promise that resolves when the model is deleted
 */
export const deleteNotebookModel = async (notebookModelId: string): Promise<void> => {
    const response = await fetch(getNotebookModelUrl(notebookModelId), {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to delete notebook model' }));
        throw new Error(error.detail || 'Failed to delete notebook model');
    }
};