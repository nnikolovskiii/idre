import {API_CONFIG} from "./api.ts";

export interface NotebookCreate {
    emoji: string;
    title: string;
    date: string;
}

export interface NotebookUpdate {
    emoji?: string;
    title?: string;
    date?: string;
    bg_color?: string;
    text_color?: string;
}

export interface NotebookResponse {
    id: string;
    emoji: string;
    title: string;
    date: string;
    bg_color: string;
    text_color: string;
    created_at: string;
    updated_at: string;
}

export interface PaginationMeta {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
}

export interface NotebooksListResponse {
    status: string;
    message: string;
    data: NotebookResponse[];
    meta?: PaginationMeta; // Add optional meta
}

// Base URL — update to match your backend
const API_BASE_URL = API_CONFIG.URL+"/notebooks";

// Generic fetch wrapper with auth and error handling
const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.detail || `HTTP error! status: ${response.status}`;
        throw new Error(message);
    }

    return response;
};

// Notebook Service
export const NotebookService = {
    // POST /notebooks
    async createNotebook(data: NotebookCreate): Promise<NotebookResponse> {
        const response = await apiFetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // GET /notebooks (Modified for pagination)
    async getAllNotebooks(page: number = 1, pageSize: number = 20): Promise<NotebooksListResponse> {
        // Construct query parameters
        const queryParams = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString()
        });

        const response = await apiFetch(`${API_BASE_URL}?${queryParams.toString()}`);
        return response.json();
    },

    // GET /notebooks/{notebook_id}
    async getNotebookById(id: string): Promise<NotebookResponse> {
        const response = await apiFetch(`${API_BASE_URL}/${id}`);
        return response.json();
    },

    // PUT /notebooks/{notebook_id}
    async updateNotebook(id: string, data: NotebookUpdate): Promise<NotebookResponse> {
        const response = await apiFetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.json();
    },

    // DELETE /notebooks/{notebook_id}
    async deleteNotebook(id: string): Promise<void> {
        await apiFetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
        });
    },
};