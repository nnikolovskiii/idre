import {API_CONFIG} from "./api.ts";

// --- INTERFACES ---

// 1. Create a plain JavaScript object with `as const`
// `as const` tells TypeScript to infer the most specific types possible (e.g., "todo" instead of string)
export const TaskStatus = {
    TODO: "todo",
    IN_PROGRESS: "in-progress",
    REVIEW: "review",
    DONE: "done"
} as const;

// 2. Create a type from the values of the object
// This is your erasable type for annotations
export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export const TaskPriority = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high"
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];
/**
 * Base task interface with common fields
 */
export interface TaskBase {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    due_date?: string; // ISO date string
    position?: number;
    archived?: boolean;
}

/**
 * Task creation request interface
 */
export interface TaskCreateRequest extends TaskBase {
    title: string; // Required for creation
}

/**
 * Task update request interface
 */
export type TaskUpdateRequest = TaskBase; // All fields are optional for partial updates

/**
 * Task move request interface
 */
export interface TaskMoveRequest {
    status: TaskStatus;
    position?: number;
}

/**
 * Task reorder request interface
 */
export interface TaskReorderRequest {
    position: number;
}

/**
 * Task search request interface
 */
export interface TaskSearchRequest {
    query?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    has_due_date?: boolean;
    is_overdue?: boolean;
    limit?: number;
    offset?: number;
}

/**
 * Complete task response interface
 */
export interface TaskResponse extends TaskBase {
    id: string;
    user_id: string;
    notebook_id: string;
    created_at: string;
    updated_at: string;
    status_display?: string;
    priority_display?: string;
    is_overdue?: boolean;
}

/**
 * Alias for TaskResponse - the main Task interface used throughout the app
 */
export interface Task extends TaskResponse {}

/**
 * Task archive request interface
 */
export interface TaskArchiveRequest {}

/**
 * Task operation response interface
 */
export interface TaskOperationResponse {
    status: string;
    message: string;
    task?: TaskResponse;
}

/**
 * Tasks list response interface
 */
export interface TasksListResponse {
    tasks: TaskResponse[];
    total_count: number;
    status: string;
    message: string;
}

/**
 * Task operation response interface
 */
export interface TaskOperationResponse {
    status: string;
    message: string;
    task?: TaskResponse;
}

/**
 * SSE connection message interface
 */
export interface SSEConnectionMessage {
    type: 'connected';
    message: string;
}

/**
 * Task statistics response interface
 */
export interface TaskStatisticsResponse {
    status: string;
    message: string;
    data: {
        [key: string]: number; // status counts + total
    };
}

// --- API CONFIG ---
const API_BASE_URL = API_CONFIG.URL + "/tasks";

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

// --- TASKS SERVICE ---

