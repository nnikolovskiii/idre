import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useChats } from "../../hooks/useChats.ts";
import MessagesContainer from "../chat/MessagesContainer.tsx";
import { fileService } from "../../services/filesService.ts";
import ChatInputArea from "../chat/ChatInputArea.tsx";
import idreLogo from "../../assets/idre_logo_v2_white.png";
import idreWhiteLogo from "../../assets/idre_logo_v2_black.png";
import { ArrowRight, Loader2, MessageSquare, NotebookText } from "lucide-react";
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
    fullWidth?: boolean; // New prop for vertical layout
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
                className={`font-semibold bg-transparent border-b border-dashed border-primary/50 focus:outline-none focus:border-solid focus:border-primary resize-none align-text-top overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded
                        ? 'block w-full p-3 border-2 border-primary rounded-lg bg-card/80 shadow-sm mb-3 max-h-64'
                        : `${fullWidth ? 'block w-full' : 'inline-block min-w-[150px] max-w-[450px]'} max-h-24 overflow-y-auto leading-relaxed rounded px-2 py-1`
                } ${className || ''}`}
                rows={isExpanded ? 8 : 3}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onInput={(e) => {
                    const target = e.currentTarget;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, isExpanded ? 256 : 96)}px`; // Cap at 256px expanded, 96px collapsed
                }}
                style={{ minHeight: isExpanded ? '6rem' : '2.5rem' }}
                title={isExpanded ? '' : fullValue}
            />
            {isExpanded && (
                <button
                    type="button"
                    onClick={() => {
                        setIsExpanded(false);
                        textareaRef.current?.blur();
                    }}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-sm bg-card/80 px-2 py-1 rounded"
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

    // --- State for mobile view toggle ---
    const [mobileView, setMobileView] = useState<'chat' | 'canvas'>('chat');

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

                const initialState: PropositionUpdateRequest = {
                    what: response.what ?? undefined,
                    why: response.why ?? undefined,
                };

                setProposition(initialState);

            } catch (err: any) {
                if (err.message.includes("404") || err.message.toLowerCase().includes("not found")) {
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
                setProposition({
                    what: updatedProposition.what ?? undefined,
                    why: updatedProposition.why ?? undefined,
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
        <div className="w-full h-full flex items-center justify-center p-4 md:p-8 bg-background overflow-y-auto">
            <div className="max-w-3xl w-full">
                <div className="bg-card border border-sidebar-border rounded-lg p-6 md:p-8 shadow-lg relative">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Idea Canvas</h2>
                    {isLoadingCanvas ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <p className="text-lg text-muted-foreground font-medium">What is your idea?</p>
                                <EditableSpan
                                    value={proposition.what || ''}
                                    onChange={(val) => handleFieldChange('what', val)}
                                    placeholder="Describe your idea and what problem it solves (e.g., An AI note-taking app that helps students capture and review lecture material)"
                                    disabled={isSaving}
                                    fullWidth={true}
                                />
                            </div>

                            <div className="space-y-3">
                                <p className="text-lg text-muted-foreground font-medium">Why does it matter?</p>
                                <EditableSpan
                                    value={proposition.why || ''}
                                    onChange={(val) => handleFieldChange('why', val)}
                                    placeholder="Explain why this is important and who it helps (e.g., Students struggle with retaining information from lectures, leading to poorer grades and increased stress)"
                                    disabled={isSaving}
                                    fullWidth={true}
                                />
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-4 right-4 text-xs text-muted-foreground flex items-center gap-2">
                        {isLoadingCanvas ? (
                            <><Loader2 className="animate-spin" size={12} /><span>Loading...</span></>
                        ) : isProcessing ? (
                            <><Loader2 className="animate-spin" size={12} /><span>Processing...</span></>
                        ) : isSaving ? (
                            <><Loader2 className="animate-spin" size={12} /><span>Saving...</span></>
                        ) : error ? (
                            <span className="text-destructive">{error}</span>
                        ) : (
                            <span className="text-success">Saved</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Chat Logic with sub_mode for Idea Canvas ---
    const handleTextSubmit = async (text: string, options: { webSearch: boolean, mode: string }) => {
        setIsProcessing(true);
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

    return (
        <div className="h-dvh w-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden relative pb-16 md:pb-0">
            <button
                onClick={() => navigate(`/chat/${currentNotebookId}`)}
                className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 md:px-8 md:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-2xl hover:shadow-blue-500/25 ring-2 ring-blue-500/50 hover:ring-blue-500/75 transform hover:scale-105 active:scale-95"
            >
                <span className="hidden sm:inline">Next</span>
                <ArrowRight size={20} />
            </button>

            {/* Chat Panel */}
            <div className={`w-full md:w-1/2 h-full md:border-r border-sidebar-border flex-col ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
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

            {/* Canvas Panel */}
            <div className={`w-full md:w-1/2 h-full ${mobileView === 'canvas' ? 'flex' : 'hidden'} md:flex`}>
                {ideaTemplate}
            </div>

            {/* Mobile View Toggle */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 flex items-center justify-around gap-2 md:hidden z-20">
                <button
                    onClick={() => setMobileView('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 text-center py-2 px-4 rounded-md transition-colors text-sm font-medium ${mobileView === 'chat' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                    <MessageSquare size={16} />
                    Chat
                </button>
                <button
                    onClick={() => setMobileView('canvas')}
                    className={`flex-1 flex items-center justify-center gap-2 text-center py-2 px-4 rounded-md transition-colors text-sm font-medium ${mobileView === 'canvas' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                >
                    <NotebookText size={16} />
                    Canvas
                </button>
            </div>
        </div>
    );
};

export default IdeaCanvasView;