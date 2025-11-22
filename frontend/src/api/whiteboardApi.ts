import { API_CONFIG } from "../services/api";

export interface Whiteboard {
  id: string;
  user_id: string;
  notebook_id: string;
  title: string;
  content: any;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface WhiteboardCreateRequest {
  title: string;
  content?: any;
  thumbnail_url?: string;
}

export interface WhiteboardUpdateRequest {
  title?: string;
  content?: any;
  thumbnail_url?: string;
}

export interface WhiteboardsListResponse {
  whiteboards: Whiteboard[];
  total_count: number;
  status: string;
  message: string;
}

export interface WhiteboardOperationResponse {
  status: string;
  message: string;
  whiteboard?: Whiteboard;
}

export interface WhiteboardSearchRequest {
  query?: string;
  limit?: number;
  offset?: number;
}

// Hierarchy Management Types

export interface NodeHierarchyUpdate {
  node_id: string;
  parent_id?: string | null;
  children_order?: string[];
}

export interface CreateChildNodeRequest {
  node_type: 'ideaNode' | 'topicNode' | 'noteNode';
  parent_id: string;
  position?: { x: number; y: number };
  content?: any;
}

export interface NodeHierarchyResponse {
  status: string;
  message: string;
  updated_content?: any;
  node_id?: string;
}

export interface ValidateHierarchyRequest {
  whiteboard_content: any;
  node_id: string;
  proposed_parent_id?: string | null;
}

export interface HierarchyValidationResponse {
  is_valid: boolean;
  message: string;
  circular_reference_path?: string[];
}

// Extended Node interface for hierarchy
export interface EnhancedNodeData {
  idea?: string;
  topics?: string[];
  text?: string;
  onEdit?: (id: string) => void;
  onDataChange?: (id: string, data: any) => void;
  // Hierarchy fields
  parentId?: string | null;
  childrenOrder?: string[];
  depth?: number;
  isExpanded?: boolean;
}

// Enhanced Edge interface for hierarchy
export interface EnhancedEdge {
  id: string;
  source: string;
  target: string;
  type: 'regular' | 'parent-child';
  style?: React.CSSProperties;
  animated?: boolean;
}

// --- API CONFIG ---
const API_BASE_URL = API_CONFIG.URL + "/whiteboards";

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

export const whiteboardApi = {
  /**
   * Get all whiteboards for a notebook
   */
  async getWhiteboards(
    notebookId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<WhiteboardsListResponse> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());

    const url = params.toString() ? `${API_BASE_URL}/${notebookId}?${params}` : `${API_BASE_URL}/${notebookId}`;
    const response = await apiFetch(url);
    return response.json();
  },

  /**
   * Get a single whiteboard by ID
   */
  async getWhiteboard(whiteboardId: string): Promise<{ status: string; message: string; data: Whiteboard }> {
    const response = await apiFetch(`${API_BASE_URL}/whiteboard/${whiteboardId}`);
    return response.json();
  },

  /**
   * Create a new whiteboard
   */
  async createWhiteboard(
    notebookId: string,
    data: WhiteboardCreateRequest
  ): Promise<WhiteboardOperationResponse> {
    const response = await apiFetch(`${API_BASE_URL}/${notebookId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Update a whiteboard
   */
  async updateWhiteboard(
    whiteboardId: string,
    data: WhiteboardUpdateRequest
  ): Promise<WhiteboardOperationResponse> {
    const response = await apiFetch(`${API_BASE_URL}/whiteboard/${whiteboardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /**
   * Update just the content of a whiteboard (for auto-save)
   */
  async updateWhiteboardContent(whiteboardId: string, content: any): Promise<{
    status: string;
    message: string;
    data: Whiteboard;
  }> {
    const response = await apiFetch(`${API_BASE_URL}/whiteboard/${whiteboardId}/content`, {
      method: 'PUT',
      body: JSON.stringify(content),
    });
    return response.json();
  },

  /**
   * Delete a whiteboard
   */
  async deleteWhiteboard(whiteboardId: string): Promise<{ status: string; message: string }> {
    const response = await apiFetch(`${API_BASE_URL}/whiteboard/${whiteboardId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  /**
   * Search whiteboards
   */
  async searchWhiteboards(
    notebookId: string,
    searchRequest: WhiteboardSearchRequest
  ): Promise<WhiteboardsListResponse> {
    const response = await apiFetch(`${API_BASE_URL}/${notebookId}/search`, {
      method: 'POST',
      body: JSON.stringify(searchRequest),
    });
    return response.json();
  },

  /**
   * Get whiteboard statistics for a notebook
   */
  async getWhiteboardStatistics(notebookId: string): Promise<{
    status: string;
    message: string;
    data: { total: number };
  }> {
    const response = await apiFetch(`${API_BASE_URL}/${notebookId}/statistics`);
    return response.json();
  },

  // --- Hierarchy Management API Methods ---

  /**
   * Update parent-child relationships between nodes
   */
  async updateNodeHierarchy(
    whiteboardId: string,
    hierarchyUpdate: NodeHierarchyUpdate
  ): Promise<NodeHierarchyResponse> {
    const response = await apiFetch(`${API_BASE_URL}/whiteboard/${whiteboardId}/nodes/hierarchy`, {
      method: 'POST',
      body: JSON.stringify(hierarchyUpdate),
    });
    return response.json();
  },

  /**
   * Create a new node as a child of an existing node
   */
  async createChildNode(
    whiteboardId: string,
    createRequest: CreateChildNodeRequest
  ): Promise<NodeHierarchyResponse> {
    const response = await apiFetch(`${API_BASE_URL}/whiteboard/${whiteboardId}/nodes/children`, {
      method: 'POST',
      body: JSON.stringify(createRequest),
    });
    return response.json();
  },

  /**
   * Validate hierarchy changes to prevent circular references
   */
  async validateHierarchy(
    whiteboardId: string,
    validationRequest: ValidateHierarchyRequest
  ): Promise<HierarchyValidationResponse> {
    const response = await apiFetch(`${API_BASE_URL}/whiteboard/${whiteboardId}/nodes/hierarchy/validate`, {
      method: 'POST',
      body: JSON.stringify(validationRequest),
    });
    return response.json();
  }
};