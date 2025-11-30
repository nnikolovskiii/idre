import React, { useEffect } from "react";
import { X, Search, Archive, Loader2, RotateCcw, Edit2, Calendar } from "lucide-react";
import { PriorityIndicator } from "./TaskCard";
import type { Task } from "./types.ts";

// Helper Card - Aligned with the new TaskCard design
const ArchivedTaskCard: React.FC<{
    task: Task;
    onUnarchive: (task: Task) => void;
    onView: (task: Task) => void;
    onEdit: (task: Task) => void;
}> = ({ task, onUnarchive, onView, onEdit }) => {
    return (
        <div className="bg-card border border-border/60 rounded-lg p-3 hover:border-primary/50 transition-all cursor-default group relative text-left">
            <div onClick={() => onView(task)} className="cursor-pointer">
                {/* Header: Notebook & Options */}
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 flex-wrap max-w-[85%]">
                        {task.notebook ? (
                            <>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium max-w-full">
                                    <span className="text-xs">{task.notebook.emoji}</span>
                                    <span className="truncate">{task.notebook.title}</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground/50">•</span>
                            </>
                        ) : null}
                        <PriorityIndicator priority={task.priority} />
                    </div>

                    {/* Hover Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-background/95 shadow-sm border border-border rounded-md p-1 flex gap-1 z-10 backdrop-blur-sm">
                        <button
                            onClick={(e) => { e.stopPropagation(); onUnarchive(task); }}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-primary transition-colors"
                            title="Unarchive"
                        >
                            <RotateCcw size={14} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                            className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Title */}
                <h4 className="font-medium text-sm text-foreground mb-1.5 leading-snug break-words text-left opacity-80">
                    {task.title}
                </h4>

                {/* Description Preview */}
                {task.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 font-normal text-left">
                        {task.description}
                    </p>
                )}

                {/* Footer: Tags & Date */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                    <div className="flex gap-1 overflow-hidden">
                        {task.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar size={12} />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ArchivedTasksPanelProps {
    isOpen: boolean;
    onClose: () => void;
    archivedTasks: Task[];
    isLoading: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onUnarchive: (task: Task) => void;
    onViewTask: (task: Task) => void;
    onEditTask: (task: Task) => void;
}

const ArchivedTasksPanel: React.FC<ArchivedTasksPanelProps> = ({
                                                                   isOpen, onClose, archivedTasks, isLoading, searchQuery, onSearchChange, onUnarchive, onViewTask, onEditTask
                                                               }) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const filtered = archivedTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 transition-opacity" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 transform transition-transform duration-200 ease-in-out">
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                            <Archive size={20} className="text-muted-foreground" />
                            Archived Tasks
                        </h2>
                        <button onClick={onClose} className="p-1 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
                    </div>

                    <div className="p-4 border-b border-border bg-background">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search archived..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-secondary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-secondary/10">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                                <Loader2 className="animate-spin" />
                                <span className="text-sm">Loading archives...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
                                <Archive size={32} className="opacity-20" />
                                <p className="text-sm">No archived tasks found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filtered.map(task => (
                                    <ArchivedTaskCard key={task.id} task={task} onUnarchive={onUnarchive} onView={onViewTask} onEdit={onEditTask} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ArchivedTasksPanel;