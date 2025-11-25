import { useState, useCallback } from 'react';
import { TasksService, type TaskWithNotebook, type TaskStatus, type TaskPriority } from '../services/tasksService';

interface UseTasksAcrossNotebooksState {
    tasks: TaskWithNotebook[];
    groupedTasks: Record<string, TaskWithNotebook[]>;
    loading: boolean;
    error: string | null;
    totalCount: number;
}

interface UseTasksAcrossNotebooksReturn extends UseTasksAcrossNotebooksState {
    fetchAllTasks: (filters?: {
        status?: TaskStatus;
        priority?: TaskPriority;
        tags?: string[];
        notebookId?: string;
        includeArchived?: boolean;
    }) => Promise<void>;
    refreshTasks: () => Promise<void>;
    clearError: () => void;
    updateTaskInState: (taskId: string, updatedTask: TaskWithNotebook) => void;
    removeTaskFromState: (taskId: string) => void;
    getTasksByNotebook: (notebookId: string) => TaskWithNotebook[];
    getNotebookStats: (notebookId: string) => { total: number; completed: number; inProgress: number; todo: number };
}

export const useTasksAcrossNotebooks = (): UseTasksAcrossNotebooksReturn => {
    const [state, setState] = useState<UseTasksAcrossNotebooksState>({
        tasks: [],
        groupedTasks: {},
        loading: false,
        error: null,
        totalCount: 0,
    });

    const setLoading = (loading: boolean) => {
        setState(prev => ({ ...prev, loading }));
    };

    const setError = (error: string | null) => {
        setState(prev => ({ ...prev, error }));
    };

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const groupTasksByNotebook = useCallback((tasks: TaskWithNotebook[]) => {
        const grouped = tasks.reduce((acc, task) => {
            if (!task.notebook?.id) return acc;
            const notebookId = task.notebook.id;
            if (!acc[notebookId]) {
                acc[notebookId] = [];
            }
            acc[notebookId].push(task);
            return acc;
        }, {} as Record<string, TaskWithNotebook[]>);

        // Sort tasks within each notebook by status and position
        Object.keys(grouped).forEach(notebookId => {
            grouped[notebookId].sort((a, b) => {
                const statusOrder = { 'todo': 0, 'in-progress': 1, 'review': 2, 'done': 3 };
                const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder];
                const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder];

                if (aStatusOrder !== bStatusOrder) {
                    return aStatusOrder - bStatusOrder;
                }

                return (a.position || 0) - (b.position || 0);
            });
        });

        return grouped;
    }, []);

    const fetchAllTasks = useCallback(async (filters?: {
        status?: TaskStatus;
        priority?: TaskPriority;
        tags?: string[];
        notebookId?: string;
        includeArchived?: boolean;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const response = await TasksService.getAllTasks({
                ...filters,
                limit: 1000, // Increased limit for comprehensive view
            });

            const grouped = groupTasksByNotebook(response.tasks);

            setState(prev => ({
                ...prev,
                tasks: response.tasks,
                groupedTasks: grouped,
                totalCount: response.total_count,
                loading: false,
            }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch tasks';
            setError(message);
            setLoading(false);
        }
    }, [groupTasksByNotebook]);

    const refreshTasks = useCallback(async () => {
        await fetchAllTasks();
    }, [fetchAllTasks]);

    const updateTaskInState = useCallback((taskId: string, updatedTask: TaskWithNotebook) => {
        setState(prev => {
            const newTasks = prev.tasks.map(task =>
                task.id === taskId ? updatedTask : task
            );
            const newGrouped = groupTasksByNotebook(newTasks);

            return {
                ...prev,
                tasks: newTasks,
                groupedTasks: newGrouped,
            };
        });
    }, [groupTasksByNotebook]);

    const removeTaskFromState = useCallback((taskId: string) => {
        setState(prev => {
            const newTasks = prev.tasks.filter(task => task.id !== taskId);
            const newGrouped = groupTasksByNotebook(newTasks);

            return {
                ...prev,
                tasks: newTasks,
                groupedTasks: newGrouped,
                totalCount: prev.totalCount - 1,
            };
        });
    }, [groupTasksByNotebook]);

    const getTasksByNotebook = useCallback((notebookId: string) => {
        return state.groupedTasks[notebookId] || [];
    }, [state.groupedTasks]);

    const getNotebookStats = useCallback((notebookId: string) => {
        const tasks = getTasksByNotebook(notebookId);

        return {
            total: tasks.length,
            completed: tasks.filter(task => task.status === 'done').length,
            inProgress: tasks.filter(task => task.status === 'in-progress').length,
            todo: tasks.filter(task => task.status === 'todo').length,
        };
    }, [getTasksByNotebook]);

    return {
        ...state,
        fetchAllTasks,
        refreshTasks,
        clearError,
        updateTaskInState,
        removeTaskFromState,
        getTasksByNotebook,
        getNotebookStats,
    };
};