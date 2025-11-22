import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { generativeModelService } from "../../services/generativeModelService.ts";
import { modelApiService } from "../../services/modelApiService";
import {
    getNotebookModels,
    updateNotebookModel,
    type NotebookModel,
} from "../../services/notebookModelService";
import {
    getChatModels,
    updateChatModel,
    type ChatModel,
} from "../../services/chatModelService";
import type { EnhancedModel } from "../../services/generativeModelService";
import { useApiKey } from "../../contexts/ApiKeyContext";

export type ActiveTab = "global" | "chat" | "api";

interface ModelSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notebookId?: string;
    chatId?: string;
    isTemporaryChat?: boolean;
    initialTab?: ActiveTab;
    forceApiView?: boolean;
    onApiKeySaved?: () => void;
}

// --- Icons (Same as before) ---
interface IconProps { className?: string; }
const Icons = {
    Notebook: ({ className }: IconProps) => (<svg className={`h-4 w-4 ${className || ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
    Chat: ({ className }: IconProps) => (<svg className={`h-4 w-4 ${className || ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 0 01-2 2h-5l-5 5v-5z" /></svg>),
    Key: ({ className }: IconProps) => (<svg className={`h-4 w-4 ${className || ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>),
    ChevronDown: ({ className }: IconProps) => (<svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>),
    Check: ({ className }: IconProps) => (<svg className={`h-5 w-5 ${className || ""}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>),
    ExternalLink: ({ className }: IconProps) => (<svg className={`h-3 w-3 inline ml-1 ${className || ""}`} fill="none" viewBox="0 0 24 24" stroke="round" strokeWidth={2}><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>),
};

// --- Dropdown Portal Component ---
const DropdownPortal: React.FC<{
    children: React.ReactNode;
    isOpen: boolean;
    targetRef: React.RefObject<HTMLDivElement>;
}> = ({ children, isOpen, targetRef }) => {
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
    const [maxHeight, setMaxHeight] = useState(400);

    useEffect(() => {
        if (isOpen && targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const estimatedHeight = 320;
            const showAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
            const top = showAbove ? rect.top - estimatedHeight : rect.bottom;
            const height = showAbove ? Math.min(estimatedHeight, spaceAbove - 20) : Math.min(estimatedHeight, spaceBelow - 20);

            setPosition({ top: Math.max(10, top), left: rect.left, width: rect.width });
            setMaxHeight(height);
        }
    }, [isOpen, targetRef]);

    useEffect(() => {
        const handleScroll = () => {
            if (isOpen && targetRef.current) {
                const rect = targetRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const spaceAbove = rect.top;
                const estimatedHeight = 320;
                const showAbove = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;
                const top = showAbove ? rect.top - estimatedHeight : rect.bottom;
                setPosition(prev => ({ ...prev, top: Math.max(10, top) }));
            }
        };
        if (isOpen) {
            window.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isOpen, targetRef]);

    if (!isOpen || !targetRef.current) return null;
    return createPortal(
        <div className="fixed z-[9999] pointer-events-none" style={{ top: `${position.top}px`, left: `${position.left}px`, width: `${position.width}px` }}>
            <div className="pointer-events-auto overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl ring-1 ring-black/5" style={{ maxHeight: `${maxHeight}px` }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                <div className="overflow-auto py-1" style={{ maxHeight: `${maxHeight}px` }}>{children}</div>
            </div>
        </div>,
        document.body
    );
};

// --- Enhanced Searchable Select ---
const EnhancedSearchableSelect: React.FC<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    options: EnhancedModel[];
    disabled: boolean;
    placeholder?: string;
}> = ({ id, value, onChange, options, disabled, placeholder = "Select a model..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) setInputValue(value || "");
    }, [value, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setInputValue(value || "");
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, value]);

    const handleSelect = (option: string) => {
        setInputValue(option);
        onChange(option);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        if (disabled) return;
        if (isOpen) setInputValue(value || "");
        setIsOpen(!isOpen);
    };

    const filteredOptions = options.filter((option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    const shouldShowCurrent = value && !options.some(option => option.name === value) && value.toLowerCase().includes(inputValue.toLowerCase());
    const recommendedOptions = filteredOptions.filter(option => option.is_recommended);
    const otherOptions = filteredOptions.filter(option => !option.is_recommended);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => !disabled && setIsOpen(true)}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    autoComplete="off"
                />
                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={toggleDropdown} disabled={disabled}>
                    <Icons.ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
            </div>
            <DropdownPortal isOpen={isOpen} targetRef={wrapperRef}>
                <ul className="list-none m-0 p-1">
                    {shouldShowCurrent && (
                        <li onClick={() => handleSelect(value)} className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                            <div className="flex flex-col"><span className="font-semibold truncate">{value}</span><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Current</span></div>
                            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center text-primary"><Icons.Check /></span>
                        </li>
                    )}
                    {recommendedOptions.length > 0 && (
                        <>
                            <li className="sticky top-0 z-10 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/75 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommended</li>
                            {recommendedOptions.map((option) => (
                                <li key={`${option.name}-${option.type}`} onClick={() => handleSelect(option.name)} className="relative flex cursor-pointer select-none items-start rounded-sm py-2 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <div className="flex gap-2 min-w-0"><span className="text-amber-400 mt-0.5 shrink-0 text-xs">⭐</span><div className="flex flex-col min-w-0"><span className={`truncate ${value === option.name ? "font-semibold" : "font-normal"}`}>{option.name}</span>{option.recommendation_reason && (<span className="text-xs text-muted-foreground truncate">{option.recommendation_reason}</span>)}</div></div>
                                    {value === option.name && (<span className="absolute right-2 top-2.5 flex h-3.5 w-3.5 items-center justify-center text-primary"><Icons.Check /></span>)}
                                </li>
                            ))}
                        </>
                    )}
                    {otherOptions.length > 0 && (
                        <>
                            {recommendedOptions.length > 0 && (<li className="sticky top-0 z-10 bg-popover/95 backdrop-blur supports-[backdrop-filter]:bg-popover/75 px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Other Models</li>)}
                            {otherOptions.map((option) => (
                                <li key={`${option.name}-${option.type}`} onClick={() => handleSelect(option.name)} className="relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors">
                                    <span className={`truncate ${value === option.name ? "font-semibold" : "font-normal"}`}>{option.name}</span>
                                    {value === option.name && (<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center text-primary"><Icons.Check /></span>)}
                                </li>
                            ))}
                        </>
                    )}
                    {filteredOptions.length === 0 && !shouldShowCurrent && (<li className="relative cursor-default select-none py-4 text-center text-sm text-muted-foreground">No models found.</li>)}
                </ul>
            </DropdownPortal>
        </div>
    );
};

// --- Main Component ---
const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
                                                                   isOpen,
                                                                   onClose,
                                                                   notebookId,
                                                                   chatId,
                                                                   isTemporaryChat = false,
                                                                   initialTab = "global",
                                                                   forceApiView = false,
                                                                   onApiKeySaved,
                                                               }) => {
    const navigate = useNavigate();
    const { refreshApiKeyStatus, hasApiKey: globalHasApiKey } = useApiKey();

    const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);

    const [globalLightModel, setGlobalLightModel] = useState<string>("");
    const [globalHeavyModel, setGlobalHeavyModel] = useState<string>("");
    const [notebookModelsByType, setNotebookModelsByType] = useState<Record<string, NotebookModel> | null>(null);
    const [chatLightModel, setChatLightModel] = useState<string>("");
    const [chatHeavyModel, setChatHeavyModel] = useState<string>("");
    const [chatModelsByType, setChatModelsByType] = useState<Record<string, ChatModel> | null>(null);

    const [availableLightModels, setAvailableLightModels] = useState<EnhancedModel[]>([]);
    const [availableHeavyModels, setAvailableHeavyModels] = useState<EnhancedModel[]>([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [savingField, setSavingField] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [apiKey, setApiKey] = useState<string>("");
    const [apiKeySaving, setApiKeySaving] = useState(false);
    const [apiKeyDeleting, setApiKeyDeleting] = useState(false);
    const [apiKeyErr, setApiKeyErr] = useState<string | null>(null);
    const [apiKeySuccess, setApiKeySuccess] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    const loadInitialData = useCallback(async () => {
        if (forceApiView) return;
        setErr(null);
        setSuccess(null);
        try {
            if (notebookId) {
                const nbModels = await getNotebookModels(notebookId);
                if (nbModels) {
                    setNotebookModelsByType(nbModels);
                    setGlobalLightModel(nbModels["light"]?.model_name || "");
                    setGlobalHeavyModel(nbModels["heavy"]?.model_name || "");
                }
            }
            if (chatId && !isTemporaryChat) {
                const chModels = await getChatModels(chatId);
                if (chModels) {
                    setChatModelsByType(chModels);
                    setChatLightModel(chModels["light"]?.model_name || "");
                    setChatHeavyModel(chModels["heavy"]?.model_name || "");
                }
            }
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to load settings");
        }
    }, [notebookId, chatId, isTemporaryChat, forceApiView]);

    const loadAvailableModels = useCallback(async () => {
        if (forceApiView) {
            setModelsLoading(false);
            return;
        }
        setModelsLoading(true);
        try {
            const [lightResponse, heavyResponse] = await Promise.all([
                generativeModelService.getLightModels(),
                generativeModelService.getHeavyModels()
            ]);
            setAvailableLightModels(lightResponse.models);
            setAvailableHeavyModels(heavyResponse.models);
        } catch (e) {
            console.warn("Failed to load available models:", e);
            setAvailableLightModels([]);
            setAvailableHeavyModels([]);
        } finally {
            setModelsLoading(false);
        }
    }, [forceApiView]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(forceApiView ? "api" : initialTab);
            loadInitialData();
            loadAvailableModels();
            // NO AUTO REFRESH HERE - This was causing the loop
        }
    }, [isOpen, forceApiView, initialTab, loadInitialData, loadAvailableModels]);

    const handleNotebookModelChange = async (type: 'light' | 'heavy', newValue: string) => {
        if (!notebookModelsByType?.[type]?.id) return;
        if (type === 'light') setGlobalLightModel(newValue);
        else setGlobalHeavyModel(newValue);
        const fieldId = `global-${type}`;
        setSavingField(fieldId);
        setErr(null);
        try {
            await updateNotebookModel(notebookModelsByType[type].id, {
                generative_model_name: newValue.trim(),
                generative_model_type: type,
            });
            setSuccess(`Updated ${type} model`);
            setTimeout(() => setSuccess(null), 2000);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setSavingField(null);
        }
    };

    const handleChatModelChange = async (type: 'light' | 'heavy', newValue: string) => {
        if (!chatModelsByType?.[type]?.id) return;
        if (type === 'light') setChatLightModel(newValue);
        else setChatHeavyModel(newValue);
        const fieldId = `chat-${type}`;
        setSavingField(fieldId);
        setErr(null);
        try {
            await updateChatModel(chatModelsByType[type].id, {
                generative_model_name: newValue.trim(),
                generative_model_type: type,
            });
            setSuccess(`Updated ${type} model`);
            setTimeout(() => setSuccess(null), 2000);
        } catch (e) {
            setErr(e instanceof Error ? e.message : "Failed to save");
        } finally {
            setSavingField(null);
        }
    };

    const handleApiKeySave = async () => {
        if (!apiKey.trim()) {
            setApiKeyErr("API key cannot be empty");
            return;
        }
        setApiKeySaving(true);
        setApiKeyErr(null);
        setApiKeySuccess(null);
        try {
            await modelApiService.updateModelApi({ api_key: apiKey.trim() });
            await refreshApiKeyStatus(); // Update global context (safe here because it's user triggered)
            setApiKey("");
            setShowApiKey(false);
            setApiKeySuccess("Connected successfully!");
            setTimeout(() => {
                if (onApiKeySaved) onApiKeySaved();
                else if (forceApiView) onClose();
                else loadAvailableModels();
            }, 500);
        } catch (e) {
            setApiKeyErr(e instanceof Error ? e.message : "Failed to save API key");
        } finally {
            setApiKeySaving(false);
        }
    };

    const handleApiKeyDelete = async () => {
        if (!window.confirm("Are you sure you want to remove the API key?")) return;
        setApiKeyDeleting(true);
        try {
            await modelApiService.deleteModelApi();
            await refreshApiKeyStatus(); // Update global context (Safe here)
            setApiKey("");
            setApiKeySuccess("Key removed.");
            setTimeout(() => {
                onClose();
                navigate("/setup");
            }, 500);
        } catch (e) {
            setApiKeyErr("Failed to delete API key");
        } finally {
            setApiKeyDeleting(false);
        }
    };

    if (!isOpen) return null;

    const renderTabButton = (id: ActiveTab, label: string, Icon: React.FC<IconProps>) => (
        <button className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === id ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} onClick={() => setActiveTab(id)}>
            <Icon />{label}
        </button>
    );

    const SavingIndicator = ({ id }: { id: string }) => {
        if (savingField === id) return <span className="text-xs text-primary animate-pulse ml-2">Saving...</span>;
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-background shadow-2xl border border-border animate-slideIn" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
                    <h2 className="text-lg font-semibold text-foreground">{forceApiView ? "Welcome! Setup API Key" : "Settings"}</h2>
                    <button className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClose}>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {!forceApiView && (
                    <div className="flex border-b border-border px-2 bg-muted/10">
                        {renderTabButton("global", "Notebook Models", Icons.Notebook)}
                        {!isTemporaryChat && renderTabButton("chat", "Chat Models", Icons.Chat)}
                        {renderTabButton("api", "API Key", Icons.Key)}
                    </div>
                )}

                <div className="flex-grow p-6">
                    {activeTab === "global" && (
                        <div className="animate-fadeInPanel space-y-5">
                            <p className="text-sm text-muted-foreground">Default models for new chats in this notebook. Changes save automatically.</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center"><label className="text-sm font-medium text-foreground">Light Model (Fast)</label><SavingIndicator id="global-light" /></div>
                                    <EnhancedSearchableSelect id="global-light" value={globalLightModel} onChange={(val) => handleNotebookModelChange('light', val)} options={availableLightModels} disabled={modelsLoading || savingField !== null} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center"><label className="text-sm font-medium text-foreground">Heavy Model (Reasoning)</label><SavingIndicator id="global-heavy" /></div>
                                    <EnhancedSearchableSelect id="global-heavy" value={globalHeavyModel} onChange={(val) => handleNotebookModelChange('heavy', val)} options={availableHeavyModels} disabled={modelsLoading || savingField !== null} />
                                </div>
                            </div>
                            {err && <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">{err}</div>}
                            {success && <div className="text-sm text-green-600 p-2 bg-green-50 dark:bg-green-900/20 rounded flex items-center"><Icons.Check className="mr-1 h-4 w-4"/> {success}</div>}
                        </div>
                    )}

                    {activeTab === "chat" && (
                        <div className="animate-fadeInPanel space-y-5">
                            <p className="text-sm text-muted-foreground">Specific models for the current active chat. Changes save automatically.</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center"><label className="text-sm font-medium text-foreground">Light Model</label><SavingIndicator id="chat-light" /></div>
                                    <EnhancedSearchableSelect id="chat-light" value={chatLightModel} onChange={(val) => handleChatModelChange('light', val)} options={availableLightModels} disabled={modelsLoading || savingField !== null || !chatId} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center"><label className="text-sm font-medium text-foreground">Heavy Model</label><SavingIndicator id="chat-heavy" /></div>
                                    <EnhancedSearchableSelect id="chat-heavy" value={chatHeavyModel} onChange={(val) => handleChatModelChange('heavy', val)} options={availableHeavyModels} disabled={modelsLoading || savingField !== null || !chatId} />
                                </div>
                            </div>
                            {err && <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded">{err}</div>}
                            {success && <div className="text-sm text-green-600 p-2 bg-green-50 dark:bg-green-900/20 rounded flex items-center"><Icons.Check className="mr-1 h-4 w-4"/> {success}</div>}
                        </div>
                    )}

                    {activeTab === "api" && (
                        <div className="animate-fadeInPanel space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900 p-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">OpenRouter Connection</h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">This application uses OpenRouter to access various AI models. You need an API key to proceed.</p>
                                        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mt-1">Get a key from OpenRouter <Icons.ExternalLink /></a>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">API Key</label>
                                    <div className="relative">
                                        <input type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={globalHasApiKey ? "••••••••••••••••" : "sk-or-v1-..."} className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                        <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground" onClick={() => setShowApiKey(!showApiKey)}>{showApiKey ? "Hide" : "Show"}</button>
                                    </div>
                                    {globalHasApiKey ? (<p className="mt-2 flex items-center text-sm text-green-600 font-medium"><Icons.Check className="mr-1" />API Key is configured.</p>) : (<p className="mt-2 text-xs text-muted-foreground">Keys are stored locally and encrypted.</p>)}
                                </div>
                                {(apiKeyErr || apiKeySuccess) && (<div className={`rounded-lg p-3 text-sm font-medium ${apiKeyErr ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>{apiKeyErr || apiKeySuccess}</div>)}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-muted/30 px-6 py-4 flex items-center justify-end gap-3 border-t border-border">
                    {activeTab === "api" ? (
                        <>
                            {globalHasApiKey && !forceApiView && (
                                <button onClick={handleApiKeyDelete} disabled={apiKeyDeleting} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">{apiKeyDeleting ? "Removing..." : "Remove Key"}</button>
                            )}
                            <button onClick={handleApiKeySave} disabled={apiKeySaving || !apiKey.trim()} className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {apiKeySaving ? (<><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>Saving...</>) : ("Connect & Save")}
                            </button>
                        </>
                    ) : (
                        <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-foreground bg-background border border-border hover:bg-muted rounded-lg shadow-sm transition-all">Close</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelSettingsModal;