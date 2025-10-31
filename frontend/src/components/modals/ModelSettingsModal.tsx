import React, { useState, useEffect, useCallback, useRef } from "react";
import { generativeModelService } from "../../services/generativeModelService.ts";
import { modelApiService } from "../../services/modelApiService";
import { getNotebookModels, updateNotebookModel, type NotebookModel } from "../../services/notebookModelService";
import { getChatModels, updateChatModel, type ChatModel } from "../../services/chatModelService";
import type { ModelName } from "../../services/openrouterModelsService";

type ActiveTab = "global" | "chat" | "api";

interface ModelSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notebookId?: string; // NotebookId to manage notebook-level models
    chatId?: string; // ChatId to manage chat-level models
    isTemporaryChat?: boolean;
}

// Props interface for our new SearchableSelect component
interface SearchableSelectProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    disabled: boolean;
    placeholder?: string;
}

// A new component for a searchable dropdown input
const SearchableSelect: React.FC<SearchableSelectProps> = ({
                                                               id,
                                                               value,
                                                               onChange,
                                                               options,
                                                               disabled,
                                                               placeholder = "Select a model...",
                                                           }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || "");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync input value with the external value prop when it changes, but only if the dropdown is closed.
    useEffect(() => {
        if (!isOpen) {
            setInputValue(value || "");
        }
    }, [value, isOpen]);

    const handleOpen = useCallback(() => {
        if (disabled) return;
        setIsOpen(true);
    }, [disabled]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        // On close, revert any untyped changes back to the currently selected value.
        setInputValue(value || "");
    }, [value]);

    const handleSelect = useCallback((option: string) => {
        onChange(option);
        setInputValue(option);
        setIsOpen(false);
    }, [onChange]);

    // Effect to handle clicks outside the component to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, handleClose]);

    const searchTerm = isOpen ? inputValue : "";
    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const shouldShowCurrentValue = value && !options.includes(value) && value.toLowerCase().includes(searchTerm.toLowerCase());

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    id={id}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={handleOpen}
                    disabled={disabled}
                    placeholder={placeholder}
                    className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-base text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70"
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => (isOpen ? handleClose() : handleOpen())}
                    disabled={disabled}
                    aria-label="Toggle dropdown"
                >
                    <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
            {isOpen && (
                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {shouldShowCurrentValue && (
                        <li key={value} onClick={() => handleSelect(value)} className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-foreground hover:bg-muted">
                            <span className="block truncate font-semibold">{value} (current)</span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-ring">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </span>
                        </li>
                    )}
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <li key={option} onClick={() => handleSelect(option)} className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-foreground hover:bg-muted">
                                <span className={`block truncate ${value === option ? 'font-semibold' : 'font-normal'}`}>{option}</span>
                                {value === option && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-ring">
                              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </span>
                                )}
                            </li>
                        ))
                    ) : !shouldShowCurrentValue ? (
                        <li className="relative cursor-default select-none py-2 px-4 text-muted-foreground">No models found.</li>
                    ) : null}
                </ul>
            )}
        </div>
    );
};

