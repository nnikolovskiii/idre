import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, SlidersHorizontal, ArrowUp, ChevronDown, Mic, Square } from "lucide-react";
import type { ChatModel } from '../../services/chatModelService';
import { SettingsPopover } from "./SettingsPopover.tsx";
import { useClickOutside } from "../../hooks/useClickOutside.ts";
import { useChatMode } from "../../hooks/useChatMode.ts";
import { chatsService } from "../../services/chatsService.ts";
import BrainstormSuggestions from "./BrainstormSuggestions.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type ChatMode = "brainstorm" | "consult" | "analyser" | "questioner";

const chatModes: { value: ChatMode; label: string; description?: string }[] = [
    { value: "brainstorm", label: "Brainstorm", description: "Generate creative ideas" },
    { value: "consult", label: "Consult", description: "Get expert advice" },
    { value: "analyser", label: "Analyse", description: "Analyze information" },
    { value: "questioner", label: "Questioner", description: "Ask clarifying questions" },
];

interface ChatInputAreaProps {
    onTextSubmit: (text: string, options: { webSearch: boolean; mode: ChatMode }) => Promise<void>;
    onFileSubmit: (file: File, options: { webSearch: boolean; mode: ChatMode }) => Promise<void>;
    onAudioSubmit?: (blob: Blob, options: { webSearch: boolean; mode: ChatMode }) => Promise<void>; // Made Optional
    disabled?: boolean;
    hasModelsConfigured?: boolean;
    loadingMessages?: boolean;
    loadingModels?: boolean;
    onModelsRequired?: () => void;
    models: Record<string, ChatModel>;
    chatId: string | null;
    initialWebSearchEnabled?: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
                                                         onTextSubmit,
                                                         onFileSubmit,
                                                         onAudioSubmit,
                                                         disabled = false,
                                                         hasModelsConfigured = false,
                                                         onModelsRequired,
                                                         chatId,
                                                         initialWebSearchEnabled = false,
                                                     }) => {
    const [textInput, setTextInput] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false); // Recording state

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const [webSearchEnabled, setWebSearchEnabled] = useState(initialWebSearchEnabled);
    const [isUpdatingWebSearch, setIsUpdatingWebSearch] = useState(false);
    const [currentMode, setCurrentMode] = useChatMode();

    // Check if we should show brainstorm suggestions
    const isTemporaryChat = chatId?.startsWith("temp_") || false;
    const shouldShowSuggestions = isTemporaryChat && currentMode === "brainstorm" && !textInput.trim() && !isRecording;

    useEffect(() => {
        setWebSearchEnabled(initialWebSearchEnabled);
    }, [initialWebSearchEnabled]);

    useClickOutside(popoverRef, () => setIsSettingsOpen(false));

    const isDisabled = disabled || !hasModelsConfigured;

    const autoResize = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            const scrollHeight = textareaRef.current.scrollHeight;
            const maxHeight = 120;
            if (scrollHeight > maxHeight) {
                textareaRef.current.style.height = `${maxHeight}px`;
                textareaRef.current.style.overflowY = "auto";
            } else {
                textareaRef.current.style.height = `${scrollHeight}px`;
                textareaRef.current.style.overflowY = "hidden";
            }
        }
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTextInput(e.target.value);
        autoResize();
    };

    const sendTextMessage = async () => {
        const message = textInput.trim();
        if (!message) return;
        try {
            await onTextSubmit(message, { webSearch: webSearchEnabled, mode: currentMode });
        } catch (error) {
            console.error("Failed to submit text:", error);
        }
        setTextInput("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.overflowY = "hidden";
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isDisabled && textInput.trim()) {
                sendTextMessage();
            }
        }
    };

    const handleInputClick = () => {
        if (!hasModelsConfigured) {
            onModelsRequired?.();
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            await onFileSubmit(file, { webSearch: webSearchEnabled, mode: currentMode });
        } catch (error) {
            console.error("Failed to submit file:", error);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleToggleWebSearch = async () => {
        const isTemporaryChat = chatId?.startsWith("temp_");

        if (isTemporaryChat) {
            setWebSearchEnabled(prev => !prev);
            return;
        }

        if (!chatId) {
            console.warn("Cannot toggle web search: chatId is not available for an existing chat.");
            return;
        }

        setIsUpdatingWebSearch(true);
        try {
            const newEnabledState = !webSearchEnabled;
            const response = await chatsService.toggleWebSearch(chatId, newEnabledState);
            setWebSearchEnabled(response.web_search_enabled);
        } catch (error) {
            console.error("Failed to update web search status:", error);
            setWebSearchEnabled(webSearchEnabled);
        } finally {
            setIsUpdatingWebSearch(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setTextInput(suggestion);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                autoResize();
            }
        }, 0);
    };

    // --- Audio Recording Logic ---
    const startRecording = async () => {
        if (isRecording || isDisabled || !onAudioSubmit) return; // Guard against missing prop
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
            mediaRecorderRef.current = recorder;

            const chunks: Blob[] = [];
            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(chunks, { type: "audio/webm" });
                // Send the blob to the parent component
                onAudioSubmit(audioBlob, { webSearch: webSearchEnabled, mode: currentMode })
                    .catch((err) => console.error("Error submitting audio:", err));

                // Stop all tracks to release microphone
                stream.getTracks().forEach((track) => track.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Could not access microphone. Please check browser permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const iconButtonClasses = "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border-none bg-transparent text-muted-foreground transition-colors hover:enabled:bg-background/20 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="relative w-full flex-shrink-0 bg-background px-4 pt-2 pb-4">
            {/* Brainstorm Suggestions */}
            <BrainstormSuggestions
                visible={shouldShowSuggestions}
                onSuggestionClick={handleSuggestionClick}
            />

            <div className="relative mx-auto max-w-3xl">
                <div className={`flex flex-col gap-2 rounded-xl border border-border bg-muted px-2 pb-1 pt-4 transition-colors ${isRecording ? "border-red-500/50 bg-red-500/5" : ""}`}>

                    {/* Input Area / Recording Indicator */}
                    {isRecording ? (
                        <div className="flex items-center justify-center h-[28px] gap-2 mb-2 animate-pulse text-red-500 font-medium">
                            <div className="w-3 h-3 bg-red-500 rounded-full" />
                            <span>Recording audio...</span>
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            className="w-full resize-none border-none bg-transparent px-2 text-base leading-tight text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm max-h-[120px]"
                            placeholder={hasModelsConfigured ? "How can I help you today?" : "Configure models to start chatting..."}
                            value={textInput}
                            onChange={handleTextChange}
                            onKeyPress={handleKeyPress}
                            onClick={handleInputClick}
                            rows={1}
                            disabled={isDisabled}
                            style={{ overflowY: 'hidden' }}
                        />
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                            accept="*/*"
                        />
                        <button className={iconButtonClasses} onClick={triggerFileUpload} disabled={isDisabled || isRecording} title="Upload File">
                            <Plus size={20} />
                        </button>

                        <div className="relative">
                            <button
                                className={iconButtonClasses}
                                disabled={(isDisabled && !chatId?.startsWith("temp_")) || isRecording}
                                title="Settings"
                                onClick={() => setIsSettingsOpen(prev => !prev)}
                            >
                                <SlidersHorizontal size={20} />
                            </button>
                            {isSettingsOpen && (
                                <SettingsPopover
                                    ref={popoverRef}
                                    isWebSearchEnabled={webSearchEnabled}
                                    onToggleWebSearch={handleToggleWebSearch}
                                    isUpdatingWebSearch={isUpdatingWebSearch}
                                />
                            )}
                        </div>

                        {/* Spacer puts the controls to the right */}
                        <div className="flex-1" />

                        {/* Mode Selector Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="flex h-8 items-center gap-1.5 rounded-lg border border-input bg-background/50 px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={isDisabled || isRecording}
                                    title="Change Mode"
                                >
                                    <span className="capitalize font-medium text-foreground">
                                        {chatModes.find(mode => mode.value === currentMode)?.label || currentMode}
                                    </span>
                                    <ChevronDown size={14} className="text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                {chatModes.map((mode) => (
                                    <DropdownMenuItem
                                        key={mode.value}
                                        onClick={() => setCurrentMode(mode.value)}
                                        className={currentMode === mode.value ? "bg-accent text-accent-foreground" : ""}
                                    >
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="font-medium">{mode.label}</span>
                                            {mode.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {mode.description}
                                                </span>
                                            )}
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Microphone Button - Only show if onAudioSubmit is provided */}
                        {onAudioSubmit && (
                            <button
                                className={`${iconButtonClasses} ${isRecording ? "text-red-500 hover:text-red-600 bg-red-100 dark:bg-red-900/20" : ""}`}
                                onClick={toggleRecording}
                                disabled={isDisabled}
                                title={isRecording ? "Stop Recording" : "Start Recording"}
                            >
                                {isRecording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
                            </button>
                        )}

                        {/* Send Button */}
                        <button
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-primary-foreground transition-colors hover:enabled:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                            onClick={sendTextMessage}
                            disabled={isDisabled || !textInput.trim() || isRecording}
                            title="Send Message"
                        >
                            <ArrowUp size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInputArea;