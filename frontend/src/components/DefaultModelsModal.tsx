import React, { useState, useEffect } from 'react';
import { defaultAIModelsService } from '../lib/defaultAIModelsService';
import { openrouterModelsService } from '../lib/openrouterModelsService';
import type { UpdateDefaultAIModelsRequest } from '../lib/defaultAIModelsService';
import type { ModelName } from '../lib/openrouterModelsService';
import './DefaultModelsModal.css';

interface DefaultModelsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DefaultModelsModal: React.FC<DefaultModelsModalProps> = ({ isOpen, onClose }) => {
  const [lightModel, setLightModel] = useState('');
  const [heavyModel, setHeavyModel] = useState('');
  const [availableModels, setAvailableModels] = useState<ModelName[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load current default AI models and available models when modal opens
  useEffect(() => {
    if (isOpen) {
      loadDefaultAIModels();
      loadAvailableModels();
    }
  }, [isOpen]);

  const loadDefaultAIModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const models = await defaultAIModelsService.getDefaultAIModels();
      setLightModel(models.light_model || '');
      setHeavyModel(models.heavy_model || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load default AI models');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModels = async () => {
    setModelsLoading(true);
    try {
      const models = await openrouterModelsService.getModelNames();
      setAvailableModels(models);
    } catch (err) {
      // If models fail to load, we'll show text inputs as fallback
      console.warn('Failed to load available models:', err);
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!lightModel.trim() || !heavyModel.trim()) {
      setError('Both light and heavy model names are required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateRequest: UpdateDefaultAIModelsRequest = {
        light_model: lightModel.trim(),
        heavy_model: heavyModel.trim()
      };

      await defaultAIModelsService.updateDefaultAIModels(updateRequest);
      setSuccess(true);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update default AI models');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadDefaultAIModels();
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content default-models-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Default AI Models Settings</h2>
          <button className="modal-close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="modal-description">Configure the default AI models that will be used for new chats</p>

          {!loading && !lightModel && !heavyModel && (
            <div className="first-time-notice">
              <span className="info-icon">ℹ️</span>
              No default models are currently set. Please configure them below.
            </div>
          )}

          {loading ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <span>Loading current settings...</span>
            </div>
          ) : (
            <div className="modal-form">
              <div className="model-section">
                <div className="model-field">
                  <label htmlFor="light-model">Light Model</label>
                  {modelsLoading ? (
                    <div className="model-loading">Loading available models...</div>
                  ) : availableModels.length > 0 ? (
                    <select
                      id="light-model"
                      value={lightModel}
                      onChange={(e) => setLightModel(e.target.value)}
                      disabled={saving}
                      className="model-input"
                    >
                      <option value="">Select a light model...</option>
                      {/* Include current model if not in available models */}
                      {lightModel && !availableModels.includes(lightModel) && (
                        <option key={lightModel} value={lightModel}>
                          {lightModel} (current)
                        </option>
                      )}
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="light-model"
                      type="text"
                      value={lightModel}
                      onChange={(e) => setLightModel(e.target.value)}
                      placeholder="e.g., gpt-3.5-turbo"
                      disabled={saving}
                      className="model-input"
                    />
                  )}
                  <small className="model-description">
                    Used for quick responses and simple tasks. Should be a fast, cost-effective model.
                  </small>
                </div>

                <div className="model-field">
                  <label htmlFor="heavy-model">Heavy Model</label>
                  {modelsLoading ? (
                    <div className="model-loading">Loading available models...</div>
                  ) : availableModels.length > 0 ? (
                    <select
                      id="heavy-model"
                      value={heavyModel}
                      onChange={(e) => setHeavyModel(e.target.value)}
                      disabled={saving}
                      className="model-input"
                    >
                      <option value="">Select a heavy model...</option>
                      {/* Include current model if not in available models */}
                      {heavyModel && !availableModels.includes(heavyModel) && (
                        <option key={heavyModel} value={heavyModel}>
                          {heavyModel} (current)
                        </option>
                      )}
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="heavy-model"
                      type="text"
                      value={heavyModel}
                      onChange={(e) => setHeavyModel(e.target.value)}
                      placeholder="e.g., gpt-4"
                      disabled={saving}
                      className="model-input"
                    />
                  )}
                  <small className="model-description">
                    Used for complex reasoning and detailed analysis. Should be a powerful, high-capability model.
                  </small>
                </div>
              </div>

              {error && (
                <div className="modal-error">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="modal-success">
                  <span className="success-icon">✅</span>
                  Default AI models updated successfully!
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="modal-btn secondary"
                  onClick={handleReset}
                  disabled={saving || loading}
                >
                  Reset
                </button>
                <button
                  className="modal-btn primary"
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  {saving ? (
                    <>
                      <div className="button-spinner"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaultModelsModal;