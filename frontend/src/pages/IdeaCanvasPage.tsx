import React, { useState, useEffect, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PropositionService, type PropositionUpdateRequest, type PropositionResponse } from "../services/propositionsService.ts";
import Layout from "../components/layout/Layout";
import { useChats } from "../hooks/useChats";
import { useAuth } from "../contexts/AuthContext";

// --- Helper Component for Inline Editable Fields ---
const EditableSpan: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled: boolean;
    className?: string;
}> = ({ value, onChange, placeholder, disabled, className }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFocus = () => {
        if (disabled) return;
        setIsExpanded(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    const handleBlur = () => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => {
            setIsExpanded(false);
        }, 150);
    };

    const fullValue = value || '';

    return (
        <>
            <textarea
                ref={textareaRef}
                value={fullValue}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`font-semibold text-primary bg-transparent border-b border-dashed border-primary/50 focus:outline-none focus:border-solid focus:border-primary resize-none align-bottom overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'block w-full p-3 border-2 border-primary rounded-lg bg-card/80 shadow-sm mb-3 max-h-48' : 'inline-block min-w-[120px] max-w-[250px] overflow-hidden text-ellipsis whitespace-nowrap'} ${className || ''}`}
                rows={isExpanded ? 6 : 1}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onInput={(e) => {
                    const target = e.currentTarget;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 192)}px`;
                }}
                style={{ minHeight: isExpanded ? '4rem' : '1.5rem' }}
                title={isExpanded ? '' : fullValue}
            />
            {isExpanded && (
                <button
                    type="button"
                    onClick={() => {
                        setIsExpanded(false);
                        textareaRef.current?.blur();
                    }}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-sm"
                >
                    Done
                </button>
            )}
        </>
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
                        {isLoadingCanvas ? (
                            <div className="flex items-center justify-center h-24">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-lg text-foreground leading-relaxed break-words">
                                    My idea is a{" "}
                                    <EditableSpan
                                        value={proposition.service || ''}
                                        onChange={(val) => handleFieldChange('service', val)}
                                        placeholder="product/service"
                                        disabled={isSaving}
                                    />{" "}
                                    for{" "}
                                    <EditableSpan
                                        value={proposition.audience || ''}
                                        onChange={(val) => handleFieldChange('audience', val)}
                                        placeholder="a specific audience"
                                        disabled={isSaving}
                                    />{" "}
                                    that solves{" "}
                                    <EditableSpan
                                        value={proposition.problem || ''}
                                        onChange={(val) => handleFieldChange('problem', val)}
                                        placeholder="a specific problem"
                                        disabled={isSaving}
                                    />{" "}
                                    by{" "}
                                    <EditableSpan
                                        value={proposition.solution || ''}
                                        onChange={(val) => handleFieldChange('solution', val)}
                                        placeholder="a unique solution"
                                        disabled={isSaving}
                                    />.
                                </p>
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
