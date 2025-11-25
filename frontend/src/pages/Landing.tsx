// Path: /frontend/src/pages/Landing.tsx
import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquareText, BarChart3, Layers, Github, Wand2 } from "lucide-react";

// --- ASSET IMPORTS ---
import bgImage from "../assets/background-wave.png";
import logoIcon from "../assets/idre-logo-icon.png";
import logoText from "../assets/idre-text-logo.png";

const Landing: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // If already authenticated, send users straight to the app
    if (!isLoading && isAuthenticated) {
        return <Navigate to="/notebooks" replace />;
    }

    return (
        <div className="min-h-screen w-full bg-black text-white overflow-x-hidden font-sans selection:bg-white/20 selection:text-white">

            {/*
             =========================================
             BACKGROUND IMAGE LAYER
             =========================================
            */}
            <div className="absolute top-0 left-0 w-full h-[100vh] z-0 overflow-hidden">
                <img
                    src={bgImage}
                    alt="Background Wave"
                    className="w-full h-full object-cover opacity-100"
                />
                {/* Gradient Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black"></div>
            </div>

            {/*
             =========================================
             HEADER
             =========================================
            */}
            <header className="relative z-50 w-full pt-6 px-6 md:px-12 flex items-center justify-between">
                {/* Left: Logo Icon */}
                <div className="flex items-center">
                    <img
                        src={logoIcon}
                        alt="IDRE Icon"
                        className="h-10 w-10 object-contain"
                    />
                </div>

                {/* Center: Navigation Links (Hidden on mobile) */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Use case</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Pricing</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Blog</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Docs</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Company</Link>
                </nav>

                {/* Right: Auth Buttons */}
                <div className="flex items-center gap-4">
                    <Link
                        to="/login"
                        className="px-6 py-2 rounded-full border border-gray-600 bg-black/50 text-white text-sm font-medium hover:bg-black hover:border-white transition-all backdrop-blur-sm"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="px-6 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all"
                    >
                        Signup
                    </Link>
                </div>
            </header>

            <main className="relative z-10 flex flex-col items-center w-full">

                {/*
                 =========================================
                 HERO SECTION
                 =========================================
                */}
                <section className="w-full max-w-7xl px-6 md:px-12 pt-20 pb-32 md:pt-32 md:pb-48 flex flex-col justify-center items-start text-left">

                    {/* Large IDRE Text Logo */}
                    <div className="mb-6">
                        <img
                            src={logoText}
                            alt="IDRE"
                            className="h-12 md:h-16 w-auto object-contain"
                        />
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white leading-[1.1] mb-6">
                        From Idea to Realization
                    </h1>

                    {/* Subtext description */}
                    <p className="text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed mb-10">
                        The continuous feedback loop for innovators. Experience a workspace where AI acts as your strategist, archivist, and accountability partner.
                        Turn vague concepts into validated roadmaps.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            to="/register"
                            className="flex items-center gap-2 px-8 py-3 rounded-full border border-white/20 bg-black text-white font-medium hover:bg-white hover:text-black transition-all group"
                        >
                            Start Generating
                            <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
                        </Link>

                        {/* UPDATED: Now a Link to /register */}
                        <Link
                            to="/register"
                            className="flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors"
                        >
                            Try it out
                        </Link>
                    </div>
                </section>

                {/*
                 =========================================
                 VIDEO SHOWCASE
                 =========================================
                */}
                <section className="w-full max-w-6xl px-4 md:px-6 mb-24 mt-[-60px] relative z-20">
                    <div className="relative rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-sm">
                        {/* Glow effects behind video */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-900 to-violet-900 rounded-2xl blur opacity-40"></div>

                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900 border border-white/5 shadow-inner">
                            <video
                                className="w-full h-full object-cover"
                                src="https://storage.googleapis.com/lunar-echo-storage/idre_demo_1.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        </div>
                    </div>
                </section>

                {/*
                 =========================================
                 FEATURES GRID
                 =========================================
                */}
                <section className="w-full max-w-7xl px-6 py-24 border-t border-white/10 bg-black">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<MessageSquareText className="h-6 w-6 text-blue-400" />}
                            title="Active Partnership"
                            description="Don't just chat—build. Engage in an iterative loop where the AI challenges your assumptions, asks clarifying questions, and refines your strategy."
                        />
                        <FeatureCard
                            icon={<Layers className="h-6 w-6 text-violet-400" />}
                            title="Contextual Intelligence"
                            description="Upload files, record voice notes, and chat. IDRE synthesizes your entire project context to provide specific, knowledge-based guidance."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-6 w-6 text-indigo-400" />}
                            title="Smart Weekly Audits"
                            description="Automated accountability. The system analyzes your weekly logs against your goals and delivers a strategic performance report to keep you on track."
                        />
                    </div>
                </section>

            </main>

            {/*
             =========================================
             FOOTER
             =========================================
            */}
            <footer className="border-t border-white/10 bg-black text-gray-400">
                <div className="mx-auto max-w-7xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-80">
                        {/* Reuse small logo icon for footer */}
                        <img
                            src={logoIcon}
                            alt="IDRE"
                            className="h-6 w-auto"
                        />
                    </div>
                    <p className="text-sm">
                        © {new Date().getFullYear()} IDRE. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm">
                        <a
                            href="https://github.com/nnikolovskiii/idre"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-white transition-colors flex items-center gap-1"
                        >
                            <Github className="h-4 w-4" /> GitHub
                        </a>
                        <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link to="#" className="hover:text-white transition-colors">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// --- SUB-COMPONENT: Feature Card ---
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 cursor-default">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            {icon}
        </div>
        <h3 className="text-lg font-bold mb-3 text-white">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed group-hover:text-gray-300">{description}</p>
    </div>
);

export default Landing;