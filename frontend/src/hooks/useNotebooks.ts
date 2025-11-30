import { useState, useCallback } from 'react';
import {
    NotebookService,
    type NotebookCreate,
    type NotebookResponse,
    type NotebookUpdate,
    type NotebooksListResponse,
    type PaginationMeta
} from '../services/notebooksService';


interface UseNotebooksState {
    notebooks: NotebookResponse[];
    currentNotebook: NotebookResponse | null;
    pagination: PaginationMeta | null; // Add pagination state
    loading: boolean;
    error: string | null;
}

interface UseNotebooksReturn extends UseNotebooksState {
    createNotebook: (data: NotebookCreate) => Promise<NotebookResponse | null>;
    getAllNotebooks: (page?: number, pageSize?: number) => Promise<void>;
    getNotebookById: (id: string) => Promise<NotebookResponse | null>;
    updateNotebook: (id: string, data: NotebookUpdate) => Promise<NotebookResponse | null>;
    deleteNotebook: (id: string) => Promise<boolean>;
    clearError: () => void;
    setCurrentNotebook: (notebook: NotebookResponse | null) => void;
}

export const useNotebooks = (): UseNotebooksReturn => {
    const [state, setState] = useState<UseNotebooksState>({
        notebooks: [],
        currentNotebook: null,
        pagination: null,
        loading: false,
        error: null,
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

    const setCurrentNotebook = useCallback((notebook: NotebookResponse | null) => {
        setState(prev => ({ ...prev, currentNotebook: notebook }));
    }, []);

    const createNotebook = useCallback(async (data: NotebookCreate): Promise<NotebookResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            // Cast to any to handle potential wrapper response { data: ... }
            const response: any = await NotebookService.createNotebook(data);
            const notebook = response.data || response;

            setState(prev => ({
                ...prev,
                currentNotebook: notebook,
                loading: false,
            }));
            return notebook;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create notebook';
            setError(message);
            setLoading(false);
            return null;
        }
    }, []);

    const getAllNotebooks = useCallback(async (page: number = 1, pageSize: number = 19): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response: NotebooksListResponse = await NotebookService.getAllNotebooks(page, pageSize);

            setState(prev => ({
                ...prev,
                notebooks: response.data,
                pagination: response.meta || null,
                loading: false,
            }));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch notebooks';
            setError(message);
            setLoading(false);
        }
    }, []);

    const getNotebookById = useCallback(async (id: string): Promise<NotebookResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            // Cast to any to handle potential wrapper response { data: ... }
            const response: any = await NotebookService.getNotebookById(id);
            const notebook = response.data || response;

            setState(prev => ({
                ...prev,
                currentNotebook: notebook,
                loading: false,
            }));
            return notebook;
        } catch (err) {
            console.error("Error fetching notebook:", err);
            // Don't set global error to avoid blocking UI, just stop loading
            setLoading(false);
            return null;
        }
    }, []);

    const updateNotebook = useCallback(async (
        id: string,
        data: NotebookUpdate
    ): Promise<NotebookResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            // Cast to any to handle potential wrapper response { data: ... }
            const response: any = await NotebookService.updateNotebook(id, data);
            const updated = response.data || response;

            setState(prev => ({
                ...prev,
                notebooks: prev.notebooks.map(nb => nb.id === id ? updated : nb),
                currentNotebook: prev.currentNotebook?.id === id ? updated : prev.currentNotebook,
                loading: false,
            }));
            return updated;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update notebook';
            setError(message);
            setLoading(false);
            return null;
        }
    }, []);

    const deleteNotebook = useCallback(async (id: string): Promise<boolean> => {
        setLoading(true);
        setError(null);
        try {
            await NotebookService.deleteNotebook(id);
            setState(prev => ({
                ...prev,
                notebooks: prev.notebooks.filter(nb => nb.id !== id),
                currentNotebook: prev.currentNotebook?.id === id ? null : prev.currentNotebook,
                loading: false,
            }));
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete notebook';
            setError(message);
            setLoading(false);
            return false;
        }
    }, []);

    return {
        ...state,
        createNotebook,
        getAllNotebooks,
        getNotebookById,
        updateNotebook,
        deleteNotebook,
        clearError,
        setCurrentNotebook,
    };
};