import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';

import Whiteboard from '../components/whiteboard/Whiteboard';
import Layout from '../components/layout/Layout';
import { whiteboardApi, type Whiteboard as WhiteboardType } from '../api/whiteboardApi';
import { useNotebooks } from '../hooks/useNotebooks';
import { useChats } from '../hooks/useChats';
import { useSse } from '../context/SseContext';

const WhiteboardView: React.FC = () => {
    const { notebookId } = useParams<{ notebookId: string }>();
    const navigate = useNavigate();
    const { currentNotebook } = useNotebooks();
    const { isThreadTyping } = useSse();

    const {
        chatSessions,
        currentChatId,
        loadingChats,
        creatingChat,
        isTyping,
        isAuthenticated,
        user,
        isTemporaryChat,
        createTemporaryChat,
        switchToChat,
        handleDeleteChat,
    } = useChats(notebookId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [whiteboard, setWhiteboard] = useState<WhiteboardType | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);

    // Load whiteboard for this notebook
    const loadWhiteboard = async () => {
        if (!notebookId) return;

        try {
            setLoading(true);
            setError(null);

            // Get whiteboards for this notebook
            const response = await whiteboardApi.getWhiteboards(notebookId, { limit: 1 });

            if (response.whiteboards.length > 0) {
                // Use existing whiteboard
                setWhiteboard(response.whiteboards[0]);
            } else {
                // Create new whiteboard for this notebook
                const createResponse = await whiteboardApi.createWhiteboard(notebookId, {
                    title: `${currentNotebook?.title || 'Untitled'} Whiteboard`,
                    content: {
                        nodes: [],
                        edges: [],
                    }
                });

                if (createResponse.whiteboard) {
                    setWhiteboard(createResponse.whiteboard);
                }
            }
        } catch (err) {
            console.error('Failed to load whiteboard:', err);
            setError(err instanceof Error ? err.message : 'Failed to load whiteboard');
        } finally {
            setLoading(false);
        }
    };

    // Retry loading
    const handleRetry = async () => {
        setIsRetrying(true);
        await loadWhiteboard();
        setIsRetrying(false);
    };

    // Auto-save whiteboard content
    const handleWhiteboardChange = async (content: any) => {
        if (!whiteboard) return;

        try {
            await whiteboardApi.updateWhiteboardContent(whiteboard.id, content);
        } catch (err) {
            console.error('Failed to auto-save whiteboard:', err);
            // Don't show error for auto-save failures to avoid interrupting user experience
        }
    };

    // Load whiteboard on component mount
    useEffect(() => {
        if (notebookId) {
            loadWhiteboard();
        } else {
            setError('No notebook ID provided');
            setLoading(false);
        }
    }, [notebookId]);

    // Check if notebook ID is available
    if (!notebookId) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-center p-4">
                <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Whiteboard Error</h1>
                <p className="text-muted-foreground mb-6 max-w-md">Notebook ID is required to access the whiteboard</p>
                <button
                    onClick={() => navigate('/notebooks')}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                >
                    Back to Notebooks
                </button>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-center p-4">
                <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Loading Whiteboard</h2>
                <p className="text-muted-foreground">Please wait while we set up your whiteboard...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-center p-4">
                <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">Whiteboard Error</h1>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <div className="flex gap-3">
                    <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isRetrying && <RefreshCw className="h-4 w-4 animate-spin" />}
                        Retry
                    </button>
                    <button
                        onClick={() => navigate('/notebooks')}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
                    >
                        Back to Notebooks
                    </button>
                </div>
            </div>
        );
    }

    // Success state - show whiteboard
    return (
        <Layout
            title="Whiteboard"
            notebookId={notebookId}
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            loadingChats={loadingChats}
            creatingChat={creatingChat}
            isTyping={isTyping}
            isAuthenticated={isAuthenticated}
            user={user}
            isTemporaryChat={isTemporaryChat}
            createNewChat={createTemporaryChat}
            createTemporaryChat={createTemporaryChat}
            switchToChat={switchToChat}
            handleDeleteChat={handleDeleteChat}
            isThreadTyping={isThreadTyping}
            forceRegularLayout={true}
        >
            <Whiteboard
                initialContent={whiteboard?.content}
                onContentChange={handleWhiteboardChange}
                whiteboardId={whiteboard?.id}
            />
        </Layout>
    );
};

export default WhiteboardView;