import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModelSettingsModal from '../components/modals/ModelSettingsModal';
import { useApiKey } from '../contexts/ApiKeyContext'; // Import this

// Large Lock Icon SVG Component
const LockBackground = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="absolute text-foreground opacity-[0.03] dark:opacity-[0.05] w-96 h-96 pointer-events-none"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
    </svg>
);

const SetupApiKeyPage: React.FC = () => {
    const navigate = useNavigate();
    // 1. Get API Key status
    const { hasApiKey, isLoading } = useApiKey();

    // 2. Redirect if already set up
    useEffect(() => {
        if (!isLoading && hasApiKey) {
            navigate('/notebooks', { replace: true });
        }
    }, [hasApiKey, isLoading, navigate]);

    // Optional: Show nothing or a spinner while checking to prevent flash
    if (isLoading || hasApiKey) {
        return null;
    }

    return (
        <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">

            {/* Background Icon */}
            <LockBackground />

            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-4">
                        Welcome to Your AI Assistant
                    </h1>
                    <p className="text-muted-foreground">
                        To get started, you'll need to set up your OpenRouter API key
                    </p>
                </div>

                <ModelSettingsModal
                    isOpen={true}
                    onClose={() => navigate('/')}
                    onApiKeySaved={() => {
                        // Explicit redirect to notebooks when key is saved
                        navigate('/notebooks');
                    }}
                    forceApiView={true}
                    initialTab="api"
                />

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupApiKeyPage;