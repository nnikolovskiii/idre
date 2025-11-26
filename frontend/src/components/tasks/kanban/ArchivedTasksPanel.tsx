import React, { useEffect } from "react";
import { X, Search, Archive, Loader2, RotateCcw } from "lucide-react";
import { PriorityIndicator } from "./TaskCard";
import type {Task} from "./types.ts";

// Helper Card
const ArchivedTaskCard: React.FC<{
    task: Task;
    onUnarchive: (task: Task) => void;
    onView: (task: Task) => void;
    onEdit: (task: Task) => void;
}> = ({ task, onUnarchive, onView }) => {
    return (
        <div className="bg-background border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer group opacity-75">
            <div onClick={() => onView(task)}>
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <PriorityIndicator priority={task.priority} />
                        <h4 className="font-medium text-foreground truncate">{task.title}</h4>
                    </div>
                </div>
                {task.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onUnarchive(task); }}
                        className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded flex items-center justify-center gap-1"
                    >
                        <RotateCcw size={10} /> Unarchive
                    </button>
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
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 transform transition-transform">
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><Archive size={20} /> Archived Tasks</h2>
                        <button onClick={onClose}><X size={20} /></button>
                    </div>
                    <div className="p-4 border-b border-border">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : (
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