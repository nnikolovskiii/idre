// /home/nnikolovskii/dev/general-chat/frontend/src/components/chat/ChatInputArea.tsx:

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Plus, SlidersHorizontal, ArrowUp } from "lucide-react";
import type { ChatModel } from '../../services/chatModelService';
import { SettingsPopover } from "./SettingsPopover.tsx";
import { useClickOutside } from "../../hooks/useClickOutside.ts";
import { useChatMode } from "../../hooks/useChatMode.ts";
import { chatsService } from "../../services/chatsService.ts";
import BrainstormSuggestions from "./BrainstormSuggestions.tsx";

type ChatMode = "brainstorm" | "consult";

const chatModes: ChatMode[] = ["brainstorm", "consult"];

interface ChatInputAreaProps {
    onTextSubmit: (text: string, options: { webSearch: boolean; mode: ChatMode }) => Promise<void>;
    onFileSubmit: (file: File, options: { webSearch: boolean; mode: ChatMode }) => Promise<void>;
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
                                                         disabled = false,
                                                         hasModelsConfigured = false,
                                                         onModelsRequired,
                                                         chatId,
                                                         initialWebSearchEnabled = false,
                                                     }) => {
    const [textInput, setTextInput] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const [webSearchEnabled, setWebSearchEnabled] = useState(initialWebSearchEnabled);
    const [isUpdatingWebSearch, setIsUpdatingWebSearch] = useState(false);
    const [currentMode, setCurrentMode] = useChatMode();

    // Check if we should show brainstorm suggestions
    const isTemporaryChat = chatId?.startsWith("temp_") || false;
    const shouldShowSuggestions = isTemporaryChat && currentMode === "brainstorm" && !textInput.trim();

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
        // Focus the textarea after setting the text
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                autoResize();
            }
        }, 0);
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
                <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted px-2 pb-1 pt-4">
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

                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                            accept="*/*"
                        />
                        <button className={iconButtonClasses} onClick={triggerFileUpload} disabled={isDisabled} title="Upload File">
                            <Plus size={20} />
                        </button>

                        <div className="relative">
                            <button
                                className={iconButtonClasses}
                                disabled={isDisabled && !chatId?.startsWith("temp_")}
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

                        <div className="flex-1" />

                        {/* Segmented Control for Chat Mode - MOVED HERE */}
                        <div className="flex h-8 items-center rounded-lg border border-border bg-background/20 p-0.5" title="Change Mode">
                            {chatModes.map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setCurrentMode(mode)}
                                    disabled={isDisabled}
                                    className={`rounded-[6px] px-3 py-0.5 text-center text-sm transition-colors capitalize disabled:cursor-not-allowed ${
                                        currentMode === mode
                                            ? 'bg-background font-medium text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground disabled:bg-transparent disabled:text-muted-foreground/50'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        <button
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-primary-foreground transition-colors hover:enabled:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                            onClick={sendTextMessage}
                            disabled={isDisabled || !textInput.trim()}
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
