import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChats } from "../../hooks/useChats.ts";
import MessagesContainer from "../chat/MessagesContainer.tsx";
import { fileService } from "../../services/filesService.ts";
import ChatInputArea from "../chat/ChatInputArea.tsx";
import idreLogo from "../../assets/idre_logo_v2_white.png";
import idreWhiteLogo from "../../assets/idre_logo_v2_black.png";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSse } from "../../context/SseContext.tsx";

// --- Import the Proposition Service and BOTH Types ---
import { PropositionService, type PropositionUpdateRequest, type PropositionResponse } from "../../services/propositionsService.ts";

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
        // Auto-focus and scroll to bottom if needed
        setTimeout(() => {
            textareaRef.current?.focus();
            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    const handleBlur = () => {
        if (disabled) return;
        timeoutRef.current = setTimeout(() => {
            setIsExpanded(false);
        }, 150); // Slight delay to allow clicking between fields
    };

    const displayText = value || placeholder;
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
                    target.style.height = `${Math.min(target.scrollHeight, 192)}px`; // Cap at ~192px (6 rows * ~32px)
                }}
                style={{ minHeight: isExpanded ? '4rem' : '1.5rem' }}
                title={isExpanded ? '' : fullValue} // Tooltip for full text when collapsed
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


type IdeaCanvasViewProps = {
    notebookId?: string;
};