export const TasksService = {
    /**
     * Retrieves all tasks for a specific notebook with optional filtering.
     * Corresponds to: GET /tasks/{notebook_id}
     * @param notebookId The UUID of the parent notebook.
     * @param filters Optional filters (status, priority, tags, etc.)
     */
    async getTasksByNotebookId(
        notebookId: string,
        filters?: {
            status?: TaskStatus;
            priority?: TaskPriority;
            tags?: string[];
            limit?: number;
            offset?: number;
            includeArchived?: boolean;
        }
    ): Promise<TasksListResponse> {
        const params = new URLSearchParams();

        if (filters?.status) params.append('status', filters.status);
        if (filters?.priority) params.append('priority', filters.priority);
        if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
        if (filters?.limit) params.append('limit', filters.limit.toString());
        if (filters?.offset) params.append('offset', filters.offset.toString());
        if (filters?.includeArchived) params.append('include_archived', 'true');

        const url = params.toString() ? `${API_BASE_URL}/${notebookId}?${params}` : `${API_BASE_URL}/${notebookId}`;
        const response = await apiFetch(url);
        return response.json();
    },

    /**
     * Creates a new task in a notebook.
     * Corresponds to: POST /tasks/{notebook_id}
     * @param notebookId The UUID of the parent notebook.
     * @param taskData The task data to create.
     */
    async createTask(notebookId: string, taskData: TaskCreateRequest): Promise<TaskOperationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/${notebookId}`, {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
        return response.json();
    },

    /**
     * Retrieves a single task by ID.
     * Corresponds to: GET /tasks/task/{task_id}
     * @param taskId The UUID of the task.
     */
    async getTaskById(taskId: string): Promise<{ status: string; message: string; data: TaskResponse }> {
        const response = await apiFetch(`${API_BASE_URL}/task/${taskId}`);
        return response.json();
    },

    /**
     * Updates an existing task.
     * Corresponds to: PUT /tasks/task/{task_id}
     * @param taskId The UUID of the task to update.
     * @param taskData The task data to update.
     */
    async updateTask(taskId: string, taskData: TaskUpdateRequest): Promise<TaskOperationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/task/${taskId}`, {
            method: 'PUT',
            body: JSON.stringify(taskData),
        });
        return response.json();
    },

    /**
     * Moves a task to a different column/status.
     * Corresponds to: PUT /tasks/task/{task_id}/move
     * @param taskId The UUID of the task to move.
     * @param moveData The move operation data.
     */
    async moveTask(taskId: string, moveData: TaskMoveRequest): Promise<TaskOperationResponse> {
        console.log('TasksService.moveTask called:', { taskId, moveData });
        const url = `${API_BASE_URL}/task/${taskId}/move`;
        console.log('Making request to:', url);

        try {
            const response = await apiFetch(url, {
                method: 'PUT',
                body: JSON.stringify(moveData),
            });
            console.log('API response status:', response.status);
            const result = await response.json();
            console.log('API response data:', result);
            return result;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    },

    /**
     * Reorders a task within its current column.
     * Corresponds to: PUT /tasks/task/{task_id}/reorder
     * @param taskId The UUID of the task to reorder.
     * @param reorderData The reorder operation data.
     */
    async reorderTask(taskId: string, reorderData: TaskReorderRequest): Promise<TaskOperationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/task/${taskId}/reorder`, {
            method: 'PUT',
            body: JSON.stringify(reorderData),
        });
        return response.json();
    },

    /**
     * Deletes a task.
     * Corresponds to: DELETE /tasks/task/{task_id}
     * @param taskId The UUID of the task to delete.
     */
    async deleteTask(taskId: string): Promise<{ status: string; message: string }> {
        const response = await apiFetch(`${API_BASE_URL}/task/${taskId}`, {
            method: 'DELETE',
        });
        return response.json();
    },

    /**
     * Archives a task.
     * Corresponds to: PUT /tasks/task/{task_id}/archive
     * @param taskId The UUID of the task to archive.
     */
    async archiveTask(taskId: string): Promise<TaskOperationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/task/${taskId}/archive`, {
            method: 'PUT',
            body: JSON.stringify({}),
        });
        return response.json();
    },

    /**
     * Unarchives a task.
     * Corresponds to: PUT /tasks/task/{task_id}/unarchive
     * @param taskId The UUID of the task to unarchive.
     */
    async unarchiveTask(taskId: string): Promise<TaskOperationResponse> {
        const response = await apiFetch(`${API_BASE_URL}/task/${taskId}/unarchive`, {
            method: 'PUT',
            body: JSON.stringify({}),
        });
        return response.json();
    },

    /**
     * Searches tasks with advanced filtering.
     * Corresponds to: POST /tasks/{notebook_id}/search
     * @param notebookId The UUID of the parent notebook.
     * @param searchData The search criteria.
     */
    async searchTasks(notebookId: string, searchData: TaskSearchRequest): Promise<TasksListResponse> {
        const response = await apiFetch(`${API_BASE_URL}/${notebookId}/search`, {
            method: 'POST',
            body: JSON.stringify(searchData),
        });
        return response.json();
    },

    /**
     * Gets task statistics for a notebook.
     * Corresponds to: GET /tasks/{notebook_id}/statistics
     * @param notebookId The UUID of the parent notebook.
     */
    async getTaskStatistics(notebookId: string): Promise<TaskStatisticsResponse> {
        const response = await apiFetch(`${API_BASE_URL}/${notebookId}/statistics`);
        return response.json();
    },

    /**
     * Creates a Server-Sent Events connection for real-time task updates.
     * Corresponds to: GET /tasks/{notebook_id}/sse
     * @param notebookId The UUID of the parent notebook.
     * @param onMessage Callback function for handling SSE messages.
     * @param onError Callback function for handling SSE errors.
     */
    connectToTaskUpdates(
        notebookId: string,
        onMessage: (data: TaskResponse | TaskOperationResponse | SSEConnectionMessage) => void,
        onError?: (error: Event) => void
    ): EventSource {
        const eventSource = new EventSource(
            `${API_BASE_URL}/${notebookId}/sse`,
            { withCredentials: true }
        );

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('Error parsing SSE message:', error);
            }
        };

        if (onError) {
            eventSource.onerror = onError;
        }

        return eventSource;
    }
};

// --- UTILITY FUNCTIONS ---

/**
 * Converts a TaskResponse to a format compatible with the frontend Task interface
 */
export const convertTaskResponse = (taskResponse: TaskResponse) => {
    return {
        id: taskResponse.id,
        title: taskResponse.title || 'Untitled Task',
        description: taskResponse.description,
        status: taskResponse.status as TaskStatus,
        priority: taskResponse.priority as TaskPriority,
        tags: taskResponse.tags || [],
        dueDate: taskResponse.due_date,
        position: taskResponse.position || 0,
        createdAt: taskResponse.created_at,
        updatedAt: taskResponse.updated_at,
        statusDisplay: taskResponse.status_display,
        priorityDisplay: taskResponse.priority_display,
        isOverdue: taskResponse.is_overdue,
        archived: taskResponse.archived || false
    };
};

/**
 * Converts frontend task data to TaskCreateRequest format
 */
export const convertToCreateRequest = (task: Partial<TaskBase> & { title: string }): TaskCreateRequest => {
    return {
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        tags: task.tags || [],
        due_date: task.due_date,
        position: task.position || 0
    };
};

/**
 * Converts frontend task data to TaskUpdateRequest format
 */
export const convertToUpdateRequest = (task: Partial<TaskBase>): TaskUpdateRequest => {
    return {
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        priority: task.priority as TaskPriority,
        tags: task.tags || [],
        due_date: task.due_date,
        position: task.position || 0
    };
};