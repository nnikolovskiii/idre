import React, { useState, useEffect, useCallback } from "react";
import { defaultAIModelsService } from "../../lib/defaultAIModelsService";
import { chatsService } from "../../lib/chatsService";
import { openrouterModelsService } from "../../lib/openrouterModelsService";
import { modelApiService } from "../../lib/modelApiService";
import type { UpdateDefaultAIModelsRequest } from "../../lib/defaultAIModelsService";
import type { UpdateAIModelsRequest } from "../../lib/chatsService";
import type { ModelName } from "../../lib/openrouterModelsService";
import "../../pages/DefaultModels.css"; // We will use the updated CSS

type ActiveTab = "chat" | "global" | "api";

interface ModelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId?: string; // ChatId is now optional
}

const LockIcon = ({ locked }: { locked: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lock-icon"
  >
    {locked ? (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </>
    ) : (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1l.1 1"></path>
      </>
    )}
  </svg>
);

const ModelSettingsModal: React.FC<ModelSettingsModalProps> = ({
  isOpen,
  onClose,
  chatId,
}) => {
  // State for which tab is active
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    chatId ? "chat" : "global"
  );

  // State for chat-specific settings
  const [chatLightModel, setChatLightModel] = useState("");
  const [chatHeavyModel, setChatHeavyModel] = useState("");
  const [useGlobalDefaults, setUseGlobalDefaults] = useState(true);

  // State for global default settings
  const [globalLightModel, setGlobalLightModel] = useState("");
  const [globalHeavyModel, setGlobalHeavyModel] = useState("");

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
      // Always fetch global models
      const globalPromise = defaultAIModelsService.getDefaultAIModels();
      // Fetch chat models only if chatId is present
      const chatPromise = chatId
        ? chatsService.getChatAIModels(chatId)
        : Promise.resolve(null);

      const [globalModels, chatModels] = await Promise.all([
        globalPromise,
        chatPromise,
      ]);

      // Set global state
      setGlobalLightModel(globalModels.light_model || "");
      setGlobalHeavyModel(globalModels.heavy_model || "");

      // Set chat-specific state if applicable
      if (chatId && chatModels) {
        const isUsingDefaults =
          !chatModels.light_model && !chatModels.heavy_model;
        setUseGlobalDefaults(isUsingDefaults);

        setChatLightModel(
          isUsingDefaults
            ? globalModels.light_model || ""
            : chatModels.light_model || ""
        );
        setChatHeavyModel(
          isUsingDefaults
            ? globalModels.heavy_model || ""
            : chatModels.heavy_model || ""
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [chatId]);

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
      setActiveTab(chatId ? "chat" : "global");
      loadInitialData();
      loadAvailableModels();
      loadApiKeyInfo();
    }
  }, [isOpen, chatId, loadInitialData, loadAvailableModels, loadApiKeyInfo]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (activeTab === "global") {
        const updateRequest: UpdateDefaultAIModelsRequest = {
          light_model: globalLightModel.trim(),
          heavy_model: globalHeavyModel.trim(),
        };
        await defaultAIModelsService.updateDefaultAIModels(updateRequest);
      } else if (chatId) {
        const updateRequest: UpdateAIModelsRequest = useGlobalDefaults
          ? { light_model: null, heavy_model: null } // Reset to default
          : {
              light_model: chatLightModel.trim(),
              heavy_model: chatHeavyModel.trim(),
            };
        await chatsService.updateChatAIModels(chatId, updateRequest);
      }
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

  const handleToggleUseGlobal = () => {
    const newUseGlobal = !useGlobalDefaults;
    setUseGlobalDefaults(newUseGlobal);
    if (newUseGlobal) {
      // When locking to global, show the current global values
      setChatLightModel(globalLightModel);
      setChatHeavyModel(globalHeavyModel);
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

    if (type === "chat" && chatId) {
      return (
        <div className="tab-panel">
          <div className="modal-toggle-section">
            <label htmlFor="use-defaults-toggle" className="toggle-switch">
              <input
                type="checkbox"
                id="use-defaults-toggle"
                checked={useGlobalDefaults}
                onChange={handleToggleUseGlobal}
                disabled={saving}
              />
              <span className="slider"></span>
            </label>
            <div className="toggle-label" onClick={handleToggleUseGlobal}>
              <LockIcon locked={useGlobalDefaults} />
              <span>Use Global Default Models</span>
            </div>
          </div>
          <p className="tab-description">
            {useGlobalDefaults
              ? "This chat is using the global models. Unlock to set custom models just for this chat."
              : "Set custom models that will only be used for this chat."}
          </p>
          <div className="model-section">
            <div className="model-field">
              <label htmlFor="chat-light-model">Light Model</label>
              {renderModelSelector(
                "chat-light-model",
                chatLightModel,
                setChatLightModel,
                useGlobalDefaults || modelsLoading || saving
              )}
            </div>
            <div className="model-field">
              <label htmlFor="chat-heavy-model">Heavy Model</label>
              {renderModelSelector(
                "chat-heavy-model",
                chatHeavyModel,
                setChatHeavyModel,
                useGlobalDefaults || modelsLoading || saving
              )}
            </div>
          </div>
        </div>
      );
    }

    if (type === "global") {
      return (
        <div className="tab-panel">
          <p className="tab-description">
            Configure the default models that will be automatically used for all
            new chats.
          </p>
          <div className="model-section">
            <div className="model-field">
              <label htmlFor="global-light-model">Default Light Model</label>
              {renderModelSelector(
                "global-light-model",
                globalLightModel,
                setGlobalLightModel,
                modelsLoading || saving
              )}
            </div>
            <div className="model-field">
              <label htmlFor="global-heavy-model">Default Heavy Model</label>
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
          {chatId && (
            <button
              className={`tab-item ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              For This Chat
            </button>
          )}
          <button
            className={`tab-item ${activeTab === "global" ? "active" : ""}`}
            onClick={() => setActiveTab("global")}
          >
            Global Defaults
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
