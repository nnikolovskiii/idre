import React from "react";
import { Square, Loader2 } from "lucide-react";
import aiTechnologiesImg from "../../assets/ai-technology (1).png"
import pencilImg from "../../assets/pencil (1).png"
import microphoneImg from "../../assets/microphone-black-shape.png"
import clipboardImg from "../../assets/checklist (1).png"



interface AISidebarProps {
    isRecording: boolean;
    onToggleRecording: () => void;
    isTranscribingForFile?: boolean;
    isRewritingForFile?: boolean;
    isGeneratingTasksForFile?: boolean;
    activeFile: any;
    onRewriteContent?: () => void;
    onGenerateTasks?: () => void;
    className?: string;
}

const AISidebar: React.FC<AISidebarProps> = ({
    isRecording,
    onToggleRecording,
    isTranscribingForFile,
    isRewritingForFile,
    isGeneratingTasksForFile,
    activeFile,
    onRewriteContent,
    onGenerateTasks,
    className = ""
}) => {
    // Only show AI actions for text files
    const isTextFile = activeFile && !activeFile.content_type.startsWith('image/');

    // Check if file has content to rewrite
    const hasContent = activeFile && activeFile.content && activeFile.content.trim().length > 0;

    return (
        <div className={`w-16 bg-muted/20 border-l border-border flex flex-col items-center py-4 gap-4 ${className}`}>
            {/* AI Header */}
            <div className="flex flex-col items-center gap-1">
                <img src={aiTechnologiesImg} className="w-7 " />
            </div>

            <div className="w-px h-4 bg-border/30"></div>

            {/* Voice Recording Button */}
            {isTextFile && (
                <button
                    onClick={onToggleRecording}
                    className={`group relative p-3 rounded-xl transition-all duration-200 ${
                        isRecording
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    title={isRecording ? "Stop Recording" : "Add Voice Note"}
                    disabled={isTranscribingForFile}
                >
                    {isTranscribingForFile ? (
                        <Loader2 size={20} className="animate-spin text-primary" />
                    ) : isRecording ? (
                        <>
                            <Square size={20} fill="currentColor" />
                            <div className="absolute inset-0 rounded-xl bg-red-500/20 animate-pulse"></div>
                        </>
                    ) : (
                        <img src={microphoneImg} className="w-6" />
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {isRecording ? "Stop Recording" : "Voice Note"}
                    </div>
                </button>
            )}

            {/* Content Rewrite Button */}
            {isTextFile && hasContent && (
                <button
                    onClick={onRewriteContent}
                    className={`group relative p-3 rounded-xl transition-all duration-200 ${
                        isRewritingForFile
                            ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    title={isRewritingForFile ? "Rewriting..." : "Rewrite Content"}
                    disabled={isRewritingForFile}
                >
                    {isRewritingForFile ? (
                        <Loader2 size={20} className="animate-spin text-blue-500" />
                    ) : (
                        <img src={pencilImg} className="w-6" />
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {isRewritingForFile ? "Rewriting..." : "Rewrite Content"}
                    </div>
                </button>
            )}

            {/* Task Generation Button */}
            {isTextFile && hasContent && (
                <button
                    onClick={onGenerateTasks}
                    className={`group relative p-3 rounded-xl transition-all duration-200 ${
                        isGeneratingTasksForFile
                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    title={isGeneratingTasksForFile ? "Generating Tasks..." : "Generate Tasks"}
                    disabled={isGeneratingTasksForFile}
                >
                    {isGeneratingTasksForFile ? (
                        <Loader2 size={20} className="animate-spin text-green-500" />
                    ) : (
                        <img src={clipboardImg} className="w-6" />
                    )}

                    {/* Tooltip */}
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        {isGeneratingTasksForFile ? "Generating..." : "Generate Tasks"}
                    </div>
                </button>
            )}

        </div>
    );
};

export default AISidebar;