const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
                                                                   isOpen,
                                                                   onClose,
                                                                   notebookId,
                                                                   chatId,
                                                                   isTemporaryChat = false,
                                                               }) => {
    // State for which tab is active
    const [activeTab, setActiveTab] = useState<ActiveTab>("global");

    // State for notebook-level (previously global default) settings
    const [globalLightModel, setGlobalLightModel] = useState("");
    const [globalHeavyModel, setGlobalHeavyModel] = useState("");
    const [notebookModelsByType, setNotebookModelsByType] = useState<Record<string, NotebookModel> | null>(null);

    // State for chat-level settings
    const [chatLightModel, setChatLightModel] = useState("");
    const [chatHeavyModel, setChatHeavyModel] = useState("");
    const [chatModelsByType, setChatModelsByType] = useState<Record<string, ChatModel> | null>(null);

    // Common states
    const [availableModels, setAvailableModels] = useState<ModelName[]>([]);
    const [loading, setLoading] = useState(true);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // API key states
    const [apiKey, setApiKey] = useState("");
    const [hasApiKey, setHasApiKey] = useState(false);
    const [apiKeyLoading, setApiKeyLoading] = useState(true);
    const [apiKeySaving, setApiKeySaving] = useState(false);
    const [apiKeyDeleting, setApiKeyDeleting] = useState(false);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const [apiKeySuccess, setApiKeySuccess] = useState<string | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            if (notebookId) {
                const nbModels = await getNotebookModels(notebookId);
                if (nbModels) {
                    setNotebookModelsByType(nbModels);
                    setGlobalLightModel(nbModels["light"]?.model_name || "");
                    setGlobalHeavyModel(nbModels["heavy"]?.model_name || "");
                } else {
                    setNotebookModelsByType(null);
                    setGlobalLightModel("");
                    setGlobalHeavyModel("");
                }
            } else {
                setNotebookModelsByType(null);
                setGlobalLightModel("");
                setGlobalHeavyModel("");
            }

            // CHANGE: Only fetch chat models if it's not a temporary chat
            if (chatId && !isTemporaryChat) {
                const chModels = await getChatModels(chatId);
                if (chModels) {
                    setChatModelsByType(chModels);
                    setChatLightModel(chModels["light"]?.model_name || "");
                    setChatHeavyModel(chModels["heavy"]?.model_name || "");
                } else {
                    setChatModelsByType(null);
                    setChatLightModel("");
                    setChatHeavyModel("");
                }
            } else {
                setChatModelsByType(null);
                setChatLightModel("");
                setChatHeavyModel("");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, [notebookId, chatId, isTemporaryChat]); // CHANGE: Add isTemporaryChat to dependency array

    const loadAvailableModels = useCallback(async () => {
        setModelsLoading(true);
        try {
            const apiKeyResponse = await modelApiService.getModelApi();
            const models = apiKeyResponse.has_api_key
                ? await generativeModelService.getModelNames()
                : await generativeModelService.getFreeModelNames();
            setAvailableModels(models);
        } catch (err) {
            console.warn("Failed to load available models:", err);
        } finally {
            setModelsLoading(false);
        }
    }, []);

    const loadApiKeyInfo = useCallback(async () => {
        setApiKeyLoading(true);
        setApiKeyError(null);
        try {
            const apiInfo = await modelApiService.getModelApi();
            setHasApiKey(apiInfo.has_api_key);
        } catch (err) {
            setApiKeyError(
                err instanceof Error
                    ? err.message
                    : "Failed to load API key information"
            );
        } finally {
            setApiKeyLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setActiveTab("global");
            loadInitialData();
            loadAvailableModels();
            loadApiKeyInfo();
        }
    }, [isOpen, loadInitialData, loadAvailableModels, loadApiKeyInfo]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            if (!notebookId || !notebookModelsByType) {
                throw new Error("Notebook is not selected. Cannot update notebook models.");
            }
            const updates: Promise<any>[] = [];
            if (notebookModelsByType["light"]?.id) {
                updates.push(updateNotebookModel(notebookModelsByType["light"].id, { generative_model_name: globalLightModel.trim() , generative_model_type: 'light'}));
            }
            if (notebookModelsByType["heavy"]?.id) {
                updates.push(updateNotebookModel(notebookModelsByType["heavy"].id, { generative_model_name: globalHeavyModel.trim(), generative_model_type: 'heavy' }));
            }
            await Promise.all(updates);

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update models");
        } finally {
            setSaving(false);
        }
    };

    const handleChatSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            if (!chatModelsByType) {
                throw new Error("Chat is not selected. Cannot update chat models.");
            }
            const updates: Promise<any>[] = [];
            if (chatModelsByType["light"]?.id) {
                updates.push(updateChatModel(chatModelsByType["light"].id, { generative_model_name: chatLightModel.trim(), generative_model_type: 'light' }));
            }
            if (chatModelsByType["heavy"]?.id) {
                updates.push(updateChatModel(chatModelsByType["heavy"].id, { generative_model_name: chatHeavyModel.trim(), generative_model_type: 'heavy' }));
            }
            await Promise.all(updates);

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update chat models");
        } finally {
            setSaving(false);
        }
    };

    const handleApiKeySave = async () => {
        if (!apiKey.trim()) {
            setApiKeyError("API key cannot be empty.");
            return;
        }
        setApiKeySaving(true);
        setApiKeyError(null);
        setApiKeySuccess(null);
        try {
            await modelApiService.updateModelApi({ api_key: apiKey.trim() });
            setHasApiKey(true);
            setApiKey("");
            setShowApiKey(false);
            setApiKeySuccess("API key saved successfully!");
            loadAvailableModels();
        } catch (err) {
            setApiKeyError(err instanceof Error ? err.message : "Failed to save API key");
        } finally {
            setApiKeySaving(false);
        }
    };

    const handleApiKeyDelete = async () => {
        setApiKeyDeleting(true);
        setApiKeyError(null);
        setApiKeySuccess(null);
        try {
            await modelApiService.deleteModelApi();
            setHasApiKey(false);
            setApiKey("");
            setApiKeySuccess("API key deleted successfully!");
            loadAvailableModels();
        } catch (err) {
            setApiKeyError(err instanceof Error ? err.message : "Failed to delete API key");
        } finally {
            setApiKeyDeleting(false);
        }
    };

    const renderModelSelector = (
        id: string,
        value: string,
        setter: (val: string) => void,
        disabled: boolean
    ) => (
        <SearchableSelect
            id={id}
            value={value}
            onChange={setter}
            disabled={disabled}
            options={availableModels}
            placeholder="Select or type to search..."
        />
    );

    const renderPanel = (type: ActiveTab) => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-gray-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                    <span>Loading settings...</span>
                </div>
            );
        }

        if (type === "global") {
            return (
                <div className="animate-fadeInPanel">
                    <p className="mb-6 mt-0 text-sm leading-relaxed ">
                        Configure the notebook models that will be automatically used for all new chats in this notebook.
                    </p>
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="global-light-model" className="text-sm font-medium text-foreground">Notebook Light Model</label>
                            {renderModelSelector(
                                "global-light-model",
                                globalLightModel,
                                setGlobalLightModel,
                                modelsLoading || saving
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="global-heavy-model" className="text-sm font-medium text-foreground">Notebook Heavy Model</label>
                            {renderModelSelector(
                                "global-heavy-model",
                                globalHeavyModel,
                                setGlobalHeavyModel,
                                modelsLoading || saving
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "chat") {
            return (
                <div className="animate-fadeInPanel">
                    <p className="mb-6 mt-0 text-sm leading-relaxed text-muted-foreground">
                        Configure the models used for this specific chat.
                    </p>
                    {!chatId && (
                        <div className="mb-4 rounded-md  p-3 text-sm text-blue-700">ℹ️ Open a chat to configure chat-level models.</div>
                    )}
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label htmlFor="chat-light-model" className="text-sm font-medium text-foreground">Chat Light Model</label>
                            {renderModelSelector(
                                "chat-light-model",
                                chatLightModel,
                                setChatLightModel,
                                modelsLoading || saving || !chatId || !chatModelsByType
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <label htmlFor="chat-heavy-model" className="text-sm font-medium text-foreground">Chat Heavy Model</label>
                            {renderModelSelector(
                                "chat-heavy-model",
                                chatHeavyModel,
                                setChatHeavyModel,
                                modelsLoading || saving || !chatId || !chatModelsByType
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (type === "api") {
            return (
                <div className="animate-fadeInPanel">
                    <p className="mb-6 mt-0 text-sm leading-relaxed text-muted-foreground">
                        Manage your OpenRouter API key for enhanced functionality.
                    </p>
                    {apiKeyLoading ? (
                        <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
                            <span>Checking API key status...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {!hasApiKey && !apiKeySuccess && (
                                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                                    ℹ️ No API key is configured. Add one below to get started.
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label htmlFor="api-key" className="text-sm font-medium text-foreground">API Key</label>
                                <div className="relative flex items-center">
                                    <input
                                        id="api-key"
                                        type={showApiKey ? "text" : "password"}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder={hasApiKey ? "Enter new key to update" : "sk-or-v1-..."}
                                        disabled={apiKeySaving || apiKeyDeleting}
                                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-foreground placeholder:text-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:bg-muted"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 rounded-md p-1 text-xl text-muted-foreground hover:bg-muted disabled:cursor-not-allowed"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        disabled={apiKeySaving || apiKeyDeleting}
                                        aria-label={showApiKey ? "Hide API key" : "Show API key"}
                                    >
                                        {showApiKey ? "👁️" : "🙈"}
                                    </button>
                                </div>
                                <small className="text-xs text-muted-foreground">
                                    Your key is encrypted and stored securely.
                                </small>
                            </div>
                            {hasApiKey && (
                                <div className="rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
                                    🔑 An API key is configured and active.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div className="flex w-11/12 max-w-xl animate-slideIn flex-col rounded-xl bg-muted shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="relative border-b border-border px-6 py-5">
                    <h2 className="m-0 text-xl font-semibold text-foreground">
                        {activeTab === "api" ? (
                            "API Key Settings"
                        ) : (
                            <>
                                AI Model Settings
                                {!apiKeyLoading && (
                                    <span
                                        className={`ml-2 inline-block rounded border px-1.5 py-0.5 text-xs font-normal align-middle leading-none ${
                                            hasApiKey
                                                ? "border-green-400 bg-green-100 text-green-800"
                                                : "border-yellow-400 bg-yellow-100 text-yellow-800"
                                        }`}
                                    >
                    {hasApiKey ? "Full Access" : "Free Models Only"}
                  </span>
                                )}
                            </>
                        )}
                    </h2>
                    <button className="absolute right-4 top-4 border-none bg-transparent text-3xl leading-none text-muted-foreground transition-colors hover:text-foreground" onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className="flex border-b border-border px-6">
                    <button className={`-mb-px border-b-2 bg-transparent px-2 py-3 text-sm font-semibold transition-all hover:text-ring ${activeTab === "global" ? "border-ring text-ring" : "border-transparent text-muted-foreground"}`} onClick={() => setActiveTab("global")}>
                        Notebook Models
                    </button>
                    {!isTemporaryChat && (
                        <button className={`-mb-px border-b-2 bg-transparent px-2 py-3 text-sm font-semibold transition-all hover:text-ring ${activeTab === "chat" ? "border-ring text-ring" : "border-transparent text-muted-foreground"}`} onClick={() => setActiveTab("chat")}>
                            Chat Models
                        </button>
                    )}
                    <button className={`-mb-px border-b-2 bg-transparent px-2 py-3 text-sm font-semibold transition-all hover:text-ring ${activeTab === "api" ? "border-ring text-ring" : "border-transparent text-muted-foreground"}`} onClick={() => setActiveTab("api")}>
                        API Key
                    </button>
                </div>

                <div className="flex-grow p-6">{renderPanel(activeTab)}</div>

                <div className="rounded-b-xl bg-muted p-4 px-6">
                    <div className="mb-3 min-h-[24px] text-sm">
                        {activeTab === "api" ? (
                            <>
                                {apiKeyError && <div className="text-red-600">⚠️ {apiKeyError}</div>}
                                {apiKeySuccess && <div className="text-green-600">✅ {apiKeySuccess}</div>}
                            </>
                        ) : (
                            <>
                                {error && <div className="text-red-600">⚠️ {error}</div>}
                                {success && <div className="text-green-600">✅ Settings saved!</div>}
                            </>
                        )}
                    </div>
                    <div className="flex justify-end gap-3">
                        {activeTab === "api" ? (
                            <>
                                {hasApiKey && (
                                    <button className="flex items-center justify-center gap-2 rounded-lg border border-red-600 bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:enabled:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleApiKeyDelete} disabled={apiKeySaving || apiKeyDeleting}>
                                        {apiKeyDeleting ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current"></div> Deleting...
                                            </>
                                        ) : (
                                            "Delete Key"
                                        )}
                                    </button>
                                )}
                                <button className="flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:enabled:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleApiKeySave} disabled={apiKeySaving || apiKeyDeleting || !apiKey.trim()}>
                                    {apiKeySaving ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current"></div> Saving...
                                        </>
                                    ) : hasApiKey ? (
                                        "Update Key"
                                    ) : (
                                        "Save Key"
                                    )}
                                </button>
                            </>
                        ) : activeTab === "chat" ? (
                            <>
                                <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:enabled:bg-secondary disabled:cursor-not-allowed disabled:opacity-60" onClick={onClose} disabled={saving}>
                                    Cancel
                                </button>
                                <button className="flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:enabled:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleChatSave} disabled={saving || loading || !chatId || !chatModelsByType}>
                                    {saving ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current"></div> Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:enabled:bg-secondary disabled:cursor-not-allowed disabled:opacity-60" onClick={onClose} disabled={saving}>
                                    Cancel
                                </button>
                                <button className="flex items-center justify-center gap-2 rounded-lg border border-transparent bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:enabled:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60" onClick={handleSave} disabled={saving || loading}>
                                    {saving ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-current"></div> Saving...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelSettingsModal;