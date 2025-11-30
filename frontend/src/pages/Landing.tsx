// Path: /frontend/src/pages/Landing.tsx
import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquareText, BarChart3, Layers, Github, Wand2 } from "lucide-react";

// --- ASSET IMPORTS ---
import bgImage from "../assets/background-wave.png";
import logoIcon from "../assets/idre-logo-icon.png";
import heroLogo from "../assets/idre_logo_v2_black.png";

const Landing: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (!isLoading && isAuthenticated) {
        return <Navigate to="/notebooks" replace />;
    }

    return (
        <div className="min-h-screen w-full bg-black text-white overflow-x-hidden font-sans selection:bg-white/20 selection:text-white flex flex-col">

            {/* BACKGROUND IMAGE LAYER */}
            <div className="absolute top-0 left-0 w-full h-[100vh] z-0 overflow-hidden pointer-events-none">
                <img
                    src={bgImage}
                    alt="Background Wave"
                    className="w-full h-full object-cover opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black"></div>
            </div>

            {/* HEADER */}
            <header className="relative z-50 w-full pt-6 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center">
                    <img src={logoIcon} alt="IDRE Icon" className="h-10 w-10 object-contain" />
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Use case</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Pricing</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Blog</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Docs</Link>
                    <Link to="#" className="hover:text-white cursor-pointer transition-colors">Company</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="px-6 py-2 rounded-full border border-gray-600 bg-black/50 text-white text-sm font-medium hover:bg-black hover:border-white transition-all backdrop-blur-sm">
                        Login
                    </Link>
                    <Link to="/register" className="px-6 py-2 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all">
                        Signup
                    </Link>
                </div>
            </header>

            <main className="relative z-10 flex flex-col items-center w-full flex-grow">

                {/* HERO SECTION */}
                <section className="w-full max-w-7xl px-6 md:px-12 pt-20 pb-32 md:pt-32 md:pb-48 flex flex-col justify-center items-start text-left">

                    {/* HERO LOGO IMAGE - SIZE REDUCED HERE */}
                    <div className="mb-10 w-full max-w-[180px] md:max-w-[200px] relative z-10">
                        <img
                            src={heroLogo}
                            alt="IDRE Logo"
                            className="w-full h-auto object-contain object-left"
                        />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white leading-[1.1] mb-6 relative z-10">
                        From Idea to Realization
                    </h1>

                    <p className="text-base md:text-lg text-gray-300 max-w-2xl leading-relaxed mb-10 relative z-10">
                        The continuous feedback loop for innovators. Experience a workspace where AI acts as your strategist, archivist, and accountability partner.
                        Turn vague concepts into validated roadmaps.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 relative z-10">
                        <Link to="/register" className="flex items-center gap-2 px-8 py-3 rounded-full border border-white/20 bg-black text-white font-medium hover:bg-white hover:text-black transition-all group">
                            Start Generating
                            <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
                        </Link>

                        <Link to="/register" className="flex items-center gap-2 px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                            Try it out
                        </Link>
                    </div>
                </section>

                {/* VIDEO SHOWCASE */}
                <section className="w-full max-w-6xl px-4 md:px-6 mb-24 mt-[-60px] relative z-20">
                    <div className="relative rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-sm">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-900 to-violet-900 rounded-2xl blur opacity-40"></div>
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900 border border-white/5 shadow-inner">
                            <video className="w-full h-full object-cover" src="https://storage.googleapis.com/lunar-echo-storage/idre_demo_1.mp4" autoPlay loop muted playsInline />
                        </div>
                    </div>
                </section>

                {/* FEATURES GRID */}
                <section className="w-full max-w-7xl px-6 py-24 border-t border-white/10 bg-black z-10">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon={<MessageSquareText className="h-6 w-6 text-blue-400" />} title="Active Partnership" description="Don't just chat—build. Engage in an iterative loop where the AI challenges your assumptions, asks clarifying questions, and refines your strategy." />
                        <FeatureCard icon={<Layers className="h-6 w-6 text-violet-400" />} title="Contextual Intelligence" description="Upload files, record voice notes, and chat. IDRE synthesizes your entire project context to provide specific, knowledge-based guidance." />
                        <FeatureCard icon={<BarChart3 className="h-6 w-6 text-indigo-400" />} title="Smart Weekly Audits" description="Automated accountability. The system analyzes your weekly logs against your goals and delivers a strategic performance report to keep you on track." />
                    </div>
                </section>

            </main>

            {/* BIG "IDRE" FOOTER */}
            <div className="relative w-full overflow-hidden bg-black mt-auto">
                <div className="absolute top-0 left-0 w-full h-px bg-white/10 z-20"></div>
                <div className="flex items-end justify-center pt-20 pb-0 w-full select-none pointer-events-none">
                    <h1 className="text-[28vw] leading-[0.8] font-black tracking-tighter text-white/10 translate-y-[5%]">IDRE</h1>
                </div>
                <footer className="absolute bottom-0 w-full z-30 pb-8 px-6">
                    <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-gray-400">
                        <div className="flex items-center gap-2 opacity-80"><span className="text-sm">© {new Date().getFullYear()} IDRE. All rights reserved.</span></div>
                        <div className="flex gap-6 text-sm">
                            <a href="https://github.com/nnikolovskiii/idre" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1"><Github className="h-4 w-4" /> GitHub</a>
                            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

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