import React, { useState, useEffect } from 'react';
import { modelApiService } from '../../lib/modelApiService';
import clsx from 'clsx'; // A tiny utility for constructing className strings conditionally. `npm install clsx`

// --- Icon Components (can be moved to a separate file if reused) ---

const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
    <div className={clsx("animate-spin rounded-full border-2 border-transparent border-t-current", className)}></div>
);

// --- Reusable Status Message Component ---

interface StatusMessageProps {
  type: 'info' | 'error' | 'success' | 'status';
  children: React.ReactNode;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ type, children }) => {
  const baseClasses = "flex items-start gap-3 rounded-lg border p-4 text-sm";
  const variantClasses = {
    info: "border-blue-200 bg-blue-50 text-blue-800",
    error: "border-red-200 bg-red-50 text-red-900",
    success: "border-green-200 bg-green-50 text-green-800",
    status: "border-sky-200 bg-sky-50 text-sky-800",
  };
  const icons = {
    info: 'ℹ️', error: '⚠️', success: '✅', status: '🔑',
  };

  return (
      <div className={clsx(baseClasses, variantClasses[type])}>
        <span className="mt-0.5 flex-shrink-0">{icons[type]}</span>
        <p className="m-0 leading-relaxed">{children}</p>
      </div>
  );
};

// --- Main Modal Component ---

