import {API_CONFIG} from "./api.ts";

// --- INTERFACES ---

/**
 * The request body for creating or updating a proposition.
 * The notebook_id is now part of the URL, not the body.
 */
export interface PropositionUpdateRequest {
    service?: string;
    audience?: string;
    problem?: string;
    solution?: string;
}

/**
 * The shape of a proposition object returned from the API.
 */
export interface PropositionResponse {
    notebook_id: string; // The primary identifier
    service: string | null;
    audience: string | null;
    problem: string | null;
    solution: string | null;
    created_at: string;
    updated_at: string;
}

// --- API CONFIG ---
const API_BASE_URL = API_CONFIG.URL + "/propositions";

// --- GENERIC FETCHER ---
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

// --- PROPOSITION SERVICE ---

export const PropositionService = {
    /**
     * Retrieves the proposition associated with a specific notebook.
     * Corresponds to: GET /propositions/{notebook_id}
     * @param notebookId The UUID of the parent notebook.
     */
    async getPropositionByNotebookId(notebookId: string): Promise<PropositionResponse> {
        const response = await apiFetch(`${API_BASE_URL}/${notebookId}`);
        return response.json();
    },

    /**
     * Creates or updates the proposition for a specific notebook (upsert).
     * Corresponds to: PUT /propositions/{notebook_id}
     * @param notebookId The UUID of the parent notebook.
     * @param data The proposition data to save.
     */
    async upsertPropositionForNotebook(notebookId: string, data: PropositionUpdateRequest): Promise<PropositionResponse> {
        const response = await apiFetch(`${API_BASE_URL}/${notebookId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        return response.json();
    },
};