const IdeaCanvasView: React.FC<IdeaCanvasViewProps> = ({ notebookId: propNotebookId }) => {
    const { notebookId: paramNotebookId } = useParams<{ notebookId: string }>();
    const currentNotebookId = propNotebookId || paramNotebookId;
    const navigate = useNavigate();

    // --- SSE Hook for real-time proposition updates ---
    const { latestPropositionEvent, connectToProposition } = useSse();

    // --- State for the Idea Canvas ---
    const [proposition, setProposition] = useState<PropositionUpdateRequest>({});
    const [isLoadingCanvas, setIsLoadingCanvas] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const isInitialMount = useRef(true); // To prevent saving on initial fetch

    // --- Chat-related hooks (unchanged) ---
    const {
        currentChat,
        currentChatId,
        loadingMessages,
        loadingModels,
        creatingChat,
        isTyping,
        isTemporaryChat,
        currentChatModels,
        handleSendMessage,
        handleDeleteMessage,
    } = useChats(currentNotebookId);


    // --- Fetch Proposition Data on Mount ---
    useEffect(() => {
        if (!currentNotebookId) return;

        const fetchProposition = async () => {
            setIsLoadingCanvas(true);
            setError(null);
            try {
                const response: PropositionResponse = await PropositionService.getPropositionByNotebookId(currentNotebookId);
                console.log("proposition", response);

                // --- FIX: Transform the API response to match the state's type ---
                // The API response can have `null` values, but our state expects `undefined` for optional fields.
                // The nullish coalescing operator (`??`) handles this transformation gracefully.
                const initialState: PropositionUpdateRequest = {
                    service: response.service ?? undefined,
                    audience: response.audience ?? undefined,
                    problem: response.problem ?? undefined,
                    solution: response.solution ?? undefined,
                };

                setProposition(initialState);

            } catch (err: any) {
                // If it's a 404, it just means no proposition exists yet, which is not an error.
                if (err.message.includes("404") || err.message.toLowerCase().includes("not found")) {
                    setProposition({}); // Start with a blank slate, a valid PropositionUpdateRequest
                } else {
                    setError("Failed to load idea canvas. Please try again.");
                    console.error(err);
                }
            } finally {
                setIsLoadingCanvas(false);
                // After the first successful fetch, subsequent changes are user-driven
                setTimeout(() => { isInitialMount.current = false; }, 100);
            }
        };

        fetchProposition();
    }, [currentNotebookId]);

    // --- Connect to SSE for real-time proposition updates ---
    useEffect(() => {
        if (currentNotebookId) {
            connectToProposition(currentNotebookId);
        }
    }, [currentNotebookId, connectToProposition]);

    // --- Handle SSE proposition updates ---
    useEffect(() => {
        if (!latestPropositionEvent || !currentNotebookId) {
            return;
        }

        console.log('IdeaCanvasView received proposition event:', latestPropositionEvent);

        if (latestPropositionEvent.event === 'proposition_update') {
            const updatedProposition = latestPropositionEvent.data?.proposition;
            if (updatedProposition && latestPropositionEvent.data?.notebook_id === currentNotebookId) {
                // Update the proposition state with the new data from SSE
                setProposition({
                    service: updatedProposition.service ?? undefined,
                    audience: updatedProposition.audience ?? undefined,
                    problem: updatedProposition.problem ?? undefined,
                    solution: updatedProposition.solution ?? undefined,
                });
                setIsProcessing(false);
                setError(null);
                console.log('Proposition updated via SSE:', updatedProposition);
            }
        } else if (latestPropositionEvent.event === 'error') {
            console.error('SSE error event:', latestPropositionEvent.data.error);
            setError('Failed to process proposition update.');
            setIsProcessing(false);
        }
    }, [latestPropositionEvent, currentNotebookId]);


    // --- Debounced Auto-Save on Proposition Change ---
    useEffect(() => {
        if (isInitialMount.current || !currentNotebookId) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(async () => {
            setIsSaving(true);
            try {
                await PropositionService.upsertPropositionForNotebook(currentNotebookId, proposition);
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
    }, [proposition, currentNotebookId]);


    const handleFieldChange = (field: keyof PropositionUpdateRequest, value: string) => {
        setProposition(prev => ({ ...prev, [field]: value }));
    };

    // --- Dynamic Idea Template Component ---
    const ideaTemplate = (
        <div className="w-1/2 h-full flex items-center justify-center p-8 bg-background">
            <div className="max-w-2xl w-full">
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
                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground flex items-center gap-2">
                        {isLoadingCanvas ? (
                            <>
                                <Loader2 className="animate-spin" size={12} />
                                <span>Loading...</span>
                            </>
                        ) : isProcessing ? (
                            <>
                                <Loader2 className="animate-spin" size={12} />
                                <span>Processing...</span>
                            </>
                        ) : isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={12} />
                                <span>Saving...</span>
                            </>
                        ) : error ? (
                            <span className="text-destructive">{error}</span>
                        ) : (
                            <span>Saved</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Chat Logic with sub_mode for Idea Canvas ---
    const handleTextSubmit = async (text: string, options: { webSearch: boolean, mode: string }) => {
        setIsProcessing(true); // Set processing state when sending message
        await handleSendMessage(text, undefined, { ...options, subMode: "idea_proposition" });
    };

    const handleFileSubmit = async (file: File, options: { webSearch: boolean, mode: string }) => {
        try {
            const uploadResult = await fileService.uploadFile(file, undefined, false);
            const fileMessage = `[File Uploaded: ${file.name}]`;
            await handleSendMessage(fileMessage, uploadResult.url, { ...options, subMode: "idea_proposition" });
        } catch (error) {
            console.error("Failed to upload file:", error);
            const errorMessage = `[Error] Failed to upload file: ${file.name}`;
            await handleSendMessage(errorMessage, undefined, { ...options, subMode: "idea_proposition" });
        }
    };

    const inputArea = (
        <ChatInputArea
            onTextSubmit={handleTextSubmit}
            onFileSubmit={handleFileSubmit}
            disabled={!currentChatId || creatingChat || isTyping}
            hasModelsConfigured={true}
            loadingMessages={loadingMessages}
            loadingModels={loadingModels}
            onModelsRequired={() => {}}
            models={currentChatModels}
            initialWebSearchEnabled={currentChat?.web_search}
            chatId={currentChatId}
        />
    );

    const children = (
        <div className="flex h-full w-full">
            <div className="w-1/2 h-full border-r border-sidebar-border flex flex-col">
                {isTemporaryChat ? (
                    <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto p-4">
                        <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
                            <img src={idreLogo} alt="Logo" className="w-60 h-auto dark:hidden" />
                            <img src={idreWhiteLogo} alt="Logo" className="w-60 h-auto hidden dark:block" />
                            {inputArea}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto">
                            <MessagesContainer
                                messages={currentChat?.messages || []}
                                isTyping={isTyping}
                                loadingMessages={loadingMessages}
                                onDeleteMessage={handleDeleteMessage}
                            />
                        </div>
                        <div className="flex-shrink-0">{inputArea}</div>
                    </>
                )}
            </div>
            {ideaTemplate}
        </div>
    );

    return (
        <div className="h-dvh w-screen flex bg-background text-foreground overflow-hidden relative">
            <button
                onClick={() => navigate(`/chat/${currentNotebookId}`)}
                className="absolute top-6 right-6 z-50 flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-2xl hover:shadow-blue-500/25 ring-2 ring-blue-500/50 hover:ring-blue-500/75 transform hover:scale-105 active:scale-95"
            >
                <span>Next</span>
                <ArrowRight size={20} />
            </button>
            {children}
        </div>
    );
};

export default IdeaCanvasView;
