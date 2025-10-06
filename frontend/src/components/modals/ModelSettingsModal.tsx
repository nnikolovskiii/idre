import React, { useState, useEffect, useCallback } from "react";
import { openrouterModelsService } from "../../lib/openrouterModelsService";
import { modelApiService } from "../../lib/modelApiService";
import { getNotebookModels, updateNotebookModel, type NotebookModel } from "../../lib/notebookModelService";
import { getChatModels, updateChatModel, type ChatModel } from "../../lib/chatModelService";
import type { ModelName } from "../../lib/openrouterModelsService";
import "../../pages/DefaultModels.css"; // We will use the updated CSS

type ActiveTab = "global" | "chat" | "api";

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId?: string; // NotebookId to manage notebook-level models
  chatId?: string; // ChatId to manage chat-level models
}

const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 notebookId,
                                                                 chatId,
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
      // Fetch notebook-level models if notebookId is provided
      if (notebookId) {
        const nbModels = await getNotebookModels(notebookId);
        console.log(nbModels);

        if (nbModels) {
          setNotebookModelsByType(nbModels);
          const light = nbModels["light"];
          const heavy = nbModels["heavy"];
          setGlobalLightModel(light?.model_name || "");
          setGlobalHeavyModel(heavy?.model_name || "");
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

      // Fetch chat-level models if chatId is provided
      if (chatId) {
        const chModels = await getChatModels(chatId);
        if (chModels) {
          setChatModelsByType(chModels);
          const cLight = chModels["light"];
          const cHeavy = chModels["heavy"];
          setChatLightModel(cLight?.model_name || "");
          setChatHeavyModel(cHeavy?.model_name || "");
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
  }, [notebookId, chatId]);

  const loadAvailableModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      // Check if user has API key set
      const apiKeyResponse = await modelApiService.getModelApi();
      const models = apiKeyResponse.has_api_key
          ? await openrouterModelsService.getModelNames()
          : await openrouterModelsService.getFreeModelNames();
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
      // Update notebook-level models (light/heavy) using notebook models service
      if (!notebookId || !notebookModelsByType) {
        throw new Error("Notebook is not selected. Cannot update notebook models.");
      }
      const light = notebookModelsByType["light"];
      const heavy = notebookModelsByType["heavy"];
      const updates: Promise<any>[] = [];
      if (light?.id) {
        updates.push(updateNotebookModel(light.id, { generative_model_name: globalLightModel.trim() , generative_model_type: 'light'}));
      }
      if (heavy?.id) {
        updates.push(updateNotebookModel(heavy.id, { generative_model_name: globalHeavyModel.trim(), generative_model_type: 'heavy' }));
      }
      await Promise.all(updates);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose(); // Optional: close modal on success
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
      const light = chatModelsByType["light"];
      const heavy = chatModelsByType["heavy"];
      const updates: Promise<any>[] = [];
      if (light?.id) {
        updates.push(updateChatModel(light.id, { generative_model_name: chatLightModel.trim(), generative_model_type: 'light' }));
      }
      if (heavy?.id) {
        updates.push(updateChatModel(heavy.id, { generative_model_name: chatHeavyModel.trim(), generative_model_type: 'heavy' }));
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
      // Refresh available models since user now has API key
      loadAvailableModels();
    } catch (err) {
      setApiKeyError(
          err instanceof Error ? err.message : "Failed to save API key"
      );
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
      // Refresh available models since user no longer has API key
      loadAvailableModels();
    } catch (err) {
      setApiKeyError(
          err instanceof Error ? err.message : "Failed to delete API key"
      );
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
      <select
          id={id}
          value={value}
          onChange={(e) => setter(e.target.value)}
          disabled={disabled}
      >
        <option value="">Select a model...</option>
        {value && !availableModels.includes(value) && (
            <option key={value} value={value}>
              {value} (current)
            </option>
        )}
        {availableModels.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
        ))}
      </select>
  );

  const renderPanel = (type: ActiveTab) => {
    if (loading) {
      return (
          <div className="modal-loading-state">
            <div className="spinner"></div>
            <span>Loading settings...</span>
          </div>
      );
    }

    if (type === "global") {
      return (
          <div className="tab-panel">
            <p className="tab-description">
              Configure the notebook models that will be automatically used for all
              new chats in this notebook.
            </p>
            <div className="model-section">
              <div className="model-field">
                <label htmlFor="global-light-model">Notebook Light Model</label>
                {renderModelSelector(
                    "global-light-model",
                    globalLightModel,
                    setGlobalLightModel,
                    modelsLoading || saving
                )}
              </div>
              <div className="model-field">
                <label htmlFor="global-heavy-model">Notebook Heavy Model</label>
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
        <div className="tab-panel">
          <p className="tab-description">
            Configure the models used for this specific chat.
          </p>
          {!chatId && (
            <div className="modal-info">ℹ️ Open a chat to configure chat-level models.</div>
          )}
          <div className="model-section">
            <div className="model-field">
              <label htmlFor="chat-light-model">Chat Light Model</label>
              {renderModelSelector(
                "chat-light-model",
                chatLightModel,
                setChatLightModel,
                modelsLoading || saving || !chatId || !chatModelsByType
              )}
            </div>
            <div className="model-field">
              <label htmlFor="chat-heavy-model">Chat Heavy Model</label>
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
          <div className="tab-panel">
            <p className="tab-description">
              Manage your OpenRouter API key for enhanced functionality.
            </p>
            {apiKeyLoading ? (
                <div className="modal-loading-state">
                  <div className="spinner"></div>
                  <span>Checking API key status...</span>
                </div>
            ) : (
                <div className="api-key-section">
                  {apiKeyError && (
                      <div className="modal-error">⚠️ {apiKeyError}</div>
                  )}
                  {apiKeySuccess && (
                      <div className="modal-success">✅ {apiKeySuccess}</div>
                  )}

                  {!hasApiKey && !apiKeySuccess && (
                      <div className="modal-info">
                        ℹ️ No API key is configured. Add one below to get started.
                      </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="api-key">API Key</label>
                    <div className="input-wrapper">
                      <input
                          id="api-key"
                          type={showApiKey ? "text" : "password"}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={
                            hasApiKey ? "Enter new key to update" : "sk-or-v1-..."
                          }
                          disabled={apiKeySaving || apiKeyDeleting}
                          className="input-field"
                      />
                      <button
                          type="button"
                          className="input-adornment-btn"
                          onClick={() => setShowApiKey(!showApiKey)}
                          disabled={apiKeySaving || apiKeyDeleting}
                          aria-label={showApiKey ? "Hide API key" : "Show API key"}
                      >
                        {showApiKey ? "👁️" : "🙈"}
                      </button>
                    </div>
                    <small className="form-text">
                      Your key is encrypted and stored securely.
                    </small>
                  </div>

                  {hasApiKey && (
                      <div className="api-key-status">
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
      <div className="modal-overlay" onClick={onClose}>
        <div
            className="modal-content model-settings-modal"
            onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h2>
              {activeTab === "api" ? (
                  "API Key Settings"
              ) : (
                  <>
                    AI Model Settings
                    {!apiKeyLoading && (
                        <span
                            className={`model-status ${
                                hasApiKey ? "full-access" : "free-only"
                            }`}
                        >
                    {hasApiKey ? "(Full Access)" : "(Free Models Only)"}
                  </span>
                    )}
                  </>
              )}
            </h2>
            <button className="modal-close-btn" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="modal-tabs">
            <button
                className={`tab-item ${activeTab === "global" ? "active" : ""}`}
                onClick={() => setActiveTab("global")}
            >
              Notebook Models
            </button>
            <button
                className={`tab-item ${activeTab === "chat" ? "active" : ""}`}
                onClick={() => setActiveTab("chat")}
            >
              Chat Models
            </button>
            <button
                className={`tab-item ${activeTab === "api" ? "active" : ""}`}
                onClick={() => setActiveTab("api")}
            >
              API Key
            </button>
          </div>

          <div className="modal-body">{renderPanel(activeTab)}</div>

          <div className="modal-footer">
            <div className="modal-messages">
              {activeTab === "api" ? (
                  <>
                    {apiKeyError && (
                        <div className="modal-error">⚠️ {apiKeyError}</div>
                    )}
                    {apiKeySuccess && (
                        <div className="modal-success">✅ {apiKeySuccess}</div>
                    )}
                  </>
              ) : (
                  <>
                    {error && <div className="modal-error">⚠️ {error}</div>}
                    {success && (
                        <div className="modal-success">✅ Settings saved!</div>
                    )}
                  </>
              )}
            </div>
            <div className="modal-actions">
              {activeTab === "api" ? (
                  <>
                    {hasApiKey && (
                        <button
                            className="modal-btn danger"
                            onClick={handleApiKeyDelete}
                            disabled={apiKeySaving || apiKeyDeleting}
                        >
                          {apiKeyDeleting ? (
                              <>
                                <div className="button-spinner"></div> Deleting...
                              </>
                          ) : (
                              "Delete Key"
                          )}
                        </button>
                    )}
                    <button
                        className="modal-btn primary"
                        onClick={handleApiKeySave}
                        disabled={apiKeySaving || apiKeyDeleting || !apiKey.trim()}
                    >
                      {apiKeySaving ? (
                          <>
                            <div className="button-spinner"></div> Saving...
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
                    <button
                        className="modal-btn secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                        className="modal-btn primary"
                        onClick={handleChatSave}
                        disabled={saving || loading || !chatId || !chatModelsByType}
                    >
                      {saving ? (
                          <>
                            <div className="button-spinner"></div> Saving...
                          </>
                      ) : (
                          "Save Changes"
                      )}
                    </button>
                  </>
              ) : (
                  <>
                    <button
                        className="modal-btn secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                        className="modal-btn primary"
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                      {saving ? (
                          <>
                            <div className="button-spinner"></div> Saving...
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