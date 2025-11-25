import { getChatsUrl } from "../services/api";

export interface GenerationRequest {
  whiteboard_id: string;
  node_id: string;
  parent_id: string;
  node_type: 'ideaNode' | 'topicNode' | 'noteNode';
  parent_content: string;
}

export interface GenerationResponse {
  status: 'success' | 'error' | 'started';
  message?: string;
}

// --- API CONFIG ---
const API_BASE_URL = getChatsUrl();

// --- GENERIC FETCHER ---
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(API_BASE_URL + endpoint, {
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

export const generationApi = {
  /**
   * Send a stateless generation request to the chat service
   */
  async sendStatelessGenerationRequest(
    request: GenerationRequest
  ): Promise<GenerationResponse> {
    const response = await apiFetch(`/generate-whiteboard`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.json();
  }
};