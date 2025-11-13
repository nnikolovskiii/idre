import React, { useState, useEffect, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PropositionService, type PropositionUpdateRequest, type PropositionResponse } from "../services/propositionsService.ts";
import Layout from "../components/layout/Layout";
import { useChats } from "../hooks/useChats";
import { useAuth } from "../contexts/AuthContext";

const EditableSpan: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled: boolean;
    className?: string;
    fullWidth?: boolean;          // NEW – force block mode
}> = ({ value, onChange, placeholder, disabled, className, fullWidth = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFocus = () => {
        if (disabled) return;
        setIsExpanded(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(
                textareaRef.current.value.length,
                textareaRef.current.value.length
            );
        }, 60);
    };

    const handleBlur = () => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => setIsExpanded(false), 150);
    };

    const content = value || '';

    return (
        <span className={`relative ${fullWidth ? 'block w-full' : 'inline-block'}`}>
      <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={isExpanded ? 8 : 3}
          className={`
          font-semibold text-primary bg-transparent
          border-b border-dashed border-primary/50
          focus:outline-none focus:border-solid focus:border-primary
          resize-none align-text-top rounded transition-all duration-300 ease-in-out
          ${isExpanded
              ? 'block w-full p-3 border-2 border-primary bg-card/80 shadow-sm mb-3 max-h-64'
              : `${fullWidth ? 'block w-full' : 'inline-block min-w-[150px] max-w-[450px]'}
               max-h-24 overflow-y-auto leading-relaxed px-2 py-1`
          }
          ${className ?? ''}
        `}
          onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, isExpanded ? 256 : 96)}px`;
          }}
          style={{ minHeight: isExpanded ? '6rem' : '2.5rem' }}
          title={isExpanded ? '' : content}
      />
            {isExpanded && (
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()} // keep focus on textarea
                    onClick={() => {
                        setIsExpanded(false);
                        textareaRef.current?.blur();
                    }}
                    className="absolute top-2 right-2 text-xs text-muted-foreground
                     hover:text-foreground bg-card/80 px-2 py-0.5 rounded"
                >
                    Done
                </button>
            )}
    </span>
    );
};

const IdeaCanvasPage: React.FC = () => {
    const { notebookId } = useParams<{ notebookId?: string }>();
    const { user, isAuthenticated } = useAuth();

    const [proposition, setProposition] = useState<PropositionUpdateRequest>({});
    const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const isInitialMount = useRef(true);

    const {
        chatSessions,
        currentChatId,
        loadingChats,
        creatingChat,
        isTyping,
        createNewChat,
        switchToChat,
        handleDeleteChat,
    } = useChats(notebookId);

    // --- Fetch Proposition Data on Mount ---
    useEffect(() => {
        if (!notebookId) return;

        const fetchProposition = async () => {
            setIsLoadingCanvas(true);
            setError(null);
            try {
                const response: PropositionResponse = await PropositionService.getPropositionByNotebookId(notebookId);
                
                const initialState: PropositionUpdateRequest = {
                    service: response.service ?? undefined,
                    audience: response.audience ?? undefined,
                    problem: response.problem ?? undefined,
                    solution: response.solution ?? undefined,
                };

                setProposition(initialState);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                if (errorMessage.includes("404") || errorMessage.toLowerCase().includes("not found")) {
                    setProposition({});
                } else {
                    setError("Failed to load idea canvas. Please try again.");
                    console.error(err);
                }
            } finally {
                setIsLoadingCanvas(false);
                setTimeout(() => { isInitialMount.current = false; }, 100);
            }
        };

        fetchProposition();
    }, [notebookId]);

    // --- Debounced Auto-Save on Proposition Change ---
    useEffect(() => {
        if (isInitialMount.current || !notebookId) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(async () => {
            setIsSaving(true);
            try {
                await PropositionService.upsertPropositionForNotebook(notebookId, proposition);
                setError(null);
            } catch (err) {
                console.error("Failed to save proposition:", err);
                setError("Failed to save changes.");
            } finally {
                setIsSaving(false);
            }
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [proposition, notebookId]);

    const handleFieldChange = (field: keyof PropositionUpdateRequest, value: string) => {
        setProposition(prev => ({ ...prev, [field]: value }));
    };

    if (!notebookId) {
        return <Navigate to="/notebooks" replace />;
    }

    return (
        <Layout
            chatSessions={chatSessions}
            currentChatId={currentChatId}
            loadingChats={loadingChats}
            creatingChat={creatingChat}
            isTyping={isTyping}
            isAuthenticated={isAuthenticated}
            user={user}
            notebookId={notebookId}
            title="Idea Canvas"
            createNewChat={createNewChat}
            switchToChat={switchToChat}
            handleDeleteChat={handleDeleteChat}
        >
            <div className="flex items-center justify-center h-full p-8">
                <div className="max-w-3xl w-full">
                    <div className="bg-card border border-sidebar-border rounded-lg p-8 shadow-lg relative">
                        <h2 className="text-2xl font-bold text-foreground mb-6">Idea Canvas</h2>
                        {/* --------------  IDEA CANVAS BODY  -------------- */}
                        {isLoadingCanvas ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <div className="space-y-6 text-lg text-foreground">
                                {/* ----  SERVICE  ---- */}
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">My idea is a</p>
                                    <EditableSpan
                                        fullWidth
                                        value={proposition.service || ''}
                                        onChange={(v) => handleFieldChange('service', v)}
                                        placeholder="product or service (e.g. AI note-taking app)"
                                        disabled={isSaving}
                                    />
                                </div>

                                {/* ----  AUDIENCE  ---- */}
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">for</p>
                                    <EditableSpan
                                        fullWidth
                                        value={proposition.audience || ''}
                                        onChange={(v) => handleFieldChange('audience', v)}
                                        placeholder="target audience (e.g. busy university students)"
                                        disabled={isSaving}
                                    />
                                </div>

                                {/* ----  PROBLEM  ---- */}
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">that solves</p>
                                    <EditableSpan
                                        fullWidth
                                        value={proposition.problem || ''}
                                        onChange={(v) => handleFieldChange('problem', v)}
                                        placeholder="specific problem (e.g. forgetting lecture material)"
                                        disabled={isSaving}
                                    />
                                </div>

                                {/* ----  SOLUTION  ---- */}
                                <div className="space-y-1">
                                    <p className="font-medium text-muted-foreground">by</p>
                                    <EditableSpan
                                        fullWidth
                                        value={proposition.solution || ''}
                                        onChange={(v) => handleFieldChange('solution', v)}
                                        placeholder="unique solution (e.g. real-time transcription & flash-cards)"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
                            {isLoadingCanvas ? "Loading..." : isSaving ? "Saving..." : error ? <span className="text-destructive">{error}</span> : "Saved"}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default IdeaCanvasPage;