interface ModelApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModelApiModal: React.FC<ModelApiModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadModelApi();
    } else {
      handleCloseCleanup();
    }
  }, [isOpen]);

  const loadModelApi = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const apiInfo = await modelApiService.getModelApi();
      setHasApiKey(apiInfo.has_api_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API key information');
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key cannot be empty.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await modelApiService.updateModelApi({ api_key: apiKey.trim() });
      setHasApiKey(true);
      setApiKey('');
      setShowApiKey(false);
      showSuccessMessage('API key saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      await modelApiService.deleteModelApi();
      setHasApiKey(false);
      setApiKey('');
      showSuccessMessage('API key deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete API key');
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseCleanup = () => {
    setApiKey('');
    setError(null);
    setSuccess(null);
    setShowApiKey(false);
    setLoading(true);
  };

  const handleClose = () => {
    handleCloseCleanup();
    onClose();
  };

  if (!isOpen) return null;

  const isActionInProgress = saving || deleting;

  const btnBaseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  return (
      <div className="fixed inset-0 z-[1000] bg-black/60 p-0 sm:grid sm:place-items-center sm:p-4" onMouseDown={handleClose}>
        <div className="flex h-auto max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-lg sm:h-auto sm:max-h-[90vh] sm:rounded-2xl" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 sm:p-6">
            <h2 className="m-0 text-lg font-semibold text-gray-900">OpenRouter API Key</h2>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900" onClick={handleClose} aria-label="Close modal">
              <CloseIcon className="h-5 w-5"/>
            </button>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto p-6">
            <div className="mb-2 text-center text-gray-900">
              <svg aria-label="OpenRouter Logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" className="mb-3 inline-block h-12">
                <path fill="currentColor" d="M431.4 196.2c0 11.2-2.1 20.8-6.2 28.8a45 45 0 0 1-41 25 44.8 44.8 0 0 1-41-25c-4.2-8-6.2-17.7-6.2-28.8 0-11.2 2-20.8 6.1-28.8a44.9 44.9 0 0 1 41.1-25 45 45 0 0 1 41 25c4.1 8 6.2 17.6 6.2 28.8m-15.7 0c0-8.5-1.4-15.7-4.1-21.6a30.6 30.6 0 0 0-11.3-13.3c-4.7-3-10.1-4.5-16.1-4.5a30 30 0 0 0-16.2 4.5c-4.7 3-8.4 7.5-11.2 13.3-2.7 5.9-4.1 13-4.1 21.6 0 8.5 1.4 15.7 4.1 21.5A30.7 30.7 0 0 0 368 231c4.8 3 10.2 4.6 16.2 4.6s11.4-1.5 16.1-4.6c4.8-3 8.5-7.4 11.3-13.3 2.7-5.8 4.1-13 4.1-21.5Zm34 81.8V170h15v12.7h1.3c.9-1.6 2.1-3.5 3.8-5.6a22 22 0 0 1 18.7-8.1 30.6 30.6 0 0 1 28.7 18.6c2.9 6 4.3 13.3 4.3 21.8s-1.4 15.8-4.2 21.8a33 33 0 0 1-11.7 14 30 30 0 0 1-17 4.9c-4.7 0-8.6-.8-11.6-2.4a22 22 0 0 1-7.1-5.6c-1.7-2.2-3-4.1-4-5.8h-.8V278h-15.3m15-68.7c0 5.5.7 10.3 2.3 14.5 1.6 4.2 4 7.4 7 9.7 3 2.4 6.7 3.5 11.1 3.5 4.6 0 8.4-1.2 11.5-3.6 3-2.5 5.4-5.8 7-10 1.6-4.2 2.4-8.9 2.4-14.1 0-5.2-.8-9.9-2.4-14a21.7 21.7 0 0 0-7-9.7 18 18 0 0 0-11.5-3.6c-4.4 0-8.1 1.1-11.2 3.4-3 2.3-5.3 5.5-7 9.6a40 40 0 0 0-2.3 14.3ZM572.4 250c-7.8 0-14.4-1.6-20-5-5.6-3.3-9.9-8-12.9-14s-4.5-13.2-4.5-21.3c0-8 1.5-15.1 4.5-21.3a35 35 0 0 1 12.7-14.4 38.5 38.5 0 0 1 32-3 31.3 31.3 0 0 1 19 19.2c2 5 2.9 11 2.9 18.2v5.4h-62.5v-11.5h47.5c0-4-.8-7.6-2.5-10.7a18.6 18.6 0 0 0-17.2-10c-4.3 0-8 1-11.2 3a22.3 22.3 0 0 0-10 19.2v9c0 5.2 1 9.6 2.8 13.3 1.9 3.7 4.5 6.5 7.8 8.4a23 23 0 0 0 11.7 2.9c3 0 5.6-.4 8-1.3a16.4 16.4 0 0 0 10.2-10l14.4 2.7c-1.1 4.3-3.2 8-6.2 11.2-3 3.2-6.7 5.6-11.2 7.4a41.7 41.7 0 0 1-15.3 2.6Zm66-48.2v46.7h-15.3V170H638v12.8h1c1.8-4.2 4.6-7.5 8.5-10 3.8-2.6 8.7-3.8 14.6-3.8 5.4 0 10 1.1 14 3.3 4.1 2.3 7.2 5.6 9.4 10a36 36 0 0 1 3.4 16.3v50h-15.3v-48.2a19 19 0 0 0-4.5-13.3c-3-3.3-7-4.9-12.2-4.9a19 19 0 0 0-9.4 2.3 16.4 16.4 0 0 0-6.5 6.8 21.8 21.8 0 0 0-2.4 10.6Zm72 46.7V143.8h37.3c8 0 14.8 1.4 20.2 4.2 5.4 2.8 9.4 6.7 12 11.6a35 35 0 0 1 4 17c0 6.5-1.3 12.1-4 17a27.3 27.3 0 0 1-12 11.3c-5.4 2.7-12.2 4-20.3 4h-28.2v-13.6h26.8c5.1 0 9.3-.7 12.5-2.2 3.2-1.4 5.6-3.6 7-6.4a21 21 0 0 0 2.3-10c0-4-.7-7.4-2.2-10.3a15.2 15.2 0 0 0-7.1-6.7 29.3 29.3 0 0 0-12.7-2.3h-19.9v91.2h-15.7m51.7-47.3 25.8 47.3h-18l-25.3-47.3h17.5Zm73 48.8a34.1 34.1 0 0 1-32-19.2 47 47 0 0 1-4.6-21.3c0-8.1 1.5-15.2 4.5-21.3a34.1 34.1 0 0 1 32-19.3 34.1 34.1 0 0 1 32 19.3 45 45 0 0 1 4.7 21.3 47 47 0 0 1-4.6 21.3 34.1 34.1 0 0 1-32 19.2m0-12.8c4.8 0 8.8-1.3 11.9-3.8 3.1-2.5 5.4-5.9 7-10a42 42 0 0 0 2.2-14c0-5-.7-9.5-2.2-13.8a22.8 22.8 0 0 0-7-10.1 18.2 18.2 0 0 0-11.9-3.8c-4.8 0-8.8 1.2-12 3.8-3 2.6-5.4 6-7 10.2a40.5 40.5 0 0 0-2.2 13.8c0 5 .8 9.6 2.3 13.8 1.5 4.2 3.8 7.6 7 10.1 3.1 2.5 7.1 3.8 12 3.8ZM938.6 216v-46h15.3v78.6h-15v-13.7h-.8a24.4 24.4 0 0 1-23.5 14.7 26 26 0 0 1-13.4-3.4 23 23 0 0 1-9-10 36.3 36.3 0 0 1-3.4-16.2v-50h15.3v48.1a18 18 0 0 0 4.4 12.8c3 3.2 6.9 4.8 11.6 4.8a19 19 0 0 0 15.7-8.7c1.9-2.9 2.8-6.6 2.8-11Zm72.5-46v12.3h-43V170h43m-31.4-18.8H995v74.3c0 3 .4 5.2 1.3 6.7.9 1.4 2 2.5 3.5 3 1.4.5 3 .8 4.6.8a176.6 176.6 0 0 0 5.4-.7l2.7 12.6a27.2 27.2 0 0 1-10 1.7c-4 0-7.7-.7-11.2-2.2a19.3 19.3 0 0 1-8.4-7c-2.1-3-3.2-7-3.2-11.7v-77.5Zm82.1 99c-7.7 0-14.4-1.7-20-5-5.5-3.4-9.8-8-12.8-14.1-3-6-4.6-13.2-4.6-21.3a47 47 0 0 1 4.6-21.3c3-6.1 7.2-11 12.6-14.4a38.5 38.5 0 0 1 32-3 31.3 31.3 0 0 1 19 19.2c2 5 3 11 3 18.2v5.4H1033v-11.5h47.4c0-4-.8-7.6-2.4-10.7a18.7 18.7 0 0 0-17.3-10c-4.3 0-8 1-11.2 3a22.9 22.9 0 0 0-9.9 19.2v9c0 5.2.9 9.6 2.8 13.3 1.8 3.7 4.4 6.5 7.8 8.4a23 23 0 0 0 11.7 2.9 24 24 0 0 0 7.9-1.3 16.7 16.7 0 0 0 10.2-9.9l14.4 2.6a26 26 0 0 1-6.2 11.2 30 30 0 0 1-11.2 7.4 41.6 41.6 0 0 1-15.3 2.6Zm50.7-1.6V170h14.8v12.5h.8c1.5-4.2 4-7.6 7.6-10 3.7-2.5 7.8-3.7 12.4-3.7a68 68 0 0 1 6.5.4v14.6a31.9 31.9 0 0 0-8-1 20 20 0 0 0-9.6 2.4 17.2 17.2 0 0 0-9.2 15.4v48h-15.3Z"/>
                <g fill="currentColor" stroke="currentColor">
                  <path strokeWidth="35.3" d="M46.2 200.5c5.9 0 28.6-5.1 40.3-11.8 11.8-6.6 11.8-6.6 36.1-23.9 30.8-21.8 52.5-14.5 88.2-14.5"/>
                  <path strokeWidth=".4" d="M245.3 150.5 185 185.3v-69.6l60.3 34.8Z"/>
                  <path strokeWidth="35.3" d="M45 200.5c5.9 0 28.6 5 40.4 11.7 11.7 6.7 11.7 6.7 36 24 30.8 21.8 52.5 14.5 88.2 14.5"/>
                  <path strokeWidth=".4" d="m244.1 250.4-60.3-34.7v69.5l60.3-34.8Z"/>
                </g>
              </svg>
              <p className="m-0 text-sm text-gray-600">
                Manage your API key for <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">OpenRouter.ai</a>
              </p>
            </div>
            {loading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-gray-600">
                  <Spinner className="h-8 w-8" />
                  <span>Checking API key status...</span>
                </div>
            ) : (
                <>
                  {error && <StatusMessage type="error">{error}</StatusMessage>}
                  {success && <StatusMessage type="success">{success}</StatusMessage>}

                  {!hasApiKey && !success && (
                      <StatusMessage type="info">
                        No API key is configured. Add one below to get started.
                      </StatusMessage>
                  )}

                  <div className="flex flex-col gap-2">
                    <label htmlFor="api-key" className="text-sm font-medium text-gray-900">API Key</label>
                    <div className="relative flex items-center">
                      <input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={hasApiKey ? 'Enter new key to update' : 'sk-or-v1-...'}
                          disabled={isActionInProgress}
                          className="w-full rounded-lg border border-gray-300 bg-white p-3 pr-10 text-base text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                      />
                      <button
                          type="button"
                          className="absolute right-2 flex rounded-md p-1 text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
                          onClick={() => setShowApiKey(!showApiKey)}
                          disabled={isActionInProgress}
                          aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                      >
                        {showApiKey ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <small className="text-sm text-gray-600">
                      Your key is encrypted and stored securely.
                    </small>
                  </div>

                  {hasApiKey && (
                      <StatusMessage type="status">
                        An API key is configured and active.
                      </StatusMessage>
                  )}
                </>
            )}
          </div>

          <div className="flex flex-shrink-0 flex-col-reverse gap-3 bg-gray-50 p-4 sm:flex-row sm:justify-end sm:p-6">
            {hasApiKey && !loading && (
                <button
                    className={clsx(btnBaseClasses, "border border-red-200 bg-red-50 text-red-700 hover:enabled:bg-red-100 sm:mr-auto", "focus:ring-red-500")}
                    onClick={handleDelete}
                    disabled={isActionInProgress}
                >
                  {deleting ? <><Spinner className="h-4 w-4" /> Deleting...</> : 'Delete Key'}
                </button>
            )}
            <button
                className={clsx(btnBaseClasses, "bg-blue-600 text-white hover:enabled:bg-blue-700", "focus:ring-blue-500")}
                onClick={handleSave}
                disabled={isActionInProgress || !apiKey.trim()}
            >
              {saving ? (
                  <><Spinner className="h-4 w-4"/> {hasApiKey ? 'Updating...' : 'Saving...'}</>
              ) : (
                  hasApiKey ? 'Update Key' : 'Save Key'
              )}
            </button>
          </div>
        </div>
      </div>
  );
};

export default ModelApiModal;