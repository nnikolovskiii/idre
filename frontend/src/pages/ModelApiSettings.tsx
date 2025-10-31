import React, { useState, useEffect } from 'react';
import { modelApiService } from '../services/modelApiService';
import type { UpdateModelApiRequest } from '../services/modelApiService';
import './ModelApiSettings.css';

const ModelApiSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load current API key information when component mounts
  useEffect(() => {
    loadModelApi();
  }, []);

  const loadModelApi = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiInfo = await modelApiService.getModelApi();
      setHasApiKey(apiInfo.has_api_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API key information');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateRequest: UpdateModelApiRequest = {
        api_key: apiKey.trim()
      };

      await modelApiService.updateModelApi(updateRequest);
      setSuccess(true);
      setHasApiKey(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    setSuccess(false);

    try {
      await modelApiService.deleteModelApi();
      setHasApiKey(false);
      setApiKey('');
      setSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = () => {
    loadModelApi();
    setError(null);
    setSuccess(false);
    setShowApiKey(false);
  };

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="model-api-container">
      <div className="model-api-header">
        <h1>Model API Key Settings</h1>
        <p>Manage your AI model API key for enhanced functionality</p>
        {!loading && !hasApiKey && (
          <div className="first-time-notice">
            <span className="info-icon">ℹ️</span>
            No API key is currently configured. Please add your API key below.
          </div>
        )}
      </div>

      <div className="model-api-content">
        {loading ? (
          <div className="model-api-loading">
            <div className="loading-spinner"></div>
            <span>Loading API key information...</span>
          </div>
        ) : (
          <div className="model-api-form">
            <div className="api-key-section">
              <div className="api-key-field">
                <label htmlFor="api-key">API Key</label>
                <div className="api-key-input-container">
                  <input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key here"
                    disabled={saving || deleting}
                    className="api-key-input"
                  />
                  {hasApiKey && apiKey && (
                    <button
                      type="button"
                      className="show-api-key-btn"
                      onClick={toggleShowApiKey}
                      disabled={saving || deleting}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
                <small className="api-key-description">
                  This API key will be used to authenticate with external AI model services.
                  It will be securely encrypted and stored.
                </small>
              </div>
            </div>

            {error && (
              <div className="model-api-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {success && (
              <div className="model-api-success">
                <span className="success-icon">✅</span>
                {hasApiKey ? 'API key updated successfully!' : 'API key deleted successfully!'}
              </div>
            )}

            <div className="model-api-actions">
              <button
                className="reset-btn"
                onClick={handleReset}
                disabled={saving || deleting}
              >
                Reset
              </button>
              
              {hasApiKey && (
                <button
                  className="delete-btn"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                >
                  {deleting ? (
                    <>
                      <div className="button-spinner"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete API Key'
                  )}
                </button>
              )}
              
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving || deleting || !apiKey.trim()}
              >
                {saving ? (
                  <>
                    <div className="button-spinner"></div>
                    {hasApiKey ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  hasApiKey ? 'Update API Key' : 'Save API Key'
                )}
              </button>
            </div>

            {hasApiKey && (
              <div className="api-key-status">
                <span className="status-icon">🔑</span>
                API key is configured and ready for use.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelApiSettings;
