import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./AuthModal.css";

// Google API type declarations
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { login, googleLogin } = useAuth();

  useEffect(() => {
    if (isOpen && window.google && googleButtonRef.current) {
      window.google.accounts.id.initialize({
        client_id: window.ENV?.VITE_GOOGLE_CLIENT_ID || "",
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
      });
    }
  }, [isOpen]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsGoogleLoading(true);
      setError("");
      await googleLogin(response.credential);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Google login failed. Please try again."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(identifier, password, rememberMe);
      onClose(); // Close modal on successful login
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setIdentifier("");
    setPassword("");
    setRememberMe(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content auth-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Welcome Back</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Sign in to your account to continue
          </p>

          {error && (
            <div className="modal-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="identifier">Email or Username</label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="auth-input"
                required
                placeholder="Enter your email or username"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-button primary"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <div className="google-signin-container">
              <div
                ref={googleButtonRef}
                className="google-signin-button"
                style={{ display: isGoogleLoading ? "none" : "block" }}
              ></div>
              {isGoogleLoading && (
                <div className="google-loading">
                  <span>Signing in with Google...</span>
                </div>
              )}
            </div>

            <div className="auth-switch">
              Don't have an account?{" "}
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  handleClose();
                  onSwitchToRegister();
                }}
              >
                Sign up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
