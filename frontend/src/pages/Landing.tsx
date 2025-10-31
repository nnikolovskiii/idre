// Path: /home/nnikolovskii/dev/general-chat/frontend/src/pages/Landing.tsx
import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Landing: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // If already authenticated, send users straight to the app
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/notebooks" replace />;
  }

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">AI</div>
            <span className="font-semibold">General Chat</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link className="text-sm hover:underline" to="/login">Log in</Link>
            <Link className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground" to="/register">Sign up</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-col items-center text-center gap-10">
          {/* Video-like primary hero block */}
          <div className="relative w-full max-w-5xl">
            <div className="aspect-video w-full rounded-xl border border-border bg-muted overflow-hidden" />
            {/* Play button overlay (visual only) */}
            <button
              type="button"
              aria-label="Play video"
              className="absolute inset-0 flex items-center justify-center group"
            >
              <span className="sr-only">Play video</span>
              <span className="h-16 w-16 rounded-full bg-white/90 text-black shadow-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
            {/* soft decorative glows */}
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-lg bg-primary/10 blur-2xl" />
            <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-lg bg-blue-500/10 blur-2xl" />
          </div>

          {/* Headline + CTAs below the hero video placeholder */}
          <div className="space-y-6 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Chat with your notebooks, files, and the web.
            </h1>
            <p className="text-muted-foreground text-lg">
              Organize knowledge in notebooks, upload files, and use powerful AI models with optional web search. Everything in one streamlined interface.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className="px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
              >
                Get started — it’s free
              </Link>
              <Link
                to="/login"
                className="px-5 py-3 rounded-md border border-border hover:bg-muted"
              >
                I already have an account
              </Link>
            </div>
            <div className="text-xs text-muted-foreground">
              By continuing you agree to our terms and privacy policy.
            </div>
          </div>
        </div>

        {/* Features */}
        <section className="mt-24 grid md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-border p-6 bg-card">
            <div className="text-sm font-semibold mb-2">Notebooks</div>
            <p className="text-sm text-muted-foreground">Group your chats and files in notebooks to keep context and projects organized.</p>
          </div>
          <div className="rounded-lg border border-border p-6 bg-card">
            <div className="text-sm font-semibold mb-2">File-aware AI</div>
            <p className="text-sm text-muted-foreground">Upload documents and chat with them. The assistant can reference your files directly.</p>
          </div>
          <div className="rounded-lg border border-border p-6 bg-card">
            <div className="text-sm font-semibold mb-2">Web search</div>
            <p className="text-sm text-muted-foreground">Enable web search to pull in fresh information right into your conversations.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} General Chat. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
