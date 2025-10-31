import React, { useState, useEffect } from 'react';
import { defaultAIModelsService } from '../services/defaultAIModelsService';
import type { UpdateDefaultAIModelsRequest } from '../services/defaultAIModelsService';
import './DefaultModels.css';

const DefaultModels: React.FC = () => {
  const [lightModel, setLightModel] = useState('');
  const [heavyModel, setHeavyModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load current default AI models when component mounts
  useEffect(() => {
    loadDefaultAIModels();
  }, []);

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

  return (
    <div className="default-models-container">
      <div className="default-models-header">
        <h1>Notebook AI Models Settings</h1>
        <p>Configure the notebook AI models that will be used for new chats in this notebook</p>
        {!loading && !lightModel && !heavyModel && (
          <div className="first-time-notice">
            <span className="info-icon">ℹ️</span>
            No default models are currently set. Please configure them below.
          </div>
        )}
      </div>

      <div className="default-models-content">
        {loading ? (
          <div className="default-models-loading">
            <div className="loading-spinner"></div>
            <span>Loading current settings...</span>
          </div>
        ) : (
          <div className="default-models-form">
            <div className="model-section">
              <div className="model-field">
                <label htmlFor="light-model">Light Model</label>
                <input
                  id="light-model"
                  type="text"
                  value={lightModel}
                  onChange={(e) => setLightModel(e.target.value)}
                  placeholder="e.g., gpt-3.5-turbo"
                  disabled={saving}
                  className="model-input"
                />
                <small className="model-description">
                  Used for quick responses and simple tasks. Should be a fast, cost-effective model.
                </small>
              </div>

              <div className="model-field">
                <label htmlFor="heavy-model">Heavy Model</label>
                <input
                  id="heavy-model"
                  type="text"
                  value={heavyModel}
                  onChange={(e) => setHeavyModel(e.target.value)}
                  placeholder="e.g., gpt-4"
                  disabled={saving}
                  className="model-input"
                />
                <small className="model-description">
                  Used for complex reasoning and detailed analysis. Should be a powerful, high-capability model.
                </small>
              </div>
            </div>

            {error && (
              <div className="default-models-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {success && (
              <div className="default-models-success">
                <span className="success-icon">✅</span>
                Default AI models updated successfully!
              </div>
            )}

            <div className="default-models-actions">
              <button
                className="reset-btn"
                onClick={handleReset}
                disabled={saving || loading}
              >
                Reset
              </button>
              <button
                className="save-btn"
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
  );
};

export default DefaultModels;
