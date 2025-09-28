import {getNotebooksUrl} from "./api";

export interface Notebook {
    id: string;
    emoji: string;
    title: string;
    date: string;
    sourceCount: number;
    bgColor: string;
    textColor: string;
    created_at: string;
    updated_at: string;
    requiredFields: string;
}

export interface CreateNotebookRequest {
    emoji: string;
    title: string;
    date: string;
    bg_color: string;
    text_color: string;
    source_count: number;
}

export interface UpdateNotebookRequest {
    emoji?: string;
    title?: string;
    date?: string;
    bg_color?: string;
    text_color?: string;
    source_count?: number;
}

export interface NotebookResponse {
    id: string;
    emoji: string;
    title: string;
    date: string;
    source_count: number;
    bg_color: string;
    text_color: string;
    created_at: string;
    updated_at: string;
}

export interface NotebooksListResponse {
    status: string;
    message: string;
    data: BackendNotebookResponse[];
}

interface BackendNotebookResponse {
    id: string;
    emoji: string;
    title: string;
    date: string;
    source_count: number;
    bg_color: string;
    text_color: string;
    created_at: string;
    updated_at: string;
    requiredFields: string;
}

const transformNotebookData = (
    backendNotebook: BackendNotebookResponse
): Notebook => {
    return {
        id: backendNotebook.id,
        emoji: backendNotebook.emoji,
        title: backendNotebook.title,
        date: backendNotebook.date,
        sourceCount: backendNotebook.source_count,
        bgColor: backendNotebook.bg_color,
        textColor: backendNotebook.text_color,
        created_at: backendNotebook.created_at,
        updated_at: backendNotebook.updated_at,
        requiredFields: backendNotebook.requiredFields
    };
};

export const notebooksService = {
    createNotebook: async (
        notebookData: CreateNotebookRequest
    ): Promise<NotebookResponse> => {
        const createUrl = getNotebooksUrl();

        const response = await fetch(createUrl, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(notebookData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to create notebook: ${response.status} ${response.statusText} (${errorText})`
            );
        }

        const result = await response.json();
        return result;
    },

    getAllNotebooks: async (): Promise<Notebook[]> => {
        const listUrl = getNotebooksUrl();

        const response = await fetch(listUrl, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to fetch notebooks: ${response.status} ${response.statusText} (${errorText})`
            );
        }

        const result: NotebooksListResponse = await response.json();
        return result.data.map(transformNotebookData);
    },

    getNotebookById: async (notebookId: string): Promise<NotebookResponse> => {
        const getUrl = getNotebooksUrl(notebookId);

        const response = await fetch(getUrl, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to fetch notebook: ${response.status} ${response.statusText} (${errorText})`
            );
        }

        const result = await response.json();
        return result;
    },

    updateNotebook: async (
        notebookId: string,
        notebookData: UpdateNotebookRequest
    ): Promise<NotebookResponse> => {
        const updateUrl = getNotebooksUrl(notebookId);

        const response = await fetch(updateUrl, {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(notebookData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to update notebook: ${response.status} ${response.statusText} (${errorText})`
            );
        }

        const result = await response.json();
        return result;
    },

    deleteNotebook: async (notebookId: string): Promise<void> => {
        const deleteUrl = getNotebooksUrl(notebookId);

        const response = await fetch(deleteUrl, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to delete notebook: ${response.status} ${response.statusText} (${errorText})`
            );
        }
    },
};